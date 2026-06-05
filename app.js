// Pegar aquí la URL pública de ejecución de tu Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};

// =========================
// NAVEGACIÓN Y CORRECCIÓN DE DIMENSIONES
// =========================
function showSection(id) {
  // Ocultar secciones e inactivar botones
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  // Activar pestaña actual
  document.getElementById(id).classList.add('active');
  document.getElementById(`btn-${id}`).classList.add('active');

  // SOLUCIÓN AL BUG: Si regresa al dashboard, fuerza a Chart.js a recalcular el tamaño
  if (id === 'dashboard') {
    Object.keys(charts).forEach(key => {
      if (charts[key]) {
        charts[key].resize();
      }
    });
  }
}

// =========================
// CONSUMO ASÍNCRONO DEL ENDPOINT
// =========================
async function loadData() {
  try {
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.add('fa-spin');

    const response = await fetch(API_URL);
    const data = await response.json();

    // 1. ASIGNACIÓN DE TARJETAS NUMÉRICAS
    document.getElementById('totalGeneral').innerText = data.totalGeneral || 0;
    document.getElementById('infestados').innerText = data.infestados || 0;

    // Cálculo dinámico del porcentaje de sanos
    let sanos = (data.totalGeneral - data.infestados) || 0;
    let porcentajeBioseguridad = data.totalGeneral > 0 ? Math.round((sanos / data.totalGeneral) * 100) : 0;
    document.getElementById('saludables').innerText = porcentajeBioseguridad + "%";

    // 2. RENDER GRÁFICA I: SEVERIDAD DE INFESTACIÓN
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

    // 3. RENDER GRÁFICA II: PARCELAS
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

    // 4. RENDER GRÁFICA III: TIPOS ECOLÓGICOS
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

    // 5. INYECCIÓN DE CENSO ABSOLUTO DE ESPECIES
    const speciesContainer = document.getElementById('speciesContainer');
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

    // 6. INYECCIÓN DE ALERTAS SANITARIAS (SUMA DE GRADOS PARÁSITOS DE TU APP SCRIPT)
    const affectedContainer = document.getElementById('affectedContainer');
    affectedContainer.innerHTML = '';

    data.especies.forEach(e => {
      // Mapeo directo de tus propiedades del script
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

    if (syncIcon) syncIcon.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error en el procesamiento de datos del Herbario:', error);
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.remove('fa-spin');
  }
}

// =========================
// MOTOR CENTRAL DE GRÁFICAS
// =========================
function createChart(id, type, labels, data, color, customOptions = {}) {
  if (charts[id]) {
    charts[id].destroy();
  }

  // Opciones base obligatorias de escalamiento fluido
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: type === 'bar' ? {
      y: { grid: { color: 'rgba(44, 37, 30, 0.05)' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    } : {}
  };

  // Mezclar opciones estructurales con las personalizadas de cada gráfica
  const mergedOptions = Object.assign({}, baseOptions, customOptions);

  charts[id] = new Chart(
    document.getElementById(id),
    {
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
    }
  );
}

// Carga Inicial al abrir el portal
window.onload = () => {
  loadData();
  // Sincronización en bucle cada 30 segundos
  setInterval(loadData, 30000);
};
