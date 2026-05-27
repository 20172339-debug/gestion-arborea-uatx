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
        '#2d6a4f',
        '#f4d35e',
        '#ee964b',
        '#f95738',
        '#9d0208',
        '#6a040f',
        '#6c757d'
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
      '#2d6a4f'
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
        '#588157',
        '#bc6c25',
        '#6d597a',
        '#adb5bd'
      ]
    );

    // =========================
    // TOTAL POR ESPECIE
    // =========================

    createChart(
      'chartEspecies',
      'bar',
      data.especies.map(e => e.especie),
      data.especies.map(e => e.total),
      '#386641',
      true
    );

    // =========================
    // INFESTACIÓN POR ESPECIE
    // =========================

    const infestadosPorEspecie = data.especies.map(e => {

      return (
        e.leve +
        e.moderado +
        e.medio +
        e.severo +
        e.critico +
        e.muerto
      );

    });

    createChart(
      'chartNiveles',
      'line',
      data.especies.map(e => e.especie),
      infestadosPorEspecie,
      '#b91c1c'
    );

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

        indexAxis: horizontal ? 'y' : 'x',

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
