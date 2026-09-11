/**
 * Animation d'émojis volants (réactions partagées), portée de la maquette.
 * Indépendant de React : crée des éléments éphémères animés via la Web
 * Animations API, puis les retire. Aucun état conservé.
 */
export function shootEmojis(emoji: string): void {
  shoot(() => {
    const el = document.createElement('div');
    el.textContent = emoji;
    el.style.cssText = 'font-size:2.4rem;line-height:1;';
    return el;
  });
}

/** Même envol pour un emoji dessiné à la main (petite image PNG transparente). */
export function shootDrawing(src: string): void {
  shoot(() => {
    const el = document.createElement('img');
    el.src = src;
    el.alt = '';
    el.style.cssText = 'width:56px;height:56px;';
    return el;
  });
}

function shoot(make: () => HTMLElement): void {
  if (typeof document === 'undefined') return;

  const board = document.getElementById('poker-board-area');
  const boardRect = board
    ? board.getBoundingClientRect()
    : { left: window.innerWidth / 2 - 200, top: window.innerHeight / 2 - 150, width: 400, height: 300 };

  // Source : zone basse-droite (proche du panneau de réactions).
  const sourceRect = {
    left: window.innerWidth - 180,
    top: window.innerHeight - 140,
    width: 40,
    height: 40,
  };

  const count = 5 + Math.floor(Math.random() * 6);

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = make();
      el.setAttribute('aria-hidden', 'true');
      el.style.position = 'fixed';
      el.style.pointerEvents = 'none';
      el.style.zIndex = '500';
      el.style.userSelect = 'none';

      const startX = sourceRect.left + sourceRect.width / 2 + (Math.random() - 0.5) * 30;
      const startY = sourceRect.top + sourceRect.height / 2 + (Math.random() - 0.5) * 20;
      const targetX = boardRect.left + 40 + Math.random() * (boardRect.width - 80);
      const targetY = boardRect.top + 40 + Math.random() * (boardRect.height * 0.7);

      const dx = targetX - startX;
      const dy = targetY - startY;
      const dur = (1.6 + Math.random() * 1.2) * 1000;
      const rot = (-30 + Math.random() * 60).toFixed(1);

      el.style.left = `${startX}px`;
      el.style.top = `${startY}px`;
      document.body.appendChild(el);

      el.animate(
        [
          { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${dx * 0.4}px,${dy * 0.4}px) scale(1.3) rotate(${parseFloat(rot) * 0.5}deg)`,
            opacity: 1,
            offset: 0.5,
          },
          { transform: `translate(${dx}px,${dy}px) scale(1.6) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: dur, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' },
      ).onfinish = () => el.remove();
    }, i * 80 + Math.random() * 60);
  }
}

/**
 * Feux d'artifice (consensus parfait), porté de la maquette.
 * Dessine sur un canvas plein écran temporaire.
 */
export function launchFireworks(): void {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:400;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = ['#00d4b4', '#1e2d7d', '#ec4899', '#f59e0b', '#22c55e', '#ffffff'];
  const particles: any[] = [];

  function burst(x: number, y: number) {
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2 + Math.random() * 7;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1, decay: 0.014 + Math.random() * 0.018,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  let n = 0;
  const bi = setInterval(() => {
    burst(120 + Math.random() * (canvas.width - 240), 80 + Math.random() * (canvas.height / 2));
    if (++n >= 5) clearInterval(bi);
  }, 280);

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.13; p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (particles.length > 0 || n < 5) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }
  draw();
}
