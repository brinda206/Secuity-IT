// app.js — logique du site Security IT
// Sections : ticker, thème clair/sombre, menu mobile, filtres, lightbox,
// chargement + rendu des reportages terrain, formulaire de publication (upload).

document.addEventListener('DOMContentLoaded', () => {

  /* ===================== TICKER (flux en direct) ===================== */
  const tickerItems = [
    { sev: 'critical', text: 'CRITIQUE — Rançongiciel actif contre des prestataires de santé' },
    { sev: 'warning', text: 'FAILLE — Framework web populaire, correctif requis sous 48h' },
    { sev: 'info', text: 'ANALYSE — Hausse de 34% des tentatives de phishing par SMS' },
    { sev: 'safe', text: 'CORRIGÉ — Patch déployé pour la vulnérabilité CVE-2026-33481' },
    { sev: 'critical', text: 'ALERTE — Fuite de données chez un courtier logistique régional' },
    { sev: 'warning', text: 'VIGILANCE — Nouvelle variante de logiciel malveillant bancaire' },
  ];
  const track = document.getElementById('tickerTrack');
  if (track) {
    const html = tickerItems
      .map(i => `<span class="ticker-item"><span class="dot ${i.sev}"></span>${i.text}</span>`)
      .join('');
    track.innerHTML = html + html; // dupliqué pour un défilement en boucle continue
  }

  // Le thème clair/sombre est géré par js/theme.js (partagé avec article.html)
  // La visionneuse (lightbox) est gérée par js/lightbox.js (partagé également)

  /* ===================== CVE DU JOUR (récupérée depuis le NVD) ===================== */
  async function loadCveOfTheDay() {
    const idEl = document.getElementById('cveId');
    const descEl = document.getElementById('cveDescription');
    const barEl = document.getElementById('cveSeverityBar');
    const scoreEl = document.getElementById('cveScoreValue');
    const linkEl = document.getElementById('cveSourceLink');
    if (!idEl) return; // widget absent de cette page

    try {
      const res = await fetch('/api/cve-of-the-day');
      if (!res.ok) throw new Error('Réponse API invalide');
      const cve = await res.json();

      idEl.textContent = cve.id;
      descEl.textContent = cve.description + (cve.stale ? ' (dernière donnée connue)' : '');
      scoreEl.textContent = cve.cvssScore != null ? `${cve.cvssScore} / 10` : 'N/A';
      barEl.style.width = cve.cvssScore != null ? `${Math.min(cve.cvssScore * 10, 100)}%` : '30%';
      barEl.style.background = `var(--${cve.severity || 'info'})`;
      if (cve.sourceUrl) {
        linkEl.href = cve.sourceUrl;
        linkEl.style.display = 'inline-block';
      }
    } catch (err) {
      idEl.textContent = 'CVE indisponible';
      descEl.textContent = "Impossible de récupérer une CVE récente pour le moment. Réessayez plus tard.";
      scoreEl.textContent = '—';
      console.warn('CVE du jour : échec du chargement —', err.message);
    }
  }
  loadCveOfTheDay();

  /* ===================== MENU MOBILE ===================== */
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  menuToggle?.addEventListener('click', () => {
    const isOpen = mainNav.style.display === 'flex';
    mainNav.style.display = isOpen ? 'none' : 'flex';
    mainNav.style.cssText += isOpen
      ? ''
      : 'position:absolute; top:72px; left:0; right:0; flex-direction:column; background:var(--surface); padding:12px 24px; border-bottom:1px solid var(--line); align-items:flex-start;';
  });

  /* ===================== FILTRES PAR CATÉGORIE ===================== */
  const chips = document.querySelectorAll('.chip');
  let currentFilter = 'all';

  function applyFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.card').forEach(card => {
      const show = filter === 'all' || card.dataset.category === filter;
      card.style.display = show ? '' : 'none';
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilter(chip.dataset.filter);
    });
  });

  // Applique le filtre demandé via l'URL (ex. lien "Interventions" du menu : ?filter=interventions)
  const urlFilter = new URLSearchParams(window.location.search).get('filter');
  if (urlFilter) {
    const targetChip = [...chips].find(c => c.dataset.filter === urlFilter);
    if (targetChip) {
      chips.forEach(c => c.classList.remove('active'));
      targetChip.classList.add('active');
      applyFilter(urlFilter);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePublishModal();
  });

  /* ===================== NEWSLETTER (démo front uniquement) ===================== */
  const newsletterForm = document.getElementById('newsletterForm');
  const confirmMsg = document.getElementById('confirmMsg');
  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    confirmMsg.style.display = 'inline';
    newsletterForm.querySelector('input').value = '';
  });

  /* ===================== REPORTAGES TERRAIN : CHARGEMENT + RENDU ===================== */
  const grid = document.getElementById('articlesGrid');

  const MONTHS = ['JANV.', 'FÉVR.', 'MARS', 'AVR.', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.'];
  function formatDate(isoDate) {
    const d = new Date(isoDate);
    if (isNaN(d)) return isoDate;
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

  function reportageCardHTML(item) {
    const catLabel = CATEGORY_LABELS[item.category] || item.category;
    const pillClass = CATEGORY_PILL[item.category] || 'info';
    const safeCategory = escapeHtml(item.category || '');
    const title = escapeHtml(item.title);
    const excerpt = escapeHtml(item.excerpt);
    const caption = escapeHtml(item.caption || '');
    const dateLabel = formatDate(item.date);

    if (item.mediaType === 'video') {
      const poster = item.posterUrl || '';
      return `
        <div class="card has-media" data-category="${safeCategory}">
          <div class="card-media" data-lightbox="video" data-src="${item.mediaUrl}" data-caption="${caption}">
            <span class="media-type-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              Vidéo
            </span>
            <video preload="metadata" muted playsinline ${poster ? `poster="${poster}"` : ''}>
              <source src="${item.mediaUrl}" type="video/mp4">
            </video>
            <span class="play-overlay">
              <span class="play-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#101826"><polygon points="6 4 20 12 6 20 6 4"/></svg>
              </span>
            </span>
          </div>
          <div class="card-body">
            <div class="card-top"><span class="tag-pill ${pillClass}">${catLabel}</span></div>
            <h3><a href="article.html?id=${item.id}">${title}</a></h3>
            <p class="excerpt">${excerpt}</p>
            <div class="tag-row"><span>${dateLabel}</span><span>Vidéo</span></div>
          </div>
        </div>`;
    }

    // Image (avec galerie éventuelle)
    const gallery = item.gallery && item.gallery.length ? item.gallery : [{ url: item.mediaUrl }];
    
    if (gallery.length > 1) {
      const slidesHTML = gallery.map((g, idx) => `
        <div class="card-media-slide" data-lightbox="image" data-src="${g.url}" data-caption="${caption}">
          <img src="${g.url}" alt="${title} - Photo ${idx + 1}">
        </div>
      `).join('');

      const dotsHTML = gallery.map((_, idx) => `
        <button class="card-media-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Photo ${idx + 1}"></button>
      `).join('');

      return `
        <div class="card has-media" data-category="${safeCategory}">
          <div class="card-media">
            <span class="media-type-badge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              Galerie
            </span>
            <div class="card-media-track">
              ${slidesHTML}
            </div>
            <button class="card-media-btn prev" aria-label="Photo précédente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="card-media-btn next" aria-label="Photo suivante">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <div class="card-media-dots">
              ${dotsHTML}
            </div>
          </div>
          <div class="card-body">
            <div class="card-top"><span class="tag-pill ${pillClass}">${catLabel}</span></div>
            <h3><a href="article.html?id=${item.id}">${title}</a></h3>
            <p class="excerpt">${excerpt}</p>
            <div class="tag-row"><span>${dateLabel}</span><span>${gallery.length} photos</span></div>
          </div>
        </div>`;
    }

    return `
      <div class="card has-media" data-category="${safeCategory}">
        <div class="card-media" data-lightbox="image" data-src="${item.mediaUrl}" data-caption="${caption}">
          <span class="media-type-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            Photo
          </span>
          <img src="${item.mediaUrl}" alt="${title}">
        </div>
        <div class="card-body">
          <div class="card-top"><span class="tag-pill ${pillClass}">${catLabel}</span></div>
          <h3><a href="article.html?id=${item.id}">${title}</a></h3>
          <p class="excerpt">${excerpt}</p>
          <div class="tag-row"><span>${dateLabel}</span><span>1 photo</span></div>
        </div>
      </div>`;
  }

  /* Initialise les carrousels interactifs pour les cartes avec galeries d'images */
  function initCardCarousels() {
    const carousels = document.querySelectorAll('.card-media:has(.card-media-track)');
    carousels.forEach(carousel => {
      if (carousel.dataset.initialized) return;
      carousel.dataset.initialized = 'true';

      const track = carousel.querySelector('.card-media-track');
      const prevBtn = carousel.querySelector('.card-media-btn.prev');
      const nextBtn = carousel.querySelector('.card-media-btn.next');
      const dots = carousel.querySelectorAll('.card-media-dot');
      const slides = carousel.querySelectorAll('.card-media-slide');
      
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
        e.preventDefault();
        index = (index - 1 + count) % count;
        updateSlide();
      });

      nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        index = (index + 1) % count;
        updateSlide();
      });

      dots.forEach((dot, idx) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          index = idx;
          updateSlide();
        });
      });
    });
  }

  /* Initialise le Carrousel Héro pour les articles "À la une" */
  function initHeroCarousel() {
    const track = document.getElementById('heroCarouselTrack');
    const dotsContainer = document.getElementById('heroCarouselDots');
    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    const container = document.getElementById('heroCarousel');
    
    if (!track) return;

    const featuredKeys = [
      'rancongiciel-sante-europe',
      'faille-framework-web',
      'mfa-obligatoire-administrations',
      'phishing-ia-techniques'
    ];

    const featuredArticles = [];
    featuredKeys.forEach(key => {
      if (typeof STATIC_ARTICLES !== 'undefined' && STATIC_ARTICLES[key]) {
        featuredArticles.push({ id: key, ...STATIC_ARTICLES[key] });
      }
    });

    if (featuredArticles.length === 0) return;

    const slidesHTML = featuredArticles.map((article, idx) => {
      const severityClass = article.severity || 'info';
      const severityLabelText = article.severityLabel || 'Info';
      const catLabel = article.categoryLabel || article.category;
      return `
        <a href="article.html?id=${article.id}" class="hero-carousel-slide" data-index="${idx}">
          <svg class="grid-art" viewBox="0 0 500 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fade-${article.id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style="stop-color:var(--surface-solid)" stop-opacity="0"/>
                <stop offset="100%" style="stop-color:var(--surface-solid)" stop-opacity="1"/>
              </linearGradient>
            </defs>
            <g style="stroke:var(--line)" stroke-width="1">
              <line x1="0" y1="60" x2="500" y2="60"/>
              <line x1="0" y1="140" x2="500" y2="140"/>
              <line x1="0" y1="220" x2="500" y2="220"/>
              <line x1="120" y1="0" x2="120" y2="400"/>
              <line x1="260" y1="0" x2="260" y2="400"/>
              <line x1="400" y1="0" x2="400" y2="400"/>
            </g>
            <circle cx="120" cy="60" r="4" style="fill:var(--${severityClass})"/>
            <circle cx="260" cy="140" r="3" style="fill:var(--info)"/>
            <circle cx="400" cy="220" r="3" style="fill:var(--warning)"/>
            <line x1="120" y1="60" x2="260" y2="140" style="stroke:var(--${severityClass})" stroke-width="1.4" opacity="0.4"/>
            <line x1="260" y1="140" x2="400" y2="220" style="stroke:var(--info)" stroke-width="1.4" opacity="0.4"/>
            <rect x="0" y="0" width="500" height="400" fill="url(#fade-${article.id})"/>
          </svg>
          <div class="content">
            <span class="eyebrow ${severityClass}">
              <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="currentColor"/></svg>
              ${escapeHtml(severityLabelText)}
            </span>
            <h2>${escapeHtml(article.title)}</h2>
            <p class="excerpt">${escapeHtml(article.excerpt)}</p>
            <div class="meta-row">
              <span class="mono">${formatDate(article.date).toUpperCase()}</span>
              <span>·</span>
              <span>${escapeHtml(article.readTime)} de lecture</span>
              <span>·</span>
              <span>${escapeHtml(catLabel)}</span>
            </div>
            <span class="read-link">
              Lire l'article
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </div>
        </a>
      `;
    }).join('');

    track.innerHTML = slidesHTML;

    const dotsHTML = featuredArticles.map((_, idx) => {
      return `<button class="hero-carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Diapositive ${idx + 1}"></button>`;
    }).join('');

    dotsContainer.innerHTML = dotsHTML;

    let currentIndex = 0;
    const slidesCount = featuredArticles.length;
    let autoplayTimer = null;

    function showSlide(index) {
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      const dots = dotsContainer.querySelectorAll('.hero-carousel-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    function nextSlide() {
      showSlide((currentIndex + 1) % slidesCount);
    }

    function prevSlide() {
      showSlide((currentIndex - 1 + slidesCount) % slidesCount);
    }

    prevBtn?.addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });

    nextBtn?.addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });

    dotsContainer.addEventListener('click', (e) => {
      const dot = e.target.closest('.hero-carousel-dot');
      if (dot) {
        const idx = parseInt(dot.dataset.index, 10);
        showSlide(idx);
        resetAutoplay();
      }
    });

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, 6000);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      startAutoplay();
    }

    container?.addEventListener('mouseenter', stopAutoplay);
    container?.addEventListener('mouseleave', startAutoplay);

    startAutoplay();
  }

  // Initialise le carrousel héros au chargement
  initHeroCarousel();

  function prependReportage(item) {
    if (!grid) return;
    grid.insertAdjacentHTML('afterbegin', reportageCardHTML(item));
    applyFilter(currentFilter); // respecte le filtre actif après ajout
    initCardCarousels(); // Initialise le carrousel sur la nouvelle carte
  }

  async function loadReportages() {
    if (!grid) return;
    try {
      const res = await fetch('/api/reportages');
      if (!res.ok) throw new Error('Réponse API invalide');
      const items = await res.json();
      // Du plus ancien au plus récent pour que insertAdjacentHTML('afterbegin', ...)
      // place bien le plus récent en premier au final.
      [...items].reverse().forEach(item => {
        grid.insertAdjacentHTML('afterbegin', reportageCardHTML(item));
      });
      applyFilter(currentFilter);
      initCardCarousels(); // Initialise tous les carrousels de cartes
    } catch (err) {
      // Le serveur n'est peut-être pas lancé (ex. ouverture directe du fichier
      // HTML sans "npm start") : le reste du site continue de fonctionner.
      console.warn('Impossible de charger les reportages depuis l\'API :', err.message);
    }
  }
  loadReportages();

  /* ===================== FORMULAIRE DE PUBLICATION (UPLOAD) ===================== */
  const publishOverlay = document.getElementById('publishOverlay');
  const openPublishBtn = document.getElementById('openPublish');
  const publishCloseBtn = document.getElementById('publishClose');
  const publishCancelBtn = document.getElementById('publishCancel');
  const publishForm = document.getElementById('publishForm');
  const publishSubmit = document.getElementById('publishSubmit');
  const publishFeedback = document.getElementById('publishFeedback');
  const mediaTypeRadios = document.querySelectorAll('input[name="mediaType"]');
  const mediaLabel = document.getElementById('mediaLabel');
  const pMedia = document.getElementById('pMedia');
  const posterFieldWrap = document.getElementById('posterFieldWrap');
  const pDate = document.getElementById('pDate');

  function openPublishModal() {
    publishOverlay.classList.add('open');
    if (pDate && !pDate.value) {
      pDate.value = new Date().toISOString().slice(0, 10);
    }
  }
  function closePublishModal() {
    publishOverlay?.classList.remove('open');
  }

  openPublishBtn?.addEventListener('click', openPublishModal);
  publishCloseBtn?.addEventListener('click', closePublishModal);
  publishCancelBtn?.addEventListener('click', closePublishModal);
  publishOverlay?.addEventListener('click', (e) => { if (e.target === publishOverlay) closePublishModal(); });

  // Adapter le champ "média" selon vidéo / photo(s)
  mediaTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'video' && radio.checked) {
        mediaLabel.textContent = 'Fichier vidéo (.mp4, .webm — 200 Mo max)';
        pMedia.accept = 'video/mp4,video/webm,video/quicktime';
        pMedia.removeAttribute('multiple');
        posterFieldWrap.style.display = '';
      } else if (radio.value === 'image' && radio.checked) {
        mediaLabel.textContent = 'Photo(s) — .jpg, .png, .webp, jusqu\'à 6 images';
        pMedia.accept = 'image/png,image/jpeg,image/webp';
        pMedia.setAttribute('multiple', 'multiple');
        posterFieldWrap.style.display = 'none';
      }
    });
  });

  function showFeedback(message, type) {
    publishFeedback.textContent = message;
    publishFeedback.className = `form-feedback ${type}`;
  }
  function resetFeedback() {
    publishFeedback.textContent = '';
    publishFeedback.className = 'form-feedback';
  }

  const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 Mo
  const MAX_IMAGE_SIZE = 15 * 1024 * 1024;  // 15 Mo par image

  publishForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    resetFeedback();

    const mediaType = publishForm.querySelector('input[name="mediaType"]:checked').value;
    const files = pMedia.files;

    if (!files || files.length === 0) {
      showFeedback('Merci de joindre au moins un fichier.', 'error');
      return;
    }

    // Validation côté client (taille et type), en plus de la validation serveur
    for (const file of files) {
      if (mediaType === 'video' && file.size > MAX_VIDEO_SIZE) {
        showFeedback(`"${file.name}" dépasse 200 Mo.`, 'error');
        return;
      }
      if (mediaType === 'image' && file.size > MAX_IMAGE_SIZE) {
        showFeedback(`"${file.name}" dépasse 15 Mo.`, 'error');
        return;
      }
    }

    const formData = new FormData(publishForm); // capture aussi les fichiers nommés

    publishSubmit.disabled = true;
    publishSubmit.textContent = 'Publication en cours…';

    try {
      const res = await fetch('/api/reportages', {
        method: 'POST',
        headers: authHeaders(), // jeton administrateur requis par le serveur
        body: formData,
      });
      const data = await res.json();

      if (res.status === 401) {
        // Le jeton stocké est invalide ou expiré : on force une reconnexion
        clearAdminToken();
        throw new Error('Session administrateur invalide. Merci de vous reconnecter.');
      }
      if (!res.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      prependReportage(data);
      showFeedback('Reportage publié avec succès.', 'success');
      publishForm.reset();
      pMedia.removeAttribute('multiple');
      mediaLabel.textContent = 'Fichier vidéo (.mp4, .webm — 200 Mo max)';

      setTimeout(() => {
        closePublishModal();
        resetFeedback();
      }, 1200);
    } catch (err) {
      showFeedback(err.message || 'Impossible de publier le reportage. Le serveur est-il lancé ?', 'error');
    } finally {
      publishSubmit.disabled = false;
      publishSubmit.textContent = 'Publier le reportage';
    }
  });

  /* ===================== CONNEXION ADMINISTRATEUR ===================== */
  // La publication d'un reportage nécessite un jeton obtenu via POST /api/login,
  // vérifié côté serveur sur chaque appel à POST /api/reportages. Cacher le
  // bouton "Publier" dans l'interface n'est qu'un confort visuel : la vraie
  // protection est faite par server.js, pas ici.
  const ADMIN_TOKEN_KEY = 'security-it-admin-token';

  const adminOverlay = document.getElementById('adminOverlay');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminClose = document.getElementById('adminClose');
  const adminCancel = document.getElementById('adminCancel');
  const adminForm = document.getElementById('adminForm');
  const adminSubmit = document.getElementById('adminSubmit');
  const adminFeedback = document.getElementById('adminFeedback');
  const adminPasswordInput = document.getElementById('adminPassword');

  function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  function setAdminToken(token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
  function clearAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
  function authHeaders() {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function refreshAdminUI() {
    const isAdmin = !!getAdminToken();
    openPublishBtn?.classList.toggle('hidden', !isAdmin);
    adminLoginBtn?.classList.toggle('hidden', isAdmin);
    adminLogoutBtn?.classList.toggle('hidden', !isAdmin);
  }
  refreshAdminUI();

  function openAdminModal() {
    adminOverlay?.classList.add('open');
    adminPasswordInput?.focus();
  }
  function closeAdminModal() {
    adminOverlay?.classList.remove('open');
    adminForm?.reset();
    if (adminFeedback) { adminFeedback.textContent = ''; adminFeedback.className = 'form-feedback'; }
  }

  adminLoginBtn?.addEventListener('click', openAdminModal);
  adminClose?.addEventListener('click', closeAdminModal);
  adminCancel?.addEventListener('click', closeAdminModal);
  adminOverlay?.addEventListener('click', (e) => { if (e.target === adminOverlay) closeAdminModal(); });

  adminLogoutBtn?.addEventListener('click', async () => {
    try {
      await fetch('/api/logout', { method: 'POST', headers: authHeaders() });
    } catch { /* la déconnexion locale reste valable même si l'appel échoue */ }
    clearAdminToken();
    refreshAdminUI();
  });

  adminForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    adminSubmit.disabled = true;
    adminSubmit.textContent = 'Connexion…';
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mot de passe incorrect.');

      setAdminToken(data.token);
      refreshAdminUI();
      closeAdminModal();
    } catch (err) {
      adminFeedback.textContent = err.message || 'Connexion impossible.';
      adminFeedback.className = 'form-feedback error';
    } finally {
      adminSubmit.disabled = false;
      adminSubmit.textContent = 'Se connecter';
    }
  });

});
