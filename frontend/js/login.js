const API_BASE_URL = '/api';

let isRegister = false;

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const usernameInput = document.getElementById('username-input');
const avatarGroup = document.getElementById('avatar-group');
const avatarInput = document.getElementById('avatar-input');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const toggleAuthBtn = document.getElementById('toggle-auth-btn');
const toggleMsg = document.getElementById('toggle-msg');

// Function to switch form UI mode
function setAuthMode(registerMode) {
  isRegister = registerMode;
  authError.textContent = '';
  authSuccess.textContent = '';

  if (isRegister) {
    authTitle.textContent = 'Create Account';
    usernameInput.classList.remove('hidden');
    avatarGroup.classList.remove('hidden');
    usernameInput.required = true;
    authSubmitBtn.textContent = 'Register';
    toggleMsg.textContent = 'Already have an account?';
    toggleAuthBtn.textContent = 'Login';
  } else {
    authTitle.textContent = 'Welcome Back';
    usernameInput.classList.add('hidden');
    avatarGroup.classList.add('hidden');
    usernameInput.required = false;
    authSubmitBtn.textContent = 'Login';
    toggleMsg.textContent = "Don't have an account?";
    toggleAuthBtn.textContent = 'Register';
  }
}

// Check URL query params on page load
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('mode') === 'register') {
  setAuthMode(true);
}

// Toggle button handler
toggleAuthBtn.addEventListener('click', (e) => {
  e.preventDefault();
  setAuthMode(!isRegister);
});

// Convert image to Base64 String
const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  authSuccess.textContent = '';

  const endpoint = isRegister ? '/auth/register' : '/auth/login';
  const payload = {
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  if (isRegister) {
    payload.username = usernameInput.value.trim();
    if (avatarInput.files && avatarInput.files[0]) {
      try {
        payload.avatar = await convertFileToBase64(avatarInput.files[0]);
      } catch (err) {
        authError.textContent = 'Failed to process image file.';
        return;
      }
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');

    if (isRegister) {
      // Switch back to login state after registration
      authSuccess.textContent = 'Account created successfully! Please log in.';
      setAuthMode(false);
      emailInput.value = payload.email;
      passwordInput.value = '';
    } else {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('avatar', data.avatar);
      window.location.href = '/dashboard.html';
    }
  } catch (err) {
    authError.textContent = err.message;
  }
});