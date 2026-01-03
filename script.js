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
