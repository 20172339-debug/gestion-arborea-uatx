const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};
let cacheMuerdagosGlobal = [];

function showSection(id) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));

  const targetSection = document.getElementById(id);
  if (targetSection) targetSection.classList.add('active');

  const navBtn = document.getElementById(`btn-${id}`);
  if (navBtn) navBtn.classList.add('active');

  if (id === 'dashboard') {
    setTimeout(() => {
      Object.keys(charts).forEach(key => {
        if (charts[key]) {
          charts[key].resize();
        }
      });
    }, 50);
  }
}

function renderEspeciero(muerdagosList) {
  const repisaUni = document.getElementById('repisa-universitaria');
  const repisaNac = document.getElementById('repisa-nacional');
  const repisaInt = document.getElementById('repisa-internacional');

  if (!repisaUni || !repisaNac || !repisaInt) return;

  repisaUni.innerHTML = '';
  repisaNac.innerHTML = '';
  repisaInt.innerHTML = '';

  muerdagosList.forEach(item => {
    let badgeHtml = '';
    let destinoRepisa = item.repisa;

    // Si tiene conteo directo en campus, forzamos su visualización en Colección Universitaria
    if (item.conteoCampus > 0) {
      destinoRepisa = 'universitaria';
      badgeHtml = `<span class="badge-conteo-rojo">${item.conteoCampus}</span>`;
    }

    const frascoHTML = `
      <div class="frasco-item" onclick="abrirModalMuerdago('${item.id}')">
        <div class="frasco-cristal">
          ${badgeHtml}
          <div class="liquido-conservante"></div>
          <img src="${item.imagen}" alt="${item.nombreComun}" class="planta-muestra">
          <div class="etiqueta-frasco">
            <span class="etiqueta-titulo">${item.nombreComun}</span>
            <span class="etiqueta-tax">${item.nombreCientifico}</span>
          </div>
        </div>
      </div>
    `;

    if (destinoRepisa === 'universitaria') {
      repisaUni.innerHTML += frascoHTML;
    } else if (destinoRepisa === 'nacional') {
      repisaNac.innerHTML += frascoHTML;
    } else if (destinoRepisa === 'internacional') {
      repisaInt.innerHTML += frascoHTML;
    }
  });
}

function abrirModalMuerdago(idSpecie) {
  const especie = cacheMuerdagosGlobal.find(e => e.id === idSpecie);
  if (!especie) return;

  const modalImg = document.getElementById('modalImg');
  const modalFamilia = document.getElementById('modalFamilia');
  const modalNombreComun = document.getElementById('modalNombreComun');
  const modalNombreCientifico = document.getElementById('modalNombreCientifico');
  const modalHospedadores = document.getElementById('modalHospedadores');
  const modalCampusCount = document.getElementById('modalCampusCount');

  if (modalImg) modalImg.src = especie.imagen;
  if (modalFamilia) modalFamilia.innerText = especie.familia;
  if (modalNombreComun) modalNombreComun.innerText = especie.nombreComun;
  if (modalNombreCientifico) modalNombreCientifico.innerText = especie.nombreCientifico;
  if (modalHospedadores) modalHospedadores.innerText = especie.hospedadores;
  if (modalCampusCount) modalCampusCount.innerText = `${especie.conteoCampus} ejemplares`;

  const modalUsoMedicinal = document.getElementById('modalUsoMedicinal');
  const modalParteUsada = document.getElementById('modalParteUsada');
  const modalPrecaucion = document.getElementById('modalPrecaucion');

  if (modalUsoMedicinal) modalUsoMedicinal.innerText = especie.usosMedicinales;
  if (modalParteUsada) modalParteUsada.innerText = especie.partesUsadas;
  if (modalPrecaucion) modalPrecaucion.innerText = especie.precaucion;

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

function cerrarModalOuter(event) {
  if (event.target.id === 'modalMuerdago') {
    cerrarModalMuerdago();
  }
}

function toggleDetalleMedicinal() {
  const medicinalContent = document.getElementById('medicinalContent');
  const btnToggle = document.getElementById('btnMedicinalToggle');
  
  if (medicinalContent && btnToggle) {
    medicinalContent.classList.toggle('hidden');
    btnToggle.classList.toggle('open');
  }
}

async function loadData() {
  const syncIcon = document.getElementById('sync-icon');
  try {
    if (syncIcon) syncIcon.classList.add('fa-spin');

    const response = await fetch(API_URL);
    const data = await response.json();

    const elTotal = document.getElementById('totalGeneral');
    const elInfestados = document.getElementById('infestados');
    const elSaludables = document.getElementById('saludables');

    if (elTotal) elTotal.innerText = data.totalGeneral || 0;
    if (elInfestados) elInfestados.innerText = data.infestados || 0;

    let sanos = (data.totalGeneral - data.infestados) || 0;
    let porcentajeBioseguridad = data.totalGeneral > 0 ? Math.round((sanos / data.totalGeneral) * 100) : 0;
    if (elSaludables) elSaludables.innerText = porcentajeBioseguridad + "%";

    if (data.infestation && Array.isArray(data.infestation)) {
      createChart(
        'chartInfestacion',
        'bar',
        data.infestation.map(i => i.estado),
        data.infestation.map(i => i.total),
        ['#c7bfa7', '#dfca9f', '#cfa375', '#bd7e60', '#ad5245', '#7a221e', '#45403c'],
        { plugins: { legend: { display: false } } }
      );
    }

    if (data.parcelas && Array.isArray(data.parcelas)) {
      createChart(
        'chartParcelas',
        'bar',
        data.parcelas.map(p => p.area),
        data.parcelas.map(p => p.total),
        '#bfa15f',
        { plugins: { legend: { display: false } } }
      );
    }

    if (data.tipos && Array.isArray(data.tipos)) {
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

    const speciesContainer = document.getElementById('speciesContainer');
    if (speciesContainer && data.especies && Array.isArray(data.especies)) {
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

    const affectedContainer = document.getElementById('affectedContainer');
    if (affectedContainer && data.especies && Array.isArray(data.especies)) {
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

    // Sincronizar herbario con datos reales provenientes de Apps Script
    if (data.muerdagos && Array.isArray(data.muerdagos)) {
      cacheMuerdagosGlobal = data.muerdagos;
      renderEspeciero(cacheMuerdagosGlobal);
    }

    if (syncIcon) syncIcon.classList.remove('fa-spin');
  } catch (error) {
    console.error('Error en el procesamiento de datos del Herbario:', error);
    if (syncIcon) syncIcon.classList.remove('fa-spin');
  }
}

function createChart(id, type, labels, data, color, customOptions = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

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

window.onload = () => {
  loadData();
  setInterval(loadData, 30000);
};
