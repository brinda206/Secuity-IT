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
  
  // Créer l'overlay dynamiquement s'il n'existe pas
  let menuOverlay = document.querySelector('.menu-overlay');
  if (!menuOverlay) {
    menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);
  }

  menuToggle?.addEventListener('click', () => {
    const isOpen = mainNav?.classList.toggle('open');
    if (isOpen) {
      menuOverlay.classList.add('open');
      document.body.style.overflow = 'hidden'; // Empêcher le défilement
    } else {
      menuOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  menuOverlay.addEventListener('click', () => {
    mainNav?.classList.remove('open');
    menuOverlay.classList.remove('open');
    document.body.style.overflow = '';
  });

  /* ===================== FILTRES & RECHERCHE ===================== */
  const chips = document.querySelectorAll('.chip');
  let currentFilter = 'all';
  let currentSearchQuery = '';

  function applyFilter() {
    const q = currentSearchQuery.toLowerCase();
    let visibleCount = 0;
    
    document.querySelectorAll('#articlesGrid .card').forEach(card => {
      const textContent = card.textContent.toLowerCase();
      const matchCategory = currentFilter === 'all' || card.dataset.category === currentFilter;
      const matchSearch = !q || textContent.includes(q);
      const isVisible = matchCategory && matchSearch;
      
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.remove('hidden');
      } else {
        emptyState.classList.add('hidden');
      }
    }
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      applyFilter();
      updateNavActive(currentFilter);
    });
  });

  /* --- Synchronisation du Menu Principal avec les Filtres --- */
  const navLinks = document.querySelectorAll('.main-nav a');
  
  function updateNavActive(filterName) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (filterName === 'all' && (href === '#' || href === 'index.html')) {
        link.classList.add('active');
      } else if (href && href.includes(`filter=${filterName}`)) {
        link.classList.add('active');
      }
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      // On intercepte les liens de filtrage pour éviter de recharger la page
      if (href === '#' || (href && href.includes('filter='))) {
        e.preventDefault();
        
        let targetFilter = 'all';
        if (href !== '#' && href.includes('filter=')) {
          const url = new URL(link.href, window.location.origin);
          targetFilter = url.searchParams.get('filter') || 'all';
        }
        
        // Met à jour les puces de catégories
        const targetChip = [...chips].find(c => c.dataset.filter === targetFilter);
        if (targetChip) {
          chips.forEach(c => c.classList.remove('active'));
          targetChip.classList.add('active');
        }
        
        // Applique le filtre
        currentFilter = targetFilter;
        applyFilter();
        updateNavActive(targetFilter);
        
        // Ferme le menu mobile si ouvert
        document.querySelector('.main-nav')?.classList.remove('open');
        
        // Défile vers la grille d'articles
        document.getElementById('filters')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Applique le filtre demandé via l'URL
  const urlFilter = new URLSearchParams(window.location.search).get('filter');
  if (urlFilter) {
    const targetChip = [...chips].find(c => c.dataset.filter === urlFilter);
    if (targetChip) {
      chips.forEach(c => c.classList.remove('active'));
      targetChip.classList.add('active');
      currentFilter = urlFilter;
      applyFilter();
      updateNavActive(urlFilter);
    }
  }

  /* --- Recherche avec Autocomplétion --- */
  const searchInput = document.getElementById('searchInput');
  const searchSuggestions = document.getElementById('searchSuggestions');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim();
      applyFilter();

      // Autocomplétion visuelle
      const q = currentSearchQuery.toLowerCase();
      if (!q) {
        searchSuggestions.style.display = 'none';
        return;
      }

      // On cherche les titres qui correspondent
      const cards = Array.from(document.querySelectorAll('#articlesGrid .card'));
      const matches = cards
        .map(card => card.querySelector('h3 a')?.textContent || '')
        .filter(title => title.toLowerCase().includes(q))
        .slice(0, 5); // top 5

      searchSuggestions.style.display = 'block';

      if (matches.length > 0) {
        searchSuggestions.innerHTML = matches.map(m => {
          // Surbrillance du texte recherché
          const regex = new RegExp(`(${q})`, 'gi');
          const highlightedTitle = escapeHtml(m).replace(regex, '<span class="highlight">$1</span>');
          
          return `<div class="suggestion-item" data-val="${escapeHtml(m)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5; flex-shrink:0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span style="flex-grow:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${highlightedTitle}</span>
          </div>`;
        }).join('');
        
        searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            searchInput.value = item.dataset.val;
            searchInput.dispatchEvent(new Event('input'));
            searchSuggestions.style.display = 'none';
            searchInput.blur();
          });
        });
      } else {
        searchSuggestions.innerHTML = `<div class="suggestion-empty">Aucun résultat pour "${escapeHtml(currentSearchQuery)}"</div>`;
      }
    });

    // Fermer les suggestions si on clique ailleurs
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) {
        searchSuggestions.style.display = 'none';
      }
    });

    // Afficher les suggestions au clic sur l'input s'il n'est pas vide
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim() !== '') {
        searchSuggestions.style.display = 'block';
      }
    });

    // Raccourci clavier Ctrl+K ou Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Bouton de suppression
    const clearBtn = document.getElementById('searchClearBtn');
    clearBtn?.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });

    // Branchement du bouton de la barre de navigation
    const headerSearchBtn = document.getElementById('headerSearchBtn');
    headerSearchBtn?.addEventListener('click', () => {
      // Défilement jusqu'à la barre de recherche
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Petit délai pour laisser le scroll se faire avant de donner le focus
      setTimeout(() => searchInput.focus(), 300);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePublishModal();
  });

  /* ===================== NEWSLETTER ===================== */
  const newsletterForm = document.getElementById('newsletterForm');
  const confirmMsg = document.getElementById('confirmMsg');
  newsletterForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = newsletterForm.querySelector('input');
    const submitBtn = newsletterForm.querySelector('button');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Inscription...';
    confirmMsg.style.display = 'none';
    
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: input.value })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'inscription");
      
      confirmMsg.textContent = data.message;
      confirmMsg.style.color = 'var(--safe)';
      confirmMsg.style.display = 'block';
      input.value = '';
    } catch (err) {
      confirmMsg.textContent = err.message;
      confirmMsg.style.color = 'var(--critical)';
      confirmMsg.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
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

    const adminActionsHTML = `
      <div class="admin-actions hidden">
        <button class="admin-action-btn edit-btn" data-id="${item.id}" aria-label="Modifier" title="Modifier cet article">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="admin-action-btn delete-btn" data-id="${item.id}" aria-label="Supprimer" title="Supprimer cet article">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    if (item.mediaType === 'video') {
      const poster = item.posterUrl || '';
      return `
        <div class="card has-media" data-category="${safeCategory}">
          ${adminActionsHTML}
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
            <div class="tag-row">
              <span>${dateLabel}</span><span>Vidéo</span>
              <button class="share-btn" data-id="${item.id}" aria-label="Partager" title="Copier le lien"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
            </div>
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
          ${adminActionsHTML}
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
            <div class="tag-row">
              <span>${dateLabel}</span><span>${gallery.length} photos</span>
              <button class="share-btn" data-id="${item.id}" aria-label="Partager" title="Copier le lien"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="card has-media" data-category="${safeCategory}">
        ${adminActionsHTML}
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
          <div class="tag-row">
            <span>${dateLabel}</span><span>1 photo</span>
            <button class="share-btn" data-id="${item.id}" aria-label="Partager" title="Copier le lien"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
          </div>
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
    applyFilter(); // respecte le filtre actif et la recherche après ajout
    initCardCarousels(); // Initialise le carrousel sur la nouvelle carte
  }

  async function loadReportages() {
    if (!grid) return;
    
    // 1. Afficher les Skeletons pendant le chargement (sans écraser les cartes statiques)
    const skeletonsHTML = `
      <div class="skeleton-card temp-skel"></div>
      <div class="skeleton-card temp-skel"></div>
      <div class="skeleton-card temp-skel"></div>
      <div class="skeleton-card temp-skel"></div>
    `;
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.insertAdjacentHTML('afterend', skeletonsHTML);
    } else {
      grid.insertAdjacentHTML('afterbegin', skeletonsHTML);
    }

    try {
      const res = await fetch('/api/reportages');
      if (!res.ok) throw new Error('Réponse API invalide');
      const items = await res.json();
      
      // Stocker en global pour l'édition
      window.allReportages = items;
      
      // Nettoyer les skeletons avant l'insertion
      grid.querySelectorAll('.temp-skel').forEach(el => el.remove());
      
      // On retire aussi les anciennes cartes dynamiques au cas où on recharge la liste (après un edit/delete)
      // pour éviter les doublons. On laisse les cartes statiques (qui n'ont pas de bouton delete-btn).
      grid.querySelectorAll('.card:has(.delete-btn)').forEach(el => el.remove());

      [...items].reverse().forEach(item => {
        // Insérer juste après le emptyState s'il existe
        if (emptyState) {
          emptyState.insertAdjacentHTML('afterend', reportageCardHTML(item));
        } else {
          grid.insertAdjacentHTML('afterbegin', reportageCardHTML(item));
        }
      });
      
      refreshAdminUI();
      applyFilter();
      initCardCarousels(); // Initialise tous les carrousels de cartes
    } catch (err) {
      grid.querySelectorAll('.temp-skel').forEach(el => el.remove());
      console.warn("Impossible de charger les reportages depuis l'API :", err.message);
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
  
  // Fonction de compression asynchrone (API Canvas)
  function compressImage(file, maxWidth = 1920) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(newFile);
            } else {
              reject(new Error('Erreur lors de la compression de ' + file.name));
            }
          }, 'image/webp', 0.8);
        };
        img.onerror = () => reject(new Error("Format d'image invalide."));
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
    });
  }

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

    publishSubmit.disabled = true;
    publishSubmit.textContent = 'Préparation et compression...';

    const formData = new FormData(publishForm); // capture aussi les fichiers nommés
    
    try {
      if (mediaType === 'image') {
        formData.delete('media'); // on supprime les fichiers non compressés
        for (let i = 0; i < files.length; i++) {
           if (files[i].type.startsWith('image/')) {
              const compressedFile = await compressImage(files[i], 1920);
              formData.append('media', compressedFile);
           }
        }
      }
      
      // Si une image poster a été choisie (vidéo), on pourrait aussi la compresser
      const posterInput = publishForm.querySelector('#pPoster');
      if (mediaType === 'video' && posterInput && posterInput.files.length > 0) {
         formData.delete('poster');
         const compressedPoster = await compressImage(posterInput.files[0], 1920);
         formData.append('poster', compressedPoster);
      }
    } catch(err) {
      showFeedback('Erreur lors de la compression : ' + err.message, 'error');
      publishSubmit.disabled = false;
      publishSubmit.textContent = 'Publier le reportage';
      return;
    }

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

  // --- Global Share Dropdown (Home Page) ---
  const globalShareDropdown = document.createElement('div');
  globalShareDropdown.className = 'share-dropdown';
  globalShareDropdown.id = 'globalShareDropdown';
  globalShareDropdown.innerHTML = `
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
  `;
  document.body.appendChild(globalShareDropdown);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#globalShareDropdown') && !e.target.closest('.share-btn')) {
      globalShareDropdown.classList.remove('open');
    }
  });

  globalShareDropdown.addEventListener('click', async (e) => {
    const btn = e.target.closest('.share-option');
    if (!btn) return;
    
    e.stopPropagation();
    const network = btn.dataset.network;
    const url = encodeURIComponent(globalShareDropdown.dataset.url);
    const title = encodeURIComponent(globalShareDropdown.dataset.title);
    
    if (network === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${title} - ${url}`, '_blank');
      globalShareDropdown.classList.remove('open');
    } else if (network === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
      globalShareDropdown.classList.remove('open');
    } else {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(url));
        const orig = btn.innerHTML;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--safe)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Lien copié !`;
        setTimeout(() => {
          btn.innerHTML = orig;
          globalShareDropdown.classList.remove('open');
        }, 1500);
      } catch (err) {
        console.error(err);
      }
    }
  });

  /* ===================== PARTAGE, SUPPRESSION & MODIFICATION ===================== */
  grid?.addEventListener('click', async (e) => {
    
    // -- Partage
    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = shareBtn.dataset.id;
      const url = `${window.location.origin}/article.html?id=${id}`;
      const title = shareBtn.closest('.card')?.querySelector('h3')?.textContent || 'Security IT';

      // Position the dropdown below the button
      const rect = shareBtn.getBoundingClientRect();
      globalShareDropdown.style.position = 'fixed';
      globalShareDropdown.style.top = `${rect.bottom + 8}px`;
      
      // Prevent going offscreen
      if (rect.right - 200 < 10) {
        globalShareDropdown.style.left = `${rect.left}px`;
        globalShareDropdown.style.right = 'auto';
      } else {
        globalShareDropdown.style.left = 'auto';
        globalShareDropdown.style.right = `${window.innerWidth - rect.right}px`;
      }

      globalShareDropdown.dataset.url = url;
      globalShareDropdown.dataset.title = title;
      
      globalShareDropdown.classList.toggle('open');
    }
  });

  // Logique de la modale de suppression
  const deleteOverlay = document.getElementById('deleteOverlay');
  const deleteIdInput = document.getElementById('deleteId');
  
  function closeDeleteModal() {
    deleteOverlay?.classList.remove('open');
  }
  
  document.getElementById('deleteClose')?.addEventListener('click', closeDeleteModal);
  document.getElementById('deleteCancel')?.addEventListener('click', closeDeleteModal);
  deleteOverlay?.addEventListener('click', (e) => { if (e.target === deleteOverlay) closeDeleteModal(); });
  
  document.getElementById('deleteConfirmBtn')?.addEventListener('click', async () => {
    const id = deleteIdInput.value;
    if (!id) return;
    
    try {
      const res = await fetch(`/api/reportages/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { clearAdminToken(); refreshAdminUI(); }
        throw new Error(data.error || 'Erreur de suppression');
      }
      closeDeleteModal();
      await loadReportages(); // Recharge la liste
    } catch (err) {
      alert('Erreur : ' + err.message);
    }
  });
  document.getElementById('reportagesGrid')?.addEventListener('click', async (e) => {
    // SUPPRESSION
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation(); // Empêche l'ouverture de l'article/lightbox
      const id = deleteBtn.dataset.id;
      deleteIdInput.value = id;
      deleteOverlay.classList.add('open');
      return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = editBtn.dataset.id;
      openEditModal(id);
      return;
    }
  });

  /* ===================== FORMULAIRE DE MODIFICATION ===================== */
  const editOverlay = document.getElementById('editOverlay');
  const editForm = document.getElementById('editForm');
  const editFeedback = document.getElementById('editFeedback');
  
  function closeEditModal() {
    editOverlay?.classList.remove('open');
  }

  document.getElementById('editClose')?.addEventListener('click', closeEditModal);
  document.getElementById('editCancel')?.addEventListener('click', closeEditModal);
  editOverlay?.addEventListener('click', (e) => { if (e.target === editOverlay) closeEditModal(); });

  function openEditModal(id) {
    if (!window.allReportages) return;
    const item = window.allReportages.find(r => r.id === id);
    if (!item) return alert('Article introuvable.');

    document.getElementById('eId').value = item.id;
    document.getElementById('eTitle').value = item.title;
    document.getElementById('eCategory').value = item.category;
    document.getElementById('eDate').value = item.date.slice(0, 10);
    document.getElementById('eExcerpt').value = item.excerpt;
    document.getElementById('eBody').value = item.body || '';
    document.getElementById('eCaption').value = item.caption || '';
    
    // Gérer l'aperçu du média existant
    const previewContainer = document.getElementById('eMediaPreviewContainer');
    const placeholder = document.getElementById('eMediaPlaceholder');
    const mediaInput = document.getElementById('eMedia');
    
    // Reset l'input file
    mediaInput.value = '';
    
    if (item.mediaUrl) {
      previewContainer.style.display = 'block';
      placeholder.style.opacity = '0'; // On cache le placeholder visuellement mais on garde l'espace
      
      const isVideo = item.mediaUrl.endsWith('.mp4') || item.mediaUrl.endsWith('.webm');
      const mediaHtml = isVideo 
        ? `<video src="${item.mediaUrl}" muted loop autoplay playsinline></video>`
        : `<img src="${item.mediaUrl}" alt="Aperçu du média">`;
        
      previewContainer.innerHTML = `
        ${mediaHtml}
        <div class="media-preview-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span>Remplacer le média</span>
        </div>
      `;
    } else {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
      placeholder.style.opacity = '1';
    }

    if (editFeedback) { editFeedback.textContent = ''; editFeedback.className = 'form-feedback'; }
    
    editOverlay?.classList.add('open');
  }

  // Gérer l'aperçu dynamique lors de la sélection d'un nouveau fichier
  document.getElementById('eMedia')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('eMediaPreviewContainer');
    const placeholder = document.getElementById('eMediaPlaceholder');
    
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      previewContainer.style.display = 'block';
      placeholder.style.opacity = '0';
      
      const mediaHtml = isVideo 
        ? `<video src="${fileUrl}" muted loop autoplay playsinline></video>`
        : `<img src="${fileUrl}" alt="Aperçu du nouveau média">`;
        
      previewContainer.innerHTML = `
        ${mediaHtml}
        <div class="media-preview-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <span>Changer de fichier</span>
        </div>
      `;
    }
  });

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('editSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enregistrement...';
    
    const id = document.getElementById('eId').value;
    const formData = new FormData(editForm);
    // Supprimer le champ fichier vide s'il n'y a pas de fichier sélectionné
    const fileInput = document.getElementById('eMedia');
    if (fileInput && fileInput.files.length === 0) {
      formData.delete('media');
    }

    try {
      const res = await fetch(`/api/reportages/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) { clearAdminToken(); refreshAdminUI(); }
        throw new Error(data.error || 'Erreur lors de la modification');
      }

      closeEditModal();
      await loadReportages();
    } catch (err) {
      if (editFeedback) {
        editFeedback.textContent = err.message;
        editFeedback.className = 'form-feedback error';
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enregistrer les modifications';
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
    
    document.querySelectorAll('.admin-actions').forEach(el => {
      el.classList.toggle('hidden', !isAdmin);
    });
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

  /* ===================== BOUTON REMONTER ===================== */
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.remove('hidden');
      } else {
        scrollTopBtn.classList.add('hidden');
      }
    });

    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Vérification de la présence du paramètre ?edit dans l'URL pour ouvrir automatiquement la modale
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId) {
    // Il faut attendre que les reportages soient chargés
    setTimeout(() => {
      if (isAdminLoggedIn()) {
        openEditModal(editId);
        // Nettoyer l'URL sans recharger
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 1000);
  }

});
