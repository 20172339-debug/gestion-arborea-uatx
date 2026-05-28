const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};

function showSection(id) {

  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(id).classList.add('active');
}

async function loadData() {

  try {

    const response = await fetch(API_URL);

    const data = await response.json();

    // =========================
    // TARJETAS
    // =========================

    document.getElementById('totalGeneral').innerText =
      data.totalGeneral;

    document.getElementById('infestados').innerText =
      data.infestados;

    // =========================
    // RESUMEN DE INFESTACIÓN
    // =========================

    createChart(
      'chartInfestacion',
      'doughnut',
      data.infestacion.map(i => i.estado),
      data.infestacion.map(i => i.total),
      [
        '#7bb89a',
        '#d9c27f',
        '#dba979',
        '#c97b63',
        '#b56576',
        '#8d5a97',
        '#6b7c93'
      ]
    );

    // =========================
    // PARCELAS
    // =========================

    createChart(
      'chartParcelas',
      'bar',
      data.parcelas.map(p => p.area),
      data.parcelas.map(p => p.total),
      '#7bb89a'
    );

    // =========================
    // TIPOS
    // =========================

    createChart(
      'chartTipos',
      'pie',
      data.tipos.map(t => t.tipo),
      data.tipos.map(t => t.total),
      [
        '#7bb89a',
        '#d9c27f',
        '#6b7c93',
        '#c97b63'
      ]
    );

    // =========================
    // ESPECIES REGISTRADAS
    // =========================

    const speciesContainer =
      document.getElementById(
        'speciesContainer'
      );

    speciesContainer.innerHTML = '';

    data.especies.forEach(especie => {

      const card =
        document.createElement('div');

      card.className =
        'species-card';

      card.innerHTML = `
        <h3>🌳 ${especie.especie}</h3>
        <p>${especie.total}</p>
        <small>ejemplares</small>
      `;

      speciesContainer.appendChild(card);

    });

    // =========================
    // ESPECIES AFECTADAS
    // =========================

    const affectedContainer =
      document.getElementById(
        'affectedContainer'
      );

    affectedContainer.innerHTML = '';

    data.especies.forEach(especie => {

      const afectados =

        especie.leve +
        especie.moderado +
        especie.medio +
        especie.severo +
        especie.critico +
        especie.muerto;

      if(afectados > 0) {

        const card =
          document.createElement('div');

        card.className =
          'species-card';

        card.innerHTML = `
          <h3>🍂 ${especie.especie}</h3>
          <p>${afectados}</p>
          <small>afectados</small>
        `;

        affectedContainer.appendChild(card);

      }

    });

  } catch(error) {

    console.error('ERROR:', error);

  }
}

function createChart(
  id,
  type,
  labels,
  data,
  color,
  horizontal = false
) {

  if(charts[id]) {
    charts[id].destroy();
  }

  charts[id] = new Chart(
    document.getElementById(id),
    {

      type: type,

      data: {

        labels: labels,

        datasets: [{
          label: 'Cantidad',
          data: data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 2,
          fill: false,
          tension: 0.3
        }]
      },

      options: {

        responsive: true,

        plugins: {

          legend: {
            display: true
          }

        }

      }

    }
  );
}

// =========================
// CARGA INICIAL
// =========================

loadData();

// =========================
// ACTUALIZACIÓN AUTOMÁTICA
// =========================

setInterval(() => {

  loadData();

}, 30000);
