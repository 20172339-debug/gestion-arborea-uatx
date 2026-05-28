const API_URL = 'https://script.google.com/macros/s/AKfycbwBEphqvwYuGyhR-WZxyfAkwe4eW_reLvedcKT80mloneU5d6gfvua_t7nIltG1WHOr/exec';

let charts = {};

// =========================
// NAVEGACION
// =========================

function showSection(id) {

  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  document.getElementById(id).classList.add('active');
}

// =========================
// CARGA DE DATOS
// =========================

async function loadData() {

  try {

    const response = await fetch(API_URL);

    const data = await response.json();

    console.log(data);

    // =========================
    // TARJETAS PRINCIPALES
    // =========================

    document.getElementById('totalGeneral').innerText =
      data.totalGeneral || 0;

    document.getElementById('infestados').innerText =
      data.infestados || 0;

    document.getElementById('saludables').innerText =
      (data.totalGeneral - data.infestados) || 0;

    // =========================
    // GRAFICA INFESTACION
    // =========================

    createChart(
      'chartInfestacion',
      'doughnut',

      data.infestacion.map(i => i.estado),

      data.infestacion.map(i => i.total),

      [
        '#8BC6A2',
        '#F2D785',
        '#F2B880',
        '#E38B73',
        '#C96B7D',
        '#8E6C88',
        '#7A8BA3'
      ]
    );

    // =========================
    // GRAFICA PARCELAS
    // =========================

    createChart(
      'chartParcelas',
      'bar',

      data.parcelas.map(p => p.area),

      data.parcelas.map(p => p.total),

      '#8BC6A2'
    );

    // =========================
    // GRAFICA TIPOS
    // =========================

    createChart(
      'chartTipos',
      'polarArea',

      data.tipos.map(t => t.tipo),

      data.tipos.map(t => t.total),

      [
        '#8BC6A2',
        '#F2D785',
        '#A5B4CB',
        '#E5A9A9',
        '#B7D3C2'
      ]
    );

    // =========================
    // ESPECIES REGISTRADAS
    // =========================

    const speciesContainer =
      document.getElementById('speciesContainer');

    speciesContainer.innerHTML = '';

    data.especies.forEach(especie => {

      const card = document.createElement('div');

      card.className = 'species-chip';

      card.innerHTML = `

        <div class="chip-icon">
          🌳
        </div>

        <div class="chip-info">

          <h4>${especie.especie}</h4>

          <p>${especie.total}</p>

        </div>

      `;

      speciesContainer.appendChild(card);

    });

    // =========================
    // ESPECIES AFECTADAS
    // =========================

    const affectedContainer =
      document.getElementById('affectedContainer');

    affectedContainer.innerHTML = '';

    data.especies.forEach(especie => {

      const afectados =

        (especie.leve || 0) +
        (especie.moderado || 0) +
        (especie.medio || 0) +
        (especie.severo || 0) +
        (especie.critico || 0) +
        (especie.muerto || 0);

      if (afectados > 0) {

        const card = document.createElement('div');

        card.className =
          'species-chip affected-chip';

        card.innerHTML = `

          <div class="chip-icon">
            🍂
          </div>

          <div class="chip-info">

            <h4>${especie.especie}</h4>

            <p>${afectados}</p>

          </div>

        `;

        affectedContainer.appendChild(card);

      }

    });

  } catch(error) {

    console.error('ERROR:', error);

  }

}

// =========================
// CREAR GRAFICAS
// =========================

function createChart(
  id,
  type,
  labels,
  data,
  color
) {

  if (charts[id]) {

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

          borderColor: 'transparent',

          borderWidth: 2,

          borderRadius: 12,

          hoverOffset: 10

        }]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {

            labels: {

              color: '#dce3ea',

              font: {

                family: 'Poppins',

                size: 12

              }

            }

          }

        },

        scales:

          type === 'bar'

          ? {

            y: {

              ticks: {

                color: '#9fb0c0'

              },

              grid: {

                color: 'rgba(255,255,255,0.05)'

              }

            },

            x: {

              ticks: {

                color: '#9fb0c0'

              },

              grid: {

                display: false

              }

            }

          }

          : {}

      }

    }

  );

}

// =========================
// CARGA INICIAL
// =========================

loadData();

// =========================
// ACTUALIZACION AUTOMATICA
// =========================

setInterval(() => {

  loadData();

}, 30000);
