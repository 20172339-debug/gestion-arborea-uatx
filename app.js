// Pegar aquí la URL pública de ejecución de tu Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};

// =========================
// HERBARIO — DATOS
// =========================

// Respaldo local: se usa si el Apps Script todavía no envía "data.muerdagos".
// En cuanto tu API devuelva ese campo (ver appscript.gs actualizado), estos
// datos se ignoran automáticamente y se usan los reales de tu Excel.
const DEMO_MUERDAGOS = [
  { nombreComun: 'Muérdago Americano', nombreCientifico: 'Phoradendron leucarpum', origen: 'Nacional', usoMedicinal: 'Si', hospedero: 'Álamo, Sauce y Nogal', enCampus: 17 },
  { nombreComun: 'Muérdago Toji', nombreCientifico: 'Phoradendron californicum', origen: 'Nacional', usoMedicinal: 'Si', hospedero: 'Mezquite, Encino y Árboles Urb.', enCampus: 8 },
  { nombreComun: 'Muérdago Mexicano', nombreCientifico: 'Psittacanthus calyculatus', origen: 'Nacional', usoMedicinal: 'Si', hospedero: 'Mezquite, Encino y Árboles Urb.', enCampus: 1 },
  { nombreComun: 'Muérdago Enano', nombreCientifico: 'Arceuthobium globosum', origen: 'Nacional', usoMedicinal: 'No', hospedero: 'Coníferas (Pinos)', enCampus: 0 },
  { nombreComun: 'Muérdago Verdadero', nombreCientifico: 'Phoradendron velutinum', origen: 'Nacional', usoMedicinal: 'Si', hospedero: 'Frutales y Caducifolios', enCampus: 0 },
  { nombreComun: 'Muérdago de los Encinos', nombreCientifico: 'Phoradendron serotinum', origen: 'Nacional', usoMedicinal: 'Si', hospedero: 'Encinos (Quercus)', enCampus: 0 },
  { nombreComun: 'Muérdago Injerto / Clavelito', nombreCientifico: 'Struthanthus interruptus', origen: 'Nacional', usoMedicinal: 'Si', hospedero: 'Árboles Urbanos y Frutales', enCampus: 0 },
  { nombreComun: 'Muérdago de Cacao / Bajero', nombreCientifico: 'Oryctanthus alveolatus', origen: 'Nacional', usoMedicinal: 'No', hospedero: 'Zonas Tropicales / Frutales', enCampus: 0 },
  { nombreComun: 'Muérdago Blanco Europeo', nombreCientifico: 'Viscum album', origen: 'Extranjero', usoMedicinal: 'Si', hospedero: 'Árboles Templados Europeos', enCampus: 0 },
  { nombreComun: 'Muérdago Australiano', nombreCientifico: 'Amyema miquelii', origen: 'Extranjero', usoMedicinal: 'No', hospedero: 'Eucaliptos', enCampus: 0 }
];

// Textos educativos de uso medicinal tradicional (no dosis, solo referencia
// divulgativa). Este dato no viene del Excel: edítalo libremente aquí.
const USOS_MEDICINALES = {
  'Muérdago Americano': 'En la medicina tradicional mexicana, las hojas y tallos de los muérdagos del género Phoradendron se han preparado en infusión como apoyo tradicional para el sistema circulatorio. Estudios preliminares también han explorado su actividad antimicrobiana frente a distintos patógenos.',
  'Muérdago Toji': 'Al igual que otros muérdagos de Phoradendron, se le atribuye un uso tradicional relacionado con el equilibrio de la presión arterial. Su empleo herbolario suele limitarse a comunidades locales y no cuenta con evidencia clínica amplia.',
  'Muérdago Mexicano': 'El muérdago mexicano (Psittacanthus calyculatus) es una de las especies parásitas mejor documentadas en la herbolaria popular del centro del país, empleada tradicionalmente en infusión como complemento para el bienestar cardiovascular.',
  'Muérdago Verdadero': 'Se le da un uso similar al de otros Phoradendron: preparación en infusión de hojas como tónico tradicional, principalmente asociado al cuidado del corazón y la circulación.',
  'Muérdago de los Encinos': 'Crece de forma específica sobre encinos y se ha empleado de manera tradicional en infusiones locales, con un uso etnobotánico comparable al de otras especies del género Phoradendron.',
  'Muérdago Injerto / Clavelito': 'En la medicina tradicional mexicana se documenta su uso en infusión para la hipertensión y como estimulante de las contracciones gastrointestinales, además de un uso antidiabético reportado en distintas regiones del país.',
  'Muérdago Blanco Europeo': 'El muérdago europeo (Viscum album) es la especie de muérdago con mayor respaldo de investigación: en fitoterapia se ha usado tradicionalmente como apoyo cardiovascular e inmunológico, y sus extractos estandarizados se investigan en Europa como terapia complementaria bajo supervisión médica estricta. No sustituye ningún tratamiento y su uso siempre debe ser supervisado por un profesional de la salud.'
};

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
    const syncIconHerbario = document.getElementById('sync-icon-herbario');
    if (syncIcon) syncIcon.classList.add('fa-spin');
    if (syncIconHerbario) syncIconHerbario.classList.add('fa-spin');

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

    // 7. RENDER DE LA VITRINA DEL HERBARIO
    renderHerbario(data.muerdagos && data.muerdagos.length ? data.muerdagos : DEMO_MUERDAGOS);

    if (syncIcon) syncIcon.classList.remove('fa-spin');
    if (syncIconHerbario) syncIconHerbario.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error en el procesamiento de datos del Herbario:', error);
    // Si falla la API, igual mostramos la vitrina con los datos de respaldo
    renderHerbario(DEMO_MUERDAGOS);
    const syncIconErr = document.getElementById('sync-icon');
    const syncIconHerbarioErr = document.getElementById('sync-icon-herbario');
    if (syncIconErr) syncIconErr.classList.remove('fa-spin');
    if (syncIconHerbarioErr) syncIconHerbarioErr.classList.remove('fa-spin');
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

// =========================
// HERBARIO — RENDER DE LA VITRINA
// =========================

// Colores de "contenido" del frasco por repisa, para dar lectura visual
// inmediata de a qué colección pertenece cada especie.
const COLOR_LIQUIDO = {
  1: '#bfa15f', // Colección Universitaria (dorado, en sintonía con la marca)
  2: '#8a9b73', // Flora Parásita Nacional (verde salvia)
  3: '#7e93ad'  // Taxones Internacionales (azul empolvado)
};

function codigoMuerdago(nombre) {
  // Genera un código corto tipo etiqueta de espécimen (AME, TOJ, MEX...)
  const limpio = nombre.replace(/muérdago/i, '').replace(/[^a-zA-ZÁÉÍÓÚÑ ]/g, '').trim();
  const palabra = limpio.split(' ')[0] || nombre;
  return palabra.substring(0, 3).toUpperCase();
}

function frascoSVG(codigo, colorLiquido) {
  return `
    <svg viewBox="0 0 90 150" class="frasco-svg" aria-hidden="true">
      <ellipse cx="45" cy="140" rx="26" ry="5" class="frasco-sombra"></ellipse>
      <rect x="30" y="8" width="30" height="14" rx="4" class="frasco-tapa"></rect>
      <rect x="34" y="20" width="22" height="10" class="frasco-cuello"></rect>
      <path d="M20 32 Q20 28 26 28 L64 28 Q70 28 70 32 L74 118 Q74 134 45 134 Q16 134 20 118 Z" class="frasco-vidrio"></path>
      <path d="M23 82 Q23 128 45 128 Q67 128 67 82 L69 74 L21 74 Z" fill="${colorLiquido}" class="frasco-liquido"></path>
      <path d="M40 60 Q35 50 42 44 Q48 50 44 60 Z" class="frasco-hoja"></path>
      <rect x="30" y="90" width="30" height="16" rx="2" class="frasco-etiqueta"></rect>
      <text x="45" y="101" text-anchor="middle" class="frasco-codigo">${codigo}</text>
    </svg>`;
}

function clasificarRepisa(m) {
  if (Number(m.enCampus) > 0) return 1;
  if ((m.origen || '').toLowerCase().startsWith('nacional')) return 2;
  return 3;
}

function crearFrasco(m, repisa) {
  const btn = document.createElement('button');
  btn.className = 'frasco frasco-nuevo';
  btn.type = 'button';
  btn.setAttribute('aria-label', `Ver ficha de ${m.nombreComun}`);

  const badge = (repisa === 1 && Number(m.enCampus) > 0)
    ? `<span class="frasco-badge">${m.enCampus}</span>`
    : '';

  btn.innerHTML = `
    ${badge}
    ${frascoSVG(codigoMuerdago(m.nombreComun), COLOR_LIQUIDO[repisa])}
    <span class="frasco-tooltip">
      <strong>${m.nombreComun}</strong>
      <em>${m.nombreCientifico}</em>
    </span>
  `;

  btn.addEventListener('click', () => abrirFicha(m, repisa));
  setTimeout(() => btn.classList.remove('frasco-nuevo'), 500);
  return btn;
}

function renderHerbario(muerdagos) {
  const contenedores = { 1: document.getElementById('repisa-1'), 2: document.getElementById('repisa-2'), 3: document.getElementById('repisa-3') };
  if (!contenedores[1] || !contenedores[2] || !contenedores[3]) return;

  contenedores[1].innerHTML = '';
  contenedores[2].innerHTML = '';
  contenedores[3].innerHTML = '';

  muerdagos.forEach(m => {
    const repisa = clasificarRepisa(m);
    contenedores[repisa].appendChild(crearFrasco(m, repisa));
  });
}

// =========================
// HERBARIO — FICHA TÉCNICA (MODAL)
// =========================

let fichaActual = null;

function abrirFicha(m, repisa) {
  fichaActual = m;

  document.getElementById('fichaNombreComun').innerText = m.nombreComun;
  document.getElementById('fichaNombreCientifico').innerText = m.nombreCientifico;
  document.getElementById('fichaOrigen').innerText = m.origen || 'Desconocido';
  document.getElementById('fichaHospedero').innerText = m.hospedero || 'No registrado';
  document.getElementById('fichaCampus').innerText = Number(m.enCampus) > 0 ? `${m.enCampus} ejemplares` : 'No registrado';

  const badge = document.getElementById('fichaEstado');
  if (Number(m.enCampus) > 0) {
    badge.innerText = 'Presente en el campus';
    badge.className = 'ficha-badge en-campus';
  } else {
    badge.innerText = repisa === 3 ? 'Referencia internacional' : 'No registrado en el campus';
    badge.className = 'ficha-badge no-registrado';
  }

  const bloqueMedicinal = document.getElementById('fichaMedicinalBloque');
  const textoUso = document.getElementById('fichaUsoTexto');
  const esMedicinal = (m.usoMedicinal || '').toLowerCase().startsWith('si') || (m.usoMedicinal || '').toLowerCase().startsWith('sí');

  if (esMedicinal) {
    bloqueMedicinal.style.display = 'block';
    textoUso.innerText = USOS_MEDICINALES[m.nombreComun] || 'Esta especie está reportada con uso medicinal tradicional; su ficha detallada está en proceso de documentación.';
    textoUso.classList.remove('visible');
    document.getElementById('fichaMedicinalBtn').innerHTML = '<i class="fa-solid fa-mortar-pestle"></i> Ver uso medicinal tradicional';
  } else {
    bloqueMedicinal.style.display = 'none';
  }

  document.getElementById('fichaOverlay').classList.add('activa');
}

function cerrarFicha() {
  document.getElementById('fichaOverlay').classList.remove('activa');
  fichaActual = null;
}

function toggleUsoMedicinal() {
  const texto = document.getElementById('fichaUsoTexto');
  const btn = document.getElementById('fichaMedicinalBtn');
  const visible = texto.classList.toggle('visible');
  btn.innerHTML = visible
    ? '<i class="fa-solid fa-mortar-pestle"></i> Ocultar uso medicinal tradicional'
    : '<i class="fa-solid fa-mortar-pestle"></i> Ver uso medicinal tradicional';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarFicha();
});

// Carga Inicial al abrir el portal
window.onload = () => {
  loadData();
  // Sincronización en bucle cada 30 segundos
  setInterval(loadData, 30000);
};
