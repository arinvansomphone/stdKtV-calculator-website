import { getNumberValue, calculateVolumeOfPatient, calculateTwice, calculateThrice } from './controller.js';

export function drawGraph() {
  const canvas = document.getElementById('myLineChart');
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Get selected PUN day
  const punDay = document.querySelector('input[name="punDay"]:checked')?.value || 'monday';
  const dayOrders = {
    monday:    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    wednesday: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday'],
    friday:    ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  };
  const dayOrder = dayOrders[punDay];
  const dayStartIndices = {
    monday: 0,
    wednesday: 2880,
    friday: 5760
  };
  const dayTicks = [0, 1440, 2880, 4320, 5760, 7200, 8640];
  
  // Rotate the dayTicks array based on selected day
  const rotatedDayTicks = punDay === 'wednesday' 
    ? [2880, 4320, 5760, 7200, 8640, 10080, 1440]
    : punDay === 'friday'
    ? [5760, 7200, 8640, 10080, 1440, 2880, 4320]
    : dayTicks;

  //// input parameters
  let Vtotal = calculateVolumeOfPatient() * 1000;
  let G = getNumberValue("G") * 100;
  let sessionlength = calculateThrice(); 
  let totalUF = getNumberValue("weeklyuf") * 1000; // is this UF the input or the calculated? 
  let Kru = getNumberValue("kru");
  let initialPUN = getNumberValue("pun");

  //// new 3x per week
  // new 3x per week secondary parameters 
  let timeoff = 10080 - 3 * sessionlength;
  let fluid = totalUF / timeoff;
  let timebetween1_2 = 2 * 1440 - sessionlength;
  let timebetween2_3 = 2 * 1440 - sessionlength;
  let timebetween3_1 = 3 * 1440 - sessionlength;
  let V1 = Vtotal * 1/3;
  let V2 = Vtotal * 2/3;
  let Kic = 0.016 * Vtotal;
  let UFrx1 = 3 / 7 * totalUF;
  let UFrx2 = 2 / 7 * totalUF;
  let UFrx3 = 2 / 7 * totalUF;
  let Kd = getNumberValue("spKtV_current") * Vtotal / (3 * sessionlength) - Kru;

  // new 3x per week calculations
  // volume
  let V1begin = [V1 + timebetween3_1 * fluid]
  let dialysison = Array(sessionlength).fill(1)
  dialysison = dialysison.concat(Array(timebetween1_2).fill(0), Array(sessionlength).fill(1), 
  Array(timebetween2_3).fill(0), Array(sessionlength).fill(1), Array(timebetween3_1).fill(0))

  for (let i=0; i < 10080; i++) {
    let reduce; 
    if (i < 2880) {
      reduce = dialysison[i] * UFrx1 / sessionlength
    }
    else if (i < 5760) {
      reduce = dialysison[i] * UFrx2 / sessionlength  
    }
    else {
      reduce = dialysison[i] * UFrx2 / sessionlength
    }
    let add = (1 - dialysison[i]) * fluid
    V1begin.push(V1begin[i] + add - reduce)
  }

  // concentrations
  let C_V1begin = [initialPUN]
  let C_V2begin = [initialPUN]
  let solute_V1 = initialPUN * V1begin[0]
  let solute_V2 = initialPUN * V2

  for (let i=0; i < 10080; i++) {
    let solute_added_by_G = G
    let solute_added_by_V2 = Kic * (C_V2begin[i] - C_V1begin[i])
    let solute_removed_by_HD = Kd * C_V1begin[i] * dialysison[i]
    let solute_removed_by_Kru = Kru * C_V1begin[i]
    solute_V1 = solute_V1 + solute_added_by_G + solute_added_by_V2 - solute_removed_by_HD - solute_removed_by_Kru
    solute_V2 = solute_V2 - solute_added_by_V2
    C_V1begin.push(solute_V1 / V1begin[i + 1])
    C_V2begin.push(solute_V2 / V2)
  }

  // apc and tac
  let tac = 0;
  for (const val of C_V1begin) {
    tac += val;
  }
  tac /= C_V1begin.length;
  const apc = (C_V1begin[0] + C_V1begin[2879] + C_V1begin[5759] + C_V1begin[10079]) / 4;

  //// new 2x per week
  // 2x per week seconday parameters
  let sessionlength2 = calculateTwice();
  let timeoff2 = 10080 - 2 * sessionlength2;
  let fluid2 = totalUF / timeoff2;
  let timebetween1_22 = 3 * 1440 - sessionlength2;
  let timebetween2_32 = 4 * 1440 - sessionlength2;
  let UFrx12 = 4 / 7 * totalUF;
  let UFrx22 = 3 / 7 * totalUF;
  let Kd2 = getNumberValue("spKtV_current") * Vtotal / (2 * sessionlength2) - Kru;

  // twice per week calculations
  // volume
  let V1begin2 = [V1 + timebetween2_32 * fluid2]
  let dialysison2 = Array(sessionlength2).fill(1)
  dialysison2 = dialysison2.concat(Array(timebetween1_22).fill(0), Array(sessionlength2).fill(1), 
  Array(timebetween2_32).fill(0))

  for (let i=0; i < 10080; i++) {
    let reduce; 
    if (i < 4320) {
      reduce = dialysison2[i] * UFrx12 / sessionlength2
    }
    else {
      reduce = dialysison2[i] * UFrx22 / sessionlength2
    }
    let add = (1 - dialysison2[i]) * fluid2
    V1begin2.push(V1begin2[i] + add - reduce)
  }

  // concentrations
  let C_V1begin2 = [initialPUN]
  let C_V2begin2 = [initialPUN]
  let solute_V12 = initialPUN * V1begin2[0]
  let solute_V22 = initialPUN * V2

  for (let i=0; i < 10080; i++) {
    let solute_added_by_G = (1-dialysison2[i]) * G
    let solute_added_by_V2 = Kic * (C_V2begin2[i] - C_V1begin2[i])
    let solute_removed_by_HD = Kd2 * C_V1begin2[i] * dialysison2[i]
    let solute_removed_by_Kru = Kru * C_V1begin2[i]
    solute_V12 = solute_V12 + solute_added_by_G + solute_added_by_V2 - solute_removed_by_HD - solute_removed_by_Kru
    solute_V22 = solute_V22 - solute_added_by_V2
    C_V1begin2.push(solute_V12 / V1begin2[i + 1])
    C_V2begin2.push(solute_V22 / V2)
  }

  // apc and tac
  let tac2 = 0;
  for (const val of C_V1begin2) {
    tac2 += val;
  }
  tac2 /= C_V1begin2.length;
  const apc2 = (C_V1begin2[0] + C_V1begin2[4319] + C_V1begin[10079]) / 3;

  //// previous 3x per week
  // secondary parameters
  let sessionlengthold = getNumberValue("time");
  let timeoffold = 10080 - 3 * sessionlengthold;
  let fluidold = totalUF / timeoffold;
  let timebetween1_2old = 2 * 1440 - sessionlengthold;
  let timebetween2_3old = 2 * 1440 - sessionlengthold;
  let timebetween3_1old = 3 * 1440 - sessionlengthold;
  let Kdold = getNumberValue("spKtV_current") * Vtotal / (3 * sessionlengthold) - Kru;

  // previous 3x per week calculations
  // volume
  let V1beginold = [V1 + timebetween3_1old * fluidold]
  let dialysisonold = Array(sessionlengthold).fill(1)
  dialysisonold = dialysisonold.concat(Array(timebetween1_2old).fill(0), Array(sessionlengthold).fill(1), 
  Array(timebetween2_3old).fill(0), Array(sessionlengthold).fill(1), Array(timebetween3_1old).fill(0))

  for (let i=0; i < 10080; i++) {
    let reduce; 
    if (i < 2880) {
      reduce = dialysisonold[i] * UFrx1 / sessionlengthold
    }
    else if (i < 5760) {
      reduce = dialysisonold[i] * UFrx2 / sessionlengthold  
    }
    else {
      reduce = dialysisonold[i] * UFrx2 / sessionlengthold
    }
    let add = (1 - dialysisonold[i]) * fluidold
    V1beginold.push(V1beginold[i] + add - reduce)
  }

  // concentrations
  let C_V1beginold = [initialPUN]
  let C_V2beginold = [initialPUN]
  let solute_V1old = initialPUN * V1beginold[0]
  let solute_V2old = initialPUN * V2

  for (let i=0; i < 10080; i++) {
    let solute_added_by_G = (1-dialysisonold[i]) * G
    let solute_added_by_V2 = Kic * (C_V2beginold[i] - C_V1beginold[i])
    let solute_removed_by_HD = Kdold * C_V1beginold[i] * dialysisonold[i]
    let solute_removed_by_Kru = Kru * C_V1beginold[i]
    solute_V1old = solute_V1old + solute_added_by_G + solute_added_by_V2 - solute_removed_by_HD - solute_removed_by_Kru
    solute_V2old = solute_V2old - solute_added_by_V2
    C_V1beginold.push(solute_V1old / V1beginold[i + 1])
    C_V2beginold.push(solute_V2old / V2)
  }

  // apc and tac
  let tacold = 0;
  for (const val of C_V1beginold) {
    tacold += val;
  }
  tacold /= C_V1beginold.length;
  const apcold = (C_V1beginold[0] + C_V1beginold[2879] + C_V1beginold[5759] + C_V1beginold[10079]) / 4;

  /// graphing
  const data = {
      labels: Array.from({ length: 10081 }, (_, i) => i),
      datasets: [
        {
          label: 'Current 3×/wk',
          data: C_V1beginold,
          fill: false,
          tension: 0.1,
          borderColor: 'rgb(232, 173, 96)',
          borderWidth: 1,
          pointRadius: 1, 
          pointHoverRadius: 4, 
          pointHitRadius: 4,
          pointBackgroundColor: 'rgb(232, 173, 96)',
          backgroundColor: 'transparent'
        },
        {
          label: 'New 3×/wk',
          data: C_V1begin,
          fill: false,
          tension: 0.1,
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1,
          pointRadius: 1,
          pointHoverRadius: 4,
          pointHitRadius: 4,
          pointBackgroundColor: 'rgba(75,192,192,1)',
          backgroundColor: 'transparent'
        },
        {
          label: 'New 2×/wk',
          data: C_V1begin2,
          fill: false,
          tension: 0.1,
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 1,
          pointRadius: 1,
          pointHoverRadius: 4,
          pointHitRadius: 4,
          pointBackgroundColor: 'rgba(153,102,255,1)',
          backgroundColor: 'transparent'
        },
        {
          label: 'APC (Prev 3×/wk)',
          data: Array(10081).fill(apcold),
          borderColor: 'rgb(232, 173, 96)',
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          hidden: true,
          backgroundColor: 'transparent'
        },
        {
          label: 'TAC (Prev 3×/wk)',
          data: Array(10081).fill(tacold),
          borderColor: 'rgb(232, 173, 96)',
          borderWidth: 1.5,
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          hidden: true,
          backgroundColor: 'transparent'
        },
        {
          label: 'APC (New 3×/wk)',
          data: Array(10081).fill(apc),
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          hidden: true,
          backgroundColor: 'transparent'
        },
        {
          label: 'TAC (New 3×/wk)',
          data: Array(10081).fill(tac),
          borderColor: 'rgba(75,192,192,1)',
          borderWidth: 1.5,
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          hidden: true,
          backgroundColor: 'transparent'
        },
        {
          label: 'APC (New 2×/wk)',
          data: Array(10081).fill(apc2),
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 1.5,
          borderDash: [8, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          hidden: true,
          backgroundColor: 'transparent'
        },
        {
          label: 'TAC (New 2×/wk)',
          data: Array(10081).fill(tac2),
          borderColor: 'rgba(153,102,255,1)',
          borderWidth: 1.5,
          borderDash: [2, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
          hidden: true,
          backgroundColor: 'transparent'
        }
      ]
    };

  const options = {
  legendCallback: function(chart) {
  // datasets already in the order you want: orange, teal, purple
  const groups = [[], [], []];              // 3 columns
  chart.data.datasets.forEach((ds, i) => {
    const col = ds.borderColor.startsWith('rgb(232') ? 0  // orange
              : ds.borderColor.startsWith('rgba(75') ? 1  // teal
              : 2;                                         // purple
    groups[col].push(
      `<li data-ds-index="${i}">
         <span style="background:${ds.borderColor};border:1px solid ${ds.borderColor}"></span>
         ${ds.label}
       </li>`
    );
  });
  return `
    <ul>${groups[0].join('')}</ul>
    <ul>${groups[1].join('')}</ul>
    <ul>${groups[2].join('')}</ul>`;
  },
  responsive: true,
  layout: { padding: 0 },
  plugins: {
    title: {
      display: true,
      text: 'PUN Levels Throughout Week',
      font: {
        size: 26
      },
      color: '#000'
    },
    legend: { display: false },
    decimation: { enabled: false }
  },
  tooltip: {
    mode: 'index',
    intersect: false
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  },
  scales: {
    x: {
      grid: {
        color: '#ddd',
        drawBorder: true,
        drawOnChartArea: true,
        drawTicks: true
      },
      ticks: {
        callback: (value) => dayOrder[Math.floor(value / 1440)],
        display: true,
        values: [0, 1440, 2880, 4320, 5760, 7200, 8640],
        maxTicksLimit: 7
      },
      min: 0,
      max: 10080,
      display: true
    },
    y: {
      display: true,
      title: {
        display: true,
        text: 'PUN',
        font: {
          weight: 'bold'
        },
        color: '#000'
      },
      beginAtZero: true,
      grid: {
        color: '#ddd',
        drawBorder: true
      },
      backgroundColor: 'transparent',
      ticks: {
        color: '#000'
      }
    }
  },
  backgroundColor: 'transparent',
  maintainAspectRatio: true
  };

  Chart.defaults.color = '#000';
  Chart.defaults.font.family = "Inter";
  Chart.defaults.backgroundColor = 'transparent';
  Chart.defaults.borderColor = '#ddd';

  // HTML Legend Plugin for Chart.js v4+
  const htmlLegendPlugin = {
    id: 'htmlLegend',
    afterUpdate(chart) {
      const legendContainer = document.getElementById('chartLegend');
      if (!legendContainer) return;
      // Group datasets by color
      const groups = [[], [], []];
      chart.data.datasets.forEach((ds, i) => {
        const col = ds.borderColor.startsWith('rgb(232') ? 0 // orange
                  : ds.borderColor.startsWith('rgba(75') ? 1 // teal
                  : 2; // purple
        groups[col].push({
          index: i,
          label: ds.label,
          color: ds.borderColor,
          hidden: chart.isDatasetVisible(i) === false
        });
      });
      // Build HTML for each column
      legendContainer.innerHTML = groups.map(group =>
        `<ul>` + group.map(item =>
          `<li data-ds-index="${item.index}" style="opacity:${item.hidden ? 0.5 : 1}">
            <span style="background:${item.color};border:1px solid ${item.color}"></span>
            ${item.label}
          </li>`
        ).join('') + `</ul>`
      ).join('');
    }
  };

  const chart = new Chart(ctx, {
    type: 'line',
    data,
    options: {
      ...options,
      plugins: {
        ...options.plugins,
        legend: { display: false }
      }
    },
    plugins: [htmlLegendPlugin]
  });

  // Remove any existing background
  canvas.style.background = 'none';
  ctx.globalCompositeOperation = 'source-over';

  // Click handler for legend
  document.getElementById('chartLegend').onclick = function(e) {
    const li = e.target.closest('li[data-ds-index]');
    if (!li) return;
    const idx = +li.dataset.dsIndex;
    const meta = chart.getDatasetMeta(idx);
    chart.setDatasetVisibility(idx, !chart.isDatasetVisible(idx));
    chart.update();
  };

  return chart;
}

