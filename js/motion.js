/**
 * ETechProvider — 3D Motion & Gravity Engine
 * Features: Particle gravity field, 3D card tilt, magnetic buttons,
 *           scroll reveal with spring physics, floating orbs, 3D hero orbit
 */

(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 680;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════════
     1. GRAVITY PARTICLE FIELD — canvas background
  ══════════════════════════════════════════════════════════ */
  function initParticles() {
    if (prefersReduced) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'gravityCanvas';
    canvas.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:0', 'pointer-events:none',
      'opacity:0.45'
    ].join(';');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles = [], mouse = { x: -9999, y: -9999 };
    const COUNT = isMobile() ? 38 : 75;
    const GRAVITY = 0.018;
    const REPEL_DIST = 120;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX; mouse.y = e.clientY;
    }, { passive: true });

    // Particle class
    class Particle {
      constructor() { this.reset(true); }
      reset(initial) {
        this.x  = Math.random() * W;
        this.y  = initial ? Math.random() * H : -10;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = Math.random() * 0.5 + 0.1;
        this.r  = Math.random() * 1.6 + 0.4;
        this.alpha = Math.random() * 0.5 + 0.15;
        this.color = Math.random() > 0.7 ? '255,255,255' : '180,180,200';
      }
      update() {
        // Gravity pull downward
        this.vy += GRAVITY;
        // Mouse repel
        const dx = this.x - mouse.x, dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_DIST) {
          const force = (REPEL_DIST - dist) / REPEL_DIST;
          this.vx += (dx / dist) * force * 1.2;
          this.vy += (dy / dist) * force * 1.2;
        }
        // Damping
        this.vx *= 0.98; this.vy *= 0.98;
        this.x += this.vx; this.y += this.vy;
        // Wrap X
        if (this.x < 0) this.x = W;
        if (this.x > W) this.x = 0;
        // Reset if off bottom
        if (this.y > H + 10) this.reset(false);
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < COUNT; i++) particles.push(new Particle());

    // Draw connecting lines between close particles
    function drawConnections() {
      const MAX_DIST = isMobile() ? 80 : 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${0.06 * (1 - d / MAX_DIST)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function loop() {
      ctx.clearRect(0, 0, W, H);
      drawConnections();
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ══════════════════════════════════════════════════════════
     2. 3D CARD TILT — mouse tracking perspective
  ══════════════════════════════════════════════════════════ */
  function init3DTilt() {
    if (prefersReduced || isMobile()) return;

    const tiltEls = document.querySelectorAll(
      '.svc-card, .price-card, .testi-card, .svc-detail-card, .work-card, .process-panel'
    );

    tiltEls.forEach(el => {
      el.style.transition = 'transform 0.1s ease, box-shadow 0.2s ease';
      el.style.willChange = 'transform';
      el.style.transformStyle = 'preserve-3d';

      el.addEventListener('mousemove', e => {
        const rect   = el.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) / (rect.width  / 2);
        const dy     = (e.clientY - cy) / (rect.height / 2);
        const rotX   = -dy * 8;   // max 8deg
        const rotY   =  dx * 8;
        el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px) scale(1.02)`;
        el.style.boxShadow = `${-dx * 12}px ${-dy * 12}px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)';
        el.style.boxShadow = '';
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     3. MAGNETIC BUTTONS — cursor gravity pull
  ══════════════════════════════════════════════════════════ */
  function initMagneticBtns() {
    if (prefersReduced || isMobile()) return;

    document.querySelectorAll('.btn-primary, .btn-ghost, .menu-toggle').forEach(btn => {
      btn.style.transition = 'transform 0.3s cubic-bezier(.34,1.56,.64,1)';
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) * 0.28;
        const dy   = (e.clientY - cy) * 0.28;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     4. SCROLL REVEAL — spring physics entrance
  ══════════════════════════════════════════════════════════ */
  function initScrollReveal() {
    if (prefersReduced) return;

    // Inject reveal CSS
    const style = document.createElement('style');
    style.textContent = `
      .sr-hidden {
        opacity: 0;
        transform: translateY(36px) scale(0.97);
        transition: opacity 0.65s cubic-bezier(.34,1.2,.64,1),
                    transform 0.65s cubic-bezier(.34,1.2,.64,1);
      }
      .sr-hidden.sr-left  { transform: translateX(-40px) scale(0.97); }
      .sr-hidden.sr-right { transform: translateX( 40px) scale(0.97); }
      .sr-hidden.sr-zoom  { transform: scale(0.88); }
      .sr-visible {
        opacity: 1 !important;
        transform: none !important;
      }
      .sr-delay-1 { transition-delay: 0.08s !important; }
      .sr-delay-2 { transition-delay: 0.16s !important; }
      .sr-delay-3 { transition-delay: 0.24s !important; }
      .sr-delay-4 { transition-delay: 0.32s !important; }
      .sr-delay-5 { transition-delay: 0.40s !important; }
    `;
    document.head.appendChild(style);

    // Tag elements for reveal
    const selectors = [
      { sel: '.sec-head',          cls: ''        },
      { sel: '.svc-card',          cls: 'sr-zoom' },
      { sel: '.price-card',        cls: 'sr-zoom' },
      { sel: '.testi-card',        cls: ''        },
      { sel: '.svc-detail-card',   cls: 'sr-left' },
      { sel: '.work-card',         cls: ''        },
      { sel: '.stat',              cls: 'sr-zoom' },
      { sel: '.cta-banner',        cls: 'sr-zoom' },
      { sel: '.proc-step-btn',     cls: ''        },
      { sel: '.process-panel',     cls: ''        },
      { sel: '.hero h1',           cls: ''        },
      { sel: '.hero p.lead',       cls: ''        },
      { sel: '.hero .cta-row',     cls: ''        },
      { sel: '.eyebrow',           cls: ''        },
      { sel: '.contact-info-card', cls: 'sr-left' },
      { sel: '.contact-form',      cls: 'sr-right'},
    ];

    selectors.forEach(({ sel, cls }) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.classList.contains('sr-hidden')) {
          el.classList.add('sr-hidden');
          if (cls) el.classList.add(cls);
          if (i < 5) el.classList.add(`sr-delay-${i + 1}`);
        }
      });
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sr-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.sr-hidden').forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     5. FLOATING GRAVITY ORBS — ambient 3D blobs
  ══════════════════════════════════════════════════════════ */
  function initFloatingOrbs() {
    if (prefersReduced || isMobile()) return;

    const orbs = [
      { size: 380, x: '8%',  y: '12%', color: 'rgba(255,255,255,0.028)', dur: 14 },
      { size: 260, x: '78%', y: '25%', color: 'rgba(255,180,84,0.022)',  dur: 18 },
      { size: 320, x: '55%', y: '68%', color: 'rgba(255,255,255,0.02)',  dur: 22 },
      { size: 180, x: '20%', y: '80%', color: 'rgba(255,180,84,0.018)', dur: 16 },
    ];

    const style = document.createElement('style');
    orbs.forEach((o, i) => {
      style.textContent += `
        @keyframes orbFloat${i} {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(${20 + i * 8}px, ${-15 - i * 5}px) scale(1.04); }
          66%  { transform: translate(${-12 + i * 4}px, ${18 + i * 3}px) scale(0.97); }
          100% { transform: translate(0,0) scale(1); }
        }
      `;
    });
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
    orbs.forEach((o, i) => {
      const el = document.createElement('div');
      el.style.cssText = `
        position:absolute;
        left:${o.x}; top:${o.y};
        width:${o.size}px; height:${o.size}px;
        border-radius:50%;
        background:radial-gradient(circle, ${o.color} 0%, transparent 70%);
        filter:blur(${o.size * 0.3}px);
        animation:orbFloat${i} ${o.dur}s ease-in-out infinite;
        will-change:transform;
      `;
      wrap.appendChild(el);
    });
    document.body.prepend(wrap);
  }

  /* ══════════════════════════════════════════════════════════
     6. 3D HERO ORBIT — rotating ring around switchboard
  ══════════════════════════════════════════════════════════ */
  function init3DHeroOrbit() {
    if (prefersReduced || isMobile()) return;

    const sb = document.querySelector('.switchboard-container');
    if (!sb) return;

    // Add 3D perspective to switchboard
    sb.style.cssText += ';transform-style:preserve-3d;perspective:1200px;';

    // Add rotating ring
    const ring = document.createElement('div');
    ring.style.cssText = `
      position:absolute; inset:-20px; border-radius:50%;
      border:1px dashed rgba(255,255,255,0.1);
      animation:orbitRing 20s linear infinite;
      pointer-events:none;
    `;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes orbitRing {
        from { transform: rotateX(70deg) rotateZ(0deg); }
        to   { transform: rotateX(70deg) rotateZ(360deg); }
      }
      .switchboard-container { position:relative; }
    `;
    document.head.appendChild(style);
    sb.style.position = 'relative';
    sb.appendChild(ring);

    // Mouse parallax on switchboard
    document.addEventListener('mousemove', e => {
      if (isMobile()) return;
      const rect  = sb.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const dx    = (e.clientX - cx) / window.innerWidth;
      const dy    = (e.clientY - cy) / window.innerHeight;
      sb.style.transform = `perspective(1200px) rotateY(${dx * 6}deg) rotateX(${-dy * 4}deg)`;
      sb.style.transition = 'transform 0.15s ease';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════
     7. CURSOR GLOW — custom cursor with gravity trail
  ══════════════════════════════════════════════════════════ */
  function initCursorGlow() {
    if (prefersReduced || isMobile()) return;

    const cursor = document.createElement('div');
    const trail  = document.createElement('div');

    const base = `
      position:fixed; border-radius:50%; pointer-events:none;
      z-index:99999; mix-blend-mode:screen;
    `;
    cursor.style.cssText = base + `
      width:10px; height:10px;
      background:rgba(255,255,255,0.9);
      transform:translate(-50%,-50%);
      transition:width 0.2s, height 0.2s, background 0.2s;
    `;
    trail.style.cssText = base + `
      width:36px; height:36px;
      background:rgba(255,255,255,0.07);
      border:1px solid rgba(255,255,255,0.15);
      transform:translate(-50%,-50%);
      transition:left 0.12s ease, top 0.12s ease, width 0.2s, height 0.2s;
    `;

    document.body.appendChild(trail);
    document.body.appendChild(cursor);

    let mx = 0, my = 0;
    let targetX = 0, targetY = 0;
    let isSnapped = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      
      // Magnetic snapping to buttons
      isSnapped = false;
      const magEls = document.querySelectorAll('.btn-primary, .btn-ghost, .menu-toggle, .logo img');
      for (let el of magEls) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 36) { // Snapping threshold
          targetX = cx;
          targetY = cy;
          isSnapped = true;
          el.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px) scale(1.05)`;
          break;
        }
      }

      const finalX = isSnapped ? targetX : mx;
      const finalY = isSnapped ? targetY : my;

      cursor.style.left = finalX + 'px';
      cursor.style.top = finalY + 'px';
      trail.style.left  = finalX + 'px';
      trail.style.top  = finalY + 'px';
    }, { passive: true });

    // Expand on hover over interactive elements
    document.querySelectorAll('a, button, .svc-card, .price-card, .work-card').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width  = '6px';
        cursor.style.height = '6px';
        cursor.style.background = 'rgba(255,180,84,1)';
        trail.style.width  = '54px';
        trail.style.height = '54px';
        trail.style.borderColor = 'rgba(255,180,84,0.4)';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width  = '10px';
        cursor.style.height = '10px';
        cursor.style.background = 'rgba(255,255,255,0.9)';
        trail.style.width  = '36px';
        trail.style.height = '36px';
        trail.style.borderColor = 'rgba(255,255,255,0.15)';
        if (el.classList.contains('btn-primary') || el.classList.contains('btn-ghost') || el.classList.contains('menu-toggle')) {
          el.style.transform = '';
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     8. NUMBER COUNT-UP ANIMATION — stats
  ══════════════════════════════════════════════════════════ */
  function initCountUp() {
    const stats = document.querySelectorAll('.stat .n');
    if (!stats.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el   = entry.target;
        const text = el.textContent;
        const num  = parseFloat(text.replace(/[^0-9.]/g, ''));
        const suffix = text.replace(/[0-9.]/g, '');
        if (!num) return;

        let start = 0, duration = 1600;
        const step = timestamp => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          // Ease out
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = (num < 10
            ? (ease * num).toFixed(1)
            : Math.round(ease * num)
          ) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    stats.forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
     9. HERO TEXT 3D GLITCH — subtle depth effect
  ══════════════════════════════════════════════════════════ */
  function initHeroGlitch() {
    if (prefersReduced) return;

    const style = document.createElement('style');
    style.textContent = `
      .hero h1 {
        text-shadow: 0 1px 0 rgba(255,255,255,0.15);
        position: relative;
      }
      @keyframes glitchShift {
        0%,95%,100% { text-shadow: 0 1px 0 rgba(255,255,255,0.15); }
        96% {
          text-shadow:
            -2px 0 rgba(255,100,100,0.4),
             2px 0 rgba(100,200,255,0.4),
             0 1px 0 rgba(255,255,255,0.15);
        }
        98% {
          text-shadow:
             2px 0 rgba(255,100,100,0.3),
            -2px 0 rgba(100,200,255,0.3),
             0 1px 0 rgba(255,255,255,0.15);
        }
      }
      .hero h1 { animation: glitchShift 8s infinite; }

      /* 3D depth on section headings */
      .sec-head h2 {
        text-shadow:
          0 2px 4px rgba(0,0,0,0.5),
          0 4px 16px rgba(0,0,0,0.3);
        letter-spacing: -0.02em;
      }

      /* Scroll progress glow */
      #scrollProgress {
        box-shadow: 0 0 8px rgba(255,255,255,0.5);
      }

      /* Card 3D base */
      .svc-card, .price-card, .testi-card, .work-card {
        transform-style: preserve-3d;
      }

      /* Glow on active nav link */
      .nav-links a.active {
        text-shadow: 0 0 12px var(--signal);
      }
    `;
    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════════════════════
     10. MOBILE FIX — hero single column + overflow fix
  ══════════════════════════════════════════════════════════ */
  function fixMobileHero() {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 680px) {
        /* Fix hero overflow on mobile */
        .hero { overflow: hidden !important; padding: 52px 0 40px !important; }
        .hero .wrap {
          grid-template-columns: 1fr !important;
          gap: 28px !important;
        }
        .switchboard { display: none !important; }
        .hero h1 { font-size: clamp(1.7rem, 8vw, 2.4rem) !important; }
        .hero p.lead { font-size: 0.97rem !important; margin: 14px 0 22px !important; }
        .hero .cta-row { flex-wrap: wrap !important; gap: 10px !important; }
        .hero .cta-row .btn { flex: 1; min-width: 130px; justify-content: center; }

        /* Fix body overflow */
        body { overflow-x: hidden !important; }
        * { max-width: 100vw; }

        /* Grid fixes */
        .services-grid { grid-template-columns: 1fr !important; }
        .testi-grid { grid-template-columns: 1fr !important; }
        .price-grid { grid-template-columns: 1fr !important; }

        /* Hide gravity canvas on mobile for perf */
        #gravityCanvas { display: none !important; }

        /* Svc detail card */
        .svc-detail-card {
          grid-template-columns: 1fr !important;
          padding: 20px 16px !important;
        }

        /* Estimator */
        .estimator-wrap {
          grid-template-columns: 1fr !important;
          padding: 20px 16px !important;
          gap: 20px !important;
        }

        /* CTA Banner */
        .cta-banner { padding: 32px 16px !important; }
        .cta-banner h2 { font-size: 1.5rem !important; }

        /* Stats */
        .stats-bar { grid-template-columns: repeat(2, 1fr) !important; padding: 20px 16px !important; }
      }

      @media (max-width: 400px) {
        .hero h1 { font-size: 1.5rem !important; }
        .stats-bar { grid-template-columns: 1fr !important; }
        .hero .cta-row .btn { width: 100% !important; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ══════════════════════════════════════════════════════════
     11. TECH PRELOADER — Loading percentage intro
  ══════════════════════════════════════════════════════════ */
  function initPreloader() {
    if (prefersReduced) return;
    
    // Check session storage so it only runs once per session
    if (sessionStorage.getItem('etp_loaded')) return;
    sessionStorage.setItem('etp_loaded', 'true');

    const loader = document.createElement('div');
    loader.id = 'etpPreloader';
    loader.style.cssText = `
      position:fixed; inset:0; background:#050508; z-index:999999;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      transition: clip-path 0.75s cubic-bezier(0.77, 0, 0.175, 1);
      clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
      font-family: 'Space Grotesk', sans-serif;
    `;
    
    loader.innerHTML = `
      <div style="text-align:center; max-width:280px; width:100%; padding:20px; box-sizing:border-box;">
        <div style="font-family:'IBM Plex Mono', monospace; font-size:0.75rem; color:var(--signal); letter-spacing:0.18em; text-transform:uppercase; margin-bottom:14px; text-shadow: 0 0 8px var(--signal-dim);">ETechProvider Core</div>
        <div style="height:2px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; position:relative; margin-bottom:16px;">
          <div id="preloaderBar" style="position:absolute; left:0; top:0; bottom:0; width:0%; background:var(--signal); transition:width 0.08s linear; box-shadow: 0 0 6px var(--signal);"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-family:'IBM Plex Mono', monospace; font-size:0.68rem; color:var(--muted-2);">
          <span style="opacity: 0.7;">INITIALIZING SYSTEMS...</span>
          <span id="preloaderPercent">0%</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(loader);
    
    const bar = document.getElementById('preloaderBar');
    const pct = document.getElementById('preloaderPercent');
    
    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 8) + 4;
      if (count >= 100) {
        count = 100;
        clearInterval(interval);
        bar.style.width = '100%';
        pct.textContent = '100%';
        setTimeout(() => {
          loader.style.clipPath = 'polygon(0 0, 100% 0, 100% 0, 0 0)'; // Slide open top
          setTimeout(() => loader.remove(), 750);
        }, 250);
      } else {
        bar.style.width = count + '%';
        pct.textContent = count + '%';
      }
    }, 38);
  }

  /* ══════════════════════════════════════════════════════════
     12. IMAGE PARALLAX — 3D sliding image effects on scroll
  ══════════════════════════════════════════════════════════ */
  function initImageParallax() {
    if (prefersReduced || isMobile()) return;
    
    const imgWraps = document.querySelectorAll('.work-thumb');
    imgWraps.forEach(wrap => {
      const img = wrap.querySelector('img');
      if (!img) return;
      
      wrap.style.overflow = 'hidden';
      img.style.transform = 'scale(1.1)';
      img.style.transition = 'transform 0.1s ease-out';
      img.style.willChange = 'transform';
      
      window.addEventListener('scroll', () => {
        const rect = wrap.getBoundingClientRect();
        const winH = window.innerHeight;
        if (rect.top < winH && rect.bottom > 0) {
          const scrolledFraction = (rect.top + rect.height/2) / winH;
          const yShift = (scrolledFraction - 0.5) * -32; // max 32px shift
          img.style.transform = `scale(1.1) translateY(${yShift}px)`;
        }
      }, { passive: true });
    });
  }

  /* ══════════════════════════════════════════════════════════
     INIT — run everything
  ══════════════════════════════════════════════════════════ */
  function init() {
    initPreloader();       // Run first - tech loading intro
    fixMobileHero();       // Mobile fixes
    initHeroGlitch();      // 3D text effects
    initFloatingOrbs();    // Ambient depth orbs
    initParticles();       // Gravity particle field
    initScrollReveal();    // Spring scroll reveal
    initCountUp();         // Number animations
    init3DHeroOrbit();     // 3D switchboard
    init3DTilt();          // Card perspective tilt
    initMagneticBtns();    // Magnetic cursor pull
    initCursorGlow();      // Custom cursor
    initImageParallax();   // Image parallax scroll
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
