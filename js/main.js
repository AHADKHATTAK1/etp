document.addEventListener('DOMContentLoaded', () => {
  // Clean URLs
  if ((window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.pathname.endsWith('.html')) {
    const originalHash = window.location.hash;
    const cleanPath = window.location.pathname.replace(/\.html$/, '');
    window.history.replaceState({}, '', cleanPath + window.location.search + originalHash);
  }

  // Smooth scroll on hash load
  if (window.location.hash) {
    setTimeout(() => {
      try {
        const el = document.querySelector(window.location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {}
    }, 150);
  }

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Mobile Dropdown Menu ────────────────────────────────────
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');

  function openMenu() {
    navLinks.classList.add('open');
    menuToggle.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.innerHTML = '&#10005;'; // ✕
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '&#9776;'; // ☰
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.contains('open') ? closeMenu() : openMenu();
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && e.target !== menuToggle) {
        closeMenu();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 680) closeMenu();
    }, { passive: true });
  }

  // ── Active nav link ──────────────────────────────────────────
  let currentPath = window.location.pathname.split('/').pop() || 'index.html';
  currentPath = currentPath.replace(/\.html$/, '');
  if (!currentPath || currentPath === 'index') currentPath = 'index';

  document.querySelectorAll('.nav-links a').forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      href = href.split('#')[0].replace(/\.html$/, '');
      link.classList.toggle('active', href === currentPath);
    }
  });

  // ── Scroll Progress Bar ─────────────────────────────────────
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height    = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      scrollProgress.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + '%';
    }, { passive: true });
  }

  // ── Header shrink on scroll ─────────────────────────────────
  const headerEl = document.querySelector('header');
  if (headerEl) {
    window.addEventListener('scroll', () => {
      headerEl.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }
});
