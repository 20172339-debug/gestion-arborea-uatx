// URL pública de ejecución de tu Google Apps Script
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
  const targetSection = document.getElementById(id);
  const targetBtn = document.getElementById(`btn-${id}`);

  if (targetSection) targetSection.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');

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
    if (data.infestacion && data.infestacion.length > 0) {
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
    }

    // 3. RENDER GRÁFICA II: PARCELAS
    if (data.parcelas && data.parcelas.length > 0) {
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
    if (data.tipos && data.tipos.length > 0) {
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
    if (speciesContainer) {
      speciesContainer.innerHTML = '';
      if (data.especies) {
        data.especies.forEach(e => {
          const row = document.createElement('div');
          row.className = 'species-row-premium';
          row.innerHTML = `
            <span class="row-label">🌿 ${e.especie}</span>
            <span class="row-counter">${e.total}</span>
          `;
          speciesContainer.appendChild(row);
        });
      }
    }

    // 6. INYECCIÓN DE ALERTAS SANITARIAS
    const affectedContainer = document.getElementById('affectedContainer');
    if (affectedContainer) {
      affectedContainer.innerHTML = '';
      if (data.especies) {
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
              <span class="row-label">⚠️ ${e.especie}</span>
              <span class="row-counter">${totalEnfermos}</span>
            `;
            affectedContainer.appendChild(row);
          }
        });
      }
    }

    // 7. INYECCIÓN DINÁMICA DE LA GALERÍA BOTÁNICA
    renderGallery(data);

    if (syncIcon) syncIcon.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error en el procesamiento de datos del Herbario:', error);
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.remove('fa-spin');
  }
}

// =========================
// RENDERIZADO DE GALERÍA DE ESPECIES
// =========================
function renderGallery(data) {
  const galleryContainer = document.getElementById('galleryContainer');
  if (!galleryContainer) return;

  galleryContainer.innerHTML = '';

  if (!data.especies || data.especies.length === 0) {
    galleryContainer.innerHTML = '<p class="no-data">No hay imágenes ni especies disponibles en este momento.</p>';
    return;
  }

  data.especies.forEach(e => {
    // Si la especie trae URL de imagen en el endpoint la usa, si no, coloca un fallback
    const imageUrl = e.imagenUrl || e.urlImagen || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80';

    let totalEnfermos = (Number(e.leve) || 0) + 
                        (Number(e.moderado) || 0) + 
                        (Number(e.medio) || 0) + 
                        (Number(e.severo) || 0) + 
                        (Number(e.critico) || 0) + 
                        (Number(e.muerto) || 0);

    const card = document.createElement('div');
    card.className = 'gallery-card glass';

    card.innerHTML = `
      <div class="gallery-image-wrapper">
        <img src="${imageUrl}" alt="${e.especie}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80';">
        <span class="gallery-badge ${totalEnfermos > 0 ? 'alert' : 'safe'}">
          ${totalEnfermos > 0 ? `${totalEnfermos} Afectados` : 'Saludable'}
        </span>
      </div>
      <div class="gallery-content">
        <h3 class="fuente-editorial">${e.especie}</h3>
        <div class="gallery-stats">
          <div>
            <small>Población Censada</small>
            <strong>${e.total || 0} ejemplares</strong>
          </div>
          <div>
            <small>Focos Activos</small>
            <strong class="${totalEnfermos > 0 ? 'text-alert' : 'text-safe'}">${totalEnfermos}</strong>
          </div>
        </div>
      </div>
    `;

    galleryContainer.appendChild(card);
  });
}

// =========================
// MOTOR CENTRAL DE GRÁFICAS
// =========================
function createChart(id, type, labels, data, color, customOptions = {}) {
  const canvasElement = document.getElementById(id);
  if (!canvasElement) return;

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
    canvasElement,
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
