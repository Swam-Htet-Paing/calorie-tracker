const API_BASE_URL = '/api';
// const API_BASE_URL = 'https://calorie-tracker-2kkf.onrender.com/';
const token = localStorage.getItem('token');

// Allow public access to landing page & login page
const currentPath = window.location.pathname;
const isPublicPage = currentPath === '/' || currentPath === '/banner.html' || currentPath === '/login.html';

if (!token && !isPublicPage) {
  window.location.href = '/login.html';
}

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
const logDatePicker = document.getElementById('log-date-picker');

// Profile Elements
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

const getTodayDateString = () => new Date().toISOString().split('T')[0];
if (logDatePicker && !logDatePicker.value) {
  logDatePicker.value = getTodayDateString();
}

// Mobile/Tablet Dropdown Navigation Handler
document.addEventListener('DOMContentLoaded', () => {
  const navDropdown = document.querySelector('.nav-dropdown');
  if (navDropdown) {
    // Set selected option based on current page URL
    const options = Array.from(navDropdown.options);
    const activeOption = options.find(opt => currentPath.endsWith(opt.value));
    if (activeOption) {
      navDropdown.value = activeOption.value;
    }

    navDropdown.addEventListener('change', (e) => {
      if (e.target.value) {
        window.location.href = e.target.value;
      }
    });
  }

  if (token) {
    loadUserProfile();
    fetchTodaysLogs();
  }
});

if (logDatePicker) {
  logDatePicker.addEventListener('change', fetchTodaysLogs);
}

// Fetch Profile info
async function loadUserProfile() {
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Unauthorized');

    const data = await res.json();
    if (userNameEl) userNameEl.textContent = data.username;
    if (userAvatarEl) userAvatarEl.src = data.avatar;
  } catch (err) {
    if (!isPublicPage) {
      localStorage.clear();
      window.location.href = '/login.html';
    }
  }
}

// Logout handler
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login.html';
  });
}

// Fetch logs with Auth Header
async function fetchTodaysLogs() {
  if (!token || !calorieLog) return;

  const selectedDate = logDatePicker ? logDatePicker.value : getTodayDateString();
  
  try {
    const response = await fetch(`${API_BASE_URL}/logs?date=${selectedDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401 || response.status === 403) {
      if (!isPublicPage) {
        localStorage.clear();
        window.location.href = '/login.html';
      }
      return;
    }

    const logs = await response.json();
    calorieLog.innerHTML = '';
    let total = 0;

    logs.forEach(log => {
      renderLogItem(log._id, log.foodName, log.weightGrams, log.calories);
      total += log.calories;
    });

    if (totalCaloriesEl) totalCaloriesEl.textContent = total;
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}

// Search USDA Food
if (searchBtn) {
  searchBtn.addEventListener('click', async () => {
    const query = foodInput ? foodInput.value.trim() : '';
    if (!query) return;

    if (searchResults) searchResults.innerHTML = '<li>Loading...</li>';

    try {
      const response = await fetch(`${API_BASE_URL}/foods/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (searchResults) searchResults.innerHTML = '';

      if (!data.foods || data.foods.length === 0) {
        if (searchResults) searchResults.innerHTML = '<li>No foods found.</li>';
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
          selectedFood = { description: food.description, calsPer100g: caloriesPer100g };
          if (selectedFoodName) selectedFoodName.textContent = selectedFood.description;
          if (portionCard) portionCard.classList.remove('hidden');
        });

        if (searchResults) searchResults.appendChild(li);
      });
    } catch (error) {
      if (searchResults) searchResults.innerHTML = '<li>Error connecting to backend server.</li>';
    }
  });
}

// Save portion log with Auth Header
if (addBtn) {
  addBtn.addEventListener('click', async () => {
    const weight = weightInput ? parseFloat(weightInput.value) : 0;
    if (!selectedFood || isNaN(weight) || weight <= 0) return;

    const calculatedCalories = Math.round((selectedFood.calsPer100g * weight) / 100);
    const selectedDate = logDatePicker ? logDatePicker.value : getTodayDateString();

    const logPayload = {
      foodName: selectedFood.description,
      weightGrams: weight,
      calories: calculatedCalories,
      date: selectedDate
    };

    try {
      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logPayload)
      });

      if (response.ok) {
        const savedLog = await response.json();
        renderLogItem(savedLog._id, savedLog.foodName, savedLog.weightGrams, savedLog.calories);

        if (totalCaloriesEl) {
          const currentTotal = parseInt(totalCaloriesEl.textContent) || 0;
          totalCaloriesEl.textContent = currentTotal + calculatedCalories;
        }

        if (portionCard) portionCard.classList.add('hidden');
        if (searchResults) searchResults.innerHTML = '';
        if (foodInput) foodInput.value = '';
      }
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  });
}

function renderLogItem(id, foodName, weight, calories) {
  if (!calorieLog) return;
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

// Delete item with Auth Header
async function deleteLogItem(id, calories) {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const itemToRemove = document.querySelector(`li[data-id="${id}"]`);
      if (itemToRemove) itemToRemove.remove();

      if (totalCaloriesEl) {
        const currentTotal = parseInt(totalCaloriesEl.textContent) || 0;
        totalCaloriesEl.textContent = Math.max(0, currentTotal - calories);
      }
    }
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
}

// Avatar Modal Logic
const avatarModal = document.getElementById('avatar-modal');
const closeAvatarModal = document.getElementById('close-avatar-modal');
const modalAvatarPreview = document.getElementById('modal-avatar-preview');
const updateAvatarInput = document.getElementById('update-avatar-input');

if (userAvatarEl) {
  userAvatarEl.addEventListener('click', () => {
    if (modalAvatarPreview && userAvatarEl.src) {
      modalAvatarPreview.src = userAvatarEl.src;
    }
    if (avatarModal) avatarModal.classList.remove('hidden');
  });
}

if (closeAvatarModal && avatarModal) {
  closeAvatarModal.addEventListener('click', () => avatarModal.classList.add('hidden'));
}

if (avatarModal) {
  avatarModal.addEventListener('click', (e) => {
    if (e.target === avatarModal) avatarModal.classList.add('hidden');
  });
}

const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

if (updateAvatarInput) {
  updateAvatarInput.addEventListener('change', async () => {
    if (!updateAvatarInput.files || !updateAvatarInput.files[0]) return;

    try {
      const base64Avatar = await convertFileToBase64(updateAvatarInput.files[0]);

      const res = await fetch(`${API_BASE_URL}/auth/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: base64Avatar })
      });

      if (!res.ok) throw new Error('Failed to update avatar');

      const data = await res.json();
      
      if (userAvatarEl) userAvatarEl.src = data.avatar;
      if (modalAvatarPreview) modalAvatarPreview.src = data.avatar;
      localStorage.setItem('avatar', data.avatar);
      
      updateAvatarInput.value = '';
    } catch (err) {
      console.error('Error updating profile picture:', err);
    }
  });
}