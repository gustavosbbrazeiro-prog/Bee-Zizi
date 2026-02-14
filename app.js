// =====================
// Bee & Zizi — App Core v5.2 (Refined for final adjustments)
// =====================
(function(){
  const $ = (sel, parent=document) => parent.querySelector(sel);
  const $$ = (sel, parent=document) => Array.from(parent.querySelectorAll(sel));

  // =====================================================
  // 🔧 GUIA RÁPIDO DE PERSONALIZAÇÃO
  // 1) STR (frases) • 2) ECON (economia/limites) • 3) LETTERS_CONFIG (cartas)
  // 4) SHOP_ITEMS (loja/temas) • 5) ALL_ACHIEVEMENTS (conquistas)
  // 6) Temas no style.css • 7) Datas na Home
  // =====================================================

  const STR = {
    surprises: [
      'Você me faz a pessoa mais feliz do mundo.',
      'Obrigada por existir do jeitinho que você é. ',
      'Hoje eu te escolho. Amanhã também. Sempre. ',
      'Toda conquista é muito melhor junto com você. '
    ],
    typingPhrases: [
      'Eu te amo do jeitinho que você é.',
      'Você é meu lugar seguro.',
      'Eu te amo mucho, mi love. ',
      'Te escolheria em todas as vidas.'
    ]
  };

  const ECON = {
    DAILY_CAP: 150,
    rewards: {
      checkin: 5,
      memoryBase: 10,
      typingLow: 5,
      typingMid: 10,
      typingHigh: 15,
      typingPerfect: 20,
      catchBase: 4,
      runBase: 5,
      surpriseMin: 0,
      surpriseMax: 5
    },
    cooldowns: { surpriseMs: 25000 },
    scratch: {
      dailyFree: 3,
      prizes: [
        { type: 'coins', amount: 25, weight: 8 },
        { type: 'coins', amount: 10, weight: 28 },
        { type: 'coins', amount: [2,5], weight: 50 },
        { type: 'sticker', weight: 10 },
        { type: 'theme',   weight: 4 }
      ]
    }
  };

  const defaultState = {
    version: 53,
    beeName: 'Bee', ziziName: 'Zizi',
    lovePoints: 0,
    streak: 0,
    lastCheckin: null,
    achievements: {},
    themePrimary: '#F6A6B2',
    theme: 'padrao',
    equippedTheme: null,
    lettersRead: 0,
    shopOwned: {},
    coinsDay: null,
    coinsEarned: 0,
    lastSurpriseAt: 0,
    playlist: [],
    records: { memoryBest: null, typingBest: 0, catchBest: 0, runBest: 0 },
    gallery: [],
    events: [],
    stats: { gamesPlayed: 0, memoryWins: 0, typingFinishes: 0, catchRuns: 0, runRuns: 0, eventsDone: 0 }
  };
  const KEY = 'bzState.v5.3';

  function migrate(){
    for(const k of ['bzState.v5.2','bzState.v5.1','bzState.v5']){
      try{ const old = JSON.parse(localStorage.getItem(k)); if(old){
        const {sound, achFilter, ...rest} = old; // drop removed fields
        return {...defaultState, ...rest, version:53};
      } }catch(e){}
    }
    return null;
  }
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || migrate() || {...defaultState}; }catch(e){ return {...defaultState}; } };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  let state = load();

  const todayKey = () => new Date().toISOString().slice(0,10);
  const toast = (text) => { const el = document.createElement('div'); el.className='toast'; el.setAttribute('role','status'); el.textContent = text; document.body.appendChild(el); setTimeout(()=> el.remove(), 1800); }
  const celebrate = (msg) => { const box = $('#confetti'); for(let i=0;i<18;i++){ const span = document.createElement('span'); span.className = 'confetti-emoji'; span.textContent = ['💛','💖','✨','🐝','💘'][Math.floor(Math.random()*5)]; span.style.left = Math.random()*100 + 'vw'; span.style.top = '10vh'; box.appendChild(span); setTimeout(()=> span.remove(), 1300);} if(msg) toast(msg); }

  function ensureDay(){ const tk = todayKey(); if(state.coinsDay !== tk){ state.coinsDay = tk; state.coinsEarned = 0; save(state); renderHeader(); } }
  function remainingToday(){ ensureDay(); return Math.max(0, ECON.DAILY_CAP - (state.coinsEarned||0)); }
  function addCoins(amount, reason=''){
    ensureDay(); amount = Math.max(0, Math.floor(amount));
    const rem = remainingToday(); const add = Math.min(rem, amount);
    if(add<=0){ toast('Limite diário atingido! Retorne amanhã 💛'); return {added:0,capped:true}; }
    state.lovePoints = Math.max(0, Math.floor(state.lovePoints + add));
    state.coinsEarned = (state.coinsEarned||0) + add; save(state); renderHeader();
    if(add>0){ celebrate(`+${add} moedinhas! ${reason?`(${reason})`:''}`);} return {added:add, capped:(add<amount)};
  }
  function bonusCoins(amount, reason=''){
    amount = Math.max(0, Math.floor(amount));
    state.lovePoints = Math.max(0, Math.floor(state.lovePoints + amount));
    save(state); renderHeader();
    celebrate(`+${amount} moedinhas (bônus)! ${reason?`(${reason})`:''}`);
    return amount;
  }
  const spendPoints = (n) => { if(state.lovePoints < n){ toast('Moedinhas insuficientes'); return false; } state.lovePoints -= n; save(state); renderHeader(); return true; }
  const unlock = (code) => { if(!state.achievements[code]){ state.achievements[code] = todayKey(); save(state); renderAchievements(); celebrate('Conquista desbloqueada!'); const ach = ALL_ACHIEVEMENTS.find(a=>a.code===code); if(ach?.rewardCoins){ bonusCoins(ach.rewardCoins, 'conquista'); } } }

  function renderHeader(){
    $('#lovePoints').textContent = state.lovePoints;
    $('#streak').textContent = state.streak;
    $('#achievementsCount').textContent = Object.keys(state.achievements).length;
    $('#nomeBee').textContent = state.beeName; $('#nomeZizi').textContent = state.ziziName; $('#footerBee').textContent = state.beeName; $('#footerZizi').textContent = state.ziziName;
    document.documentElement.style.setProperty('--primary', state.themePrimary);
    document.documentElement.setAttribute('data-theme', state.equippedTheme||state.theme);
    const cap = $('#dailyCapStatus'); if(cap){ cap.textContent = `${state.coinsEarned||0}/${ECON.DAILY_CAP} hoje`; }
    const q = $('#themeQuick'); if(q){ q.value = state.equippedTheme||state.theme||'padrao'; }
  }

  function renderThemeQuick(){ const sel=$('#themeQuick'); if(!sel) return; sel.innerHTML='';
    const entries=[
      {val:'padrao', label:'Claro', enabled:true},
      {val:'romantico', label:'Romântico', enabled:true},
      {val:'noite', label:'Noite Estrelada', enabled: !!state.shopOwned['theme_star']},
      {val:'neon', label:'Neon', enabled: !!state.shopOwned['theme_neon']},
      {val:'girassol', label:'Girassol', enabled: !!state.shopOwned['theme_sunflower']}
    ];
    entries.forEach(e=>{ const opt=document.createElement('option'); opt.value=e.val; opt.textContent = e.enabled? e.label : `🔒 ${e.label} (Loja)`; opt.disabled = !e.enabled; sel.appendChild(opt); })
    sel.value = state.equippedTheme||state.theme||'padrao';
    sel.onchange = ()=>{ state.equippedTheme = sel.value; save(state); renderHeader(); toast('Tema aplicado!'); };
  }

  // Cartinhas
  const LETTERS_CONFIG = [
    { id:'L1', type:'free', emoji:'💌', title:'Carta Livre #1', text:'Escreva aqui seu carinho livre 1.' },
    { id:'L2', type:'free', emoji:'🌻', title:'Carta Livre #2', text:'Seu texto fofinho aqui 2.' },
    { id:'L3', type:'free', emoji:'🍯', title:'Carta Livre #3', text:'Seu texto fofinho aqui 3.' },
    { id:'L4', type:'free', emoji:'🗺️', title:'Carta Livre #4', text:'Seu texto fofinho aqui 4.' },
    { id:'L5', type:'free', emoji:'⭐', title:'Carta Livre #5', text:'Seu texto fofinho aqui 5.' },
    { id:'C1', type:'shop', shopId:'cardpack1', emoji:'💖', title:'Carta Comprada #1', text:'Texto de carta comprada 1.' },
    { id:'C2', type:'shop', shopId:'cardpack1', emoji:'🎀', title:'Carta Comprada #2', text:'Texto de carta comprada 2.' },
    { id:'C3', type:'shop', shopId:'cardpack1', emoji:'✨', title:'Carta Comprada #3', text:'Texto de carta comprada 3.' },
    { id:'C4', type:'shop', shopId:'cardpack1', emoji:'💫', title:'Carta Comprada #4', text:'Texto de carta comprada 4.' },
    { id:'C5', type:'shop', shopId:'cardpack1', emoji:'🎁', title:'Carta Comprada #5', text:'Texto de carta comprada 5.' },
    { id:'D1', type:'date', unlockDate:'2026-02-14', emoji:'💘', title:'Carta de Data #1', text:'A partir de 14/02.' },
    { id:'D2', type:'date', unlockDate:'2026-06-12', emoji:'🎉', title:'Carta de Data #2', text:'A partir de 12/06.' },
    { id:'D3', type:'date', unlockDate:'2026-12-25', emoji:'🎄', title:'Carta de Data #3', text:'A partir de 25/12.' },
    { id:'E1', type:'event', eventId:'aniversario-zizi', emoji:'🎂', title:'Carta do Aniversário', text:'Libera no dia do evento “aniversario-zizi”.' },
    { id:'E2', type:'event', eventId:'viagem',          emoji:'🧳', title:'Carta da Viagem',      text:'Libera no dia do evento “viagem”.' }
  ];
  function findEventById(id){ return (state.events||[]).find(e=>e.id===id); }
  function isLetterUnlocked(cfg){
    if(cfg.type==='free') return true;
    if(cfg.type==='shop') return !!state.shopOwned[cfg.shopId];
    if(cfg.type==='date'){ return todayKey() >= cfg.unlockDate; }
    if(cfg.type==='event'){ const ev=findEventById(cfg.eventId); if(!ev) return false; return todayKey() >= ev.date; }
    return false;
  }
  function renderLetters(){
    const wrap = $('#cardsContainer'); wrap.innerHTML='';
    LETTERS_CONFIG.forEach((cfg, idx)=>{
      const unlocked = isLetterUnlocked(cfg);
      const info = cfg.type==='date'?` • Libera em ${cfg.unlockDate}` : cfg.type==='shop'?` • Requer: ${cfg.shopId}` : (cfg.type==='event'?` • Evento: ${cfg.eventId}`:'');
      const card = document.createElement('article'); card.className='card';
      card.innerHTML = `
        <div class="card-emoji">${unlocked?cfg.emoji:'🔒'}</div>
        <h3>${cfg.title}${unlocked?'':' (Bloqueada)'}</h3>
        <p class="muted">#${idx+1}${info}</p>
        <div class="card-actions">
          <button class="btn sm" ${unlocked?'':'disabled'} data-open-letter="${cfg.id}">${unlocked?'Ler':'Bloqueada'}</button>
        </div>`;
      wrap.appendChild(card);
    });
  }
  document.addEventListener('click', (e)=>{
    const btn=e.target.closest('[data-open-letter]'); if(!btn) return; const id=btn.getAttribute('data-open-letter');
    const cfg = LETTERS_CONFIG.find(x=>x.id===id); if(!cfg) return; if(!isLetterUnlocked(cfg)) return;
    openModal(cfg.title, `<p style='white-space:pre-line;word-break:break-word'>${cfg.text}</p>`);
    state.lettersRead++; save(state); addCoins(6,'leu uma carta'); if(state.lettersRead>=3) unlock('letters3'); if(state.lettersRead>=10) unlock('letters10');
  });

  // Galeria — render com tamanho e tilt românticos
  const renderGallery = () => {
    const grid = $('#galleryGrid'); grid.innerHTML='';
    if(!state.gallery.length){ const ph=document.createElement('div'); ph.className='embed-placeholder'; ph.style.minHeight='120px'; ph.innerHTML='<p>Arraste imagens aqui ou use "Adicionar fotos".</p>'; grid.appendChild(ph); return; }
    state.gallery.forEach((g, i)=>{
      const fig=document.createElement('figure'); fig.dataset.index=String(i);
      // tamanhos e rotação leves
      const sizes=['sz-s','sz-m','sz-l']; const tilts=['tiltL','tiltR'];
      const sz=sizes[(i)%sizes.length]; const tilt=tilts[i%tilts.length];
      fig.classList.add(sz, tilt);
      const img=document.createElement('img'); img.className='thumb'; img.alt=g.caption||('Foto '+(i+1)); img.src=g.src; fig.appendChild(img);
      const cap=document.createElement('figcaption'); cap.textContent=g.caption||('Foto '+(i+1)); fig.appendChild(cap);
      fig.addEventListener('click', ()=> openLightbox(i)); grid.appendChild(fig);
    })
  }
  const addToGallery = async (files) => { const max = 12; for(const f of files){ if(!f.type.startsWith('image/')) continue; if(state.gallery.length>=max){ toast('Limite de 12 fotos atingido'); break; } const dataUrl = await fileToDataURL(f); state.gallery.push({src:dataUrl, caption:f.name}); } save(state); renderGallery(); toast('Fotos adicionadas!'); }
  const fileToDataURL = (file) => new Promise((res)=>{ const r=new FileReader(); r.onload=()=>res(String(r.result)); r.readAsDataURL(file); });
  const setupDragDrop = () => { const g=$('#galleryGrid'); const on=(evn,fn)=> g.addEventListener(evn,fn); ['dragenter','dragover'].forEach(e=> on(e,(ev)=>{ ev.preventDefault(); g.classList.add('dragover'); })); ['dragleave','drop'].forEach(e=> on(e,(ev)=>{ ev.preventDefault(); g.classList.remove('dragover'); })); on('drop',(ev)=>{ const files=ev.dataTransfer?.files; if(files) addToGallery(files); }); }
  let lbIndex = -1; const openLightbox = (i) => { lbIndex = i; const item = state.gallery[i]; if(!item) return; const html = `<div style='text-align:center'> <img src='${item.src}' alt='' style='max-width:100%;max-height:70vh;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.2)'/> <div style='display:flex;justify-content:space-between;gap:8px;margin-top:8px'> <button class='btn sm' id='lbPrev'>← Anterior</button> <span class='muted'>${item.caption||''}</span> <button class='btn sm' id='lbNext'>Próxima →</button> </div> </div>`; openModal('Foto', html); setTimeout(()=>{ $('#lbPrev')?.addEventListener('click', ()=>{ lbIndex=(lbIndex-1+state.gallery.length)%state.gallery.length; openLightbox(lbIndex); }); $('#lbNext')?.addEventListener('click', ()=>{ lbIndex=(lbIndex+1)%state.gallery.length; openLightbox(lbIndex); }); }, 0); }

  // Playlist (.mp3 locais) — autoplay após gesto do usuário + troca automática
  async function initPlaylist(){
    try{ const res = await fetch('data/playlist.json'); const pl = await res.json(); state.playlist = pl.tracks||[]; }catch(e){ state.playlist = []; }
    const audio = $('#audioPlayer'); const info = $('#trackInfo'); const listEl = $('#trackList');
    listEl.innerHTML = '';
    state.playlist.forEach((t, i)=>{ const li = document.createElement('li'); const a = document.createElement('a'); a.href='#'; a.textContent = `${t.title} — ${t.artist||''}`.trim(); a.addEventListener('click', (ev)=>{ ev.preventDefault(); play(i); }); li.appendChild(a); listEl.appendChild(li); });
    let idx = 0;
    function play(i){ idx = i; const t = state.playlist[idx]; if(!t) return; audio.src = t.src; info.textContent = `${t.title}${t.artist?(' — '+t.artist):''}`; audio.play().catch(()=>{}); }
    audio.addEventListener('ended', ()=>{ if(!state.playlist.length) return; idx = (idx+1)%state.playlist.length; play(idx); });
    const kick = ()=>{ if(audio.paused && state.playlist.length){ play(0); } window.removeEventListener('click', kick, true); window.removeEventListener('pointerdown', kick, true); window.removeEventListener('keydown', kick, true); };
    window.addEventListener('click', kick, {capture:true, once:true});
    window.addEventListener('pointerdown', kick, {capture:true, once:true});
    window.addEventListener('keydown', kick, {capture:true, once:true});
  }

  const initTabs = () => { const tabs=$$('.tab'); const panels=$$('.panel'); tabs.forEach(tab=>{ tab.addEventListener('click', ()=>{ tabs.forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); }); panels.forEach(p=> p.classList.remove('active')); tab.classList.add('active'); tab.setAttribute('aria-selected','true'); $('#'+tab.getAttribute('aria-controls')).classList.add('active'); }) }) }

  const modal = $('#modal');
  const openModal = (title, html) => { $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; modal.setAttribute('aria-hidden','false'); }
  const closeModal = () => modal.setAttribute('aria-hidden','true');
  modal.addEventListener('click', (e)=>{ if(e.target.hasAttribute('data-close')) { closeModal(); } });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && modal.getAttribute('aria-hidden')==='false'){ closeModal(); } });

  $('#btnCheckin').addEventListener('click', ()=>{ const t=todayKey(); if(state.lastCheckin===t){ toast('Você já fez o check-in hoje 🐝'); return; } const y = new Date(); y.setDate(y.getDate()-1); const yk=y.toISOString().slice(0,10); state.streak = (state.lastCheckin===yk)? state.streak+1 : 1; state.lastCheckin=t; save(state); addCoins(ECON.rewards.checkin,'check-in diário'); if(state.streak>=3) unlock('streak_3'); if(state.streak>=7) unlock('streak_7'); })
  $('#btnSurpresa').addEventListener('click', ()=>{ const now = Date.now(); if(now - (state.lastSurpriseAt||0) < ECON.cooldowns.surpriseMs){ const wait = Math.ceil((ECON.cooldowns.surpriseMs - (now-(state.lastSurpriseAt||0)))/1000); toast(`Aguarde ${wait}s para outra surpresinha ✨`); return; } state.lastSurpriseAt = now; save(state); const msg = STR.surprises[Math.floor(Math.random()*STR.surprises.length)]; openModal('Surpresinha', `<p style='font-size:1.1rem'>${msg}</p>`); const rnd = ECON.rewards.surpriseMin + Math.floor(Math.random()*(ECON.rewards.surpriseMax-ECON.rewards.surpriseMin+1)); addCoins(rnd,'surpresinha'); })
  $('#btnRaspadinha').addEventListener('click', openScratch);
  function openScratch(){ ensureDay(); state.scratchUsed = state.scratchUsed || {}; const used = state.scratchUsed[todayKey()]||0; const remaining = Math.max(0, ECON.scratch.dailyFree - used); const html = `<div><p class='muted'>Raspadinhas grátis hoje: <strong>${remaining}</strong> de ${ECON.scratch.dailyFree}</p><div id='scratchPrizeLabel' style='text-align:center;font-weight:700;margin:.3rem 0;'></div><canvas id='scratchCanvas' width='560' height='220' style='width:100%;border-radius:12px;box-shadow:var(--shadow);display:block;margin:auto'></canvas><div style='margin-top:.6rem;display:flex;gap:.5rem'><button class='btn sm' id='btnScratchNew'>Nova</button></div><div id='scratchResult' class='muted' style='margin-top:.4rem'></div></div>`; openModal('Raspadinha 🎟️', html); const canvas = $('#scratchCanvas'); const ctx = canvas.getContext('2d'); const w=canvas.width, h=canvas.height; const prize = pickPrize(); ctx.save(); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#222'; ctx.font='bold 24px system-ui, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(prizeLabel(prize), w/2, h/2); ctx.restore(); const overlay = document.createElement('canvas'); overlay.width=w; overlay.height=h; const octx=overlay.getContext('2d'); octx.fillStyle='#bfbfbf'; octx.fillRect(0,0,w,h); octx.fillStyle='#9a9a9a'; for(let i=0;i<w;i+=18){ octx.fillRect(i,0,9,h);} ctx.globalCompositeOperation='source-over'; ctx.drawImage(overlay,0,0); let scratching=false; let cleared=0; const total=w*h; const R=18; function scratch(x,y){ ctx.globalCompositeOperation='destination-out'; ctx.beginPath(); ctx.arc(x,y,R,0,Math.PI*2); ctx.fill(); cleared += Math.PI*R*R; if(cleared/total>0.3) reveal(); } canvas.addEventListener('pointerdown', (e)=>{ scratching=true; const r=canvas.getBoundingClientRect(); scratch(e.clientX-r.left, e.clientY-r.top); }); canvas.addEventListener('pointermove', (e)=>{ if(!scratching) return; const r=canvas.getBoundingClientRect(); scratch(e.clientX-r.left, e.clientY-r.top); }); document.addEventListener('pointerup', ()=> scratching=false, {once:false}); function reveal(){ if(state.scratchUsed[todayKey()]>=ECON.scratch.dailyFree){ $('#scratchResult').textContent = 'Limite diário de raspadinhas atingido.'; return; } state.scratchUsed[todayKey()] = (state.scratchUsed[todayKey()]||0) + 1; save(state); const res = grantPrize(prize); $('#scratchPrizeLabel').textContent = `Prêmio: ${prizeLabel(prize)}`; $('#scratchResult').textContent = res.msg; } $('#btnScratchNew').addEventListener('click', ()=>{ closeModal(); setTimeout(openScratch, 50); }); }
  function randBetween(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
  function pickPrize(){ const bag=[]; ECON.scratch.prizes.forEach(p=>{ for(let i=0;i<(p.weight||1); i++) bag.push(p); }); return bag[Math.floor(Math.random()*bag.length)]; }
  function prizeLabel(p){ if(p.type==='coins'){ const amt = Array.isArray(p.amount)? `${p.amount[0]}–${p.amount[1]}` : p.amount; return `${amt} moedinhas`; } if(p.type==='sticker') return 'Sticker raro'; if(p.type==='theme') return 'Tema aleatório'; return 'Prêmio'; }
  function grantPrize(p){ if(p.type==='coins'){ const amt = Array.isArray(p.amount)? randBetween(p.amount[0], p.amount[1]) : p.amount; const {added,capped} = addCoins(amt,'raspadinha'); return {msg: `+${added} moedinhas${capped?' (cap atingido)':''}`}; } if(p.type==='theme'){ if(!state.shopOwned['theme_neon']){ state.shopOwned['theme_neon']=true; save(state); renderShop(); return {msg:'Tema Neon desbloqueado!'} } const {added}=addCoins(10,'raspadinha'); return {msg:`Tema duplicado → +${added} moedas`}; } if(p.type==='sticker'){ if(!state.shopOwned['stickers1']){ state.shopOwned['stickers1']=true; save(state); renderShop(); return {msg:'Pacote de Stickers desbloqueado!'} } const {added}=addCoins(5,'raspadinha'); return {msg:`Sticker duplicado → +${added} moedas`}; } return {msg:'Prêmio recebido!'} }

  function renderDates(){ const list=$('#datesList'); list.innerHTML=''; const events = [...(state.events||[])].sort((a,b)=> a.date.localeCompare(b.date)); const today = todayKey(); const upcoming = events.filter(e=> e.date>=today).slice(0,5); if(!upcoming.length){ const li=document.createElement('li'); li.className='muted'; li.textContent='Sem datas por enquanto.'; list.appendChild(li); return; } upcoming.forEach(ev=>{ const li=document.createElement('li'); li.className='dates-item'; const days = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime())/86400000); const canComplete = today >= ev.date && !ev.done; li.innerHTML = `<span><strong>${ev.title}</strong> <span class='when'>• ${ev.date} (${days>=0?days:0} dia${days>1?'s':''})</span></span> <span> ${ canComplete?`<button class='btn sm' data-done-date='${ev.id}'>Concluir</button>`:`<button class='btn sm' data-del-date='${ev.id}'>Remover</button>`} </span>`; list.appendChild(li); }) }
  $('#btnAddDate').addEventListener('click', ()=>{ const html = `<div class='form'>
      <label>Título<br><input id='evTitle' type='text' placeholder='Aniversário, viagem...'></label>
      <label class='mt'>ID (opcional, ex.: aniversario-zizi)<br><input id='evId' type='text' placeholder='id-para-vincular-carta'></label>
      <label class='mt'>Data<br><input id='evDate' type='date'></label>
      <div class='mt'><button class='btn primary' id='evSave'>Salvar</button></div>
    </div>`; openModal('Nova data', html); setTimeout(()=>{ $('#evSave').addEventListener('click', ()=>{ const t=$('#evTitle').value.trim(); const d=$('#evDate').value; let id=$('#evId').value.trim(); if(!t||!d){ toast('Preencha título e data'); return; } if(!id){ id = titleSafe(t); } state.events = state.events||[]; state.events.push({id, title:t, date:d}); save(state); closeModal(); renderDates(); toast('Data adicionada!'); }) },0); })
  document.addEventListener('click',(e)=>{ const del=e.target.closest('[data-del-date]'); if(del){ const id=del.getAttribute('data-del-date'); state.events = (state.events||[]).filter(ev=>ev.id!==id); save(state); renderDates(); return; } const done=e.target.closest('[data-done-date]'); if(done){ const id=done.getAttribute('data-done-date'); const ev=findEventById(id); if(ev && !ev.done){ ev.done=true; state.stats.eventsDone++; save(state); toast('Evento concluído!'); unlock('event_first'); if(state.stats.eventsDone>=3) unlock('events_3'); renderDates(); renderAchievements(); } } })
  function titleSafe(t){ return t.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').slice(0,32); }

  // Jogos
  const memoryEmojis = ['💛','💖','🐝','🌻','🍯','⭐','🎀','✨'];
  let memoryLock=false, memoryFirst=null, memoryMoves=0, memoryPairs=0;
  const setupMemory = () => { const grid=$('#memoryGrid'); grid.innerHTML=''; const deck=[...memoryEmojis, ...memoryEmojis].map((emoji,i)=> ({ id:i+'-'+Math.random().toString(36).slice(2), emoji})).sort(()=> Math.random()-.5); memoryLock=false; memoryFirst=null; memoryMoves=0; memoryPairs=0; $('#memoryMoves').textContent='0'; $('#memoryPairs').textContent='0'; deck.forEach(card=>{ const el=document.createElement('button'); el.className='memory-card'; el.setAttribute('data-id', card.id); el.setAttribute('aria-label','Carta de memória'); el.innerHTML = '<span class="front">?</span><span class="back" aria-hidden="true">'+card.emoji+'</span>'; el.addEventListener('click', ()=> { memoryFlip(el, card); }); grid.appendChild(el); }) }
  const memoryFlip = (el, card) => { if(memoryLock || el.classList.contains('matched') || el.classList.contains('revealed')) return; el.classList.add('revealed'); if(!memoryFirst){ memoryFirst = {el, card}; return; } memoryLock = true; memoryMoves++; $('#memoryMoves').textContent = memoryMoves; if(memoryFirst.card.emoji === card.emoji){ setTimeout(()=>{ el.classList.add('matched'); memoryFirst.el.classList.add('matched'); memoryPairs++; $('#memoryPairs').textContent = memoryPairs; memoryLock=false; memoryFirst=null; if(memoryPairs===8){ let bonus = 0; if(memoryMoves<=12) bonus=10; else if(memoryMoves<=18) bonus=4; addCoins(ECON.rewards.memoryBase+bonus, 'jogo da memória'); unlock('memory_first'); state.stats.memoryWins++; state.stats.gamesPlayed++; save(state); renderHeader(); renderAchievements(); } }, 280); } else { setTimeout(()=>{ [el, memoryFirst.el].forEach(x=> x.classList.remove('revealed')); memoryLock=false; memoryFirst=null; }, 480); } }
  $('#btnMemoryNovo').addEventListener('click', ()=>{ setupMemory(); });

  let typingTarget='', typingTimer=null, typingTime=0;
  const startTyping = () => { typingTarget = STR.typingPhrases[Math.floor(Math.random()*STR.typingPhrases.length)]; $('#typingPhrase').textContent = typingTarget; $('#typingInput').value=''; $('#typingTime').textContent='0'; $('#typingAcc').textContent='0'; if(typingTimer) clearInterval(typingTimer); typingTime=0; typingTimer = setInterval(()=>{ typingTime++; $('#typingTime').textContent = String(typingTime); if(typingTime>=25){ finishTyping(); } }, 1000); $('#typingInput').focus(); }
  const finishTyping = () => { if(!typingTimer) return; clearInterval(typingTimer); typingTimer=null; const typed=$('#typingInput').value; const acc = Math.max(0, Math.round(100 * similarity(typed, typingTarget))); $('#typingAcc').textContent = String(acc); let gain = ECON.rewards.typingLow; if(acc>=95) gain = ECON.rewards.typingPerfect; else if(acc>=80) gain = ECON.rewards.typingHigh; else if(acc>=60) gain = ECON.rewards.typingMid; addCoins(gain, 'digite com amor'); unlock('typing_first'); state.stats.typingFinishes++; state.stats.gamesPlayed++; save(state); renderHeader(); renderAchievements(); }
  const similarity = (a,b) => { if(!a && !b) return 1; if(!a || !b) return 0; const len = Math.max(a.length, b.length); let same=0; for(let i=0;i<Math.min(a.length,b.length);i++){ if(a[i]===b[i]) same++; } return same/len; }
  $('#btnTypingNovo').addEventListener('click', startTyping);
  $('#typingInput').addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); finishTyping(); }});

  let catchRunning=false, catchLeft=0, catchCount=0, catchTimer=null;
  const startCatch = () => { const arena=$('#catchArena'); arena.innerHTML=''; catchRunning=true; catchLeft=24; catchCount=0; $('#catchCount').textContent='0'; $('#catchRemaining').textContent=String(catchLeft); const duration=15000; const spawn = () => { if(!catchRunning) return; if(catchLeft<=0) return; const el=document.createElement('span'); el.className='heart'; el.textContent='💗'; const y=Math.random()*(arena.clientHeight-24); el.style.top = y+'px'; el.style.left = '-24px'; arena.appendChild(el); const travel = arena.clientWidth + 60; const speed = 4200 + Math.random()*2000; const startT = performance.now(); const step = (t) => { const dt = t - startT; const x = Math.min(1, dt/speed) * travel - 30; el.style.transform = `translateX(${x}px)`; if(dt < speed && catchRunning) requestAnimationFrame(step); else el.remove(); } ; requestAnimationFrame(step); el.addEventListener('click', ()=>{ el.remove(); catchCount++; $('#catchCount').textContent=String(catchCount); }) ; catchLeft--; $('#catchRemaining').textContent=String(catchLeft); if(catchLeft>0) setTimeout(spawn, 520 + Math.random()*520); } ; spawn(); if(catchTimer) clearTimeout(catchTimer); catchTimer=setTimeout(()=>{ catchRunning=false; const gain=ECON.rewards.catchBase + Math.min(24, catchCount*2); addCoins(gain, 'caça-corações'); unlock('catch_first'); state.stats.catchRuns++; state.stats.gamesPlayed++; save(state); renderHeader(); renderAchievements(); }, duration); }
  $('#btnCatchStart').addEventListener('click', ()=>{ startCatch(); });

  let runTimer=null, runScore=0, playerLane=1, running=false;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
  const startRun = () => {
    const arena = $('#runArena'); arena.innerHTML=''; arena.focus(); running=true; runScore=0; playerLane=1; $('#runScore').textContent='0';
    for(let i=0;i<3;i++){ const lane=document.createElement('div'); lane.className='run-lane'; lane.style.top=(i*33.33)+'%'; lane.style.height='33.33%'; arena.appendChild(lane); }
    const player = document.createElement('div'); player.className='runner'; player.textContent='🐝'; arena.appendChild(player);
    const placePlayer = ()=>{ const h = arena.clientHeight; const y = ((playerLane + 0.5) * (h/3)); player.style.left='40px'; player.style.top= y+'px'; }
    placePlayer();
    const key = (e)=>{ if(!running) return; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); if(e.key==='ArrowUp'){ playerLane=Math.max(0, playerLane-1); placePlayer(); } else if(e.key==='ArrowDown'){ playerLane=Math.min(2, playerLane+1); placePlayer(); } }
    arena.addEventListener('keydown', key, {passive:false});
    function docKey(e){ if(!running) return; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)){ e.preventDefault(); }}
    document.addEventListener('keydown', docKey, {passive:false});

    const runControls = $('#runControls'); runControls.setAttribute('aria-hidden', String(!isTouch)); if(isTouch){ const up=$('#runUp'), down=$('#runDown'); up.onclick=()=>{ if(!running) return; playerLane=Math.max(0, playerLane-1); placePlayer(); }; down.onclick=()=>{ if(!running) return; playerLane=Math.min(2, playerLane+1); placePlayer(); }; }

    const rectsIntersect = (a,b)=> !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    const spawnThing = () => { if(!running) return; const thing = document.createElement('div'); const isPickup = Math.random()<0.6; thing.className = isPickup ? 'pickup' : 'obstacle'; thing.textContent = isPickup ? '💗' : '☁'; const lane = Math.floor(Math.random()*3); thing.dataset.lane = String(lane); arena.appendChild(thing); const h = arena.clientHeight; const y = ((lane + 0.5) * (h/3)); thing.style.top = y+'px'; thing.style.left = arena.clientWidth+'px'; const speed = 3 + Math.random()*2; const tick = () => { if(!running) { thing.remove(); return; } const x = (parseFloat(thing.style.left)||0) - speed; thing.style.left = x+'px'; const pr = player.getBoundingClientRect(); const tr = thing.getBoundingClientRect(); if(rectsIntersect(pr,tr)){ if(thing.className==='pickup'){ runScore+=2; $('#runScore').textContent=String(runScore); thing.remove(); } else { running=false; endRun(); thing.remove(); } } if(x>-20) requestAnimationFrame(tick); else thing.remove(); } ; requestAnimationFrame(tick); if(running) setTimeout(spawnThing, 800 + Math.random()*700); }
    spawnThing(); if(runTimer) clearTimeout(runTimer); runTimer = setTimeout(()=>{ running=false; endRun(); }, 30000);
    function endRun(){ document.removeEventListener('keydown', docKey); const gain = ECON.rewards.runBase + Math.min(20, Math.floor(runScore/2)); addCoins(gain, 'corrida das abelhinhas'); unlock('run_first'); state.stats.runRuns++; state.stats.gamesPlayed++; if(runScore > (state.records.runBest||0)){ state.records.runBest = runScore; } save(state); renderHeader(); renderAchievements(); openModal('Fim de Jogo', `<p>Pontuação: <strong>${runScore}</strong></p><p>Dica: use ↑ e ↓ (ou botões) para trocar de faixa.</p>`); }
  }
  $('#btnRunStart').addEventListener('click', ()=>{ startRun(); });

  // Loja
  const SHOP_ITEMS = [
    { id:'stickers1', icon:'🎀', title:'Pacote de Stickers',    desc:'Novos emojis em confetes e surpresas.', price:120, type:'pack',  apply:()=>{} },
    { id:'theme_star', icon:'🌌', title:'Tema Noite Estrelada', desc:'Ativa o tema Noite e muda cor primária.', price:180, type:'theme', theme:'noite',     apply:()=>{ state.theme = 'noite'; state.themePrimary = '#8a4fff'; } },
    { id:'theme_neon', icon:'🟩', title:'Tema Neon',            desc:'Visual neon com alto contraste.',       price:500, type:'theme', theme:'neon',      apply:()=>{ state.theme = 'neon'; } },
    { id:'theme_sunflower', icon:'🌻', title:'Tema Girassol',   desc:'Cores quentinhas de girassol ☀️',      price:220, type:'theme', theme:'girassol',  apply:()=>{ state.theme = 'girassol'; } },
    { id:'cardpack1', icon:'💌', title:'Pacote de Cartas #1',   desc:'Desbloqueia 5 cartinhas especiais.',    price:200, type:'cardpack', apply:()=>{} },
  ];
  function renderShop(){ const grid=$('#shopGrid'); grid.innerHTML=''; SHOP_ITEMS.forEach(p=>{ const owned=!!state.shopOwned[p.id]; const isTheme = p.type==='theme'; const equipped = isTheme && (state.equippedTheme===p.theme); const priceArea = owned? (isTheme? (equipped?`<span class='owned'>Equipado</span>`:`<button class='btn sm' data-equip='${p.id}'>Equipar</button>`) : `<span class='owned'>Comprado</span>`) : `<div class='price'>${p.price} 💛</div><button class='btn sm' data-buy='${p.id}'>Comprar</button>`; const el=document.createElement('div'); el.className='product'; el.innerHTML = `<div class='icon'>${p.icon}</div> <div class='meta'><div><strong>${p.title}</strong></div><div class='muted'>${p.desc}</div></div> <div class='price-area'>${priceArea}</div>`; grid.appendChild(el); }) }
  document.addEventListener('click', (e)=>{
    const buyBtn=e.target.closest('[data-buy]'); if(buyBtn){ const id=buyBtn.getAttribute('data-buy'); const item=SHOP_ITEMS.find(i=>i.id===id); if(!item) return; if(state.shopOwned[id]){ toast('Você já tem este item'); return; } if(!spendPoints(item.price)) return; state.shopOwned[id]=true; item.apply?.(); save(state); toast('Item comprado!'); renderShop(); return; }
    const eqBtn=e.target.closest('[data-equip]'); if(eqBtn){ const id=eqBtn.getAttribute('data-equip'); const item=SHOP_ITEMS.find(i=>i.id===id); if(!item || item.type!=='theme') return; if(!state.shopOwned[id]){ toast('Compre na Loja para equipar'); return; } state.equippedTheme = item.theme; save(state); renderHeader(); renderShop(); toast('Tema equipado!'); }
  });

  $('#btnThemeToggle').addEventListener('click', ()=>{ const current = state.equippedTheme||state.theme||'padrao'; const next = (current==='romantico')? 'padrao' : 'romantico'; state.equippedTheme = next; save(state); renderHeader(); $('#btnThemeToggle').textContent = next==='romantico' ? '🌗 Modo Claro' : '🌗 Modo Romântico'; $('#themeQuick').value = next; });

  // Conquistas — sem filtros, com progresso e grayscale no locked
  const ALL_ACHIEVEMENTS = [
    {code:'daily_first',  icon:'✨',  title:'Primeiro Passo',      desc:'Fez seu primeiro check-in diário.',   rewardCoins:0,  rarity:'comum'},
    {code:'streak_3',     icon:'🔥',  title:'Ritmo Bom',           desc:'Sequência de 3 dias.',                rewardCoins:0,  rarity:'comum'},
    {code:'streak_7',     icon:'🔥',  title:'Chama Acesa',         desc:'Sequência de 7 dias.',                rewardCoins:10, rarity:'raro'},
    {code:'letters3',     icon:'💌',  title:'Carta Quentinha',     desc:'Leu 3 cartas.',                       rewardCoins:0,  rarity:'comum', progress:(s)=>({current:Math.min(s.lettersRead,3),  target:3})},
    {code:'letters10',    icon:'💌',  title:'Biblioteca do Amor',  desc:'Leu 10 cartas.',                      rewardCoins:15, rarity:'raro',  progress:(s)=>({current:Math.min(s.lettersRead,10), target:10})},
    {code:'memory_first', icon:'🧠',  title:'Cabeça Boa',          desc:'Venceu o Jogo da Memória.',           rewardCoins:0,  rarity:'comum'},
    {code:'typing_first', icon:'⌨️',  title:'Digitando Amor',      desc:'Completou Digite com Amor.',          rewardCoins:0,  rarity:'comum'},
    {code:'catch_first',  icon:'💗',  title:'Caçador de Corações', desc:'Jogou Caça-Corações.',                rewardCoins:0,  rarity:'comum'},
    {code:'run_first',    icon:'🏁',  title:'Vuuum, Abelhinha!',   desc:'Jogou Corrida das Abelhinhas.',       rewardCoins:0,  rarity:'comum'},
    {code:'points_200',   icon:'🏅',  title:'200 Moedinhas',       desc:'Atingiu 200 moedas.',                 rewardCoins:0,  rarity:'comum', progress:(s)=>({current:Math.min(s.lovePoints,200),  target:200})},
    {code:'points_1000',  icon:'💰',  title:'Cofre Cheio',         desc:'Juntou 1000 moedinhas.',              rewardCoins:50, rarity:'epico', progress:(s)=>({current:Math.min(s.lovePoints,1000), target:1000})},
    {code:'event_first',  icon:'📅',  title:'Agenda Aberta',       desc:'Cadastrou sua primeira data.',        rewardCoins:5,  rarity:'comum'},
    {code:'event_today',  icon:'🎊',  title:'Dia Especial',        desc:'Chegou o dia de um evento!',          rewardCoins:15, rarity:'raro'}
  ];

  function renderAchievements(){ const grid=$('#achievementsGrid'); grid.innerHTML='';
    ALL_ACHIEVEMENTS.forEach(a=>{ const unlocked=!!state.achievements[a.code]; const card=document.createElement('div'); card.className='ach-card'+(unlocked?'':' ach-locked'); const prog = a.progress?.(state); const pct = (!unlocked && prog)? Math.round((prog.current/prog.target)*100) : null; card.innerHTML = `<div class='ach-icon'>${a.icon}</div><div class='ach-meta'><div class='ach-title'>${a.title}</div><div class='ach-desc'>${a.desc}</div>${a.rewardCoins?`<div class='ach-reward'>Recompensa: +${a.rewardCoins} 💛 (bônus)</div>`:''}${(pct!=null)?`<div class='progress'><span style='width:${pct}%;'></span></div>`:''}</div><div class='ach-status'>${ unlocked?`✅ ${state.achievements[a.code]}`:'—' }</div>`; grid.appendChild(card); }) }

  function periodicChecks(){ if(state.lovePoints>=200) unlock('points_200'); if(state.lovePoints>=1000) unlock('points_1000'); const anyToday = (state.events||[]).some(ev=> ev.date===todayKey()); if(anyToday) unlock('event_today'); }
  setInterval(periodicChecks, 2500);

  async function applyStrings(){ try{ const s = await (await fetch('data/strings.json')).json(); document.querySelectorAll('[data-i18n]').forEach(el=>{ const key = el.getAttribute('data-i18n'); const txt = key.split('.').reduce((o,k)=>o?.[k], s); if(typeof txt === 'string') el.textContent = txt; }); }catch(e){ /* opcional */ } }

  const beeLayer=$('#beeLayer'); const bees=[]; function spawnBees(n=6){ beeLayer.innerHTML=''; bees.length=0; for(let i=0;i<n;i++){ const b=document.createElement('div'); b.className='bee'; b.textContent='🐝'; b.style.left=Math.random()*90+5+'%'; b.style.top=Math.random()*80+10+'%'; beeLayer.appendChild(b); bees.push({el:b, vx:(Math.random()-.5)*0.15, vy:(Math.random()-.5)*0.15}); } }
  let mouse={x:0,y:0}; document.addEventListener('mousemove',(e)=>{ const r=beeLayer.getBoundingClientRect(); mouse.x=(e.clientX-r.left)/r.width; mouse.y=(e.clientY-r.top)/r.height; }); function tickBees(){ const noflyR=0.12; bees.forEach(b=>{ const el=b.el; const x=parseFloat(el.style.left)/100, y=parseFloat(el.style.top)/100; const dx=x-mouse.x, dy=y-mouse.y; const d=Math.hypot(dx,dy); if(d < noflyR){ b.vx += (dx/(d+0.001))*0.01; b.vy += (dy/(d+0.001))*0.01; } b.vx += (0.5 - x)*0.0004; b.vy += (0.5 - y)*0.0004; b.vx *= 0.995; b.vy *= 0.995; let nx=x+b.vx, ny=y+b.vy; if(nx<0.02||nx>0.98) { b.vx*=-0.8; nx=Math.max(0.02, Math.min(0.98,nx)); } if(ny<0.02||ny>0.98) { b.vy*=-0.8; ny=Math.max(0.02, Math.min(0.98,ny)); } el.style.left=(nx*100)+'%'; el.style.top=(ny*100)+'%'; }); requestAnimationFrame(tickBees); }

  $('#btnAddPhotos').addEventListener('click', ()=> $('#galleryInput').click());
  $('#galleryInput').addEventListener('change',(e)=>{ const f=e.target.files; if(f) addToGallery(f); e.target.value=''; });
  $('#btnClearPhotos').addEventListener('click', ()=>{ if(confirm('Limpar todas as fotos?')){ state.gallery=[]; save(state); renderGallery(); } });

  function init(){ applyStrings(); renderHeader(); renderThemeQuick(); renderLetters(); initPlaylist(); initTabs(); renderAchievements(); renderShop(); renderGallery(); setupDragDrop(); spawnBees(6); tickBees(); renderDates(); }
  init();
})();
