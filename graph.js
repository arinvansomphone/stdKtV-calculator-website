const canvas = document.getElementById('myLineChart');
const ctx = canvas.getContext('2d');

//// input parameters
// let Vtotal = calculateVolumeOfPatient() * 1000;
let Vtotal = 36000;
let Kd = 130;
let G = 556;
let sessionlength = 213;
let totalUF = 7000;
// let sessionlength = document.getElementById('timeOutputThrice');
// let totalUF = document.getElementById('UF_RateThrice') * 1000;
let Kru = 0;
let initialPUN = 100;
// let Kru = getNumberValue("kru");

//// thrice per week secondary parameters 
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

//// thrice per week calculations
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
  let solute_added_by_G = (1-dialysison[i]) * G
  let solute_added_by_V2 = Kic * (C_V2begin[i] - C_V1begin[i])
  let solute_removed_by_HD = Kd * C_V1begin[i] * dialysison[i]
  let solute_removed_by_Kru = Kru * C_V1begin[i]
  solute_V1 = solute_V1 + solute_added_by_G + solute_added_by_V2 - solute_removed_by_HD - solute_removed_by_Kru
  solute_V2 = solute_V2 - solute_added_by_V2
  C_V1begin.push(solute_V1 / V1begin[i + 1])
  C_V2begin.push(solute_V2 / V2)
}

// twice per week seconday parameters
let sessionlength2 = 375;
let timeoff2 = 10080 - 2 * sessionlength2;
let fluid2 = totalUF / timeoff2;
let timebetween1_22 = 3 * 1440 - sessionlength2;
let timebetween2_32 = 4 * 1440 - sessionlength2;
let UFrx12 = 4 / 7 * totalUF;
let UFrx22 = 3 / 7 * totalUF;

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
  let solute_removed_by_HD = Kd * C_V1begin2[i] * dialysison2[i]
  let solute_removed_by_Kru = Kru * C_V1begin2[i]
  solute_V12 = solute_V12 + solute_added_by_G + solute_added_by_V2 - solute_removed_by_HD - solute_removed_by_Kru
  solute_V22 = solute_V22 - solute_added_by_V2
  C_V1begin2.push(solute_V12 / V1begin2[i + 1])
  C_V2begin2.push(solute_V22 / V2)
}


const data = {
    labels: Array.from({ length: 10081 }, (_, i) => i),
    datasets: [
      {
        label: '3x per Week Treatment',
        data: C_V1begin,
        fill: false,            // no fill under the line
        tension: 0.1,           // curve tension (0 = straight lines)
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        pointRadius: 1,
        pointBackgroundColor: 'rgba(75,192,192,1)',
      },
      {
        label: '2x per Week Treatment',
        data: C_V1begin2,
        fill: false,
        tension: 0.1,
        borderColor: 'rgba(153,102,255,1)',
        borderWidth: 1,
        pointRadius: 1,
        pointBackgroundColor: 'rgba(153,102,255,1)',
      }
    ]
  };

const options = {
responsive: true,
plugins: {
    title: {
    display: true,
    text: 'PUN Level Through Week',
    font: {
      size: 26
    }
    },
    tooltip: {
    mode: 'index',
    intersect: false,
    }
},
scales: {
    x: {
      ticks: {
        autoSkip: false,
        maxTicksLimit: 7,
        callback: function(value) {
          const labels = {
            0: 'Monday',
            1440: 'Tuesday',
            2880: 'Wednesday',
            4320: 'Thursday',
            5600: 'Friday',
            7200: 'Saturday',
            8640: 'Sunday'
          };
          if (labels[value]) return labels[value];
          return '';
        }
      },
      min: 0,
      max: 10080
    },
    y: {
    display: true,
    title: {
        display: true,
        text: 'PUN',
        font: {
          weight: 'bold'
        }
    },
    beginAtZero: true
    }
}
};

Chart.defaults.color = '#000';
Chart.defaults.font.family = "Inter"
new Chart(ctx, {
type: 'line',
data,
options
});