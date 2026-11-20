/* ---------- RevaroAI chat widget ---------- */
(function(){
  const launcher = document.getElementById('raLauncher');
  const panel = document.getElementById('raPanel');
  const closeBtn = document.getElementById('raClose');
  const body = document.getElementById('raBody');
  const foot = document.getElementById('raFoot');
  const footLink = document.getElementById('raFootLink');
  let started = false;

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addBot(html) {
    const d = document.createElement('div');
    d.className = 'ra-msg bot';
    d.innerHTML = html;
    body.appendChild(d);
    scrollDown();
  }
  function addUser(text) {
    const d = document.createElement('div');
    d.className = 'ra-msg user';
    d.textContent = text;
    body.appendChild(d);
    scrollDown();
  }
  function clearOptions() {
    body.querySelectorAll('.ra-options, .ra-form').forEach(el => el.remove());
  }
  function showOptions(opts) {
    clearOptions();
    const wrap = document.createElement('div');
    wrap.className = 'ra-options';
    opts.forEach(o => {
      const b = document.createElement('button');
      b.className = 'ra-opt-btn';
      b.textContent = o.label;
      b.addEventListener('click', () => { addUser(o.label); clearOptions(); o.action(); });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    scrollDown();
  }
  function showFoot(href, label) {
    foot.style.display = 'block';
    footLink.textContent = label || 'Book a Free Strategy Call';
    footLink.setAttribute('href', href || '#contact');
  }
  function hideFoot() { foot.style.display = 'none'; }

  function moneyFmt(n) {
    return '$' + Math.round(n).toLocaleString('en-US');
  }

  function startConversation() {
    if (started) return;
    started = true;
    hideFoot();
    addBot('Welcome to Go Revaro. Are you looking to scale your GTM team, reduce sales overhead, or explore AI workflow automation?');
    showRootOptions();
  }

  function showRootOptions() {
    showOptions([
      { label: 'Calculate my AI ROI', action: startRoiFlow },
      { label: 'See AI SDR workflows in action', action: startWorkflowFlow },
      { label: 'Book strategy call', action: startBookingFlow }
    ]);
  }

  function startRoiFlow() {
    addBot('How many SDRs or AEs are you currently looking to hire, and what is your target annual budget per role?');
    clearOptions();
    const form = document.createElement('div');
    form.className = 'ra-form';
    form.innerHTML = `
      <label for="raRoiCount">Number of roles</label>
      <input type="number" id="raRoiCount" min="1" value="2" step="1">
      <label for="raRoiBudget">Target annual budget per role (USD)</label>
      <input type="number" id="raRoiBudget" min="1000" value="85000" step="1000">
      <button type="button" id="raRoiSubmit">Calculate savings</button>
    `;
    body.appendChild(form);
    scrollDown();
    document.getElementById('raRoiSubmit').addEventListener('click', () => {
      const count = Math.max(1, parseInt(document.getElementById('raRoiCount').value, 10) || 1);
      const budget = Math.max(1000, parseFloat(document.getElementById('raRoiBudget').value) || 85000);
      const annualSavings = count * budget * 0.5;
      addUser(`${count} role${count > 1 ? 's' : ''} @ ${moneyFmt(budget)}/yr`);
      form.remove();
      addBot(`With ${count} Go Revaro AI-augmented role${count > 1 ? 's' : ''}, you save approximately <strong>${moneyFmt(annualSavings)} a year</strong> at up to 50% lower cost than a domestic hire, with our target of up to 50% more outbound activity per rep. Treat it as a planning estimate, and we will confirm real numbers on a call.`);
      showOptions([
        { label: 'View candidate profiles', action: () => { addBot('Great, I\'ll point you to real candidate profiles on the next call. Book a 15-minute strategy call below and we\'ll bring shortlisted profiles with us.'); showFoot('#contact', 'Book a 15-min strategy call'); } },
        { label: 'Book a 15-min strategy call', action: startBookingFlow },
        { label: 'Start over', action: () => { clearOptions(); showRootOptions(); } }
      ]);
    });
  }

  function startWorkflowFlow() {
    addBot('Our SDRs use custom AI engines for account research, lead scoring, and personalized outreach. What is your target industry?');
    clearOptions();
    const form = document.createElement('div');
    form.className = 'ra-form';
    form.innerHTML = `
      <label for="raIndustry">Target industry</label>
      <input type="text" id="raIndustry" placeholder="e.g. Healthcare SaaS">
      <button type="button" id="raIndustrySubmit">See how it works</button>
    `;
    body.appendChild(form);
    scrollDown();
    document.getElementById('raIndustrySubmit').addEventListener('click', () => {
      const raw = document.getElementById('raIndustry').value.trim();
      const industry = raw || 'your industry';
      addUser(industry);
      form.remove();
      addBot(`Here's a breakdown of how an AI-equipped SDR researches target <strong>${industry}</strong> accounts faster than manual research, using automated enrichment, signal tracking, and ready-made prompt libraries.`);
      showOptions([
        { label: 'Book a strategy call to see a live demo', action: startBookingFlow },
        { label: 'Start over', action: () => { clearOptions(); showRootOptions(); } }
      ]);
    });
  }

  function startBookingFlow() {
    addBot('Happy to set that up. Use the button below to book a free, no-obligation strategy call and we\'ll walk through your GTM hiring plan and AI workflow buildout together.');
    clearOptions();
    showFoot('#contact', 'Book a Free Strategy Call');
    showOptions([
      { label: 'Start over', action: () => { hideFoot(); clearOptions(); showRootOptions(); } }
    ]);
  }

  launcher.addEventListener('click', () => {
    panel.classList.add('open');
    startConversation();
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));
})();

/* ---------- Header, mobile menu and interactions ---------- */
(function(){
  const menuBtn = document.getElementById('menuBtn');
  const drawer = document.getElementById('mobileDrawer');
  menuBtn.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    drawer.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));

  // Header scroll shadow
  const header = document.getElementById('site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Scroll-reveal
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  }

  // Subtle tilt on the hero org-card, Deel-style
  const heroVisual = document.getElementById('heroVisual');
  const orgCard = document.getElementById('orgCard');
  if (heroVisual && orgCard && !prefersReduced && window.matchMedia('(min-width: 981px)').matches) {
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      orgCard.style.transform = `rotateY(${px * 6}deg) rotateX(${py * -6}deg)`;
    });
    heroVisual.addEventListener('mouseleave', () => {
      orgCard.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }
})();
