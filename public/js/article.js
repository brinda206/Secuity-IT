// article.js — affiche la page complète d'un article (statique ou reportage terrain)
// à partir du paramètre ?id= de l'URL.

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const root = document.getElementById('articleContent');
  const pageTitle = document.getElementById('pageTitle');

  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function formatDateLong(isoDate) {
    const d = new Date(isoDate);
    if (isNaN(d)) return isoDate;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  const CATEGORY_LABELS = {
    'interventions': 'Interventions',
    'reportage-terrain': 'Reportage terrain',
    'cybercriminalite': 'Cybercriminalité',
    'vulnerabilites': 'Vulnérabilités',
    'defense': 'Défense',
    'vie-privee': 'Vie privée',
    'reglementation': 'Réglementation',
  };

  const CATEGORY_PILL = {
    'interventions': 'safe',
    'reportage-terrain': 'info',
    'cybercriminalite': 'critical',
    'vulnerabilites': 'warning',
    'defense': 'safe',
    'vie-privee': 'info',
    'reglementation': 'info',
  };

  function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function paragraphsHTML(text) {
    if (Array.isArray(text)) {
      return text.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }
    if (typeof text === 'string' && text.trim()) {
      return text.split(/\n\s*\n/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('');
    }
    return '';
  }

  function notFound() {
    pageTitle.textContent = 'Article introuvable — Security IT';
    root.innerHTML = `
      <div class="article-not-found">
        <h2>Article introuvable</h2>
        <p>Ce contenu n'existe plus ou a été déplacé.</p>
        <a href="index.html" class="btn-primary" style="display:inline-flex; margin-top:16px;">Retour à l'accueil</a>
      </div>`;
  }

  function renderStaticArticle(article) {
    pageTitle.textContent = `${article.title} — Security IT`;
    root.innerHTML = `
      <div class="article-header">
        <span class="eyebrow ${article.severity}">
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>
          ${escapeHtml(article.severityLabel)}
        </span>
        <h1>${escapeHtml(article.title)}</h1>
        <div class="article-meta">
          <span class="mono">${formatDateLong(article.date).toUpperCase()}</span>
          <span>·</span>
          <span>${escapeHtml(article.readTime)} de lecture</span>
          <span>·</span>
          <span>${escapeHtml(article.categoryLabel)}</span>
        </div>
      </div>
      <div class="article-banner">
        <img src="${article.image}" alt="${escapeHtml(article.title)}">
      </div>
      <div class="article-body">
        ${paragraphsHTML(article.body)}
      </div>
      <div class="article-tags">
        <span class="tag-pill ${article.severity}">${escapeHtml(article.categoryLabel)}</span>
      </div>`;
  }

  function renderReportageArticle(item) {
    const catLabel = CATEGORY_LABELS[item.category] || item.category;
    const pillClass = CATEGORY_PILL[item.category] || 'info';
    pageTitle.textContent = `${item.title} — Security IT`;

    let bannerHTML = '';
    if (item.mediaType === 'video') {
      bannerHTML = `
        <div class="article-banner">
          <span class="video-badge">Vidéo</span>
          <video src="${item.mediaUrl}" ${item.posterUrl ? `poster="${item.posterUrl}"` : ''} controls playsinline></video>
        </div>`;
    } else {
      const gallery = item.gallery && item.gallery.length ? item.gallery : [{ url: item.mediaUrl }];
      if (gallery.length > 1) {
        const slidesHTML = gallery.map((g, idx) => `
          <div class="article-carousel-slide" data-lightbox="image" data-src="${g.url}" data-caption="${escapeHtml(item.caption || '')}">
            <img src="${g.url}" alt="${escapeHtml(item.title)} - Photo ${idx + 1}">
          </div>
        `).join('');

        const dotsHTML = gallery.map((_, idx) => `
          <button class="article-carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Photo ${idx + 1}"></button>
        `).join('');

        bannerHTML = `
          <div class="article-carousel-container" id="articleCarousel">
            <div class="article-carousel-track">
              ${slidesHTML}
            </div>
            <button class="article-carousel-btn prev" aria-label="Photo précédente">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="article-carousel-btn next" aria-label="Photo suivante">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="article-carousel-zoom" id="articleCarouselZoom" aria-label="Agrandir l'image courante">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button>
            <div class="article-carousel-dots">
              ${dotsHTML}
            </div>
            ${item.caption ? `<div class="article-carousel-caption">${escapeHtml(item.caption)}</div>` : ''}
          </div>`;
      } else {
        bannerHTML = `
          <div class="article-banner" data-lightbox="image" data-src="${gallery[0].url}" data-caption="${escapeHtml(item.caption || '')}" style="cursor: zoom-in;">
            <img src="${gallery[0].url}" alt="${escapeHtml(item.title)}">
          </div>`;
      }
    }

    const bodyContent = item.body && item.body.trim() ? item.body : item.excerpt;

    root.innerHTML = `
      <div class="article-header">
        <span class="eyebrow ${pillClass}">
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>
          ${escapeHtml(catLabel)}
        </span>
        <h1>${escapeHtml(item.title)}</h1>
        <div class="article-meta">
          <span class="mono">${formatDateLong(item.date).toUpperCase()}</span>
          <span>·</span>
          <span>Reportage terrain</span>
        </div>
      </div>
      ${bannerHTML}
      ${item.caption && (!item.gallery || item.gallery.length <= 1) ? `<p class="mono" style="color:var(--ink-faint); font-size:13px; margin:10px 0 0;">${escapeHtml(item.caption)}</p>` : ''}
      <div class="article-body" style="margin-top:24px;">
        ${paragraphsHTML(bodyContent)}
      </div>
      <div class="article-tags">
        <span class="tag-pill ${pillClass}">${escapeHtml(catLabel)}</span>
      </div>`;

    if (item.mediaType === 'image' && item.gallery && item.gallery.length > 1) {
      initArticleCarousel();
    }
  }

  function initArticleCarousel() {
    const container = document.getElementById('articleCarousel');
    if (!container) return;

    const track = container.querySelector('.article-carousel-track');
    const prevBtn = container.querySelector('.article-carousel-btn.prev');
    const nextBtn = container.querySelector('.article-carousel-btn.next');
    const zoomBtn = document.getElementById('articleCarouselZoom');
    const dots = container.querySelectorAll('.article-carousel-dot');
    const slides = container.querySelectorAll('.article-carousel-slide');

    let index = 0;
    const count = slides.length;

    function updateSlide() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
      });
    }

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      index = (index - 1 + count) % count;
      updateSlide();
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      index = (index + 1) % count;
      updateSlide();
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        index = idx;
        updateSlide();
      });
    });

    zoomBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSlide = slides[index];
      currentSlide.click();
    });

    // Swipe pour mobile
    let startX = 0;
    let isSwiping = false;

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isSwiping = true;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      const diffX = e.touches[0].clientX - startX;
      if (Math.abs(diffX) > 50) {
        if (diffX > 0) {
          index = (index - 1 + count) % count;
        } else {
          index = (index + 1) % count;
        }
        updateSlide();
        isSwiping = false;
      }
    }, { passive: true });

    container.addEventListener('touchend', () => {
      isSwiping = false;
    });
  }

  if (!id) {
    notFound();
    return;
  }

  // 1) Article éditorial statique (défini dans articles-data.js)
  if (typeof STATIC_ARTICLES !== 'undefined' && STATIC_ARTICLES[id]) {
    renderStaticArticle(STATIC_ARTICLES[id]);
    return;
  }

  // 2) Reportage terrain publié via le formulaire (API backend)
  try {
    const res = await fetch(`/api/reportages/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('not found');
    const item = await res.json();
    renderReportageArticle(item);
  } catch {
    notFound();
  }
});
