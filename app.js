// URL pública de ejecución de tu Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};
let galeriaMuerdagosData = []; // Guardará la lista global para filtrado en cliente

// =========================
// NAVEGACIÓN Y CORRECCIÓN DE DIMENSIONES
// =========================
function showSection(id) {
  // Ocultar secciones e inactivar botones
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  // Activar pestaña actual
  const sectionTarget = document.getElementById(id);
  const btnTarget = document.getElementById(`btn-${id}`);
  
  if (sectionTarget) sectionTarget.classList.add('active');
  if (btnTarget) btnTarget.classList.add('active');

  // Fuerza a Chart.js a recalcular el tamaño al regresar al dashboard
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

    // 1. ASIGNACIÓN DE TARJETAS NUMÉRICAS PRINCIPALES
    document.getElementById('totalGeneral').innerText = data.totalGeneral || 0;
    document.getElementById('infestados').innerText = data.infestados || 0;

    let sanos = (data.totalGeneral - data.infestados) || 0;
    let porcentajeBioseguridad = data.totalGeneral > 0 ? Math.round((sanos / data.totalGeneral) * 100) : 0;
    document.getElementById('saludables').innerText = porcentajeBioseguridad + "%";

    // 2. DESACOPLE Y RENDER DE SEVERIDAD DE INFESTACIÓN (SOLO INFESTADOS)
    if (data.infestacion) {
      // Extraer cantidad de sanos para el badge superior
      const objSano = data.infestacion.find(i => i.estado === "Sano");
      const numSanos = objSano ? objSano.total : sanos;
      const cantSanosElem = document.getElementById('cantSanos');
      if (cantSanosElem) cantSanosElem.innerText = numSanos;

      // Mapeo directo para las tarjetas KPI de severidad
      const sevMap = {
        'Leve': 'sev-leve',
        'Moderado': 'sev-moderado',
        'Medio': 'sev-medio',
        'Severo': 'sev-severo',
        'Crítico': 'sev-critico',
        'Muerto': 'sev-muerto'
      };

      data.infestacion.forEach(item => {
        const elemId = sevMap[item.estado];
        if (elemId) {
          const el = document.getElementById(elemId);
          if (el) el.innerText = item.total || 0;
        }
      });

      // Filtrar el estado "Sano" para que la gráfica represente ÚNICAMENTE los infestados
      const infestadosSolo = data.infestacion.filter(i => i.estado !== "Sano");

      createChart(
        'chartInfestacion',
        'bar',
        infestadosSolo.map(i => i.estado),
        infestadosSolo.map(i => i.total),
        ['#dfca9f', '#cfa375', '#bd7e60', '#ad5245', '#7a221e', '#45403c'],
        {
          plugins: { legend: { display: false } }
        }
      );
    }

    // 3. RENDER GRÁFICA II: PARCELAS
    if (data.parcelas) {
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
    }

    // 4. RENDER GRÁFICA III: TIPOS ECOLÓGICOS
    if (data.tipos) {
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
    }

    // 5. INYECCIÓN DE CENSO ABSOLUTO DE ESPECIES
    const speciesContainer = document.getElementById('speciesContainer');
    if (speciesContainer && data.especies) {
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

    // 6. INYECCIÓN DE ALERTAS SANITARIAS
    const affectedContainer = document.getElementById('affectedContainer');
    if (affectedContainer && data.especies) {
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

    // 7. CARGA DE LA GALERÍA / ESTANTE DE MUÉRDAGOS
    if (data.galeriaMuerdagos) {
      galeriaMuerdagosData = data.galeriaMuerdagos;
      renderGallery(galeriaMuerdagosData);
    }

    if (syncIcon) syncIcon.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error en el procesamiento de datos del Herbario:', error);
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.remove('fa-spin');
  }
}

// =========================
// RENDERIZADO Y FILTRADO DE LA GALERÍA DE MUÉRDAGOS
// =========================
function renderGallery(lista) {
  const muerdagosGrid = document.getElementById('muerdagosGrid');
  if (!muerdagosGrid) return;

  muerdagosGrid.innerHTML = '';

  if (lista.length === 0) {
    muerdagosGrid.innerHTML = `<p class="no-data-msg">No se encontraron especies en esta categoría.</p>`;
    return;
  }

  lista.forEach(m => {
    const card = document.createElement('div');
    card.className = 'muerdago-card glass';

    // Determinar si está detectado en el campus
    const detectados = Number(m.detectadosEnCampus) || 0;
    const badgeCampus = detectados > 0 
      ? `<span class="badge-tag badge-campus-active"><i class="fa-solid fa-location-dot"></i> ${detectados} detectados</span>`
      : `<span class="badge-tag badge-campus-inactive"><i class="fa-solid fa-circle-minus"></i> Sin registro en campus</span>`;

    // Badges de Origen y Uso
    const esNacional = (m.origen || '').toString().toLowerCase().includes('nacional');
    const badgeOrigen = esNacional 
      ? `<span class="badge-tag badge-nacional">🇲🇽 Nacional</span>`
      : `<span class="badge-tag badge-extranjero">🌍 Extranjero</span>`;

    const usoMed = (m.usoMedicinal || '').toString().trim();
    const badgeUso = usoMed.toLowerCase() === 'si' || usoMed.toLowerCase() === 'sí'
      ? `<span class="badge-tag badge-uso-si"><i class="fa-solid fa-notes-medical"></i> Uso Medicinal</span>`
      : `<span class="badge-tag badge-uso-no"><i class="fa-solid fa-ban"></i> Sin Uso Medicinal</span>`;

    card.innerHTML = `
      <div class="card-header-bio">
        <h4 class="muerdago-title fuente-editorial">${m.nombreComun}</h4>
        <span class="muerdago-sci"><em>${m.nombreCientifico || 'S/N'}</em></span>
      </div>
      
      <div class="card-badges-flex">
        ${badgeOrigen}
        ${badgeCampus}
        ${badgeUso}
      </div>

      <div class="card-body-info">
        <p><strong><i class="fa-solid fa-tree"></i> Hospedero Principal:</strong></p>
        <p class="hospedero-text">${m.hospederoPrincipal || 'No especificado'}</p>
      </div>
    `;

    muerdagosGrid.appendChild(card);
  });
}

function filterGallery(categoria) {
  // Actualizar botones activos
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }

  if (categoria === 'todos') {
    renderGallery(galeriaMuerdagosData);
  } else if (categoria === 'campus') {
    const filtrados = galeriaMuerdagosData.filter(m => (Number(m.detectadosEnCampus) || 0) > 0);
    renderGallery(filtrados);
  } else if (categoria === 'nacional') {
    const filtrados = galeriaMuerdagosData.filter(m => (m.origen || '').toString().toLowerCase().includes('nacional'));
    renderGallery(filtrados);
  } else if (categoria === 'extranjero') {
    const filtrados = galeriaMuerdagosData.filter(m => (m.origen || '').toString().toLowerCase().includes('extranjero'));
    renderGallery(filtrados);
  }
}

// =========================
// MOTOR CENTRAL DE GRÁFICAS
// =========================
function createChart(id, type, labels, data, color, customOptions = {}) {
  const chartElem = document.getElementById(id);
  if (!chartElem) return;

  if (charts[id]) {
    charts[id].destroy();
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: type === 'bar' ? {
      y: { grid: { color: 'rgba(44, 37, 30, 0.05)' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    } : {}
  };

  const mergedOptions = Object.assign({}, baseOptions, customOptions);

  charts[id] = new Chart(
    chartElem,
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
