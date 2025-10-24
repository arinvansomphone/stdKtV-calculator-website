/* controller.js  ─ ES-module that coordinates UI, calculations & chart */
import { drawGraph } from './graph.js';   // graph.js must export drawGraph()

/* ─────────── UI VISIBILITY + VALIDATION ─────────── */
function toggleFields() {
  const isEstimate = document.querySelector('input[name="isestimate"]:checked').value === 'yes';
  const volInput   = document.getElementById('volume-input');
  const volDisplay = document.getElementById('volume-display');
  const ghaGroup   = document.getElementById('gender-height-age');

  // required flags
  const req = (el , on) => (on ? el.setAttribute('required','') : el.removeAttribute('required'));

  if (isEstimate) {
    volInput .style.display = 'block';
    volDisplay.style.display = 'none';
    ghaGroup  .style.display = 'none';

    req(document.getElementById('ureaDistribution'), true );
    req(document.getElementById('age')            , false);
    req(document.getElementById('height')         , false);
    req(document.getElementById('weight')         , true );
    document.querySelectorAll('input[name="gender"]').forEach(i => req(i,false));
  } else {
    volInput .style.display = 'none';
    volDisplay.style.display = 'block';
    ghaGroup  .style.display = 'block';

    req(document.getElementById('ureaDistribution'), false);
    req(document.getElementById('age')            , true );
    req(document.getElementById('height')         , true );
    req(document.getElementById('weight')         , true );
    document.querySelectorAll('input[name="gender"]').forEach(i => req(i,true));
  }
  checkInputs();
}

function checkInputs() {
  const allFilled = [...document.querySelectorAll('input[required]')].every(i => i.value);
  document.getElementById('calculate').disabled = !allFilled;
}

/* ─────────── GENERIC HELPERS (exported so graph.js can import them) ─────────── */
export const getNumberValue = (id) => {
  const n = parseFloat(document.getElementById(id)?.value);
  return Number.isFinite(n) ? n : 0;
};

export function calculateVolumeOfPatient() {
  const isEstimate = document.querySelector('input[name="isestimate"]:checked').value === 'yes';
  let volume = 0;

  if (isEstimate) {
    volume = getNumberValue('ureaDistribution');
  } else {
    const age    = getNumberValue('age');
    const height = getNumberValue('height');
    const weight = getNumberValue('weight');
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    volume = gender === 'male'
        ? 2.447 - 0.09156 * age + 0.1074 * height + 0.3362 * weight
        : -2.097 + 0.1069 * height + 0.2466 * weight;
    volume *= 0.9;
    document.getElementById('ureaDisplay').value = volume.toFixed(2);
  }
  return volume;
}

export function calculateTwice() {
    let spKtV = getNumberValue("spKtV_current");
    let time = getNumberValue("time");
    let weeklyuf = getNumberValue("weeklyuf");
    let kru = getNumberValue("kru");
    let stdKtV_target = getNumberValue("stdKtV_target")
    let weight = getNumberValue("weight");
    let ureaVolume = calculateVolumeOfPatient();
    let t_prime = time; // start with current dialysis time
    let iteration_step = 0.1;
    let spKtV_prime = 0;

    let eKtV = (spKtV * time) / (time + 30);
    let Keff = (ureaVolume * 1000 * eKtV) / time;

    let UF_factor = 1 / (1-(0.74 * weeklyuf) / (2 * ureaVolume));
    let KruAdd = (10080 * kru) / (ureaVolume * 1000);

    let difference = 1;
    while (difference > 0.001 * stdKtV_target) {
        spKtV_prime = (Keff * (t_prime + 30)) / (ureaVolume * 1000);
        let eKtV_prime = (spKtV_prime * t_prime) / (t_prime + 30);
        let a = 1 - Math.exp(-eKtV_prime);
        let stdKtV_Leypoldt = (10080 * a / t_prime) / (a / eKtV_prime + (10080 / (2 * t_prime)) - 1);
        let stdKtV_trial = UF_factor * stdKtV_Leypoldt + KruAdd;
        difference = Math.abs(stdKtV_trial - stdKtV_target);

        // adjust time for next iteration
        if (stdKtV_trial < stdKtV_target) {
            t_prime += iteration_step;
        } else {
            t_prime -= iteration_step;
        }
    }

    let t_target = Math.round(t_prime);

    // removal rate
    let weightGainPerDay = weeklyuf / 7;
    let weightAccumulation = weightGainPerDay * 4 * 1000;
    let removalRate = weightAccumulation / (t_target / 60 * weight);
    let timeOutputTwice = document.getElementById("timeOutputTwice");
    if (timeOutputTwice) {
        timeOutputTwice.textContent = `${t_target}` + " min";
    }

    let UF_RateTwice = document.getElementById("UF_RateTwice");
    if (UF_RateTwice) {
        UF_RateTwice.textContent = `${removalRate.toFixed(1)}` + " mL/kg/hr";
    }

    let newspKtVTwice = document.getElementById("newspKtVTwice");
    if (newspKtVTwice) {
        newspKtVTwice.textContent = `${spKtV_prime.toFixed(2)}`;
    }
    
    if (removalRate < 13) {
        let UF_WarningTwice = document.getElementById("UF_WarningTwice");
        if (UF_WarningTwice) {
            UF_WarningTwice.textContent = "";
        }
    } else {
        let t_target13 = Math.round((60 * weightAccumulation) / (weight * 13));
        let UF_WarningTwice = document.getElementById("UF_WarningTwice");
        if (UF_WarningTwice) {
            UF_WarningTwice.innerHTML = "<strong>NOTE🚨</strong>: The predicted UF rate is greater than 13 mL/kg/hr. Increasing time to " + `${t_target13}` + " minutes would reduce the UF rate to 13 mL/kg/hr.";
        }
    }
    return t_target
}

export function calculateThrice() {
    let spKtV = getNumberValue("spKtV_current");
    let time = getNumberValue("time");
    let weeklyuf = getNumberValue("weeklyuf");
    let kru = getNumberValue("kru");
    let stdKtV_target = getNumberValue("stdKtV_target")
    let weight = getNumberValue("weight");
    let ureaVolume = calculateVolumeOfPatient();
    let t_prime = time; // start with current dialysis time
    let iteration_step = 0.1;
    let spKtV_prime = 0;

    let eKtV = (spKtV * time) / (time + 30);
    let Keff = (ureaVolume * 1000 * eKtV) / time;

    let UF_factor = 1 / (1-(0.74 * weeklyuf) / (3 * ureaVolume));
    let KruAdd = (10080 * kru) / (ureaVolume * 1000);

    let difference = 1;
    while (difference > 0.001 * stdKtV_target) {
        spKtV_prime = (Keff * (t_prime + 30)) / (ureaVolume * 1000);
        let eKtV_prime = (spKtV_prime * t_prime) / (t_prime + 30);
        let a = 1 - Math.exp(-eKtV_prime);
        let stdKtV_Leypoldt = (10080 * a / t_prime) / (a / eKtV_prime + (10080 / (3 * t_prime)) - 1);
        let stdKtV_trial = UF_factor * stdKtV_Leypoldt + KruAdd;
        difference = Math.abs(stdKtV_trial - stdKtV_target);

        // adjust time for next iteration
        if (stdKtV_trial < stdKtV_target) {
            t_prime += iteration_step;
        } else {
            t_prime -= iteration_step;
        }
    }

    let t_target = Math.round(t_prime);

    // removal rate
    let weightGainPerDay = weeklyuf / 7;
    let weightAccumulation = weightGainPerDay * 3 * 1000;
    let removalRate = weightAccumulation / (t_target / 60 * weight);
    let timeOutputThrice = document.getElementById("timeOutputThrice");
    if (timeOutputThrice) {
        timeOutputThrice.textContent = `${t_target}` + " min";
    }

    let UF_RateThrice = document.getElementById("UF_RateThrice");
    if (UF_RateThrice) {
        UF_RateThrice.textContent = `${removalRate.toFixed(1)}` + " mL/kg/hr";
    }

    let newspKtVThrice = document.getElementById("newspKtVThrice");
    if (newspKtVThrice) {
        newspKtVThrice.textContent = `${spKtV_prime.toFixed(2)}`;
    }
    if (removalRate < 13) {
        let UF_WarningThrice = document.getElementById("UF_WarningThrice");
        if (UF_WarningThrice) {
            UF_WarningThrice.textContent = "";
        }
    } else {
        let t_target13 = Math.round((60 * weightAccumulation) / (weight * 13));
        let UF_WarningThrice = document.getElementById("UF_WarningThrice");
        if (UF_WarningThrice) {
            UF_WarningThrice.innerHTML = "<strong>NOTE🚨</strong>: The predicted UF rate is greater than 13 mL/kg/hr. Increasing time to " + `${t_target13}` + " minutes would reduce the UF rate to 13 mL/kg/hr.";
        }
    } 
    return t_target;
}

/* ─────────── INITIAL UI BINDINGS ─────────── */
document.querySelectorAll('input').forEach(i => i.addEventListener('input',  checkInputs));
document.querySelectorAll('input[name="isestimate"]').forEach(i => i.addEventListener('change', toggleFields));

/* ─────────── MAIN SUBMIT HANDLER (re-draw chart each time) ─────────── */
const form         = document.getElementById('dialysisForm');
let   activeChart  = null;

form.addEventListener('submit', (e) => {
  e.preventDefault();          // stop page refresh

  calculateVolumeOfPatient();  // refresh derived inputs
  calculateTwice();
  calculateThrice();

  if (activeChart) { activeChart.destroy(); }
  activeChart = drawGraph();
});

/* block Enter from jumping to next page when inside single-line input */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
});

/* first-load setup */
toggleFields();
checkInputs();

/* ─────────── INITIAL CALC + CHART ─────────── */
(function initialRender() {
  // run all calculations with the default values already in the form
  calculateVolumeOfPatient();
  calculateTwice();
  calculateThrice();

  // build the first chart and keep its reference
  activeChart = drawGraph();
})();