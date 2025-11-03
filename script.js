// script.js - Teclado de Miel (puro JS)
// ---------------------------------------------------
// Diseño: genera teclado, maneja interacciones 3D, partículas
// Hecho para funcionar en móvil y escritorio. No dependencias.

// ---------- Utilities ----------
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// ---------- Keyboard layout (compact) ----------
const LAYOUT = [
  ['Esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','Del'],
  ['`','1','2','3','4','5','6','7','8','9','0','-'],
  ['Tab','Q','W','E','R','T','Y','U','I','O','P','['],
  ['Caps','A','S','D','F','G','H','J','K','L',';','\''],
  ['Shift','Z','X','C','V','B','N','M',',','.','/','Shift'],
  ['Ctrl','Win','Alt','Space','Alt','Fn','Menu','Ctrl','','','']
];

// ---------- Create keyboard markup ----------
function createKeyboard(container){
  const board = document.createElement('div');
  board.className = 'board';
  container.appendChild(board);

  // Flatten layout to create keys. Keep blanks as gaps.
  LAYOUT.forEach(row => {
    row.forEach(keyLabel => {
      const key = document.createElement('div');
      key.className = 'key';
      key.dataset.key = keyLabel || '';
      key.setAttribute('role','button');
      key.setAttribute('tabindex','0');
      key.setAttribute('aria-label', keyLabel || 'espacio');
      if(!keyLabel) {
        key.style.visibility = 'hidden';
        key.style.pointerEvents = 'none';
      } else {
        // wide keys for special labels
        if(['Tab','Caps','Shift','Space','Ctrl','Enter','Backspace','Esc'].includes(keyLabel)){
          key.classList.add('wide');
        }
        key.textContent = keyLabel === 'Space' ? '' : keyLabel;
        // small label for space
        if(keyLabel === 'Space'){
          key.style.width = 'calc(var(--key-w) * 6)';
          key.innerHTML = '<span style="opacity:.9">SPACE</span>';
        }
      }
      board.appendChild(key);
    });
  });

  // Slight initial 3D tilt animation
  board.style.transform = 'rotateX(18deg) rotateY(-6deg) translateZ(10px)';
  // store reference
  return board;
}

// ---------- Interaction handlers ----------
function attachKeyHandlers(board){
  // press visual feedback
  board.addEventListener('pointerdown', e => {
    const key = e.target.closest('.key');
    if(!key || !key.dataset.key) return;
    key.classList.add('pressed','active');
    setTimeout(()=> key.classList.remove('pressed'), 200);
    // transient active
    setTimeout(()=> key.classList.remove('active'), 700);
    // brief honey ripple
    rippleAt(key, e.clientX, e.clientY);
  });

  // keyboard events (hardware)
  window.addEventListener('keydown', e => {
    const k = findKeyByLabel(e.key);
    if(k) {
      k.classList.add('pressed','active');
      setTimeout(()=> k.classList.remove('pressed'), 180);
      setTimeout(()=> k.classList.remove('active'), 700);
    }
  });

  window.addEventListener('keyup', e => {
    const k = findKeyByLabel(e.key);
    if(k) k.classList.remove('pressed');
  });

  // accessibility: allow enter/space to "press" a focused key
  document.addEventListener('keydown', e => {
    if((e.key === 'Enter' || e.key === ' ') && document.activeElement?.classList.contains('key')){
      document.activeElement.classList.add('pressed','active');
      setTimeout(()=> document.activeElement.classList.remove('pressed'), 180);
      setTimeout(()=> document.activeElement.classList.remove('active'), 700);
    }
  });
}

function findKeyByLabel(label){
  if(!label) return null;
  // normalize common labels
  const map = {
    ' ': 'Space',
    'Escape': 'Esc',
    'Control': 'Ctrl',
    'AltGraph':'Alt',
    'Meta': 'Win',
    'OS': 'Win',
    'ArrowLeft':'←','ArrowRight':'→','ArrowUp':'↑','ArrowDown':'↓'
  };
  const normalized = map[label] || label.length === 1 ? label.toUpperCase() : (label.charAt(0).toUpperCase() + label.slice(1));
  return document.querySelector(`.key[data-key="${normalized}"]`);
}

// small ripple effect for tactile feel
function rippleAt(key, cx, cy){
  const el = document.createElement('span');
  el.className = 'h-ripple';
  const rect = key.getBoundingClientRect();
  const x = (cx || rect.left + rect.width/2) - rect.left;
  const y = (cy || rect.top + rect.height/2) - rect.top;
  el.style.position = 'absolute';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = el.style.height = '10px';
  el.style.borderRadius = '50%';
  el.style.transform = 'translate(-50%,-50%)';
  el.style.pointerEvents = 'none';
  el.style.background = 'radial-gradient(circle, rgba(255,220,140,0.45), rgba(255,180,60,0.05))';
  el.style.filter = 'blur(10px)';
  el.style.opacity = '0.95';
  el.style.transition = 'all 600ms cubic-bezier(.2,.9,.3,1)';
  key.appendChild(el);
  requestAnimationFrame(()=> {
    el.style.width = '120px';
    el.style.height = '120px';
    el.style.opacity = '0';
  });
  setTimeout(()=> el.remove(), 700);
}

// ---------- Background: particle canvas (honey droplets) ----------
function initParticles(canvas){
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = w * DPR;
  canvas.height = h * DPR;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(DPR, DPR);

  const particles = [];
  const COUNT = Math.round((w*h) / 70000); // density
  for(let i=0;i<COUNT;i++) particles.push(createParticle(w,h));

  function createParticle(w,h){
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      r: 6 + Math.random()*18,
      vx: (Math.random()-0.5) * 0.2,
      vy: 0.1 + Math.random()*0.6,
      life: 200 + Math.random()*900,
      wob: Math.random()*0.02 + 0.005,
      hue: 30 + Math.random()*30
    };
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // subtle vignette
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    particles.forEach(p => {
      p.x += p.vx + Math.sin(perf.now()*p.wob + p.x*0.001)*0.2;
      p.y += p.vy;
      p.life--;
      if(p.y - p.r > h || p.life < 0){
        Object.assign(p, createParticle(w, -40));
        p.y = -Math.random()*160;
      }
      // draw droplet (shiny)
      const g = ctx.createRadialGradient(p.x - p.r*0.3, p.y - p.r*0.4, p.r*0.06, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(255,255,220,0.95)`);
      g.addColorStop(0.25, `hsla(${p.hue}, 90%, 60%, 0.85)`);
      g.addColorStop(1, `hsla(${p.hue}, 95%, 45%, 0.12)`);
      ctx.beginPath();
      ctx.fillStyle = g;
      ctx.ellipse(p.x, p.y, p.r*0.9, p.r, 0, 0, Math.PI*2);
      ctx.fill();

      // shine
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.ellipse(p.x - p.r*0.25, p.y - p.r*0.45, p.r*0.35, p.r*0.22, 0, 0, Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  // responsive
  window.addEventListener('resize', ()=> {
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(DPR, DPR);
  });

  draw();
}

// ---------- Demo: automatic typing / highlight sequence ----------
function demoSequence(){
  const keys = Array.from(document.querySelectorAll('.key')).filter(k => k.style.visibility !== 'hidden');
  const sequence = [
    'T','E','C','L','A','D','O',' ','D','E',' ','M','I','E','L'
  ];
  let i=0;
  function step(){
    const label = sequence[i % sequence.length];
    // find key ' ' => Space
    const keyEl = label === ' ' ? document.querySelector('.key[data-key="Space"]') : document.querySelector(`.key[data-key="${label}"]`);
    if(keyEl){
      keyEl.classList.add('active','pressed');
      rippleAt(keyEl, keyEl.getBoundingClientRect().left + keyEl.offsetWidth/2, keyEl.getBoundingClientRect().top + keyEl.offsetHeight/2);
      setTimeout(()=> keyEl.classList.remove('pressed'), 180);
      setTimeout(()=> keyEl.classList.remove('active'), 700);
    }
    i++;
    // keep demo alive for 18 seconds total-ish
    if(i < 45) setTimeout(step, 420 + Math.random()*160);
  }
  step();
}

// ---------- Micro parallax: board follows pointer slightly ----------
function attachParallax(board){
  let rect = board.getBoundingClientRect();
  function update(e){
    const cx = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || (innerWidth/2);
    const cy = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || (innerHeight/2);
    const dx = (cx - (rect.left + rect.width/2)) / rect.width;
    const dy = (cy - (rect.top + rect.height/2)) / rect.height;
    const rx = 14 * dy;
    const ry = -18 * dx;
    const tz = 18 + Math.abs(dx)*6;
    board.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
  }
  window.addEventListener('pointermove', update, {passive:true});
  window.addEventListener('touchmove', update, {passive:true});
  window.addEventListener('resize', ()=> rect = board.getBoundingClientRect());
}

// ---------- Init everything on DOM ready ----------
document.addEventListener('DOMContentLoaded', ()=> {
  const container = $('#keyboard');
  const board = createKeyboard(container);
  attachKeyHandlers(board);
  attachParallax(board);

  const canvas = $('#bgCanvas');
  initParticles(canvas);

  // demo button
  const demoBtn = $('#demoBtn');
  demoBtn.addEventListener('click', (e)=>{
    demoBtn.setAttribute('aria-pressed','true');
    demoBtn.classList.add('active');
    demoSequence();
    setTimeout(()=> {
      demoBtn.setAttribute('aria-pressed','false');
      demoBtn.classList.remove('active');
    }, 17000);
  });

  // keyboard spotlight: small periodic pulses to attract attention (keeps >15s retention)
  setInterval(()=> {
    const keys = Array.from(document.querySelectorAll('.key')).filter(k => k.style.visibility !== 'hidden');
    const r1 = keys[Math.floor(Math.random()*keys.length)];
    r1.classList.add('active');
    setTimeout(()=> r1.classList.remove('active'), 900);
  }, 2600);
});