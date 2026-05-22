/* ── SEARCH ─────────────────────────────────────────── */
const navSearch = document.getElementById('navSearch');
const allCards  = document.querySelectorAll('.game-card');

navSearch.addEventListener('input', () => {
  const q = navSearch.value.toLowerCase().trim();

  allCards.forEach(card => {
    const img   = card.querySelector('img');
    const label = card.querySelector('.game-label');
    const name  = (img?.alt || '') + ' ' + (label?.textContent || '');

    const match = !q || name.toLowerCase().includes(q);
    card.style.display = match ? '' : 'none';
  });

  // hide/show section headers when empty after filtering
  document.querySelectorAll('.section-header').forEach(header => {
    const grid = header.nextElementSibling;
    if (!grid) return;
    const visible = [...grid.querySelectorAll('.game-card')]
      .some(c => c.style.display !== 'none');
    header.style.display = (q && !visible) ? 'none' : '';
    grid.style.display    = (q && !visible) ? 'none' : '';
  });
});

/* ── ANIMATED BACKGROUND CANVAS ─────────────────────── */
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#00e5ff', '#b14aff', '#ff3d6b'];

  function rand(a, b) { return a + Math.random() * (b - a); }

  for (let i = 0; i < 60; i++) {
    particles.push({
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      r: rand(0.5, 2.5),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.35, -0.05),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: rand(0.3, 0.9),
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;

      if (p.y < -10)       p.y = H + 10;
      if (p.x < -10)       p.x = W + 10;
      if (p.x > W + 10)    p.x = -10;
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

/* ── CARD ENTRANCE ANIMATION ─────────────────────────── */
(function () {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.game-card').forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = `opacity 0.4s ${(i % 10) * 35}ms ease, transform 0.4s ${(i % 10) * 35}ms ease, box-shadow 0.25s, border-color 0.25s`;
    observer.observe(card);
  });
})();
