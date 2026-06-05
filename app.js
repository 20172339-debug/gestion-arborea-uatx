/* ======================================================== */
/* CAPÍTULO 0: CONFIGURACIÓN INICIAL Y ENDPOINTS            */
/* ======================================================== */

// URL pública de ejecución de tu Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};

// Carga Inicial al abrir el portal
window.onload = () => {
  loadData();
  // Sincronización en bucle automático cada 30 segundos
  setInterval(loadData, 30000);
};


/* ======================================================== */
/* CAPÍTULO 1: NAVEGACIÓN Y CORRECCIÓN DE DIMENSIONES       */
/* ======================================================== */
function showSection(id) {
  // Ocultar todas las secciones e inactivar los botones del nav
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  // Activar la sección seleccionada y su respectivo botón
  document.getElementById(id).classList.add('active');
  
  const targetBtn = document.getElementById(`btn-${id}`);
  if (targetBtn) targetBtn.classList.add('active');

  // SOLUCIÓN AL BUG: Si regresa al dashboard, fuerza a Chart.js a recalcular el tamaño real
  if (id === 'dashboard') {
    Object.keys(charts).forEach(key => {
      if (charts[key]) {
        charts[key].resize();
      }
    });
  }
}


/* ======================================================== */
/* CAPÍTULO 2: CONSUMO ASÍNCRONO DEL ENDPOINT (DATA INJECTION)*/
/* ======================================================== */
async function loadData() {
  try {
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.add('fa-spin');

    const response = await fetch(API_URL);
    const data = await response.json();

    // --------------------------------------------------------
    // Subcapítulo: Asignación de Tarjetas Numéricas
    // --------------------------------------------------------
    document.getElementById('totalGeneral').innerText = data.totalGeneral || 0;
    document.getElementById('infestados').innerText = data.infestados || 0;

    // Cálculo dinámico del porcentaje de sanos (Tasa de Bioseguridad)
    let sanos = (data.totalGeneral - data.infestados) || 0;
    let porcentajeBioseguridad = data.totalGeneral > 0 ? Math.round((sanos / data.totalGeneral) * 100) : 0;
    document.getElementById('saludables').innerText = porcentajeBioseguridad + "%";

    // --------------------------------------------------------
    // Subcapítulo: Renderizado de Gráficas de Control
    // --------------------------------------------------------
    
    // 1. Gráfica de Severidad de Infestación
    createChart(
      'chartInfestacion',
      'bar',
      data.infestacion.map(i => i.estado),
      data.infestacion.map(i => i.total),
      ['#c7bfa7', '#dfca9f', '#cfa375', '#bd7e60', '#ad5245', '#7a221e', '#45403c'],
      {
        plugins: { legend: { display: false } }
      }
    );

    // 2. Gráfica de Distribución por Parcelas
    createChart(
      'chartParcelas',
      'bar',
      data.parcelas.map(p => p.area),
      data.parcelas.map(p => p.total),
      '#bfa15f', 
      {
        plugins: { legend: { display: false } }
      }
    );

    // 3. Gráfica de Clasificación Ecológica (Doughnut)
    createChart(
      'chartTipos',
      'doughnut',
      data.tipos.map(t => t.tipo),
      data.tipos.map(t => t.total),
      ['#2c251e', '#bfa15f', '#d0c8b3'],
      {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 8, font: { size: 9, family: 'Plus Jakarta Sans' } }
          }
        }
      }
    );

    // --------------------------------------------------------
    // Subcapítulo: Inyección Dinámica de Paneles Laterales
    // --------------------------------------------------------
    
    // Inyección I: Censo Absoluto de Especies
    const speciesContainer = document.getElementById('speciesContainer');
    if (speciesContainer) {
      speciesContainer.innerHTML = '';
      data.especies.forEach(e => {
        const row = document.createElement('div');
        row.className = 'species-row-premium';
        row.innerHTML = `
          <span class="row-label">🌳 ${e.especie}</span>
          <span class="row-counter">${e.total}</span>
        `;
        speciesContainer.appendChild(row);
      });
    }

    // Inyección II: Alertas Sanitarias (Suma algorítmica de vectores parásitos)
    const affectedContainer = document.getElementById('affectedContainer');
    if (affectedContainer) {
      affectedContainer.innerHTML = '';
      data.especies.forEach(e => {
        let totalEnfermos = (Number(e.leve) || 0) + 
                            (Number(e.moderado) || 0) + 
                            (Number(e.medio) || 0) + 
                            (Number(e.severo) || 0) + 
                            (Number(e.critico) || 0) + 
                            (Number(e.muerto) || 0);

        if (totalEnfermos > 0) {
          const row = document.createElement('div');
          row.className = 'species-row-premium';
          row.innerHTML = `
            <span class="row-label">🍂 ${e.especie}</span>
            <span class="row-counter">${totalEnfermos}</span>
          `;
          affectedContainer.appendChild(row);
        }
      });
    }

    if (syncIcon) syncIcon.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error en el procesamiento de datos del Herbario:', error);
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.remove('fa-spin');
  }
}


/* ======================================================== */
/* CAPÍTULO 3: MOTOR CENTRAL DE RE-RENDERIZADO DE GRÁFICAS   */
/* ======================================================== */
function createChart(id, type, labels, data, color, customOptions = {}) {
  if (charts[id]) {
    charts[id].destroy();
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {},
    scales: type === 'bar' ? {
      y: { grid: { color: 'rgba(44, 37, 30, 0.05)' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    } : {}
  };

  const mergedOptions = {
    ...baseOptions,
    ...customOptions,
    plugins: {
      ...baseOptions.plugins,
      ...customOptions.plugins
    },
    scales: type === 'bar' ? {
      ...baseOptions.scales,
      ...customOptions.scales
    } : {}
  };

  const ctx = document.getElementById(id);
  if (ctx) {
    charts[id] = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: 'Ejemplares',
          data: data,
          backgroundColor: color,
          borderWidth: 0,
          borderRadius: type === 'bar' ? 6 : 0
        }]
      },
      options: mergedOptions
    });
  }
}


/* ======================================================== */
/* CAPÍTULO 4: FILTROS INTERACTIVOS DEL HERBARIO MEDICINAL  */
/* ======================================================== */
function filterMedicinal(origen, element) {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  element.classList.add('active');

  const cards = document.querySelectorAll('.herbario-card');
  
  cards.forEach(card => {
    if (origen === 'todos') {
      card.style.display = 'flex';
    } else {
      if (card.getAttribute('data-origen') === origen) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    }
  });
}
