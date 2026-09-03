// Endpoint del Apps Script desplegado
const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};
let muerdagosGaleria = []; // Almacén local de datos para la Galería / Vitrina

// =========================
// NAVEGACIÓN Y CORRECCIÓN DE GRÁFICAS
// =========================
function showSection(id) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  const targetSection = document.getElementById(id);
  const targetBtn = document.getElementById(`btn-${id}`);
  
  if (targetSection) targetSection.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

  if (id === 'dashboard') {
    Object.keys(charts).forEach(key => {
      if (charts[key]) charts[key].resize();
    });
  }
}

// =========================
// CONSUMO Y PROCESAMIENTO DE DATOS
// =========================
async function loadData() {
  try {
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.add('fa-spin');

    const response = await fetch(API_URL);
    const data = await response.json();

    // 1. CARGA DE CONTEO EN TARJETAS POR NIVEL DE SEVERIDAD
    renderNivelesTarjetas(data);

    // 2. RENDER GRÁFICAS DEL DASHBOARD
    createChart(
      'chartParcelas',
      'bar',
      data.parcelas.map(p => p.area),
      data.parcelas.map(p => p.total),
      '#bfa15f',
      { plugins: { legend: { display: false } } }
    );

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

    // 3. CENSO POR ESPECIE DE ÁRBOL
    const speciesContainer = document.getElementById('speciesContainer');
    if (speciesContainer) {
      speciesContainer.innerHTML = '';
      data.especies.forEach(e => {
        const row = document.createElement('div');
        row.className = 'species-row-premium';
        row.innerHTML = `
          <span class="row-label"><i class="fa-solid fa-tree"></i> ${e.especie}</span>
          <span class="row-counter">${e.total}</span>
        `;
        speciesContainer.appendChild(row);
      });
    }

    // 4. ALMACENAR Y RENDERIZAR LA GALERÍA DE MUÉRDAGOS
    if (data.galeriaMuerdagos) {
      muerdagosGaleria = data.galeriaMuerdagos;
      renderGaleria('todos');
    }

    if (syncIcon) syncIcon.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error al sincronizar con Apps Script:', error);
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.remove('fa-spin');
  }
}

// =========================
// TARJETAS DE NIVELES (REEMPLAZO DE GRÁFICA DE SANOS)
// =========================
function renderNivelesTarjetas(data) {
  let conteos = {
    sano: 0, leve: 0, moderado: 0,
    medio: 0, severo: 0, critico: 0, muerto: 0
  };

  // Mapear la información obtenida del resumen de infestación
  if (data.infestacion && Array.isArray(data.infestacion)) {
    data.infestacion.forEach(item => {
      const estadoLower = item.estado.toLowerCase();
      if (estadoLower.includes("sano")) conteos.sano = item.total;
      else if (estadoLower.includes("leve")) conteos.leve = item.total;
      else if (estadoLower.includes("moderado")) conteos.moderado = item.total;
      else if (estadoLower.includes("medio")) conteos.medio = item.total;
      else if (estadoLower.includes("severo")) conteos.severo = item.total;
      else if (estadoLower.includes("crítico") || estadoLower.includes("critico")) conteos.critico = item.total;
      else if (estadoLower.includes("muerto")) conteos.muerto = item.total;
    });
  }

  // Asignar los conteos a sus respectivos IDs en las tarjetas del HTML
  Object.keys(conteos).forEach(key => {
    const el = document.getElementById(`count-${key}`);
    if (el) el.innerText = conteos[key];
  });
}

// =========================
// VITRINA VIRTUAL Y ESTANTE DE CRISTAL (GALERÍA)
// =========================
function renderGaleria(filtro) {
  const shelfContainer = document.getElementById('shelfContainer');
  if (!shelfContainer) return;

  shelfContainer.innerHTML = '';

  const listaFiltrada = muerdagosGaleria.filter(item => {
    if (filtro === 'uatx') return item.enCampus || item.origen.toLowerCase().includes('uatx');
    if (filtro === 'nacional') return item.origen.toLowerCase().includes('nacional');
    if (filtro === 'extranjero') return item.origen.toLowerCase().includes('extranjero');
    return true; // Todos
  });

  if (listaFiltrada.length === 0) {
    shelfContainer.innerHTML = `<p class="empty-msg">No hay especímenes registrados en esta categoría.</p>`;
    return;
  }

  listaFiltrada.forEach((esp, index) => {
    const jar = document.createElement('div');
    jar.className = 'capelo-item';
    jar.onclick = () => abrirFicha(esp);

    // Ajuste de animación individual para dar dinamismo a la levitación
    const delay = (index % 3) * 0.5;

    jar.innerHTML = `
      <div class="jar-tooltip">
        <span class="tooltip-common">${esp.nombreComun}</span>
        <span class="tooltip-scientific">${esp.nombreCientifico || 'S/N'}</span>
      </div>
      <div class="glass-capelo">
        <div class="glass-reflection"></div>
        <img src="assets/muerdago-demo.png" alt="${esp.nombreComun}" class="floating-specimen" style="animation-delay: ${delay}s;">
      </div>
      <div class="jar-base"></div>
    `;
    shelfContainer.appendChild(jar);
  });
}

function filtrarGaleria(filtro) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  renderGaleria(filtro);
}

// =========================
// MODAL / FICHA INTERACTIVA DEL ESPÉCIMEN
// =========================
function abrirFicha(esp) {
  const modal = document.getElementById('specimenModal');
  if (!modal) return;

  document.getElementById('modalNombreComun').innerText = esp.nombreComun;
  document.getElementById('modalNombreCientifico').innerText = esp.nombreCientifico || 'Sin clasificación científica';
  document.getElementById('modalOriginBadge').innerText = esp.enCampus ? `Detectados en Campus: ${esp.detectadosEnCampus}` : `Origen: ${esp.origen}`;

  document.getElementById('modalEstructura').innerText = `Planta hemiparásita con estructura adaptada para la penetración del xilema arbóreo. Su patrón vegetativo presenta raíces modificadas (haustorios).`;
  document.getElementById('modalPropiedades').innerText = esp.usoMedicinal ? esp.usoMedicinal : 'No se registran aplicaciones medicinales locales en la base de datos.';
  document.getElementById('modalRiesgo').innerText = `Hospedero principal reportado: ${esp.hospederoPrincipal || 'Variados'}. Constituye un factor de riesgo para el deterioro del dosel urbano.`;

  switchTab('tab-estructura');
  modal.classList.remove('hidden');
}

function cerrarFicha() {
  const modal = document.getElementById('specimenModal');
  if (modal) modal.classList.add('hidden');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  const activeContent = document.getElementById(tabId);
  if (activeContent) activeContent.classList.add('active');

  if (event && event.target && event.target.classList.contains('tab-btn')) {
    event.target.classList.add('active');
  }
}

// =========================
// MOTOR DE GRÁFICAS CHART.JS
// =========================
function createChart(id, type, labels, data, color, customOptions = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  if (charts[id]) charts[id].destroy();

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: type === 'bar' ? {
      y: { grid: { color: 'rgba(44, 37, 30, 0.05)' }, ticks: { font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { font: { size: 10 } } }
    } : {}
  };

  const mergedOptions = Object.assign({}, baseOptions, customOptions);

  charts[id] = new Chart(canvas, {
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

// Carga Inicial
window.onload = () => {
  loadData();
  setInterval(loadData, 30000); // Recarga automática cada 30 segundos
};
