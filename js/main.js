document.addEventListener('DOMContentLoaded', () => {
  // Clean URLs: strip .html extension from the address bar immediately (HTTP/HTTPS only)
  if ((window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.pathname.endsWith('.html')) {
    const originalHash = window.location.hash;
    const cleanPath = window.location.pathname.replace(/\.html$/, '');
    window.history.replaceState({}, '', cleanPath + window.location.search + originalHash);
  }

  // Smooth scroll to anchor target on direct load
  if (window.location.hash) {
    const targetHash = window.location.hash;
    setTimeout(() => {
      try {
        const targetEl = document.querySelector(targetHash);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        console.warn("Invalid hash query:", targetHash);
      }
    }, 150);
  }

  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Mobile Menu ──────────────────────────────────────────────
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');
  const header     = document.querySelector('header');

  // Create dark overlay backdrop
  const overlay = document.createElement('div');
  overlay.id = 'navOverlay';
  overlay.style.cssText = [
    'position:fixed','inset:0','background:rgba(0,0,0,0.6)',
    'backdrop-filter:blur(4px)','-webkit-backdrop-filter:blur(4px)',
    'z-index:98','opacity:0','pointer-events:none',
    'transition:opacity .3s ease'
  ].join(';');
  document.body.appendChild(overlay);

  function openMenu() {
    navLinks.classList.add('open');
    menuToggle.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.innerHTML = '&#10005;'; // ✕
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    document.body.style.overflow = 'hidden'; // lock scroll
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '&#9776;'; // ☰
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    document.body.style.overflow = '';
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    // Close on overlay click
    overlay.addEventListener('click', closeMenu);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
    });

    // Close menu on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 680) closeMenu();
    });
  }

  // ── Active nav link highlighting ─────────────────────────────
  let currentPath = window.location.pathname.split('/').pop() || 'index.html';
  currentPath = currentPath.replace(/\.html$/, '');
  if (currentPath === '' || currentPath === 'index') currentPath = 'index';

  document.querySelectorAll('.nav-links a').forEach(link => {
    let linkHref = link.getAttribute('href');
    if (linkHref) {
      linkHref = linkHref.split('#')[0].replace(/\.html$/, '');
      link.classList.toggle('active', linkHref === currentPath);
    }
  });

  // ── Scroll Progress Bar ──────────────────────────────────────
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      scrollProgress.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + '%';
    }, { passive: true });
  }

  // ── Header shrink on scroll ──────────────────────────────────
  const headerEl = document.querySelector('header');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      headerEl.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }
});
