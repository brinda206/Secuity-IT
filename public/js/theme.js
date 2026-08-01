// theme.js — bascule jour / nuit, partagée entre index.html et article.html.
// L'icône du bouton est une image interactive unique (soleil qui se rétracte,
// lune qui apparaît en fondu), animée en CSS via l'attribut data-theme sur <html>.

document.addEventListener('DOMContentLoaded', () => {
  const THEME_KEY = 'security-it-theme';
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
      themeToggle?.setAttribute('aria-pressed', 'true');
    } else {
      root.removeAttribute('data-theme');
      themeToggle?.setAttribute('aria-pressed', 'false');
    }
  }

  // Préférence enregistrée en priorité, sinon préférence système au premier chargement
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
  }

  themeToggle?.addEventListener('click', () => {
    const isDark = root.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    themeToggle.classList.remove('spin');
    void themeToggle.offsetWidth; // relance l'animation à chaque clic
    themeToggle.classList.add('spin');
  });
});
