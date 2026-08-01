// lightbox.js — visionneuse plein écran partagée entre index.html et article.html.
// Fonctionne par délégation d'événement sur [data-lightbox], donc s'applique
// aussi aux éléments ajoutés dynamiquement après coup (cartes de reportage, etc.)

document.addEventListener('DOMContentLoaded', () => {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxMedia = document.getElementById('lightboxMedia');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(type, src, caption) {
    lightboxMedia.innerHTML = type === 'video'
      ? `<video src="${src}" controls autoplay playsinline></video>`
      : `<img src="${src}" alt="${(caption || 'Média du reportage').replace(/"/g, '')}">`;
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxMedia.innerHTML = ''; // stoppe la lecture vidéo en vidant le conteneur
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-lightbox]');
    if (el) {
      e.preventDefault();
      openLightbox(el.dataset.lightbox, el.dataset.src, el.dataset.caption);
    }
  });
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
});
