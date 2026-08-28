/**
 * ETechProvider — AI Booking Assistant
 * Conversational booking widget that guides users through
 * selecting a service, budget, timeline and capturing
 * their contact details.
 */

(function () {
  'use strict';

  /* ── CONVERSATION FLOW ───────────────────────────────────────── */
  const FLOW = [
    {
      id: 'welcome',
      bot: "👋 Hi! I'm <strong>Aria</strong>, ETechProvider's AI assistant.<br>I'll help you book a free consultation in under 2 minutes.<br><br>What's your name?",
      input: { type: 'text', placeholder: 'Your full name…', key: 'name' },
    },
    {
      id: 'service',
      bot: (d) => `Great to meet you, <strong>${d.name}</strong>! 🎉<br>Which service are you interested in?`,
      chips: [
        { label: '🌐 Web Development', value: 'Web Development' },
        { label: '📈 SEO & Search', value: 'SEO & Search Marketing' },
        { label: '📢 Paid Advertising', value: 'Paid Advertising' },
        { label: '🎨 UI/UX Design', value: 'UI/UX Design' },
        { label: '☁️ Cloud & Infrastructure', value: 'Cloud & Infrastructure' },
        { label: '📦 E-Commerce', value: 'E-Commerce Development' },
        { label: '🤖 AI Integration', value: 'AI Integration' },
        { label: '📊 Full Digital Package', value: 'Full Digital Package' },
      ],
      key: 'service',
    },
    {
      id: 'budget',
      bot: (d) => `Nice choice! <strong>${d.service}</strong> is one of our most popular services. 💼<br><br>What's your approximate budget?`,
      chips: [
        { label: '£500 – £1,500', value: '£500–£1,500' },
        { label: '£1,500 – £5,000', value: '£1,500–£5,000' },
        { label: '£5,000 – £15,000', value: '£5,000–£15,000' },
        { label: '£15,000+', value: '£15,000+' },
        { label: 'Not sure yet', value: 'Flexible / TBD' },
      ],
      key: 'budget',
    },
    {
      id: 'timeline',
      bot: () => `Understood! When would you like to get started?`,
      chips: [
        { label: '🚀 ASAP', value: 'As soon as possible' },
        { label: '📅 Within 1 month', value: 'Within 1 month' },
        { label: '🗓️ 1–3 months', value: '1–3 months' },
        { label: '🔭 3+ months', value: '3+ months' },
        { label: '💭 Just exploring', value: 'Just exploring for now' },
      ],
      key: 'timeline',
    },
    {
      id: 'email',
      bot: () => `Almost done! What's the best email to send your consultation details to?`,
      input: { type: 'email', placeholder: 'your@email.com', key: 'email' },
    },
    {
      id: 'phone',
      bot: () => `And a phone number? (optional — we'll only call if you prefer)`,
      input: { type: 'tel', placeholder: '+44 7000 000000  (or press ↩ to skip)', key: 'phone', optional: true },
    },
    {
      id: 'notes',
      bot: () => `Anything else you'd like us to know about your project? (optional)`,
      input: { type: 'textarea', placeholder: 'Brief description, goals, references…', key: 'notes', optional: true },
    },
    {
      id: 'confirm',
      bot: null, // rendered dynamically as summary card
      summary: true,
    },
  ];

  /* ── STATE ───────────────────────────────────────────────────── */
  let step = 0;
  const data = {};
  let open = false;
  let submitted = false;

  /* ── HELPERS ─────────────────────────────────────────────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  /* ── BUILD DOM ───────────────────────────────────────────────── */
  function buildWidget() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
      /* ── Bot Widget ── */
      #etp-bot-fab{
        position:fixed; bottom:28px; right:28px; z-index:9000;
        width:60px; height:60px; border-radius:50%;
        background:linear-gradient(135deg,#fff 0%,#c8c8c8 100%);
        border:none; cursor:pointer; box-shadow:0 8px 30px rgba(0,0,0,.55);
        display:flex; align-items:center; justify-content:center;
        transition:transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
        animation: botPulse 3s ease-in-out infinite;
      }
      #etp-bot-fab:hover{ transform:scale(1.12); box-shadow:0 12px 40px rgba(0,0,0,.7); }
      #etp-bot-fab svg{ width:28px; height:28px; }
      @keyframes botPulse{
        0%,100%{box-shadow:0 8px 30px rgba(0,0,0,.55), 0 0 0 0 rgba(255,255,255,.35);}
        50%{box-shadow:0 8px 30px rgba(0,0,0,.55), 0 0 0 10px rgba(255,255,255,0);}
      }

      #etp-bot-badge{
        position:absolute; top:-4px; right:-4px;
        width:18px; height:18px; border-radius:50%;
        background:#ff4d4d; border:2px solid #000;
        font-size:10px; font-weight:700; color:#fff;
        display:flex; align-items:center; justify-content:center;
        animation: badgeBounce 1s ease-in-out 2s 3;
      }
      @keyframes badgeBounce{0%,100%{transform:scale(1);}50%{transform:scale(1.3);}}

      #etp-bot-panel{
        position:fixed; bottom:100px; right:28px; z-index:8999;
        width:380px; max-width:calc(100vw - 40px);
        background:rgba(10,10,10,0.96);
        backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px);
        border:1px solid rgba(255,255,255,0.1);
        border-radius:20px;
        box-shadow:0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04);
        display:flex; flex-direction:column;
        overflow:hidden;
        transform:translateY(20px) scale(0.97);
        opacity:0;
        pointer-events:none;
        transition:transform .3s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
        max-height:620px;
      }
      #etp-bot-panel.open{
        transform:translateY(0) scale(1);
        opacity:1; pointer-events:all;
      }

      /* Header */
      .etp-bot-header{
        display:flex; align-items:center; gap:12px;
        padding:16px 20px;
        background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
        border-bottom:1px solid rgba(255,255,255,.07);
        flex-shrink:0;
      }
      .etp-bot-avatar{
        width:40px; height:40px; border-radius:50%;
        background:linear-gradient(135deg,#fff,#888);
        display:flex; align-items:center; justify-content:center;
        font-size:18px; flex-shrink:0;
        box-shadow:0 0 0 3px rgba(255,255,255,.1);
      }
      .etp-bot-name{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:.95rem; color:#fff; }
      .etp-bot-status{ font-size:.72rem; color:#4ade80; display:flex; align-items:center; gap:5px; }
      .etp-bot-status::before{ content:''; width:6px; height:6px; border-radius:50%; background:#4ade80;
        box-shadow:0 0 6px #4ade80; display:inline-block; }
      .etp-bot-close{
        margin-left:auto; background:none; border:none; color:rgba(255,255,255,.45);
        font-size:1.2rem; cursor:pointer; padding:4px 8px; border-radius:6px;
        transition:color .2s, background .2s;
      }
      .etp-bot-close:hover{ color:#fff; background:rgba(255,255,255,.08); }

      /* Progress bar */
      .etp-bot-progress{
        height:3px; background:rgba(255,255,255,.07); flex-shrink:0;
      }
      .etp-bot-progress-fill{
        height:100%; background:linear-gradient(90deg,#fff,rgba(255,255,255,.5));
        transition:width .5s cubic-bezier(.4,0,.2,1);
      }

      /* Messages */
      .etp-bot-messages{
        flex:1; overflow-y:auto; padding:20px 16px 12px;
        display:flex; flex-direction:column; gap:10px;
        scroll-behavior:smooth;
      }
      .etp-bot-messages::-webkit-scrollbar{ width:4px; }
      .etp-bot-messages::-webkit-scrollbar-track{ background:transparent; }
      .etp-bot-messages::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.12); border-radius:4px; }

      .etp-msg{
        max-width:88%; padding:12px 15px; border-radius:14px;
        font-size:.875rem; line-height:1.55;
        animation:msgIn .3s cubic-bezier(.34,1.56,.64,1) forwards;
        opacity:0;
      }
      @keyframes msgIn{
        from{opacity:0; transform:translateY(8px) scale(.97);}
        to{opacity:1; transform:translateY(0) scale(1);}
      }
      .etp-msg.bot{
        background:rgba(255,255,255,.07);
        border:1px solid rgba(255,255,255,.09);
        color:#e0e0e0; align-self:flex-start; border-radius:4px 14px 14px 14px;
      }
      .etp-msg.user{
        background:#fff; color:#000; font-weight:500;
        align-self:flex-end; border-radius:14px 4px 14px 14px;
        box-shadow:0 4px 14px rgba(255,255,255,.15);
      }

      /* Typing indicator */
      .etp-typing{
        display:flex; gap:5px; align-items:center; padding:12px 14px;
        background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.09);
        border-radius:4px 14px 14px 14px; width:fit-content;
        animation:msgIn .3s forwards;
      }
      .etp-typing span{
        width:7px; height:7px; border-radius:50%; background:rgba(255,255,255,.5);
        animation:typingDot 1.2s ease-in-out infinite;
      }
      .etp-typing span:nth-child(2){ animation-delay:.2s; }
      .etp-typing span:nth-child(3){ animation-delay:.4s; }
      @keyframes typingDot{0%,100%{transform:translateY(0); opacity:.4;}50%{transform:translateY(-4px); opacity:1;}}

      /* Quick-reply chips */
      .etp-chips{
        display:flex; flex-wrap:wrap; gap:8px; padding:6px 16px 12px;
        flex-shrink:0;
      }
      .etp-chip{
        padding:8px 14px; background:rgba(255,255,255,.07);
        border:1px solid rgba(255,255,255,.14); border-radius:20px;
        font-size:.8rem; color:#d4d4d4; cursor:pointer; font-family:'Inter',sans-serif;
        transition:background .2s, border-color .2s, color .2s, transform .15s;
        white-space:nowrap;
      }
      .etp-chip:hover{
        background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.35);
        color:#fff; transform:translateY(-1px);
      }
      .etp-chip.selected{
        background:#fff; color:#000; border-color:#fff; font-weight:600;
      }

      /* Input footer */
      .etp-bot-input-row{
        display:flex; gap:8px; padding:12px 14px;
        border-top:1px solid rgba(255,255,255,.07);
        flex-shrink:0; align-items:flex-end;
      }
      .etp-bot-input-row textarea,
      .etp-bot-input-row input{
        flex:1; background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.12);
        border-radius:10px; padding:10px 14px;
        color:#fff; font-family:'Inter',sans-serif; font-size:.875rem;
        resize:none; outline:none; line-height:1.4; max-height:100px;
        transition:border-color .2s, box-shadow .2s;
      }
      .etp-bot-input-row textarea:focus,
      .etp-bot-input-row input:focus{
        border-color:rgba(255,255,255,.35);
        box-shadow:0 0 0 3px rgba(255,255,255,.05);
      }
      .etp-bot-send{
        width:40px; height:40px; border-radius:10px; border:none;
        background:#fff; color:#000; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        flex-shrink:0; transition:transform .15s, box-shadow .2s;
      }
      .etp-bot-send:hover{ transform:scale(1.06); box-shadow:0 4px 14px rgba(255,255,255,.25); }
      .etp-bot-send svg{ width:18px; height:18px; }

      /* Summary card */
      .etp-summary{
        margin:8px 0; background:rgba(255,255,255,.05);
        border:1px solid rgba(255,255,255,.1);
        border-radius:12px; padding:16px; font-size:.82rem;
      }
      .etp-summary-row{
        display:flex; justify-content:space-between; padding:6px 0;
        border-bottom:1px solid rgba(255,255,255,.06); gap:8px;
      }
      .etp-summary-row:last-child{ border-bottom:none; }
      .etp-summary-row .k{ color:rgba(255,255,255,.45); font-size:.75rem; text-transform:uppercase; letter-spacing:.04em; }
      .etp-summary-row .v{ color:#fff; font-weight:500; text-align:right; }

      .etp-confirm-btn{
        width:100%; margin-top:10px; padding:12px; border-radius:10px;
        background:linear-gradient(135deg,#fff,#d0d0d0); color:#000;
        font-weight:700; font-size:.9rem; border:none; cursor:pointer;
        font-family:'Space Grotesk',sans-serif; letter-spacing:.01em;
        transition:transform .15s, box-shadow .2s;
      }
      .etp-confirm-btn:hover{ transform:translateY(-1px); box-shadow:0 6px 20px rgba(255,255,255,.2); }

      .etp-success{
        text-align:center; padding:24px 16px; animation:msgIn .4s forwards;
      }
      .etp-success .icon{ font-size:2.8rem; margin-bottom:12px; }
      .etp-success h4{ font-family:'Space Grotesk',sans-serif; font-size:1.1rem; color:#fff; margin:0 0 8px; }
      .etp-success p{ color:rgba(255,255,255,.55); font-size:.83rem; line-height:1.55; margin:0; }

      /* Responsive */
      @media(max-width:460px){
        #etp-bot-panel{ right:12px; bottom:90px; width:calc(100vw - 24px); }
        #etp-bot-fab{ right:16px; bottom:16px; }
      }
    `;
    document.head.appendChild(style);

    /* FAB button */
    const fab = el('button', '', `
      <svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <circle cx="9" cy="10" r=".5" fill="#000"/>
        <circle cx="12" cy="10" r=".5" fill="#000"/>
        <circle cx="15" cy="10" r=".5" fill="#000"/>
      </svg>
      <span id="etp-bot-badge">1</span>
    `);
    fab.id = 'etp-bot-fab';
    fab.setAttribute('aria-label', 'Open booking assistant');
    fab.setAttribute('title', 'Chat with Aria — Book a consultation');

    /* Panel */
    const panel = el('div', '');
    panel.id = 'etp-bot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'AI Booking Assistant');
    panel.innerHTML = `
      <div class="etp-bot-header">
        <div class="etp-bot-avatar">🤖</div>
        <div>
          <div class="etp-bot-name">Aria · ETechProvider</div>
          <div class="etp-bot-status">Online · Typically replies instantly</div>
        </div>
        <button class="etp-bot-close" id="etpBotClose" aria-label="Close">✕</button>
      </div>
      <div class="etp-bot-progress"><div class="etp-bot-progress-fill" id="etpProgress" style="width:0%"></div></div>
      <div class="etp-bot-messages" id="etpMessages"></div>
      <div class="etp-chips" id="etpChips"></div>
      <div class="etp-bot-input-row" id="etpInputRow" style="display:none">
        <input id="etpInput" type="text" autocomplete="off" />
        <button class="etp-bot-send" id="etpSend" aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    /* Wire events */
    fab.addEventListener('click', togglePanel);
    $('#etpBotClose', panel).addEventListener('click', () => togglePanel(false));

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (open && !panel.contains(e.target) && e.target !== fab) {
        togglePanel(false);
      }
    });

    return { fab, panel };
  }

  /* ── TOGGLE PANEL ────────────────────────────────────────────── */
  function togglePanel(forceState) {
    open = typeof forceState === 'boolean' ? forceState : !open;
    const panel = document.getElementById('etp-bot-panel');
    panel.classList.toggle('open', open);

    // Hide badge on first open
    const badge = document.getElementById('etp-bot-badge');
    if (open && badge) badge.style.display = 'none';

    // Start conversation if first open
    if (open && step === 0 && !submitted) {
      setTimeout(() => renderStep(), 400);
    }
  }

  /* ── PROGRESS ────────────────────────────────────────────────── */
  function updateProgress() {
    const pct = Math.round((step / (FLOW.length - 1)) * 100);
    const bar = document.getElementById('etpProgress');
    if (bar) bar.style.width = pct + '%';
  }

  /* ── APPEND MESSAGE ──────────────────────────────────────────── */
  function appendMsg(html, type = 'bot') {
    const msgs = document.getElementById('etpMessages');
    const m = el('div', `etp-msg ${type}`, html);
    msgs.appendChild(m);
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── TYPING THEN MESSAGE ─────────────────────────────────────── */
  function botSay(html, delay = 600) {
    const msgs = document.getElementById('etpMessages');
    const typing = el('div', 'etp-typing', '<span></span><span></span><span></span>');
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    return new Promise((resolve) => {
      setTimeout(() => {
        typing.remove();
        appendMsg(html, 'bot');
        resolve();
      }, delay);
    });
  }

  /* ── RENDER CHIPS ────────────────────────────────────────────── */
  function renderChips(chips, key) {
    const container = document.getElementById('etpChips');
    container.innerHTML = '';
    chips.forEach((c) => {
      const chip = el('button', 'etp-chip', c.label);
      chip.addEventListener('click', () => {
        // Deselect all, select clicked
        container.querySelectorAll('.etp-chip').forEach(ch => ch.classList.remove('selected'));
        chip.classList.add('selected');
        data[key] = c.value;
        appendMsg(c.label, 'user');
        container.innerHTML = '';
        step++;
        setTimeout(renderStep, 500);
      });
      container.appendChild(chip);
    });
  }

  /* ── RENDER INPUT ────────────────────────────────────────────── */
  function renderInput(cfg) {
    const row = document.getElementById('etpInputRow');
    const inputEl = document.getElementById('etpInput');
    const sendBtn = document.getElementById('etpSend');

    row.style.display = 'flex';

    if (cfg.type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.id = 'etpInput';
      ta.placeholder = cfg.placeholder || '';
      ta.rows = 2;
      inputEl.replaceWith(ta);
    } else {
      const inp = document.createElement('input');
      inp.id = 'etpInput';
      inp.type = cfg.type || 'text';
      inp.placeholder = cfg.placeholder || '';
      inp.autocomplete = cfg.type === 'email' ? 'email' : 'off';
      inputEl.replaceWith(inp);
    }

    const fresh = document.getElementById('etpInput');
    fresh.focus();

    const submit = () => {
      const val = fresh.value.trim();
      if (!val && !cfg.optional) { fresh.classList.add('etp-shake'); setTimeout(() => fresh.classList.remove('etp-shake'), 400); return; }
      if (cfg.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        fresh.style.borderColor = '#f87171';
        setTimeout(() => fresh.style.borderColor = '', 1000);
        return;
      }
      const display = val || '(skipped)';
      data[cfg.key] = val;
      appendMsg(display, 'user');
      row.style.display = 'none';
      step++;
      setTimeout(renderStep, 500);
    };

    fresh.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    sendBtn.onclick = submit;
  }

  /* ── RENDER SUMMARY ──────────────────────────────────────────── */
  function renderSummary() {
    const msgs = document.getElementById('etpMessages');
    const chips = document.getElementById('etpChips');
    const inputRow = document.getElementById('etpInputRow');
    chips.innerHTML = '';
    inputRow.style.display = 'none';

    const rows = [
      { k: 'Name', v: data.name },
      { k: 'Service', v: data.service },
      { k: 'Budget', v: data.budget },
      { k: 'Timeline', v: data.timeline },
      { k: 'Email', v: data.email },
      data.phone && { k: 'Phone', v: data.phone },
      data.notes && { k: 'Notes', v: data.notes },
    ].filter(Boolean);

    const card = el('div', 'etp-msg bot', '');
    const sum = el('div', 'etp-summary');
    sum.innerHTML = rows.map(r => `
      <div class="etp-summary-row">
        <span class="k">${r.k}</span>
        <span class="v">${r.v}</span>
      </div>
    `).join('');

    const confirmBtn = el('button', 'etp-confirm-btn', '✅ Confirm & Book Free Consultation');
    confirmBtn.addEventListener('click', submitBooking);
    sum.appendChild(confirmBtn);
    card.appendChild(sum);
    msgs.appendChild(card);
    msgs.scrollTop = msgs.scrollHeight;
  }

  /* ── RENDER STEP ─────────────────────────────────────────────── */
  async function renderStep() {
    const chips = document.getElementById('etpChips');
    const inputRow = document.getElementById('etpInputRow');
    chips.innerHTML = '';
    inputRow.style.display = 'none';
    updateProgress();

    if (step >= FLOW.length) return;

    const s = FLOW[step];

    // Bot message
    if (s.summary) {
      await botSay("Here's a summary of your booking request. Looks good? 👇", 500);
      renderSummary();
      return;
    }

    const msg = typeof s.bot === 'function' ? s.bot(data) : s.bot;
    await botSay(msg, step === 0 ? 800 : 600);

    if (s.chips) {
      renderChips(s.chips, s.key);
    } else if (s.input) {
      renderInput(s.input);
    }
  }

  /* ── SUBMIT ──────────────────────────────────────────────────── */
  async function submitBooking() {
    submitted = true;
    const msgs = document.getElementById('etpMessages');
    const chips = document.getElementById('etpChips');
    const inputRow = document.getElementById('etpInputRow');
    chips.innerHTML = '';
    inputRow.style.display = 'none';

    // Build mailto as fallback (always works, no backend needed)
    const subject = encodeURIComponent(`[ETechProvider] New Consultation: ${data.service}`);
    const body = encodeURIComponent(
      `New Booking Request via AI Assistant\n\n` +
      `Name: ${data.name}\n` +
      `Service: ${data.service}\n` +
      `Budget: ${data.budget}\n` +
      `Timeline: ${data.timeline}\n` +
      `Email: ${data.email}\n` +
      `Phone: ${data.phone || 'Not provided'}\n` +
      `Notes: ${data.notes || 'None'}\n`
    );

    // Attempt EmailJS if configured
    const cfg = window.ETP_BOT_CONFIG || {};
    let sent = false;

    if (cfg.emailjsServiceId && cfg.emailjsTemplateId && cfg.emailjsPublicKey && window.emailjs) {
      try {
        await window.emailjs.send(cfg.emailjsServiceId, cfg.emailjsTemplateId, {
          from_name: data.name,
          service: data.service,
          budget: data.budget,
          timeline: data.timeline,
          reply_to: data.email,
          phone: data.phone || 'Not provided',
          notes: data.notes || 'None',
        }, cfg.emailjsPublicKey);
        sent = true;
      } catch (err) {
        console.warn('[ETP Bot] EmailJS failed, falling back to mailto.', err);
      }
    }

    // Show typing then success
    const typing = el('div', 'etp-typing', '<span></span><span></span><span></span>');
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    await new Promise(r => setTimeout(r, 1200));
    typing.remove();

    const success = el('div', 'etp-success');
    success.innerHTML = `
      <div class="icon">🎉</div>
      <h4>You're booked in!</h4>
      <p>Thanks, <strong>${data.name}</strong>! Our team will reach out to <strong>${data.email}</strong> within 24 hours to confirm your free consultation for <strong>${data.service}</strong>.</p>
    `;
    msgs.appendChild(success);
    msgs.scrollTop = msgs.scrollHeight;

    // Fallback: open mailto if EmailJS not configured
    if (!sent) {
      setTimeout(() => {
        window.location.href = `mailto:hello@etechprovider.co.uk?subject=${subject}&body=${body}`;
      }, 1800);
    }

    // Update progress to 100%
    const bar = document.getElementById('etpProgress');
    if (bar) bar.style.width = '100%';
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function init() {
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
