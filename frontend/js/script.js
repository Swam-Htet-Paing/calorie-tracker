let currentUnit = 'metric';

// DOM Controls
const sliderCm = document.getElementById('sliderCm');
const sliderKg = document.getElementById('sliderKg');
const sliderFt = document.getElementById('sliderFt');
const sliderIn = document.getElementById('sliderIn');
const sliderLbs = document.getElementById('sliderLbs');
const sliderAge = document.getElementById('sliderAge');

// Display Text Nodes
const valCm = document.getElementById('valCm');
const valKg = document.getElementById('valKg');
const valFt = document.getElementById('valFt');
const valIn = document.getElementById('valIn');
const valLbs = document.getElementById('valLbs');
const valAge = document.getElementById('valAge');

const bmiScore = document.getElementById('bmiScore');
const bmiStatus = document.getElementById('bmiStatus');
const targetWeight = document.getElementById('targetWeight');
const ponderalIndex = document.getElementById('ponderalIndex');
const circleProgress = document.getElementById('circleProgress');

// Event Handlers for Real-time Calculation
[sliderCm, sliderKg, sliderFt, sliderIn, sliderLbs, sliderAge].forEach(input => {
  input.addEventListener('input', () => {
    updateDisplayValues();
    recalculateBMI();
  });
});

function updateDisplayValues() {
  valCm.textContent = sliderCm.value;
  valKg.textContent = sliderKg.value;
  valFt.textContent = sliderFt.value;
  valIn.textContent = sliderIn.value;
  valLbs.textContent = sliderLbs.value;
  valAge.textContent = sliderAge.value;
}

function setUnitSystem(unit) {
  currentUnit = unit;
  document.getElementById('btnMetric').classList.toggle('active', unit === 'metric');
  document.getElementById('btnImperial').classList.toggle('active', unit === 'imperial');
  
  document.getElementById('metricGroup').classList.toggle('hidden', unit !== 'metric');
  document.getElementById('imperialGroup').classList.toggle('hidden', unit !== 'imperial');
  
  recalculateBMI();
}

function setGender(gender, element) {
  document.querySelectorAll('.g-btn').forEach(btn => btn.classList.remove('active'));
  element.classList.add('active');
  recalculateBMI();
}

function recalculateBMI() {
  let heightMeters = 0;
  let weightKg = 0;

  if (currentUnit === 'metric') {
    heightMeters = parseFloat(sliderCm.value) / 100;
    weightKg = parseFloat(sliderKg.value);
  } else {
    const totalInches = (parseFloat(sliderFt.value) * 12) + parseFloat(sliderIn.value);
    heightMeters = totalInches * 0.0254;
    weightKg = parseFloat(sliderLbs.value) * 0.45359237;
  }

  if (heightMeters <= 0) return;

  const bmi = weightKg / (heightMeters * heightMeters);
  const ponderal = weightKg / Math.pow(heightMeters, 3);

  // Render Numeric Output
  bmiScore.textContent = bmi.toFixed(1);
  ponderalIndex.textContent = `${ponderal.toFixed(1)} kg/m³`;

  // Render Target Weight Range (BMI 18.5 - 25)
  const minIdealKg = 18.5 * (heightMeters * heightMeters);
  const maxIdealKg = 25.0 * (heightMeters * heightMeters);

  if (currentUnit === 'metric') {
    targetWeight.textContent = `${minIdealKg.toFixed(1)} - ${maxIdealKg.toFixed(1)} kg`;
  } else {
    targetWeight.textContent = `${(minIdealKg * 2.20462).toFixed(0)} - ${(maxIdealKg * 2.20462).toFixed(0)} lbs`;
  }

  updateRadialRing(bmi);
}

function updateRadialRing(bmi) {
  // Circular Ring Dash offset calculations (Radius = 65, Perimeter = 2 * PI * 65 ≈ 408.4)
  const circumference = 408.4;
  
  // Map BMI scale range (15 to 35) into percentage ring completion
  let percentage = (bmi - 12) / (38 - 12);
  percentage = Math.max(0, Math.min(1, percentage));

  const offset = circumference - (percentage * circumference);
  circleProgress.style.strokeDashoffset = offset;

  // Category Colors
  let color = 'var(--clr-normal)';
  let statusText = 'Normal';

  if (bmi < 18.5) {
    statusText = 'Underweight';
    color = 'var(--clr-underweight)';
  } else if (bmi >= 18.5 && bmi < 25) {
    statusText = 'Normal';
    color = 'var(--clr-normal)';
  } else if (bmi >= 25 && bmi < 30) {
    statusText = 'Overweight';
    color = 'var(--clr-overweight)';
  } else {
    statusText = 'Obese';
    color = 'var(--clr-obese)';
  }

  bmiStatus.textContent = statusText;
  bmiStatus.style.color = color;
  circleProgress.style.stroke = color;
}

// Initial Run
updateDisplayValues();
recalculateBMI();