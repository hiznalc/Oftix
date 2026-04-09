/* ================================================================
   OFTIX NETWORK INC. — script.js v3
   Enhanced: fiber-optic BG, admin loading screen, scroll transitions,
             locked client modules, consistent logo, better motto
   ================================================================ */
'use strict';

/* ── App State ───────────────────────────────────────────────── */
const APP = {
  security_pin: '123',
  branches: [
    { id:1, name:'Oftix Quezon City', gcash:'09171234567', address:'Quezon City, Metro Manila',   clients:24, status:'active' },
    { id:2, name:'Oftix Manila',      gcash:'09281234567', address:'Manila City, Metro Manila',   clients:18, status:'active' },
    { id:3, name:'Oftix Makati',      gcash:'09391234567', address:'Makati City, Metro Manila',   clients:31, status:'active' },
    { id:4, name:'Oftix Pasig',       gcash:'09501234567', address:'Pasig City, Metro Manila',    clients:15, status:'active' },
  ],
  branch_admins: [
    { id:1, username:'admin_qc',  password:'admin123', branch_id:1, name:'Juan dela Cruz',  status:'active' },
    { id:2, username:'admin_mnl', password:'admin123', branch_id:2, name:'Maria Santos',    status:'active' },
    { id:3, username:'admin_mak', password:'admin123', branch_id:3, name:'Pedro Reyes',     status:'active' },
    { id:4, username:'admin_psg', password:'admin123', branch_id:4, name:'Ana Gonzales',    status:'active' },
  ],
  clients: [
    { id:1, name:'Carlo Mendoza', username:'carlo', email:'carlo@email.com', contact:'09171111111', address:'QC',     branch_id:1, plan:'Fiber 50',  status:'active', payment_status:'paid',    install_date:'2025-01-15', due_date:'2026-04-05' },
    { id:2, name:'Liza Reyes',    username:'liza',  email:'liza@email.com',  contact:'09282222222', address:'Manila', branch_id:2, plan:'Fiber 100', status:'active', payment_status:'pending', install_date:'2025-02-10', due_date:'2026-04-10' },
    { id:3, name:'Ryan Cruz',     username:'ryan',  email:'ryan@email.com',  contact:'09393333333', address:'Makati', branch_id:3, plan:'Fiber 25',  status:'pending',payment_status:'unpaid',  install_date:null,         due_date:null },
    { id:4, name:'Sofia Tan',     username:'sofia', email:'sofia@email.com', contact:'09504444444', address:'Pasig',  branch_id:4, plan:'Fiber 200', status:'active', payment_status:'paid',    install_date:'2025-03-05', due_date:'2026-04-05' },
  ],
  applications: [
    { id:1, name:'Jerome Bautista', contact:'09171231234', address:'QC',     branch_id:1, plan:'Fiber 50',  status:'pending',   date:'2025-03-10' },
    { id:2, name:'Gina Lopez',      contact:'09281231234', address:'Manila', branch_id:2, plan:'Fiber 100', status:'approved',  date:'2025-03-08' },
    { id:3, name:'Mark Villanueva', contact:'09391231234', address:'Makati', branch_id:3, plan:'Fiber 25',  status:'scheduled', date:'2025-03-07' },
  ],
  payments: [
    { id:1, client:'Carlo Mendoza', branch_id:1, amount:1499, method:'GCash',   date:'2025-03-01', status:'verified', receipt:true  },
    { id:2, client:'Sofia Tan',     branch_id:4, amount:2999, method:'GCash',   date:'2025-03-05', status:'verified', receipt:true  },
    { id:3, client:'Liza Reyes',    branch_id:2, amount:1999, method:'Walk-in', date:'2025-03-12', status:'pending',  receipt:false },
  ],
  tickets: [
    { id:1, client:'Carlo Mendoza', branch_id:1, subject:'Slow connection', message:'Internet is very slow in the afternoon.', status:'open',     date:'2025-03-15', response:null },
    { id:2, client:'Sofia Tan',     branch_id:4, subject:'No internet',     message:'Connection dropped since morning.',        status:'resolved', date:'2025-03-10', response:'Issue resolved. Router was restarted remotely.' },
  ],
  plans: [
    { id:1, name:'Fiber 25',  speed:'25 Mbps',  price:999,  desc:'Light browsing & streaming' },
    { id:2, name:'Fiber 50',  speed:'50 Mbps',  price:1499, desc:'Families & HD streaming' },
    { id:3, name:'Fiber 100', speed:'100 Mbps', price:1999, desc:'Work from home & heavy users' },
    { id:4, name:'Fiber 200', speed:'200 Mbps', price:2999, desc:'Power users & online gaming' },
  ],
  current_user:   null,
  client_applied: false,
  client_data:    null,
};

/* ── State Persistence ───────────────────────────────────────── */
function saveState(){ sessionStorage.setItem('oftix_v3', JSON.stringify(APP)); }
function loadState(){
  const s = sessionStorage.getItem('oftix_v3');
  if(s){ try{ Object.assign(APP, JSON.parse(s)); }catch(e){} }
}

/* ── Helpers ─────────────────────────────────────────────────── */
function go(page){ window.location.href = page; }
function el(id){ return document.getElementById(id); }
function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return document.querySelectorAll(sel); }
function setTxt(id, v){ const e=el(id); if(e) e.textContent=v; }
function statusColor(s){ return {pending:'warning',approved:'info',scheduled:'warning',installed:'success',active:'success',rejected:'danger'}[s]||'muted'; }

/* ── Toast ────────────────────────────────────────────────────── */
function toast(msg, type='info', dur=3500, dark=true){
  let c=el('toast-container');
  if(!c){ c=document.createElement('div'); c.id='toast-container'; document.body.appendChild(c); }
  const icons={info:'💡',success:'✅',warning:'⚠️',danger:'❌'};
  const t=document.createElement('div');
  t.className=`toast ${dark?'toast-dk':'toast-lt'}`;
  t.innerHTML=`<span style="font-size:1.1rem">${icons[type]||'💡'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.classList.add('hide'); setTimeout(()=>t.remove(),400); }, dur);
}

/* ── Modal ────────────────────────────────────────────────────── */
function openModal(id){ const m=el(id); if(m){m.style.display='flex';document.body.style.overflow='hidden';} }
function closeModal(id){ const m=el(id); if(m){m.style.display='none';document.body.style.overflow='';} }
document.addEventListener('click', e=>{
  if(e.target.classList.contains('modal-overlay')){
    e.target.style.display='none'; document.body.style.overflow='';
  }
});

/* ================================================================
   FIBER-OPTIC CANVAS BACKGROUND
   Renders: dark base, moving curved fiber cables with glow tips,
   floating nodes, radial ambient glows
   ================================================================ */
function initBG(){
  const canvas = el('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Fiber cable constructor ───────────────────────────────────
  function mkFiber(){
    const fromLeft = Math.random() > 0.45;
    const palette = [
      ['0,85,229','0,200,240'],
      ['100,60,255','0,180,255'],
      ['0,60,200','0,220,255'],
      ['80,40,200','0,200,220'],
    ];
    const [c1, c2] = palette[Math.floor(Math.random()*palette.length)];
    const speed = 0.25 + Math.random() * 0.7;
    const len   = 180 + Math.random() * 260;
    const curve = (Math.random() - 0.5) * 120; // bezier bend amount

    if(fromLeft){
      return {
        x: -len - 50, y: Math.random() * H,
        dx: speed, dy: (Math.random()-0.5)*0.3,
        len, curve, c1, c2,
        w: 0.6 + Math.random()*1.4,
        alpha: 0.25 + Math.random()*0.45,
        pulse: Math.random()*Math.PI*2,
        fromLeft: true
      };
    } else {
      return {
        x: Math.random() * W, y: -len - 50,
        dx: (Math.random()-0.5)*0.3, dy: speed,
        len, curve, c1, c2,
        w: 0.6 + Math.random()*1.4,
        alpha: 0.25 + Math.random()*0.45,
        pulse: Math.random()*Math.PI*2,
        fromLeft: false
      };
    }
  }

  // ── Node constructor ──────────────────────────────────────────
  function mkNode(){
    return {
      x: Math.random()*W, y: Math.random()*H,
      r: 0.8 + Math.random()*2.2,
      alpha: 0.1 + Math.random()*0.4,
      pulse: Math.random()*Math.PI*2,
      sp: 0.008 + Math.random()*0.022,
      col: Math.random()>0.5 ? '0,200,240' : '80,140,255',
    };
  }

  // ── Ambient orb constructor ───────────────────────────────────
  function mkOrb(){
    return {
      x: Math.random()*W, y: Math.random()*H,
      r: 120 + Math.random()*200,
      alpha: 0.04 + Math.random()*0.06,
      pulse: Math.random()*Math.PI*2,
      sp: 0.003 + Math.random()*0.008,
      col: Math.random()>0.5 ? '0,85,229' : '0,160,255',
    };
  }

  const FIBER_COUNT = 28;
  const NODE_COUNT  = 48;
  const ORB_COUNT   = 4;

  let fibers = Array.from({length: FIBER_COUNT}, mkFiber);
  let nodes  = Array.from({length: NODE_COUNT},  mkNode);
  let orbs   = Array.from({length: ORB_COUNT},   mkOrb);

  function drawFiber(f){
    const tailX = f.fromLeft ? f.x - f.len : f.x + f.curve;
    const tailY = f.fromLeft ? f.y + f.curve : f.y - f.len;
    const cpX   = f.fromLeft ? f.x - f.len*0.5 + f.curve : f.x + f.curve*0.5;
    const cpY   = f.fromLeft ? f.y + f.curve*0.5 : f.y - f.len*0.5;

    // Glow halo
    const halo = ctx.createLinearGradient(f.x, f.y, tailX, tailY);
    const a2 = f.alpha * (0.65 + 0.35*Math.sin(f.pulse));
    halo.addColorStop(0, `rgba(${f.c2},${a2*0.9})`);
    halo.addColorStop(0.4, `rgba(${f.c1},${a2*0.5})`);
    halo.addColorStop(1, `rgba(${f.c1},0)`);
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.quadraticCurveTo(cpX, cpY, tailX, tailY);
    ctx.strokeStyle = halo;
    ctx.lineWidth   = f.w * 4.5;
    ctx.globalAlpha = 0.22;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Core line
    const grad = ctx.createLinearGradient(f.x, f.y, tailX, tailY);
    grad.addColorStop(0, `rgba(${f.c2},${a2})`);
    grad.addColorStop(0.5, `rgba(${f.c1},${a2*0.75})`);
    grad.addColorStop(1, `rgba(${f.c1},0)`);
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.quadraticCurveTo(cpX, cpY, tailX, tailY);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = f.w;
    ctx.stroke();

    // Bright glowing tip
    const tipA = a2 * 1.1;
    const tipR = f.w * 2.8;
    const tipG = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, tipR * 3);
    tipG.addColorStop(0, `rgba(${f.c2},${Math.min(tipA*1.2, 1)})`);
    tipG.addColorStop(0.4, `rgba(${f.c2},${tipA*0.6})`);
    tipG.addColorStop(1, `rgba(${f.c2},0)`);
    ctx.beginPath();
    ctx.arc(f.x, f.y, tipR * 3, 0, Math.PI*2);
    ctx.fillStyle = tipG;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.x, f.y, tipR, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${f.c2},${Math.min(tipA*1.3,1)})`;
    ctx.fill();
  }

  function tick(){
    ctx.clearRect(0, 0, W, H);

    // Ambient orbs
    orbs.forEach(o=>{
      o.pulse += o.sp;
      const a = o.alpha * (0.7 + 0.3*Math.sin(o.pulse));
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `rgba(${o.col},${a})`);
      g.addColorStop(1, `rgba(${o.col},0)`);
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill();
    });

    // Nodes
    nodes.forEach(n=>{
      n.pulse += n.sp;
      const a = n.alpha * (0.5 + 0.5*Math.sin(n.pulse));
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r*4);
      g.addColorStop(0, `rgba(${n.col},${a})`);
      g.addColorStop(1, `rgba(${n.col},0)`);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r*4, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${n.col},${Math.min(a*1.4,1)})`; ctx.fill();
    });

    // Fibers
    fibers.forEach((f, i) => {
      f.pulse += 0.018;
      f.x += f.dx; f.y += f.dy;
      // Respawn when off-screen
      const oob = f.fromLeft
        ? f.x > W + f.len + 100
        : f.y > H + f.len + 100;
      if(oob) fibers[i] = mkFiber();
      else drawFiber(f);
    });

    requestAnimationFrame(tick);
  }
  tick();
}

/* ================================================================
   ADMIN LOADING SCREEN
   Shows centered logo with pulsing color transitions,
   animated fiber cables, then fades out.
   ================================================================ */
function showAdminLoader(callback, duration=2400){
  // Create loader overlay
  const overlay = document.createElement('div');
  overlay.id = 'admin-loader';
  overlay.innerHTML = `
    <canvas id="loader-canvas"></canvas>
    <div class="loader-inner">
      <div class="loader-logo-wrap">
        <div class="loader-ring"></div>
        <div class="loader-ring-2"></div>
        <img src="oftix-logo-anim.svg" alt="Oftix" class="loader-logo"
          style="height:100px;width:auto"
          onerror="this.outerHTML='<div class=loader-logo-fallback>OFTiX</div>'"/>
      </div>
      <div class="loader-bar-wrap">
        <div class="loader-bar-track">
          <div class="loader-bar-fill" id="loader-bar-fill"></div>
        </div>
      </div>
      <div class="loader-msg" id="loader-msg">Authenticating…</div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Mini fiber canvas inside loader
  const lc = el('loader-canvas');
  if(lc){
    const ctx = lc.getContext('2d');
    lc.width  = window.innerWidth;
    lc.height = window.innerHeight;
    // reuse global BG for loader too
    let lfibers = [];
    function mkLF(){
      const fl = Math.random()>0.5;
      return { x:fl?-300:Math.random()*lc.width, y:fl?Math.random()*lc.height:-300,
        dx:fl?0.6+Math.random()*0.8:0, dy:fl?0:0.6+Math.random()*0.8,
        len:200+Math.random()*200, curve:(Math.random()-.5)*80,
        c:'0,200,240', w:0.8+Math.random()*1.2, alpha:0.3+Math.random()*0.4,
        pulse:Math.random()*Math.PI*2, fl };
    }
    for(let i=0;i<18;i++) lfibers.push(mkLF());
    function lTick(){
      if(!el('admin-loader')) return;
      ctx.clearRect(0,0,lc.width,lc.height);
      lfibers.forEach((f,i)=>{
        f.pulse+=0.02; f.x+=f.dx; f.y+=f.dy;
        if((f.fl&&f.x>lc.width+300)||((!f.fl)&&f.y>lc.height+300)) lfibers[i]=mkLF();
        const tX=f.fl?f.x-f.len:f.x+f.curve;
        const tY=f.fl?f.y+f.curve:f.y-f.len;
        const cX=f.fl?f.x-f.len*0.5+f.curve:f.x+f.curve*0.5;
        const cY=f.fl?f.y+f.curve*0.5:f.y-f.len*0.5;
        const a=f.alpha*(0.7+0.3*Math.sin(f.pulse));
        const g=ctx.createLinearGradient(f.x,f.y,tX,tY);
        g.addColorStop(0,`rgba(${f.c},${a})`); g.addColorStop(1,`rgba(${f.c},0)`);
        ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.quadraticCurveTo(cX,cY,tX,tY);
        ctx.strokeStyle=g; ctx.lineWidth=f.w; ctx.stroke();
        ctx.beginPath(); ctx.arc(f.x,f.y,f.w*2.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(0,220,255,${a})`; ctx.fill();
      });
      requestAnimationFrame(lTick);
    }
    lTick();
  }

  // Animate progress bar
  const fill = el('loader-bar-fill');
  const msgs = el('loader-msg');
  const steps = ['Authenticating…','Verifying credentials…','Loading dashboard…','Almost ready…'];
  let prog = 0;
  const interval = setInterval(()=>{
    prog = Math.min(prog + (100/(duration/60)), 100);
    if(fill) fill.style.width = prog+'%';
    const idx = Math.floor((prog/100)*steps.length);
    if(msgs) msgs.textContent = steps[Math.min(idx, steps.length-1)];
    if(prog >= 100) clearInterval(interval);
  }, 60);

  // Fade out and remove
  setTimeout(()=>{
    overlay.classList.add('loader-fade-out');
    setTimeout(()=>{ overlay.remove(); if(callback) callback(); }, 600);
  }, duration);
}

/* ================================================================
   SECTION NAVIGATION WITH SCROLL TRANSITION
   Each nav click triggers an upward-slide animation even if the
   scroll container isn't full. Works for both admin and client.
   ================================================================ */
function initNav(navSel, secPrefix, dark=true){
  const items = qsa(navSel);
  let transitioning = false;

  function activateSection(secId, label){
    if(transitioning) return;

    const current = qs(`[id^="${secPrefix}"].active`);
    const target  = el(`${secPrefix}${secId}`);
    if(!target || target === current) return;

    transitioning = true;

    // Update nav active state
    items.forEach(n => n.classList.remove('active'));
    qs(`[data-sec="${secId}"]`)?.classList.add('active');

    // Update topbar title
    const titleEl = el('adm-page-title') || el('cli-page-title');
    if(titleEl) titleEl.textContent = label || secId;

    if(current){
      // Slide current section up and out
      current.style.transition = 'transform 0.48s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease';
      current.style.transform  = 'translateY(-60px)';
      current.style.opacity    = '0';
      current.style.pointerEvents = 'none';

      setTimeout(()=>{
        current.classList.remove('active');
        current.style.cssText = '';
        // Slide new section in from below
        target.style.transform  = 'translateY(60px)';
        target.style.opacity    = '0';
        target.style.transition = 'none';
        target.classList.add('active');

        // Force reflow then animate in
        requestAnimationFrame(()=>{
          requestAnimationFrame(()=>{
            target.style.transition = 'transform 0.48s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease';
            target.style.transform  = 'translateY(0)';
            target.style.opacity    = '1';
            setTimeout(()=>{ target.style.cssText=''; transitioning=false; }, 500);
          });
        });

        // Scroll to top of main content area
        const scrollWrap = qs('.adm-scroll') || qs('.cli-content');
        if(scrollWrap) scrollWrap.scrollTo({ top:0, behavior:'smooth' });

      }, 320);
    } else {
      target.classList.add('active');
      target.style.animation = 'sec-rise 0.55s cubic-bezier(0.22,1,0.36,1)';
      setTimeout(()=>{ target.style.animation=''; transitioning=false; }, 600);
    }
  }

  items.forEach(item => {
    item.addEventListener('click', ()=>{
      const secId = item.dataset.sec;
      const label = item.querySelector('.n-label')?.textContent || secId;
      activateSection(secId, label);
      // Close mobile sidebar
      qs('.adm-sidebar')?.classList.remove('open');
      qs('.cli-sidebar')?.classList.remove('open');
    });
  });

  // Hamburger
  const hbk = qs('.hamburger');
  if(hbk) hbk.addEventListener('click', ()=>{
    qs('.adm-sidebar')?.classList.toggle('open');
    qs('.cli-sidebar')?.classList.toggle('open');
  });
}

/* ── Logout ──────────────────────────────────────────────────── */
function initLogout(dark=true){
  const btn = el('logout-btn');
  if(btn) btn.addEventListener('click', ()=>{
    APP.current_user = null; saveState();
    toast('Logged out successfully.', 'info', 1500, dark);
    setTimeout(()=> go('index.html'), 900);
  });
}

/* ── User UI ─────────────────────────────────────────────────── */
function setUserUI(user){
  setTxt('u-name-disp', user?.name || 'User');
  const roles = { admin:'Super Admin', branch:'Branch Admin', client:'Subscriber' };
  setTxt('u-role-disp', roles[user?.role] || 'User');
  const av = el('u-avatar-disp');
  if(av) av.textContent = (user?.name || 'U').charAt(0).toUpperCase();
}

/* ── PIN Inputs ──────────────────────────────────────────────── */
function initPinInputs(selector){
  const inputs = qsa(selector);
  inputs.forEach((inp, i)=>{
    inp.addEventListener('input', ()=>{
      inp.value = inp.value.replace(/\D/g,'').slice(-1);
      if(inp.value && i < inputs.length-1) inputs[i+1].focus();
    });
    inp.addEventListener('keydown', e=>{
      if(e.key==='Backspace' && !inp.value && i>0) inputs[i-1].focus();
    });
  });
}
function getPIN(selector){
  return Array.from(qsa(selector)).map(i=>i.value).join('');
}

/* ================================================================
   LOGIN PAGE
   ================================================================ */
function initLogin(){
  // Populate branch dropdown in modal
  const bSel = el('admin-branch-sel');
  if(bSel){
    APP.branches.forEach(b=>{
      const o=document.createElement('option'); o.value=b.id; o.textContent=b.name; bSel.appendChild(o);
    });
  }
  // QR → register
  el('qr-box')?.addEventListener('click', ()=> go('register.html'));
  el('reg-btn')?.addEventListener('click', ()=> go('register.html'));
  // Admin access button
  el('admin-access-btn')?.addEventListener('click', ()=> openModal('admin-gate-modal'));
  // PIN verify
  el('pin-verify-btn')?.addEventListener('click', verifyAdminPIN);
  // Role select in admin modal
  el('admin-role-select')?.addEventListener('change', ()=>{
    const isBranch = el('admin-role-select').value === 'branch';
    const br = el('branch-row');
    if(br) br.style.display = isBranch ? 'block' : 'none';
  });
  // Client login
  el('login-btn')?.addEventListener('click', doClientLogin);
  el('login-pass')?.addEventListener('keydown', e=>{ if(e.key==='Enter') doClientLogin(); });
  // Admin login inside modal
  el('admin-login-btn')?.addEventListener('click', doAdminLogin);

  initPinInputs('.pin-lt');
}

function verifyAdminPIN(){
  const pin = getPIN('.pin-lt');
  if(pin !== APP.security_pin){
    toast('Incorrect Security PIN. Please try again.', 'danger', 3000, false);
    // Shake animation
    const pr = qs('.pin-row');
    if(pr){ pr.style.animation='shake 0.4s ease'; setTimeout(()=> pr.style.animation='',500); }
    return;
  }
  el('pin-step').style.display   = 'none';
  el('admin-login-step').style.display = 'block';
  const sel = el('admin-branch-sel');
  if(sel && sel.children.length <= 1){
    APP.branches.forEach(b=>{ const o=document.createElement('option'); o.value=b.id; o.textContent=b.name; sel.appendChild(o); });
  }
  const role = el('admin-role-select');
  const br   = el('branch-row');
  if(role && br) br.style.display = role.value==='branch' ? 'block' : 'none';
  toast('PIN verified! Please enter your credentials.', 'success', 2500, false);
}

function doClientLogin(){
  const user = el('login-user')?.value?.trim();
  const pass = el('login-pass')?.value?.trim();
  if(!user || !pass){ toast('Please enter your username and password.', 'warning', 3000, false); return; }
  const btn = el('login-btn');
  if(btn){ btn.textContent='Signing in…'; btn.disabled=true; }

  setTimeout(()=>{
    // Hide login UI immediately
    const loginBg = qs('.login-bg');
    if(loginBg) loginBg.style.display='none';
    APP.current_user = { name: user, username: user, role:'client' };
    APP.client_applied = false;
    saveState();
    showClientLoader(()=>{ window.location.replace('client-dashboard.html'); }, 2000);
  }, 600);
}

/* ================================================================
   CLIENT LOADING SCREEN
   Uses animated logo SVG, cyan/teal color scheme
   ================================================================ */
function showClientLoader(callback, duration=2000){
  const overlay = document.createElement('div');
  overlay.id = 'client-loader';
  overlay.innerHTML = `
    <canvas id="loader-canvas-cli"></canvas>
    <div class="loader-inner">
      <div class="loader-logo-wrap">
        <div class="loader-ring" style="border-top-color:rgba(0,200,240,0.7);border-right-color:rgba(0,85,229,0.35)"></div>
        <div class="loader-ring-2" style="border-bottom-color:rgba(0,180,255,0.6);border-left-color:rgba(0,200,240,0.25)"></div>
        <img src="oftix-logo-anim.svg" alt="Oftix" class="loader-logo"
          style="height:100px;width:auto"
          onerror="this.outerHTML='<div class=loader-logo-fallback>OFTiX</div>'"/>
      </div>
      <div class="loader-bar-wrap">
        <div class="loader-bar-track">
          <div class="loader-bar-fill" id="loader-bar-fill-cli" style="background:linear-gradient(90deg,#0055e5,#00c8f0,#00ffee,#00c8f0);background-size:200% 100%;animation:bar-shimmer 1.6s linear infinite"></div>
        </div>
      </div>
      <div class="loader-msg" id="loader-msg-cli" style="color:rgba(0,200,240,0.8)">Connecting…</div>
    </div>
  `;
  // Style the overlay
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#030c20;display:flex;align-items:center;justify-content:center;animation:loader-fade-in 0.3s ease';
  document.body.appendChild(overlay);

  // Mini fiber canvas
  const lc = el('loader-canvas-cli');
  if(lc){
    lc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const ctx = lc.getContext('2d');
    lc.width = window.innerWidth; lc.height = window.innerHeight;
    let lf = [];
    function mkLF(){ const fl=Math.random()>.5; return {x:fl?-300:Math.random()*lc.width, y:fl?Math.random()*lc.height:-300, dx:fl?.7+Math.random()*.9:0, dy:fl?0:.7+Math.random()*.9, len:200+Math.random()*200, cv:(Math.random()-.5)*80, c:'0,200,240', w:.8+Math.random()*1.2, a:.3+Math.random()*.4, p:Math.random()*Math.PI*2, fl}; }
    for(let i=0;i<20;i++) lf.push(mkLF());
    function lTick(){ if(!el('client-loader')) return; ctx.clearRect(0,0,lc.width,lc.height); lf.forEach((f,i)=>{ f.p+=.02; f.x+=f.dx; f.y+=f.dy; if((f.fl&&f.x>lc.width+300)||((!f.fl)&&f.y>lc.height+300)) lf[i]=mkLF(); const tX=f.fl?f.x-f.len:f.x+f.cv, tY=f.fl?f.y+f.cv:f.y-f.len; const cX=f.fl?f.x-f.len*.5+f.cv:f.x+f.cv*.5, cY=f.fl?f.y+f.cv*.5:f.y-f.len*.5; const a=f.a*(.7+.3*Math.sin(f.p)); const g=ctx.createLinearGradient(f.x,f.y,tX,tY); g.addColorStop(0,`rgba(${f.c},${a})`); g.addColorStop(1,`rgba(${f.c},0)`); ctx.beginPath(); ctx.moveTo(f.x,f.y); ctx.quadraticCurveTo(cX,cY,tX,tY); ctx.strokeStyle=g; ctx.lineWidth=f.w; ctx.stroke(); ctx.beginPath(); ctx.arc(f.x,f.y,f.w*2.5,0,Math.PI*2); ctx.fillStyle=`rgba(0,220,255,${a})`; ctx.fill(); }); requestAnimationFrame(lTick); }
    lTick();
  }

  const fill = el('loader-bar-fill-cli');
  const msgs = el('loader-msg-cli');
  const steps = ['Connecting…','Loading your account…','Almost ready…','Welcome!'];
  let prog = 0;
  const interval = setInterval(()=>{
    prog = Math.min(prog + (100/(duration/60)), 100);
    if(fill) fill.style.width = prog+'%';
    const idx = Math.floor((prog/100)*steps.length);
    if(msgs) msgs.textContent = steps[Math.min(idx, steps.length-1)];
    if(prog >= 100) clearInterval(interval);
  }, 60);

  setTimeout(()=>{
    overlay.style.animation = 'loader-fade-out 0.6s ease forwards';
    setTimeout(()=>{ overlay.remove(); if(callback) callback(); }, 600);
  }, duration);
}

function doAdminLogin(){
  const role     = el('admin-role-select')?.value;
  const user     = el('admin-user')?.value?.trim();
  const pass     = el('admin-pass')?.value?.trim();
  if(!user || !pass){ toast('Please enter your username and password.', 'warning', 3000, false); return; }

  const btn = el('admin-login-btn');
  if(btn){ btn.textContent='Verifying…'; btn.disabled=true; }

  setTimeout(()=>{
    // Hide entire login UI immediately to prevent client page flash
    const loginBg = qs('.login-bg');
    if(loginBg) loginBg.style.display='none';
    const adminBtn = el('admin-access-btn');
    if(adminBtn) adminBtn.style.display='none';
    closeModal('admin-gate-modal');

    if(role === 'branch'){
      const branchId = parseInt(el('admin-branch-sel')?.value || 1);
      const branch   = APP.branches.find(b=> b.id===branchId) || APP.branches[0];
      APP.current_user = { name:user||'Branch Admin', role:'branch', branch_id:branchId, branch_name:branch.name };
    } else {
      APP.current_user = { name:user||'Super Admin', role:'admin' };
    }
    saveState();
    // Show loading screen, then navigate
    showAdminLoader(()=>{
      window.location.replace(role==='branch' ? 'branch-dashboard.html' : 'admin-dashboard.html');
    }, 2200);
  }, 600);
}

/* ================================================================
   REGISTER PAGE
   ================================================================ */
function initRegister(){
  const bSel = el('reg-branch');
  if(bSel){
    APP.branches.forEach(b=>{
      const o=document.createElement('option'); o.value=b.id; o.textContent=b.name; bSel.appendChild(o);
    });
  }
  el('reg-submit')?.addEventListener('click', ()=>{
    const fields = ['reg-name','reg-username','reg-contact','reg-address','reg-email','reg-pass','reg-branch'];
    let ok = true;
    fields.forEach(f=>{
      const e = el(f);
      if(!e?.value?.trim()){ ok=false; e?.classList.add('err'); } else e?.classList.remove('err');
    });
    if(!ok){ toast('Please fill in all required fields.', 'warning', 3000, false); return; }
    const btn = el('reg-submit');
    if(btn){ btn.textContent='Creating account…'; btn.disabled=true; }
    setTimeout(()=>{
      const branchId = parseInt(el('reg-branch').value);
      APP.current_user = {
        name: el('reg-name').value.trim(),
        username: el('reg-username').value.trim(),
        role:'client', branch_id: branchId
      };
      APP.client_applied = false;
      APP.client_data    = null;
      saveState(); go('client-dashboard.html');
    }, 1200);
  });
}

/* ================================================================
   CLIENT DASHBOARD
   Modules locked until application is submitted
   ================================================================ */
function initClient(){
  loadState();
  const user = APP.current_user || { name:'Client User', role:'client' };
  setUserUI(user);
  setTxt('u-name-disp', user.name || 'Client User');
  setTxt('u-role-disp', 'Subscriber');
  const av = el('u-avatar-disp'); if(av) av.textContent = (user.name||'C').charAt(0).toUpperCase();

  // Populate plan select
  const planSel = el('apply-plan');
  if(planSel){
    APP.plans.forEach(p=>{
      const o=document.createElement('option'); o.value=p.name;
      o.textContent=`${p.name} — ${p.speed} — ₱${p.price.toLocaleString()}/mo`;
      planSel.appendChild(o);
    });
  }

  renderClientView();
  initClientNav();
  initLogout(false);

  el('pay-method')?.addEventListener('change', ()=>{
    const v = el('pay-method').value;
    if(el('gcash-details'))  el('gcash-details').style.display  = v==='gcash'  ? 'block':'none';
    if(el('walkin-details')) el('walkin-details').style.display = v==='walkin' ? 'block':'none';
  });
}

/* Client nav — locked modules until applied */
function initClientNav(){
  const LOCKED_SECTIONS = ['plan','billing','tickets']; // locked until applied
  const items = qsa('.cli-nav-item');
  let transitioning = false;

  items.forEach(item=>{
    item.addEventListener('click', ()=>{
      const secId = item.dataset.sec;
      if(!secId) return;

      // Check lock
      if(LOCKED_SECTIONS.includes(secId) && !APP.client_applied){
        toast('Please apply for a connection first to access this module.', 'warning', 3500, false);
        // Shake the clicked nav item
        item.classList.add('nav-lock-shake');
        setTimeout(()=> item.classList.remove('nav-lock-shake'), 500);
        // Nudge the apply button
        const applyBtn = el('apply-cta-btn');
        if(applyBtn){
          applyBtn.style.animation = 'pulse-glow 0.5s ease 3';
          setTimeout(()=> applyBtn.style.animation='', 1600);
        }
        return;
      }

      if(transitioning) return;
      transitioning = true;

      const current = qs('.cli-sec.active');
      const target  = el(`cli-sec-${secId}`);
      if(!target || target===current){ transitioning=false; return; }

      items.forEach(n=>n.classList.remove('active'));
      item.classList.add('active');

      const titleEl = el('cli-page-title');
      if(titleEl) titleEl.textContent = item.querySelector('.n-label')?.textContent || secId;

      if(current){
        current.style.transition   = 'transform 0.44s cubic-bezier(0.4,0,0.2,1), opacity 0.34s ease';
        current.style.transform    = 'translateY(-55px)';
        current.style.opacity      = '0';
        current.style.pointerEvents= 'none';
        setTimeout(()=>{
          current.classList.remove('active'); current.style.cssText='';
          target.style.transform  = 'translateY(55px)';
          target.style.opacity    = '0';
          target.style.transition = 'none';
          target.classList.add('active');
          requestAnimationFrame(()=> requestAnimationFrame(()=>{
            target.style.transition = 'transform 0.44s cubic-bezier(0.22,1,0.36,1), opacity 0.38s ease';
            target.style.transform  = 'translateY(0)';
            target.style.opacity    = '1';
            setTimeout(()=>{ target.style.cssText=''; transitioning=false; }, 480);
          }));
          qs('.cli-content')?.scrollTo({ top:0, behavior:'smooth' });
        }, 300);
      } else {
        target.classList.add('active');
        setTimeout(()=> transitioning=false, 500);
      }

      qs('.cli-sidebar')?.classList.remove('open');
    });
  });

  // Hamburger
  qs('.hamburger')?.addEventListener('click', ()=> qs('.cli-sidebar')?.classList.toggle('open'));
}

function renderClientView(){
  const applied = APP.client_applied;
  if(el('view-unapplied'))  el('view-unapplied').style.display  = applied ? 'none'  : 'block';
  if(el('view-applied'))    el('view-applied').style.display    = applied ? 'block' : 'none';

  // Update nav lock indicators
  const LOCKED = ['plan','billing','tickets'];
  qsa('.cli-nav-item').forEach(item=>{
    const sec = item.dataset.sec;
    if(LOCKED.includes(sec)){
      const lockIcon = item.querySelector('.lock-icon');
      if(lockIcon) lockIcon.style.display = applied ? 'none' : 'inline';
      if(applied) item.classList.remove('locked');
      else        item.classList.add('locked');
    }
  });

  if(applied && APP.client_data){
    const cd = APP.client_data;
    const p  = `₱${(cd.price||0).toLocaleString()}`;
    [
      ['disp-name',    cd.name],
      ['disp-name2',   cd.name],
      ['disp-name3',   cd.name],
      ['disp-plan',    cd.plan],
      ['disp-speed',   cd.speed],
      ['disp-price',   p+'/month'],
      ['disp-price2',  p],
      ['disp-price3',  p+'.00'],
      ['disp-branch',  cd.branch],
      ['disp-branch2', cd.branch],
      ['disp-gcash',   cd.gcash],
      ['gcash-num-disp', cd.gcash],
      ['disp-due',     cd.due_date||'April 5, 2026'],
      ['disp-due2',    cd.due_date||'April 5, 2026'],
      ['disp-due3',    '📅 '+(cd.due_date||'April 5, 2026')],
      ['plan-name-big',  cd.plan],
      ['plan-speed-big', cd.speed],
      ['plan-price-big', p+'/month'],
      ['plan-due-big',   cd.due_date||'April 5, 2026'],
    ].forEach(([id, val])=> setTxt(id, val));
    const av = el('u-avatar-disp'); if(av) av.textContent = (cd.name||'C').charAt(0).toUpperCase();
    setTxt('u-name-disp', cd.name);
  }
}

function submitApplication(){
  const name    = el('apply-name')?.value?.trim();
  const address = el('apply-address')?.value?.trim();
  const contact = el('apply-contact')?.value?.trim();
  const plan    = el('apply-plan')?.value;
  if(!name||!address||!contact||!plan){ toast('Please fill in all fields.','warning',3000,false); return; }
  const planData = APP.plans.find(p=> p.name===plan);
  const branch   = APP.branches.find(b=> b.id===(APP.current_user?.branch_id||1)) || APP.branches[0];
  const btn = qs('#apply-modal .btn-primary-lt');
  if(btn){ btn.textContent='Submitting…'; btn.disabled=true; }
  setTimeout(()=>{
    APP.client_applied = true;
    APP.client_data    = {
      name, address, contact, plan,
      speed:   planData?.speed  || '50 Mbps',
      price:   planData?.price  || 1499,
      branch:  branch.name,
      gcash:   branch.gcash,
      due_date:'April 5, 2026'
    };
    saveState(); closeModal('apply-modal');
    if(btn){ btn.textContent='Submit My Application'; btn.disabled=false; }
    toast('Application submitted! Your account is now active. ✅','success',4500,false);
    setTimeout(()=> renderClientView(), 400);
  }, 1400);
}

function submitPayment(){
  const method = el('pay-method')?.value;
  if(!method){ toast('Please select a payment method.','warning',3000,false); return; }
  toast('Payment submitted for verification! We will confirm within 24 hours. 📩','success',4500,false);
  closeModal('payment-modal');
  el('pay-method').value='';
  if(el('gcash-details'))  el('gcash-details').style.display='none';
  if(el('walkin-details')) el('walkin-details').style.display='none';
}

function submitTicket(){
  const sub = el('ticket-subject')?.value?.trim();
  const msg = el('ticket-msg')?.value?.trim();
  if(!sub||!msg){ toast('Please fill in all ticket fields.','warning',3000,false); return; }
  toast('Support ticket submitted! We will respond within 24 hours. 🎫','success',4000,false);
  el('ticket-subject').value=''; el('ticket-msg').value='';
}

/* ================================================================
   BRANCH ADMIN DASHBOARD
   ================================================================ */
function initBranch(){
  loadState();
  const user     = APP.current_user || { name:'Branch Admin', role:'branch', branch_id:1 };
  const branchId = user.branch_id || 1;
  const branch   = APP.branches.find(b=> b.id===branchId) || APP.branches[0];

  setUserUI(user);
  qsa('.branch-name-disp').forEach(e=> e.textContent = branch.name);
  const gcashInp = el('gcash-number'); if(gcashInp) gcashInp.value = branch.gcash || '';
  if(el('topbar-branch')) el('topbar-branch').textContent = branch.name;

  renderAppsTable(branchId);
  renderClientsTable(branchId);
  renderPaymentsTable(branchId);
  renderTicketsTable(branchId);
  initNav('.adm-nav-item','adm-sec-', true);
  initLogout(true);
}

function renderAppsTable(branchId){
  const tb = el('apps-tbody'); if(!tb) return;
  const apps = APP.applications.filter(a=> a.branch_id===branchId);
  tb.innerHTML = apps.length ? apps.map(a=>`
    <tr>
      <td>${a.name}</td><td>${a.contact}</td><td>${a.plan}</td><td>${a.date}</td>
      <td><span class="badge badge-${statusColor(a.status)}">${a.status}</span></td>
      <td><div class="action-row">
        ${a.status==='pending'   ? `<button class="btn btn-success btn-sm" onclick="approveApp(${a.id})">Approve</button>`:''}
        ${a.status==='approved'  ? `<button class="btn btn-warning btn-sm" onclick="scheduleApp(${a.id})">Schedule</button>`:''}
        ${a.status==='scheduled' ? `<button class="btn btn-primary-dk btn-sm" onclick="markInstalled(${a.id})">Mark Installed</button>`:''}
        <button class="btn btn-danger btn-sm" onclick="archiveApp(${a.id})">Archive</button>
      </div></td>
    </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:30px">No applications found</td></tr>';
}
function approveApp(id){ const a=APP.applications.find(x=>x.id===id); if(a){a.status='approved';saveState();renderAppsTable(APP.current_user?.branch_id||1);toast('Application approved!','success');} }
function scheduleApp(id){ const a=APP.applications.find(x=>x.id===id); if(a){a.status='scheduled';saveState();renderAppsTable(APP.current_user?.branch_id||1);toast('Installation scheduled!','info');} }
function markInstalled(id){
  const a=APP.applications.find(x=>x.id===id); if(!a) return;
  a.status='installed';
  APP.clients.push({ id:APP.clients.length+10, name:a.name, contact:a.contact, address:a.address, branch_id:a.branch_id, plan:a.plan, status:'active', payment_status:'pending', install_date:new Date().toISOString().split('T')[0], due_date:'April 5, 2026' });
  saveState(); renderAppsTable(APP.current_user?.branch_id||1); renderClientsTable(APP.current_user?.branch_id||1);
  toast('Marked as installed! Client added to client list. ✅','success');
}
function archiveApp(id){ APP.applications=APP.applications.filter(a=>a.id!==id); saveState(); renderAppsTable(APP.current_user?.branch_id||1); toast('Application archived.','warning'); }

function renderClientsTable(branchId){
  const tb=el('clients-tbody'); if(!tb) return;
  const clients=APP.clients.filter(c=>c.branch_id===branchId);
  tb.innerHTML=clients.length ? clients.map(c=>`
    <tr>
      <td>${c.name}</td><td>${c.contact||'—'}</td><td>${c.plan}</td>
      <td><span class="badge badge-${c.status==='active'?'success':'warning'}">${c.status}</span></td>
      <td><span class="badge badge-${c.payment_status==='paid'?'success':c.payment_status==='pending'?'warning':'danger'}">${c.payment_status}</span></td>
      <td>${c.install_date||'Pending'}</td>
    </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:30px">No clients yet</td></tr>';
}

function renderPaymentsTable(branchId){
  const tb=el('payments-tbody'); if(!tb) return;
  const payments=APP.payments.filter(p=>p.branch_id===branchId);
  tb.innerHTML=payments.length ? payments.map(p=>`
    <tr>
      <td>${p.client}</td><td>₱${p.amount.toLocaleString()}</td><td>${p.method}</td><td>${p.date}</td>
      <td><span class="badge badge-${p.status==='verified'?'success':'warning'}">${p.status}</span></td>
      <td>${p.receipt?'<span class="badge badge-info">Uploaded</span>':'<span class="badge badge-muted">None</span>'}</td>
      <td>${p.status==='pending'?`<button class="btn btn-success btn-sm" onclick="verifyPayment(${p.id})">Verify</button>`:'—'}</td>
    </tr>`).join('')
    : '<tr><td colspan="7" style="text-align:center;color:var(--adm-muted);padding:30px">No payments found</td></tr>';
}
function verifyPayment(id){ const p=APP.payments.find(x=>x.id===id); if(p){p.status='verified';saveState();renderPaymentsTable(APP.current_user?.branch_id||1);toast('Payment verified! ✅','success');} }

function renderTicketsTable(branchId){
  const tb=el('tickets-tbody'); if(!tb) return;
  const tickets=APP.tickets.filter(t=>t.branch_id===branchId);
  tb.innerHTML=tickets.length ? tickets.map(t=>`
    <tr>
      <td>${t.client}</td><td>${t.subject}</td><td>${t.message.substring(0,40)}…</td><td>${t.date}</td>
      <td><span class="badge badge-${t.status==='open'?'warning':'success'}">${t.status}</span></td>
      <td>${t.status==='open'?`<button class="btn btn-primary-dk btn-sm" onclick="respondTicket(${t.id})">Respond</button>`:'Resolved'}</td>
    </tr>`).join('')
    : '<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:30px">No tickets found</td></tr>';
}
function respondTicket(id){
  const t=APP.tickets.find(x=>x.id===id); if(!t) return;
  const resp=prompt(`Respond to: "${t.subject}"\nEnter your response:`);
  if(resp){ t.status='resolved'; t.response=resp; saveState(); renderTicketsTable(APP.current_user?.branch_id||1); toast('Ticket marked as resolved! ✅','success'); }
}
function saveGCash(){
  const val=el('gcash-number')?.value?.trim();
  if(!val){ toast('Please enter a GCash number.','warning'); return; }
  const branch=APP.branches.find(b=>b.id===(APP.current_user?.branch_id||1));
  if(branch){ branch.gcash=val; saveState(); toast('GCash number saved! 💾','success'); }
}

/* ================================================================
   MAIN ADMIN DASHBOARD
   ================================================================ */
function initAdmin(){
  loadState();
  setUserUI(APP.current_user || { name:'Super Admin', role:'admin' });
  renderAdminStats();
  renderBranchesTable();
  renderAdminsTable();
  initNav('.adm-nav-item','adm-sec-', true);
  initLogout(true);
  initCharts();
}

function renderAdminStats(){
  const totalIncome = APP.payments.filter(p=>p.status==='verified').reduce((s,p)=>s+p.amount,0);
  setTxt('stat-clients',  APP.clients.length);
  setTxt('stat-income',   `₱${totalIncome.toLocaleString()}`);
  setTxt('stat-branches', APP.branches.length);
  setTxt('stat-admins',   APP.branch_admins.length);
}

function renderBranchesTable(){
  const tb=el('branches-tbody'); if(!tb) return;
  tb.innerHTML=APP.branches.map(b=>`
    <tr>
      <td>${b.name}</td><td>${b.address}</td><td>${b.gcash}</td><td>${b.clients}</td>
      <td><span class="badge badge-success">Active</span></td>
      <td><div class="action-row">
        <button class="btn btn-outline-dk btn-sm" onclick="editBranch(${b.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBranch(${b.id})">Delete</button>
      </div></td>
    </tr>`).join('');
}
function editBranch(id){ const b=APP.branches.find(x=>x.id===id); if(!b) return; const name=prompt('Edit branch name:',b.name); if(name){ b.name=name; saveState(); renderBranchesTable(); toast('Branch updated!','success'); } }
function deleteBranch(id){ if(!confirm('Delete this branch?')) return; APP.branches=APP.branches.filter(b=>b.id!==id); saveState(); renderBranchesTable(); renderAdminStats(); toast('Branch deleted.','warning'); }
function addBranch(){
  const name=el('new-branch-name')?.value?.trim();
  const address=el('new-branch-address')?.value?.trim();
  const gcash=el('new-branch-gcash')?.value?.trim();
  if(!name||!address){ toast('Please fill all fields.','warning'); return; }
  const id=Math.max(...APP.branches.map(b=>b.id))+1;
  APP.branches.push({ id, name, address, gcash:gcash||'09000000000', clients:0, status:'active' });
  saveState(); closeModal('add-branch-modal'); renderBranchesTable(); renderAdminStats();
  toast(`Branch "${name}" added! 🏢`,'success');
  ['new-branch-name','new-branch-address','new-branch-gcash'].forEach(f=>{ const e=el(f); if(e) e.value=''; });
}

function renderAdminsTable(){
  const tb=el('admins-tbody'); if(!tb) return;
  tb.innerHTML=APP.branch_admins.map(a=>{
    const branch=APP.branches.find(b=>b.id===a.branch_id);
    return `<tr>
      <td>${a.name}</td><td>${a.username}</td><td>${branch?.name||'—'}</td>
      <td><span class="badge badge-success">Active</span></td>
      <td><div class="action-row">
        <button class="btn btn-outline-dk btn-sm" onclick="editAdmin(${a.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteAdmin(${a.id})">Delete</button>
      </div></td>
    </tr>`;
  }).join('');
  const sel=el('new-admin-branch');
  if(sel&&sel.children.length<=1){ APP.branches.forEach(b=>{ const o=document.createElement('option'); o.value=b.id; o.textContent=b.name; sel.appendChild(o); }); }
}
function addAdmin(){
  const name=el('new-admin-name')?.value?.trim();
  const username=el('new-admin-user')?.value?.trim();
  const password=el('new-admin-pass')?.value?.trim();
  const branchId=parseInt(el('new-admin-branch')?.value||1);
  if(!name||!username||!password){ toast('Please fill all fields.','warning'); return; }
  const id=Math.max(...APP.branch_admins.map(a=>a.id))+1;
  APP.branch_admins.push({ id, name, username, password, branch_id:branchId, status:'active' });
  saveState(); closeModal('add-admin-modal'); renderAdminsTable(); renderAdminStats();
  toast(`Admin "${name}" created! 👤`,'success');
}
function editAdmin(id){ const a=APP.branch_admins.find(x=>x.id===id); if(!a) return; const name=prompt('Edit admin name:',a.name); if(name){ a.name=name; saveState(); renderAdminsTable(); toast('Admin updated!','success'); } }
function deleteAdmin(id){ if(!confirm('Delete this admin?')) return; APP.branch_admins=APP.branch_admins.filter(a=>a.id!==id); saveState(); renderAdminsTable(); renderAdminStats(); toast('Admin removed.','warning'); }

function backupSystem(){
  const btn=el('backup-btn'); if(btn){btn.textContent='⏳ Backing up…';btn.disabled=true;}
  setTimeout(()=>{
    toast('System backup completed successfully! 💾','success',4000);
    setTxt('last-backup-txt',`Last backup: ${new Date().toLocaleString()}`);
    if(btn){btn.textContent='💾 Backup Now';btn.disabled=false;}
  },2200);
}

function changePin(){
  const np=el('new-pin-inp')?.value?.trim();
  if(!np||np.length<3){ toast('PIN must be at least 3 digits.','warning'); return; }
  APP.security_pin=np; saveState(); toast('Security PIN updated! 🔑','success');
}

/* ── Charts ──────────────────────────────────────────────────── */
function initCharts(){
  setTimeout(()=>{
    if(!window.Chart) return;
    Chart.defaults.color='#6a90c4';
    Chart.defaults.font.family='Exo 2, sans-serif';

    const income=el('income-chart');
    if(income) new Chart(income,{ type:'line', data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets:[{ label:'Monthly Income (₱)', data:[45000,52000,61000,58000,67000,74000],
        borderColor:'#2277ff', backgroundColor:'rgba(0,100,255,.10)', borderWidth:2.5, fill:true, tension:.4,
        pointBackgroundColor:'#00c8f0', pointBorderColor:'#00c8f0', pointRadius:5 }] },
      options:{ responsive:true, plugins:{legend:{labels:{color:'#6a90c4'}}},
        scales:{ x:{ticks:{color:'#3d5a88'},grid:{color:'rgba(0,100,255,.08)'}},
          y:{ticks:{color:'#3d5a88',callback:v=>'₱'+v.toLocaleString()},grid:{color:'rgba(0,100,255,.08)'}} } } });

    const donut=el('client-chart');
    if(donut) new Chart(donut,{ type:'doughnut', data:{ labels:APP.branches.map(b=>b.name),
      datasets:[{ data:APP.branches.map(b=>b.clients),
        backgroundColor:['#0055e5','#00c8f0','#7b2fff','#00c853'], borderWidth:0, hoverOffset:8 }] },
      options:{ responsive:true, plugins:{legend:{labels:{color:'#6a90c4',padding:16},position:'bottom'}} } });

    const bar=el('branch-rev-chart');
    if(bar) new Chart(bar,{ type:'bar', data:{ labels:APP.branches.map(b=>b.name.replace('Oftix ','')),
      datasets:[{ label:'Revenue (₱)', data:[35976,27982,46469,22485],
        backgroundColor:['rgba(0,85,229,.8)','rgba(0,200,240,.8)','rgba(123,47,255,.8)','rgba(0,200,80,.8)'], borderRadius:8 }] },
      options:{ responsive:true, plugins:{legend:{display:false}},
        scales:{ x:{ticks:{color:'#3d5a88'},grid:{display:false}},
          y:{ticks:{color:'#3d5a88',callback:v=>'₱'+v.toLocaleString()},grid:{color:'rgba(0,100,255,.08)'}} } } });

    const pie=el('plans-chart');
    if(pie) new Chart(pie,{ type:'pie', data:{ labels:APP.plans.map(p=>p.name),
      datasets:[{ data:[20,35,30,15],
        backgroundColor:['rgba(0,200,80,.8)','rgba(0,85,229,.8)','rgba(0,200,240,.8)','rgba(123,47,255,.8)'], borderWidth:0 }] },
      options:{ responsive:true, plugins:{legend:{labels:{color:'#6a90c4',padding:14},position:'bottom'}} } });

    const brc2=el('branch-rev-chart2');
    if(brc2) new Chart(brc2,{ type:'bar', data:{ labels:APP.branches.map(b=>b.name.replace('Oftix ','')),
      datasets:[{ data:[35976,27982,46469,22485],
        backgroundColor:['rgba(0,85,229,.8)','rgba(0,200,240,.8)','rgba(123,47,255,.8)','rgba(0,200,80,.8)'], borderRadius:8 }] },
      options:{ responsive:true, plugins:{legend:{display:false}},
        scales:{ x:{ticks:{color:'#3d5a88'},grid:{display:false}},
          y:{ticks:{color:'#3d5a88',callback:v=>'₱'+v.toLocaleString()},grid:{color:'rgba(0,100,255,.08)'}} } } });
  }, 400);
}

/* ================================================================
   LIGHT-PAGE FIBER CANVAS
   Subtle animated fiber cables for login, register, client pages.
   Very low opacity — just enough to feel "techy" on white BG.
   ================================================================ */
function initLightFiberBG(){
  const canvas = el('login-fiber-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* Palette: muted blues & cyans that work on white */
  const COLORS = [
    '0,85,229',
    '0,160,220',
    '80,40,180',
    '0,120,200',
    '40,80,200',
  ];

  function mkFiber(){
    const fromLeft = Math.random() > 0.4;
    const col = COLORS[Math.floor(Math.random() * COLORS.length)];
    const speed = 0.18 + Math.random() * 0.42;
    const len   = 160 + Math.random() * 240;
    const curve = (Math.random() - 0.5) * 140;

    return fromLeft
      ? { x:-len-40, y:Math.random()*H,  dx:speed, dy:(Math.random()-.5)*.2,
          len, curve, col, w:0.5+Math.random()*1.1,
          alpha:0.12+Math.random()*0.18, pulse:Math.random()*Math.PI*2, fromLeft:true }
      : { x:Math.random()*W, y:-len-40,  dx:(Math.random()-.5)*.2, dy:speed,
          len, curve, col, w:0.5+Math.random()*1.1,
          alpha:0.12+Math.random()*0.18, pulse:Math.random()*Math.PI*2, fromLeft:false };
  }

  /* Soft background nodes / dust specks */
  function mkDot(){
    return {
      x: Math.random()*W, y: Math.random()*H,
      r: 0.6+Math.random()*1.6,
      alpha: 0.06+Math.random()*0.12,
      pulse: Math.random()*Math.PI*2,
      sp: 0.006+Math.random()*0.014,
      col: COLORS[Math.floor(Math.random()*COLORS.length)],
    };
  }

  const FIBER_COUNT = 22;
  const DOT_COUNT   = 38;
  let fibers = Array.from({length: FIBER_COUNT}, mkFiber);
  const dots = Array.from({length: DOT_COUNT}, mkDot);

  function drawFiber(f){
    const tailX = f.fromLeft ? f.x - f.len : f.x + f.curve;
    const tailY = f.fromLeft ? f.y + f.curve : f.y - f.len;
    const cpX   = f.fromLeft ? f.x - f.len*0.5 + f.curve*.6 : f.x + f.curve*.5;
    const cpY   = f.fromLeft ? f.y + f.curve*.5             : f.y - f.len*0.5;
    const a     = f.alpha * (0.65 + 0.35*Math.sin(f.pulse));

    /* Glow halo */
    const halo = ctx.createLinearGradient(f.x, f.y, tailX, tailY);
    halo.addColorStop(0, `rgba(${f.col},${a*.8})`);
    halo.addColorStop(0.5,`rgba(${f.col},${a*.35})`);
    halo.addColorStop(1, `rgba(${f.col},0)`);
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.quadraticCurveTo(cpX, cpY, tailX, tailY);
    ctx.strokeStyle = halo;
    ctx.lineWidth   = f.w * 5;
    ctx.globalAlpha = 0.25;
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* Core line */
    const grad = ctx.createLinearGradient(f.x, f.y, tailX, tailY);
    grad.addColorStop(0, `rgba(${f.col},${a})`);
    grad.addColorStop(0.6,`rgba(${f.col},${a*.6})`);
    grad.addColorStop(1, `rgba(${f.col},0)`);
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.quadraticCurveTo(cpX, cpY, tailX, tailY);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = f.w;
    ctx.stroke();

    /* Bright tip */
    const tipA = Math.min(a*1.4, 0.55);
    const tipR = f.w * 2.2;
    const tipG = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, tipR*3.5);
    tipG.addColorStop(0, `rgba(${f.col},${tipA})`);
    tipG.addColorStop(1, `rgba(${f.col},0)`);
    ctx.beginPath(); ctx.arc(f.x, f.y, tipR*3.5, 0, Math.PI*2);
    ctx.fillStyle = tipG; ctx.fill();
    ctx.beginPath(); ctx.arc(f.x, f.y, tipR, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${f.col},${tipA})`; ctx.fill();
  }

  function tick(){
    ctx.clearRect(0, 0, W, H);

    /* Dots */
    dots.forEach(d=>{
      d.pulse += d.sp;
      const a = d.alpha*(0.5+0.5*Math.sin(d.pulse));
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${d.col},${a})`; ctx.fill();
    });

    /* Fibers */
    fibers.forEach((f, i)=>{
      f.pulse += 0.016;
      f.x += f.dx; f.y += f.dy;
      const oob = f.fromLeft ? f.x > W+f.len+80 : f.y > H+f.len+80;
      if(oob) fibers[i] = mkFiber();
      else    drawFiber(f);
    });

    requestAnimationFrame(tick);
  }
  tick();
}

/* ── DOM Ready ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', ()=>{
  loadState();
  initBG();
  initLightFiberBG();
  const page = window.location.pathname.split('/').pop() || 'index.html';
  if(page===''||page==='index.html')       initLogin();
  if(page==='register.html')               initRegister();
  if(page==='client-dashboard.html')       initClient();
  if(page==='branch-dashboard.html')       initBranch();
  if(page==='admin-dashboard.html')        initAdmin();
  initPinInputs('.pin-lt');
  initPinInputs('.pin-dk');
});

/* ── Contact Support Modal ───────────────────────────────────── */
function openContactModal(){
  loadState();
  const cd = APP.client_data || {};
  const user = APP.current_user || {};
  const branches = APP.branches || [];
  let branch = null;
  if(user.branch_id) branch = branches.find(b => b.id === user.branch_id);
  if(!branch && cd.branch) branch = branches.find(b => b.name === cd.branch);
  if(!branch) branch = branches[0] || { name:'Oftix Network', gcash:'09171234567', address:'Metro Manila' };

  const setEl = (id, val) => { const e = el(id); if(e) e.textContent = val; };
  setEl('contact-branch-name', branch.name    || 'Oftix Network');
  setEl('contact-branch-addr', branch.address || 'Metro Manila');
  setEl('contact-gcash',       branch.gcash   || '09171234567');
  openModal('contact-modal');
}

/* ── Window exports ──────────────────────────────────────────── */
window.openModal=openModal; window.closeModal=closeModal;
window.verifyAdminPIN=verifyAdminPIN;
window.submitApplication=submitApplication; window.submitPayment=submitPayment; window.submitTicket=submitTicket;
window.approveApp=approveApp; window.scheduleApp=scheduleApp; window.markInstalled=markInstalled; window.archiveApp=archiveApp;
window.verifyPayment=verifyPayment; window.respondTicket=respondTicket; window.saveGCash=saveGCash;
window.addBranch=addBranch; window.editBranch=editBranch; window.deleteBranch=deleteBranch;
window.addAdmin=addAdmin; window.editAdmin=editAdmin; window.deleteAdmin=deleteAdmin;
window.backupSystem=backupSystem; window.changePin=changePin;
window.toast=toast;
window.openContactModal=openContactModal;
