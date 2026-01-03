(function(){
  const tabs = Array.from(document.querySelectorAll('.tab[data-tab]'));
  const panels = Array.from(document.querySelectorAll('.panel[data-panel]'));
  if(!tabs.length || !panels.length) return;

  function activate(id, focusTab){
    tabs.forEach(t=>{
      const on = t.dataset.tab === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if(on && focusTab) t.focus();
    });
    panels.forEach(p=>{
      p.hidden = p.dataset.panel !== id;
    });
    try{ history.replaceState(null,'','#'+id);}catch(e){}
  }

  tabs.forEach(t=>{
    t.addEventListener('click', ()=>activate(t.dataset.tab, false));
    t.addEventListener('keydown', (e)=>{
      const idx = tabs.indexOf(t);
      if(e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = (idx + dir + tabs.length) % tabs.length;
        activate(tabs[next].dataset.tab, true);
      }
      if(e.key === 'Home'){ e.preventDefault(); activate(tabs[0].dataset.tab, true); }
      if(e.key === 'End'){ e.preventDefault(); activate(tabs[tabs.length-1].dataset.tab, true); }
    });
  });

  const initial = (location.hash || '').slice(1);
  if(initial && tabs.some(t=>t.dataset.tab===initial)) activate(initial, false);
})();

/* ---- inline script block separator ---- */

/* Fix: если какой-то текст/блок случайно оказался вне вкладки (из-за разметки/закрывающих тегов),
   мы "подбираем" такие элементы и переносим внутрь подходящей панели. */
(function(){
  function moveOrphans(){
    const main = document.querySelector('main.main') || document.querySelector('main');
    if(!main) return;

    const mechanicsPanel = main.querySelector(".panel[data-panel='mechanics']");
    const targetPanel = mechanicsPanel || main.querySelector('.panel') || main;

    // Ищем элементы, похожие на контент вкладок, которые оказались вне .panel
    const candidates = Array.from(document.querySelectorAll('.answer, .section, .bbTable, details'))
      .filter(el => !el.closest('.panel') && !el.closest('.sidebar') && !el.closest('.tabs'));

    // Переносим только те, что лежат внутри общего контейнера страницы,
    // но вне main (типичный случай "вылетело ниже").
    candidates.forEach(el => {
      // не трогаем, если это уже внутри footer/header
      if(el.closest('footer') || el.closest('header')) return;
      // если элемент явно относится к ремеслу (формулы) — в mechanics
      const txt = (el.textContent || '').toLowerCase();
      if(mechanicsPanel && (txt.includes('формул') || txt.includes('ремесл') || txt.includes('формула'))){
        mechanicsPanel.appendChild(el);
      } else {
        targetPanel.appendChild(el);
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', moveOrphans);
  } else {
    moveOrphans();
  }
})();


/* ---- Global tooltip (render in <body> to avoid clipping by overflow) ---- */
(function(){
  const tip = document.getElementById('globalTooltip');
  if(!tip) return;

  const PAD = 10;   // gap between element and tooltip
  const EDGE = 10;  // gap from viewport edges
  let current = null;

  function getContent(el){
    // Prefer explicit attribute
    const dt = el.getAttribute('data-tip');
    if(dt) return dt;

    // Fallback: reuse embedded tooltip HTML
    const inner = el.querySelector('.hp-tooltip, .sv-tooltip');
    if(inner) return inner.innerHTML;

    return '';
  }

  function position(el){
    const r = el.getBoundingClientRect();

    // Tooltip size (requires it to be in DOM)
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;

    // Default: below, left-aligned
    let left = r.left;
    let top  = r.bottom + PAD;
    let place = 'bottom';

    // If doesn't fit below -> place above
    if(top + h > window.innerHeight - EDGE){
      top = r.top - PAD - h;
      place = 'top';
    }

    // Clamp vertically
    if(top < EDGE) top = EDGE;
    if(top + h > window.innerHeight - EDGE) top = window.innerHeight - EDGE - h;

    // Clamp horizontally
    if(left + w > window.innerWidth - EDGE){
      left = window.innerWidth - EDGE - w;
    }
    if(left < EDGE) left = EDGE;

    tip.style.left = left + 'px';
    tip.style.top  = top + 'px';
    tip.dataset.place = place;

    // Arrow X: target center, clamped inside tooltip
    const targetMid = r.left + r.width / 2;
    let arrowX = targetMid - left - 6; // 6 = half arrow square
    arrowX = Math.max(18, Math.min(w - 18, arrowX));
    tip.style.setProperty('--arrow-x', arrowX + 'px');
  }

  function show(el){
    const html = getContent(el);
    if(!html) return;

    current = el;
    tip.innerHTML = html;
    tip.classList.add('show');
    tip.setAttribute('aria-hidden','false');

    position(el);
  }

  function hide(){
    current = null;
    tip.classList.remove('show');
    tip.setAttribute('aria-hidden','true');
  }

  function findTarget(node){
    return node && node.closest ? node.closest('.hpvalwrap, .svtipwrap, [data-tip]') : null;
  }

  document.addEventListener('mouseover', (e)=>{
    const el = findTarget(e.target);
    if(!el) return;
    if(current === el) return;
    show(el);
  });

  document.addEventListener('mouseout', (e)=>{
    if(!current) return;
    const from = findTarget(e.target);
    if(from !== current) return;
    const rel = e.relatedTarget;
    if(rel && current.contains(rel)) return;
    hide();
  });

  document.addEventListener('focusin', (e)=>{
    const el = findTarget(e.target);
    if(!el) return;
    show(el);
  });

  document.addEventListener('focusout', (e)=>{
    const el = findTarget(e.target);
    if(el && el === current) hide();
  });

  window.addEventListener('scroll', ()=>{
    if(current) position(current);
  }, true);

  window.addEventListener('resize', ()=>{
    if(current) position(current);
  });
})();
