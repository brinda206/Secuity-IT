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

  function setupShareButton(articleTitle) {
    const shareBtn = document.getElementById('artShareBtn');
    const shareDropdown = document.getElementById('shareDropdown');
    
    if (shareBtn && shareDropdown) {
      // Nettoyer les anciens écouteurs pour éviter les doublons si re-rendu
      const newShareBtn = shareBtn.cloneNode(true);
      shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
      
      newShareBtn.addEventListener('click', (e) => {
        shareDropdown.classList.toggle('open');
        e.stopPropagation();
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-container')) {
          shareDropdown.classList.remove('open');
        }
      });
      
      window.addEventListener('scroll', () => {
        if (shareDropdown.classList.contains('open')) {
          shareDropdown.classList.remove('open');
        }
      }, { passive: true, capture: true });

      document.querySelectorAll('.share-option').forEach(btn => {
        // Clone for safe replacement
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const network = newBtn.dataset.network;
          const url = encodeURIComponent(window.location.href);
          const title = encodeURIComponent(articleTitle || 'Security IT');
          
          if (network === 'whatsapp') {
            window.open(`https://api.whatsapp.com/send?text=${title} - ${url}`, '_blank');
            shareDropdown.classList.remove('open');
          } else if (network === 'facebook') {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
            shareDropdown.classList.remove('open');
          } else {
            try {
              await navigator.clipboard.writeText(window.location.href);
              const orig = newBtn.innerHTML;
              newBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Lien copié !`;
              setTimeout(() => {
                newBtn.innerHTML = orig;
                shareDropdown.classList.remove('open');
              }, 1500);
            } catch (err) {
              console.error(err);
            }
          }
        });
      });
    }
  }

  function renderStaticArticle(article) {
    pageTitle.textContent = `${article.title} — Security IT`;
    
    const shareBtnHTML = `
      <div class="share-container" style="position: relative; margin-left: auto;">
        <button class="btn-secondary share-btn" id="artShareBtn" aria-label="Partager" style="display:inline-flex; align-items:center; gap:8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          Partager
        </button>
        <div class="share-dropdown" id="shareDropdown">
          <button class="share-option" data-network="whatsapp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button class="share-option" data-network="facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </button>
          <button class="share-option" data-network="instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Instagram
          </button>
          <button class="share-option" data-network="tiktok">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            TikTok
          </button>
          <hr class="share-divider">
          <button class="share-option" data-network="copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Copier le lien
          </button>
        </div>
      </div>
    `;

    root.innerHTML = `
      <div class="article-header">
        <span class="eyebrow ${article.severity}">
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>
          ${escapeHtml(article.severityLabel)}
        </span>
        <h1>${escapeHtml(article.title)}</h1>
        <div class="article-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:12px;">
          <span class="mono">${formatDateLong(article.date).toUpperCase()}</span>
          <span>·</span>
          <span>${escapeHtml(article.readTime)} de lecture</span>
          <span>·</span>
          <span>${escapeHtml(article.categoryLabel)}</span>
          ${shareBtnHTML}
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
      
    setupShareButton(article.title);
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

    const isAdmin = !!localStorage.getItem('adminToken');
    const adminActionsHTML = isAdmin ? `
      <div class="article-admin-actions" style="display:flex; gap:12px; margin-bottom: 24px;">
        <button class="btn-secondary" id="artEditBtn" data-id="${item.id}">Modifier l'article</button>
        <button class="btn-secondary" id="artDelBtn" data-id="${item.id}" style="color:var(--critical); border-color:var(--critical-bg);">Supprimer</button>
      </div>
    ` : '';

    const shareBtnHTML = `
      <div class="share-container" style="position: relative; margin-left: auto;">
        <button class="btn-secondary share-btn" id="artShareBtn" aria-label="Partager" style="display:inline-flex; align-items:center; gap:8px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          Partager
        </button>
        <div class="share-dropdown" id="shareDropdown">
          <button class="share-option" data-network="whatsapp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button class="share-option" data-network="facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </button>
          <button class="share-option" data-network="instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Instagram
          </button>
          <button class="share-option" data-network="tiktok">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
            TikTok
          </button>
          <hr class="share-divider">
          <button class="share-option" data-network="copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Copier le lien
          </button>
        </div>
      </div>
    `;

    root.innerHTML = `
      ${adminActionsHTML}
      <div class="article-header">
        <span class="eyebrow ${pillClass}">
          <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>
          ${escapeHtml(catLabel)}
        </span>
        <h1>${escapeHtml(item.title)}</h1>
        <div class="article-meta" style="display:flex; align-items:center; flex-wrap:wrap; gap:12px;">
          <span class="mono">${formatDateLong(item.date).toUpperCase()}</span>
          <span>·</span>
          <span>Reportage terrain</span>
          ${shareBtnHTML}
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

    setupShareButton(item.title);

    const delBtn = document.getElementById('artDelBtn');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet article définitivement ? (Les médias seront détruits)')) {
          try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/reportages/${item.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) throw new Error('Erreur lors de la suppression');
            window.location.href = 'index.html';
          } catch (e) {
            alert(e.message);
          }
        }
      });
    }

    const editBtn = document.getElementById('artEditBtn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.location.href = `index.html?edit=${item.id}`;
      });
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
