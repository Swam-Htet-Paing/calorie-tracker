const API_BASE_URL = 'http://localhost:5000/api';
const DEMO_USER_ID = '64c9f1a2b3c4d5e6f7a8b9c0'; 

let selectedFood = null;

// DOM Elements
const foodInput = document.getElementById('food-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const portionCard = document.getElementById('portion-card');
const selectedFoodName = document.getElementById('selected-food-name');
const weightInput = document.getElementById('weight-input');
const addBtn = document.getElementById('add-btn');
const calorieLog = document.getElementById('calorie-log');
const totalCaloriesEl = document.getElementById('total-calories');

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// 1. Load today's logs from MongoDB on load
document.addEventListener('DOMContentLoaded', fetchTodaysLogs);

async function fetchTodaysLogs() {
  const today = getTodayDateString();
  
  try {
    const response = await fetch(`${API_BASE_URL}/logs?userId=${DEMO_USER_ID}&date=${today}`);
    const logs = await response.json();

    calorieLog.innerHTML = '';
    let total = 0;

    logs.forEach(log => {
      renderLogItem(log._id, log.foodName, log.weightGrams, log.calories);
      total += log.calories;
    });

    totalCaloriesEl.textContent = total;
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

// 2. Search USDA Food via Express Proxy
searchBtn.addEventListener('click', async () => {
  const query = foodInput.value.trim();
  if (!query) return;

  searchResults.innerHTML = '<li>Loading...</li>';

  try {
    const response = await fetch(`${API_BASE_URL}/foods/search?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    searchResults.innerHTML = '';

    if (!data.foods || data.foods.length === 0) {
      searchResults.innerHTML = '<li>No foods found.</li>';
      return;
    }

    data.foods.forEach(food => {
      const energyNutrient = food.foodNutrients.find(
        n => n.nutrientId === 1008 || n.nutrientName === 'Energy'
      );
      const caloriesPer100g = energyNutrient ? energyNutrient.value : 0;

      const li = document.createElement('li');
      li.textContent = `${food.description} (${caloriesPer100g} kcal / 100g)`;

      li.addEventListener('click', () => {
        selectedFood = {
          description: food.description,
          calsPer100g: caloriesPer100g
        };
        selectedFoodName.textContent = selectedFood.description;
        portionCard.classList.remove('hidden');
      });

      searchResults.appendChild(li);
    });
  } catch (error) {
    searchResults.innerHTML = '<li>Error connecting to backend server.</li>';
  }
});

// 3. Save new item to MongoDB Log.js collection
addBtn.addEventListener('click', async () => {
  const weight = parseFloat(weightInput.value);

  if (!selectedFood || isNaN(weight) || weight <= 0) return;

  const calculatedCalories = Math.round((selectedFood.calsPer100g * weight) / 100);
  const today = getTodayDateString();

  const logPayload = {
    userId: DEMO_USER_ID,
    foodName: selectedFood.description,
    weightGrams: weight,
    calories: calculatedCalories,
    date: today
  };

  try {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logPayload)
    });

    if (response.ok) {
      const savedLog = await response.json();

      // Render created MongoDB entry
      renderLogItem(savedLog._id, savedLog.foodName, savedLog.weightGrams, savedLog.calories);

      // Update total
      const currentTotal = parseInt(totalCaloriesEl.textContent) || 0;
      totalCaloriesEl.textContent = currentTotal + calculatedCalories;

      // Reset UI
      portionCard.classList.add('hidden');
      searchResults.innerHTML = '';
      foodInput.value = '';
    }
  } catch (error) {
    console.error('Failed to save log to backend:', error);
  }
});

// Helper: Render item element with MongoDB _id attribute and Delete button
function renderLogItem(id, foodName, weight, calories) {
  const li = document.createElement('li');
  li.dataset.id = id;

  li.innerHTML = `
    <div class="log-item-details">
      <span>${foodName} (${weight}g)</span>
      <strong>${calories} kcal</strong>
    </div>
    <button class="delete-btn" onclick="deleteLogItem('${id}', ${calories})">✕</button>
  `;

  calorieLog.appendChild(li);
}

// 4. Delete item from MongoDB and update UI total
async function deleteLogItem(id, calories) {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      // Remove element from DOM
      const itemToRemove = document.querySelector(`li[data-id="${id}"]`);
      if (itemToRemove) itemToRemove.remove();

      // Recalculate total calories
      const currentTotal = parseInt(totalCaloriesEl.textContent) || 0;
      totalCaloriesEl.textContent = Math.max(0, currentTotal - calories);
    }
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
}