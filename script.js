function toggleFields() {
    let isEstimateYes = document.querySelector('input[name="isestimate"]:checked').value === "yes";

    let ureaVolumeField = document.getElementById("urea-volume");
    let genderHeightAgeField = document.getElementById("gender-height-age");

    let ureaVolumeInput = document.getElementById("ureaDistribution");
    let ageInput = document.getElementById("age");
    let heightInput = document.getElementById("height");
    let weightInput = document.getElementById("weight");
    let genderInputs = document.querySelectorAll('input[name="gender"]');

    if (isEstimateYes) {
        ureaVolumeField.style.display = "block";
        genderHeightAgeField.style.display = "none";

        ureaVolumeInput.setAttribute("required", "true");
        ageInput.removeAttribute("required");
        heightInput.removeAttribute("required");
        weightInput.setAttribute("required", "true");

        genderInputs.forEach(input => input.removeAttribute("required"));
    } else {
        ureaVolumeField.style.display = "none";
        genderHeightAgeField.style.display = "block";

        ureaVolumeInput.removeAttribute("required");
        ageInput.setAttribute("required", "true");
        heightInput.setAttribute("required", "true");
        weightInput.setAttribute("required", "true");

        genderInputs.forEach(input => input.setAttribute("required", "true"));
    }

    checkInputs();
}

function checkInputs() {
    let isFilled = true;

    document.querySelectorAll("input[required]").forEach(input => {
        if (!input.value) {
            isFilled = false;
        }
    });

    let calculateButton = document.querySelector("button[type='submit']");
    calculateButton.disabled = !isFilled;
}

document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", checkInputs);
});

document.querySelectorAll('input[name="isestimate"]').forEach(input => {
    input.addEventListener("change", toggleFields);
});

function getNumberValue(id) {
    let value = parseFloat(document.getElementById(id)?.value);
    return isNaN(value) ? 0 : value;
}

function calculateVolumeOfPatient() {
    let isEstimateYes = document.querySelector('input[name="isestimate"]:checked').value === "yes";
    let volume = 0;
    if (isEstimateYes) {
        let ureaVolume = getNumberValue("ureaDistribution");
        volume = ureaVolume            

    } else {
        let age = getNumberValue("age");
        let height = getNumberValue("height");
        let weight = getNumberValue("weight");
        let gender = document.querySelector('input[name="gender"]:checked')?.value;

        if (gender === "male") {
            volume = 2.447 - (0.09156 * age) + (0.1074 * height) + (0.3362 * weight);
        } else if (gender === "female") {
            volume = -2.097 + (0.1069 * height) + (0.2466 * weight);
        }

        volume = volume * 0.9
    }

    let volumeOutputTwice = document.getElementById("volumeOutputTwice");
    let volumeOutputThrice = document.getElementById("volumeOutputThrice");

    if (volumeOutputTwice) {
        volumeOutputTwice.textContent = `${volume.toFixed(2)}` + " L";
    }

    if (volumeOutputThrice) {
        volumeOutputThrice.textContent = `${volume.toFixed(2)}` + " L";
    }

    return volume;
}

function calculateTwice() {
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

    let timeOutputTwice = document.getElementById("timeOutputTwice");
    if (timeOutputTwice) {
        timeOutputTwice.textContent = `${t_target}` + " min";
    }

    let stdKtVTargetOutputTwice = document.getElementById("stdKtVTargetOutputTwice");
    if (stdKtVTargetOutputTwice) {
        stdKtVTargetOutputTwice.textContent = `${stdKtV_target}`;
    }

    let NewSpKtVTwice = document.getElementById("NewSpKtVTwice");
    if (NewSpKtVTwice) {
        NewSpKtVTwice.textContent = `${spKtV_prime.toFixed(2)}`;
    }

    // removal rate
    let weightGainPerDay = weeklyuf / 7;
    let weightAccumulation = weightGainPerDay * 4 * 1000;
    let removalRate = weightAccumulation / (t_target / 60 * weight);
    let UF_RateTwice = document.getElementById("UF_RateTwice");
    if (UF_RateTwice) {
        UF_RateTwice.textContent = `${removalRate.toFixed(2)}` + " mL/kg/hr";
    }

    if (removalRate > 13) {
        let t_target13 = Math.round((60 * weightAccumulation) / (weight * 13));
        let time13OutputTwice = document.getElementById("time13OutputTwice");
        if (time13OutputTwice) {
            time13OutputTwice.textContent = `${t_target13}` + " min";
        }

        let UF_WarningTwice = document.getElementById("UF_WarningTwice");
        if (UF_WarningTwice) {
            UF_WarningTwice.textContent = "WARNING🚨: The predicted ultrafiltration rate is greater than 13 mL/kg/hr. Increasing the time to " + `${t_target13}` + " minutes would reduce the ultrafiltration rate to 13 mL/kg/hr.";
        }

        let spKtV_13 = (Keff * (t_target13 + 30)) / (ureaVolume * 1000);
        let spKtV_13OutputTwice = document.getElementById("spKtV_13OutputTwice");
        if (spKtV_13OutputTwice) {
            spKtV_13OutputTwice.textContent = `${spKtV_13.toFixed(2)}`;
        }

        let eKtV_13 = (spKtV_13 * t_target13) / (t_target13 + 30);
        let a_13 = 1 - Math.exp(-eKtV_13);
        let stdKtV_Leypoldt13 = (10080 * a_13 / t_target13) / (a_13 / eKtV_13 + (10080 / (2 * t_target13)) - 1);
        let stdKtV_13 = UF_factor * stdKtV_Leypoldt13 + KruAdd;
        let stdKtV_13OutputTwice = document.getElementById("stdKtV_13OutputTwice");
        if (stdKtV_13OutputTwice) {
            stdKtV_13OutputTwice.textContent = `${stdKtV_13.toFixed(2)}`;
        }
    } else {
        let UF_WarningTwice = document.getElementById("UF_WarningTwice");
        if (UF_WarningTwice) {
            UF_WarningTwice.textContent = null;
        }

        let time13OutputTwice = document.getElementById("time13OutputTwice");
        if (time13OutputTwice) {
            time13OutputTwice.textContent = "N/A";
        }

        let spKtV_13OutputTwice = document.getElementById("spKtV_13OutputTwice");
        if (spKtV_13OutputTwice) {
            spKtV_13OutputTwice.textContent = "N/A";
        }

        let stdKtV_13OutputTwice = document.getElementById("stdKtV_13OutputTwice");
        if (stdKtV_13OutputTwice) {
            stdKtV_13OutputTwice.textContent = "N/A";
        }
    }
}

function calculateThrice() {
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

    let timeOutputThrice = document.getElementById("timeOutputThrice");
    if (timeOutputThrice) {
        timeOutputThrice.textContent = `${t_target}` + " min";
    }

    let stdKtVTargetOutputThrice = document.getElementById("stdKtVTargetOutputThrice");
    if (stdKtVTargetOutputThrice) {
        stdKtVTargetOutputThrice.textContent = `${stdKtV_target}`;
    }

    let NewSpKtVThrice = document.getElementById("NewSpKtVThrice");
    if (NewSpKtVThrice) {
        NewSpKtVThrice.textContent = `${spKtV_prime.toFixed(2)}`;
    }

    // removal rate
    let weightGainPerDay = weeklyuf / 7;
    let weightAccumulation = weightGainPerDay * 3 * 1000;
    let removalRate = weightAccumulation / (t_target / 60 * weight);
    let UF_RateThrice = document.getElementById("UF_RateThrice");
    if (UF_RateThrice) {
        UF_RateThrice.textContent = `${removalRate.toFixed(2)}` + " mL/kg/hr";
    }

    if (removalRate > 13) {
        let t_target13 = Math.round((60 * weightAccumulation) / (weight * 13));
        let time13OutputThrice = document.getElementById("time13OutputThrice");
        if (time13OutputThrice) {
            time13OutputThrice.textContent = `${t_target13}` + " min";
        }

        let UF_WarningThrice = document.getElementById("UF_WarningThrice");
        if (UF_WarningThrice) {
            UF_WarningThrice.textContent = "WARNING🚨: The predicted ultrafiltration rate is greater than 13 mL/kg/hr. Increasing the time to " + `${t_target13}` + " minutes would reduce the ultrafiltration rate to 13 mL/kg/hr.";
        }

        let spKtV_13 = (Keff * (t_target13 + 30)) / (ureaVolume * 1000);
        let spKtV_13OutputThrice = document.getElementById("spKtV_13OutputThrice");
        if (spKtV_13OutputThrice) {
            spKtV_13OutputThrice.textContent = `${spKtV_13.toFixed(2)}`;
        }

        let eKtV_13 = (spKtV_13 * t_target13) / (t_target13 + 30);
        let a_13 = 1 - Math.exp(-eKtV_13);
        let stdKtV_Leypoldt13 = (10080 * a_13 / t_target13) / (a_13 / eKtV_13 + (10080 / (3 * t_target13)) - 1);
        let stdKtV_13 = UF_factor * stdKtV_Leypoldt13 + KruAdd;
        let stdKtV_13OutputThrice = document.getElementById("stdKtV_13OutputThrice");
        if (stdKtV_13OutputThrice) {
            stdKtV_13OutputThrice.textContent = `${stdKtV_13.toFixed(2)}`;
        }
    } else {
        let UF_WarningThrice = document.getElementById("UF_WarningThrice");
        if (UF_WarningThrice) {
            UF_WarningThrice.textContent = null;
        }

        let time13OutputThrice = document.getElementById("time13OutputThrice");
        if (time13OutputThrice) {
            time13OutputThrice.textContent = "N/A";
        }

        let spKtV_13OutputThrice = document.getElementById("spKtV_13OutputThrice");
        if (spKtV_13OutputThrice) {
            spKtV_13OutputThrice.textContent = "N/A";
        }

        let stdKtV_13OutputThrice = document.getElementById("stdKtV_13OutputThrice");
        if (stdKtV_13OutputThrice) {
            stdKtV_13OutputThrice.textContent = "N/A";
        }
    }
}


document.querySelector("button[type='submit']").addEventListener("click", function (event) {
    event.preventDefault();
    if (!this.disabled) {
        calculateVolumeOfPatient();
    }
});

document.querySelectorAll(".output-column").forEach(column => {
    let moreInfoBtn = column.querySelector(".more-info-btn");
    let hideBtn = column.querySelector(".hide-btn");
    let detailsDiv = column.querySelector(".details-group");

    moreInfoBtn.addEventListener("click", function () {
        detailsDiv.style.display = "block";
    });

    hideBtn.addEventListener("click", function () {
        detailsDiv.style.display = "none";
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.tagName === "INPUT") {
        event.preventDefault();
    }
});

toggleFields();
checkInputs();

