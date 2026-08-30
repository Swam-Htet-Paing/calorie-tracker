document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.querySelector('.theme-toggle-btn');
  if (!toggleBtn) return;

  // 1. Check saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const currentTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(currentTheme);

  // 2. Toggle theme on click
  toggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  });

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggleBtn.textContent = '🌙';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      toggleBtn.textContent = '☀️';
    }
  }
});