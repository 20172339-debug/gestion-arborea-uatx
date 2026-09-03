// Endpoint de ejecución de Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};

// ==========================================
// BASE DE DATOS BOTÁNICA Y TAXONÓMICA
// ==========================================
const BASE_DATOS_MUERDAGOS = [
  // --- REPISA 1: Colección Universitaria (Tlaxcala / Campus UATx) ---
  {
    id: "phoradendron-velutinum",
    repisa: "universitaria",
    nombreComun: "Muérdago de Encino (Toji)",
    nombreCientifico: "Phoradendron velutinum",
    familia: "Santalaceae",
    hospedadores: "Quercus laurina, Quercus rugosa (Encinos de clima templado-frío).",
    usoMedicinal: "Se emplea tradicionalmente en infusiones para equilibrar la presión arterial y disminuir palpitaciones.",
    parteUsada: "Hojas y tallos jóvenes desecados a la sombra.",
    precaucion: "Contiene viscotoxinas. Dosis no estandarizadas pueden ser tóxicas para el sistema cardiovascular.",
    imagen: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=600&q=80",
    campusCount: 142
  },
  {
    id: "psittacanthus-calyculatus",
    repisa: "universitaria",
    nombreComun: "Muérdago Naranjo",
    nombreCientifico: "Psittacanthus calyculatus",
    familia: "Loranthaceae",
    hospedadores: "Fraxinus uhdei (Fresno), Populus alba (Álamo), Prunus serotina (Capulín).",
    usoMedicinal: "Utilizado en la medicina popular regional para afecciones gastrointestinales y dolores reumáticos.",
    parteUsada: "Hojas secas en decocción ligera.",
    precaucion: "Requiere moderación estricta por alcaloides de alta reactividad orgánica.",
    imagen: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80",
    campusCount: 98
  },
  {
    id: "phoradendron-tomentosum",
    repisa: "universitaria",
    nombreComun: "Injerto de Tlaxcala",
    nombreCientifico: "Phoradendron tomentosum",
    familia: "Santalaceae",
    hospedadores: "Prosopis laevigata (Mezquite), Acacia farnesiana (Huizache).",
    usoMedicinal: "Empleado localmente en cataplasmas externas para aliviar inflamaciones articulares.",
    parteUsada: "Tallo y ramas maceradas.",
    precaucion: "No ingerir sin supervisión herbolaria experimentada.",
    imagen: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80",
    campusCount: 45
  },

  // --- REPISA 2: Flora Parásita Nacional (México) ---
  {
    id: "struthanthus-interceptus",
    repisa: "nacional",
    nombreComun: "Matapalos Tropical",
    nombreCientifico: "Struthanthus interceptus",
    familia: "Loranthaceae",
    hospedadores: "Arbolado urbano tropical, cítricos y leguminosas arbóreas.",
    usoMedicinal: "Utilizado en herbolaria tradicional como coadyuvante en lavados cicatrizantes.",
    parteUsada: "Corteza y hojas.",
    precaucion: "Posible irritación dérmica en pieles sensibles.",
    imagen: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80",
    campusCount: 12
  },
  {
    id: "phoradendron-brachystachyum",
    repisa: "nacional",
    nombreComun: "Muérdago de Valle",
    nombreCientifico: "Phoradendron brachystachyum",
    familia: "Santalaceae",
    hospedadores: "Matorral xerófilo y especies de bosque caducifolio.",
    usoMedicinal: "Registrado en el Bajío para infusiones destinadas a calmar la ansiedad nerviosa.",
    parteUsada: "Hojas molidas.",
    precaucion: "Contraindicado en el embarazo y lactancia.",
    imagen: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=600&q=80",
    campusCount: 5
  },
  {
    id: "cladocolea-loniceroides",
    repisa: "nacional",
    nombreComun: "Muérdago Enano de la Meseta",
    nombreCientifico: "Cladocolea loniceroides",
    familia: "Loranthaceae",
    hospedadores: "Arbolado de alta montaña y sauces fluviales.",
    usoMedicinal: "Usos rituales de protección en comunidades rurales del centro del país.",
    parteUsada: "Ramas completas.",
    precaucion: "Planta con alta densidad de resinas; no apta para consumo interno.",
    imagen: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=600&q=80",
    campusCount: 0
  },

  // --- REPISA 3: Taxones Internacionales ---
  {
    id: "viscum-album",
    repisa: "internacional",
    nombreComun: "Muérdago Blanco Europeo",
    nombreCientifico: "Viscum album",
    familia: "Santalaceae",
    hospedadores: "Malus domestica (Manzano), Populus, Pinus sylvestris.",
    usoMedicinal: "Base de tratamientos complementarios (Iscador) e investigación oncológica europea por sus lectinas.",
    parteUsada: "Extracto estandarizado de hoja y tallo.",
    precaucion: "Las bayas blancas son altamente tóxicas por ingestión directa.",
    imagen: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80",
    campusCount: 0
  },
  {
    id: "arceuthobium-oxycedri",
    repisa: "internacional",
    nombreComun: "Muérdago Enano del Enebro",
    nombreCientifico: "Arceuthobium oxycedri",
    familia: "Santalaceae",
    hospedadores: "Juniperus spp. (Enebros y Sabinas del Mediterráneo).",
    usoMedicinal: "Astringente artesanal en antiguos tratados botánicos mediterráneos.",
    parteUsada: "Extracto de brotes.",
    precaucion: "Toxico si se consume en cantidades mayores.",
    imagen: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    campusCount: 0
  }
];

// ==========================================
// NAVEGACIÓN Y CORRECCIÓN DE DIMENSIONES
// ==========================================
function showSection(id) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  document.getElementById(id).classList.add('active');
  const navBtn = document.getElementById(`btn-${id}`);
  if (navBtn) navBtn.classList.add('active');

  // Ajuste dinámico de gráficas al volver al Dashboard
  if (id === 'dashboard') {
    Object.keys(charts).forEach(key => {
      if (charts[key]) {
        charts[key].resize();
      }
    });
  }
}

// ==========================================
// GENERADOR DINÁMICO DEL ESPECIERO (HERBARIO)
// ==========================================
function renderEspeciero() {
  const repisaUni = document.getElementById('repisa-universitaria');
  const repisaNac = document.getElementById('repisa-nacional');
  const repisaInt = document.getElementById('repisa-internacional');

  if (!repisaUni || !repisaNac || !repisaInt) return;

  repisaUni.innerHTML = '';
  repisaNac.innerHTML = '';
  repisaInt.innerHTML = '';

  BASE_DATOS_MUERDAGOS.forEach(item => {
    const frascoHTML = `
      <div class="frasco-item" onclick="abrirModalMuerdago('${item.id}')">
        <div class="frasco-cristal">
          <div class="liquido-conservante"></div>
          <img src="${item.imagen}" alt="${item.nombreComun}" class="planta-muestra">
          <div class="etiqueta-frasco">
            <span class="etiqueta-titulo">${item.nombreComun}</span>
            <span class="etiqueta-tax">${item.nombreCientifico}</span>
          </div>
        </div>
      </div>
    `;

    if (item.repisa === 'universitaria') {
      repisaUni.innerHTML += frascoHTML;
    } else if (item.repisa === 'nacional') {
      repisaNac.innerHTML += frascoHTML;
    } else if (item.repisa === 'internacional') {
      repisaInt.innerHTML += frascoHTML;
    }
  });
}

// ==========================================
// LÓGICA DE VENTANA MODAL BOTÁNICA
// ==========================================
function abrirModalMuerdago(idSpecie) {
  const especie = BASE_DATOS_MUERDAGOS.find(e => e.id === idSpecie);
  if (!especie) return;

  document.getElementById('modalImg').src = especie.imagen;
  document.getElementById('modalFamilia').innerText = especie.familia;
  document.getElementById('modalNombreComun').innerText = especie.nombreComun;
  document.getElementById('modalNombreCientifico').innerText = especie.nombreCientifico;
  document.getElementById('modalHospedadores').innerText = especie.hospedadores;
  document.getElementById('modalCampusCount').innerText = `${especie.campusCount} ejemplares`;

  // Datos Medicinales
  document.getElementById('modalUsoMedicinal').innerText = especie.usoMedicinal;
  document.getElementById('modalParteUsada').innerText = especie.parteUsada;
  document.getElementById('modalPrecaucion').innerText = especie.precaucion;

  // Resetear despliegue medicinal al abrir
  const medicinalContent = document.getElementById('medicinalContent');
  const btnToggle = document.getElementById('btnMedicinalToggle');
  if (medicinalContent) medicinalContent.classList.add('hidden');
  if (btnToggle) btnToggle.classList.remove('open');

  const modal = document.getElementById('modalMuerdago');
  if (modal) modal.classList.add('active');
}

function cerrarModalMuerdago() {
  const modal = document.getElementById('modalMuerdago');
  if (modal) modal.classList.remove('active');
}

function toggleDetalleMedicinal() {
  const medicinalContent = document.getElementById('medicinalContent');
  const btnToggle = document.getElementById('btnMedicinalToggle');
  
  if (medicinalContent && btnToggle) {
    medicinalContent.classList.toggle('hidden');
    btnToggle.classList.toggle('open');
  }
}

// ==========================================
// CONSUMO ASÍNCRONO DEL ENDPOINT DE APPS SCRIPT
// ==========================================
async function loadData() {
  try {
    const syncIcon = document.getElementById('sync-icon');
    if (syncIcon) syncIcon.classList.add('fa-spin');

    const response = await fetch(API_URL);
    const data = await response.json();

    // 1. ASIGNACIÓN DE TARJETAS NUMÉRICAS
    document.getElementById('totalGeneral').innerText = data.totalGeneral || 0;
    document.getElementById('infestados').innerText = data.infestados || 0;

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
      { plugins: { legend: { display: false } } }
    );

    // 3. RENDER GRÁFICA II: PARCELAS
    createChart(
      'chartParcelas',
      'bar',
      data.parcelas.map(p => p.area),
      data.parcelas.map(p => p.total),
      '#bfa15f',
      { plugins: { legend: { display: false } } }
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

    // 6. INYECCIÓN DE ALERTAS SANITARIAS
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

// ==========================================
// MOTOR CENTRAL DE GRÁFICAS (CHART.JS)
// ==========================================
function createChart(id, type, labels, data, color, customOptions = {}) {
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

  const canvas = document.getElementById(id);
  if (!canvas) return;

  charts[id] = new Chart(
    canvas,
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

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
window.onload = () => {
  renderEspeciero();
  loadData();
  setInterval(loadData, 30000);
};
