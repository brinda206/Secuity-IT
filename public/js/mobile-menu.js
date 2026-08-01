// mobile-menu.js — ouverture/fermeture du menu de navigation sur mobile,
// pour les pages qui n'incluent pas app.js (article.html, a-propos.html).

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.style.display === 'flex';
    mainNav.style.display = isOpen ? 'none' : 'flex';
    mainNav.style.cssText += isOpen
      ? ''
      : 'position:absolute; top:72px; left:0; right:0; flex-direction:column; background:var(--surface); padding:12px 24px; border-bottom:1px solid var(--line); align-items:flex-start;';
  });
});
