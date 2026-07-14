document.addEventListener('DOMContentLoaded', () => {
  // Clean URLs: strip .html extension from the address bar immediately
  if (window.location.pathname.endsWith('.html')) {
    const cleanPath = window.location.pathname.replace(/\.html$/, '');
    window.history.replaceState({}, '', cleanPath + window.location.search + window.location.hash);
  }

  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.classList.toggle('active');
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.textContent = '☰';
      });
    });
  }

  // Active navigation link highlighting based on filename
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref && (linkHref === currentPath || (currentPath === '' && linkHref === 'index.html'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Scroll Progress Bar
  window.addEventListener('scroll', () => {
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      scrollProgress.style.width = scrolled + '%';
    }
  });
});
