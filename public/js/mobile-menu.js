// mobile-menu.js — ouverture/fermeture du menu de navigation sur mobile,
// pour les pages qui n'incluent pas app.js (article.html, a-propos.html).

document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (!menuToggle || !mainNav) return;

  // Enlever les styles en ligne pour utiliser la classe CSS
  mainNav.style.cssText = '';
  
  // Créer l'overlay dynamiquement s'il n'existe pas
  let menuOverlay = document.querySelector('.menu-overlay');
  if (!menuOverlay) {
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    if (isOpen) {
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  menuOverlay.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });
});
