const GameSound = (() => {
  let ctx = null, master = null;
  const state = { enabled: true };
  function ensure(){
    if(!ctx){
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, {type='sine', gain=0.25, when=0, glideTo=null}={}){
    if(!state.enabled) return;
    ensure(); const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if(glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0+dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0+dur+0.02);
  }
  function noise(dur, {gain=0.2, when=0, hp=800, lp=6000}={}){
    if(!state.enabled) return;
    ensure(); const t0 = ctx.currentTime + when;
    const n = Math.floor(ctx.sampleRate*dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate); const d = buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = (Math.random()*2-1)*(1-i/n);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=(hp+lp)/2; bp.Q.value=0.6;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(bp); bp.connect(g); g.connect(master); src.start(t0);
  }
  const chord = (freqs, dur, opts={}) => freqs.forEach(f=>tone(f,dur,opts));
  let musTimer=null, musOn=false, mi=0;
  const PROG=[[196,247,294],[220,277,330],[165,220,262],[147,196,247]];
  function musicStep(){
    if(!musOn) return; ensure(); const t=ctx.currentTime;
    PROG[mi].forEach(f=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type='sine'; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.05,t+.6); g.gain.exponentialRampToValueAtTime(.0001,t+3.4);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+3.6); });
    PROG[mi].forEach((f,k)=>tone(f*2,.5,{type:'triangle',gain:.03,when:k*.4}));
    mi=(mi+1)%PROG.length; musTimer=setTimeout(musicStep,3400);
  }
  const S = {
    get enabled(){return state.enabled;}, set enabled(v){state.enabled=v; if(v) ensure();},
    resume(){ensure();},
    click(){ tone(420,0.06,{type:'square',gain:0.12}); },
    diceRoll(){ for(let i=0;i<7;i++) noise(0.05,{when:i*0.06, gain:0.12, hp:1200, lp:5000}); },
    diceLand(){ tone(180,0.18,{type:'triangle',gain:0.3}); noise(0.08,{gain:0.18,hp:200,lp:1500}); },
    questionIn(){ noise(0.18,{gain:0.10,hp:600,lp:4000}); tone(680,0.14,{type:'sine',gain:0.16,when:0.05,glideTo:1020}); },
    tick(){ tone(1500,0.03,{type:'square',gain:0.08}); },
    tock(){ tone(1050,0.035,{type:'square',gain:0.06}); },
    warn(){ tone(880,0.09,{type:'square',gain:0.18}); tone(880,0.09,{type:'square',gain:0.18,when:0.14}); },
    timeUp(){ tone(300,0.5,{type:'sawtooth',gain:0.25,glideTo:120}); },
    correct(){ [523,659,784,1047].forEach((f,i)=>tone(f,0.18,{type:'triangle',gain:0.22,when:i*0.09})); },
    wrong(){ tone(300,0.28,{type:'sawtooth',gain:0.22,glideTo:170}); tone(150,0.3,{type:'square',gain:0.14,when:0.02}); },
    steal(){ tone(660,0.12,{type:'sine',gain:0.2}); tone(990,0.16,{type:'sine',gain:0.2,when:0.12}); },
    hop(){ tone(760,0.06,{type:'sine',gain:0.16,glideTo:1040}); },
    penalty(){ tone(220,0.35,{type:'sawtooth',gain:0.2,glideTo:110}); chord([233,277],0.5,{type:'triangle',gain:0.12,when:0.1}); noise(0.2,{gain:0.1,hp:100,lp:900,when:0.05}); },
    bonus(){ [523,784,1047].forEach((f,i)=>tone(f,0.2,{type:'triangle',gain:0.2,when:i*0.08})); chord([659,988],0.55,{type:'sine',gain:0.13,when:0.22}); },
    win(){ [523,659,784,1047,1319].forEach((f,i)=>tone(f,0.28,{type:'triangle',gain:0.22,when:i*0.1}));
           chord([523,659,784],0.7,{type:'sine',gain:0.14,when:0.55}); },
    count(n){ tone(n>0?700:1100, n>0?0.14:0.4, {type:'square',gain:0.2, glideTo:n>0?null:1600}); },
    region(){ tone(523,0.5,{type:'sine',gain:0.14,glideTo:784}); noise(0.4,{gain:0.05,hp:400,lp:3000}); },
    music(v){ musOn=v; if(v){ ensure(); mi=0; musicStep(); } else { clearTimeout(musTimer); } }
  };
  return S;
})();

const GameNarr = (() => {
  let on=false, voice=null;
  function pick(){ if(!('speechSynthesis' in window)) return; const vs=speechSynthesis.getVoices();
    voice = vs.find(v=>/pt.BR/i.test(v.lang)) || vs.find(v=>/pt/i.test(v.lang)) || vs[0] || null; }
  if('speechSynthesis' in window){ pick(); speechSynthesis.onvoiceschanged=pick; }
  return { set on(v){on=v; if(!v&&'speechSynthesis'in window) speechSynthesis.cancel();}, get on(){return on;},
    say(t){ if(!on||!('speechSynthesis'in window)) return; speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(t); if(voice)u.voice=voice; u.lang='pt-BR'; u.rate=1.02; speechSynthesis.speak(u); } };
})();
const GameVibrate = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

const GameFX = (() => {
  const $ = id => document.getElementById(id);
  const stage = $('stage'), hint = $('hint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hideHint = () => hint.style.display='none';
  function replay(el, cls){ el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  const cv = $('confetti'), cx = cv.getContext('2d'); let parts=[], raf=null;
  function size(){ cv.width = stage.clientWidth; cv.height = stage.clientHeight; }
  new ResizeObserver(size).observe(stage); size();
  const Cc = ['#D6645C','#E29869','#54D49C','#54D4D2','#D1478F','#D9A33F'];
  function burst(n=140, from='top'){
    if(reduce) return;
    for(let i=0;i<n;i++) parts.push({
      x: from==='center'? cv.width/2 : Math.random()*cv.width,
      y: from==='center'? cv.height/2 : -10,
      vx:(Math.random()-0.5)*(from==='center'?9:4),
      vy: from==='center'? (Math.random()-0.5)*9-2 : Math.random()*3+2,
      g:0.12, s:6+Math.random()*6, r:Math.random()*6, vr:(Math.random()-.5)*.4,
      c:Cc[i%Cc.length], life:120+Math.random()*40 });
    if(!raf) loop();
  }
  function loop(){
    cx.clearRect(0,0,cv.width,cv.height);
    parts.forEach(p=>{ p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.life--;
      cx.save(); cx.translate(p.x,p.y); cx.rotate(p.r); cx.fillStyle=p.c;
      cx.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6); cx.restore(); });
    parts = parts.filter(p=>p.life>0 && p.y<cv.height+20);
    raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0,0,cv.width,cv.height), null);
  }

  const PENS = [
    ['Refluxo','Volte para o início do esôfago.'],['Cárie','Perca a vez.'],['Úlcera','Volte 3 casas.'],
    ['Náusea','Volte 2 casas.'],['Apendicite','Volte ao início do intestino delgado.'],
    ['Prisão de ventre','Fique 1 rodada parado.'],['Cálculo biliar','Pule a próxima jogada.'],
    ['Intoxicação','Volte 4 casas.']
  ];

  let timerRAF=null;
  const FX = {
    turn(name='Estômago', color='#D6645C', letter='E'){
      hideHint(); GameSound.click();
      $('bannerName').textContent = name;
      const b=$('bannerBadge'); b.textContent=letter; b.style.background=color;
      replay($('banner'),'show'); GameSound.questionIn();
      setTimeout(()=>$('banner').classList.remove('show'), 2700);
    },
    rollDice(result){
      hideHint(); const d=$('dice'); const n = result || (1+Math.floor(Math.random()*6));
      d.classList.add('show'); d.classList.remove('land'); d.classList.add('rolling');
      GameSound.diceRoll();
      let f=0; const iv=setInterval(()=>{ d.dataset.f = (f++%6)+1; }, 90);
      setTimeout(()=>{ clearInterval(iv); d.classList.remove('rolling'); d.dataset.f=n;
        d.classList.add('land'); GameSound.diceLand(); FX.toast('Dado: '+n); }, reduce?60:640);
      return n;
    },
    voarIcones(pares){
      const camada=$('voo');
      const bons=(pares||[]).filter(p=>p.de&&p.para&&p.de.width>0&&p.para.width>0);
      if(reduce || !bons.length) return Promise.resolve();

      camada.innerHTML=''; camada.classList.add('on');

      const voos=bons.map((p,i)=>{
        const el=document.createElement('img');
        el.className='voo-item'; el.src=p.icone; el.alt='';
        el.style.borderColor=p.cor;
        el.style.left=p.de.left+'px';  el.style.top=p.de.top+'px';
        el.style.width=p.de.width+'px'; el.style.height=p.de.height+'px';
        camada.appendChild(el);

        const dx=(p.para.left+p.para.width/2)-(p.de.left+p.de.width/2);
        const dy=(p.para.top+p.para.height/2)-(p.de.top+p.de.height/2);
        const fim=p.para.width/p.de.width;
        const alto=Math.min(150, Math.max(50, Math.hypot(dx,dy)*0.22));

        return el.animate([
          {transform:'translate(0px,0px) scale(1)', opacity:1, offset:0},
          {transform:`translate(${dx*.5}px, ${dy*.5-alto}px) scale(${(1+fim)/2*1.1})`,
           opacity:1, offset:.55},
          {transform:`translate(${dx}px, ${dy}px) scale(${fim})`, opacity:1, offset:1},
        ], {duration:820, delay:i*90, easing:'cubic-bezier(.5,0,.25,1)',
            fill:'forwards'}).finished;
      });

      return Promise.all(voos)
        .then(()=>{ camada.classList.remove('on'); camada.innerHTML=''; })
        .catch(()=>{ camada.classList.remove('on'); camada.innerHTML=''; });
    },
    question(){ hideHint(); replay($('qcard'),'show'); GameSound.questionIn(); },
    startTimer(seconds=20){
      hideHint(); const t=$('timer'), arc=$('timerArc'), num=$('timerNum');
      t.classList.add('show'); t.classList.remove('flash');
      const bar=$('qbarFill'); if(bar) bar.style.width='100%';
      const total=seconds; let start=performance.now(); const DASH=264;
      cancelAnimationFrame(timerRAF);
      let lastSec=Math.ceil(seconds), beeped=false;
      function frame(now){
        let el=(now-start)/1000, left=Math.max(0,total-el), frac=left/total;
        arc.style.strokeDashoffset = (DASH*(1-frac)).toFixed(1);
        num.textContent = Math.ceil(left);
        if(bar) bar.style.width=(frac*100)+'%';
        const col = frac>0.5?'#54D49C':frac>0.25?'#D9A33F':'#D6645C';
        arc.setAttribute('stroke',col); if(bar) bar.style.background=col;
        const s=Math.ceil(left);
        if(s!==lastSec){ lastSec=s; if(s<=5 && s>0) GameSound.tick(); }
        if(frac<=0.25 && !beeped){ beeped=true; GameSound.warn(); }
        if(left>0){ timerRAF=requestAnimationFrame(frame); }
        else { t.classList.add('flash'); GameSound.timeUp(); FX.toast('Tempo esgotado'); }
      }
      timerRAF=requestAnimationFrame(frame);
    },
    stopTimer(){ cancelAnimationFrame(timerRAF); $('timer').classList.remove('show'); },
    correct(steps=0){
      hideHint(); FX.stopTimer(); const v=$('verdict');
      v.className='verdict good'; $('verdictMark').textContent='✓'; $('verdictLbl').textContent='Acertou!';
      $('verdictPlus').textContent = steps? ('+'+steps+' casa'+(steps>1?'s':'')) : '';
      replay(v,'show'); GameSound.correct(); burst(120,'top'); GameVibrate(60);
      setTimeout(()=>v.classList.remove('show'), 1600);
    },
    wrong(){
      hideHint(); FX.stopTimer(); const v=$('verdict');
      v.className='verdict bad'; $('verdictMark').textContent='✕'; $('verdictLbl').textContent='Errou!';
      $('verdictPlus').textContent=''; replay(v,'show'); replay(v,'shake'); GameSound.wrong(); GameVibrate([90,60,90]);
      setTimeout(()=>v.classList.remove('show'), 1500);
    },
    steal(){ hideHint(); const s=$('steal'); s.className='steal show'; GameSound.steal();
      setTimeout(()=>s.classList.remove('show'), 3200); },
    stealWon(team='Fígado', steps=2){ hideHint(); $('steal').classList.remove('show');
      const v=$('verdict'); v.className='verdict good'; $('verdictMark').textContent='✓';
      $('verdictLbl').textContent=team+' roubou!'; $('verdictPlus').textContent='+'+steps+' casas';
      replay(v,'show'); GameSound.correct(); burst(90,'top'); setTimeout(()=>v.classList.remove('show'),1600); },
    penalty(data){
      hideHint(); const [nm,ef] = data ? [data.nome,data.efeito] : PENS[Math.floor(Math.random()*PENS.length)];
      const el=$('penalty'); el.classList.remove('boa');
      if($('penTag')) $('penTag').textContent='Casa de penalidade';
      $('penNm').textContent=nm; $('penEf').textContent=ef;
      replay(el,'show'); GameSound.penalty(); GameVibrate([50,40,120]);
      setTimeout(()=>el.classList.remove('show'), 2600);
    },
    bonus(data){
      hideHint(); const {nome,efeito} = data || {nome:'Vantagem',efeito:''};
      const el=$('penalty'); el.classList.add('boa');
      if($('penTag')) $('penTag').textContent='Casa de vantagem';
      $('penNm').textContent=nome; $('penEf').textContent=efeito;
      replay(el,'show'); GameSound.bonus(); GameVibrate([25,30,25,30,60]);
      setTimeout(()=>el.classList.remove('show'), 2600);
    },
    win(team='Estômago', icone=''){
      hideHint(); $('winName').textContent=team+' é um cocô vencedor!';
      const ic=$('winIcone'); if(ic){ ic.src=icone||''; ic.hidden=!icone; }
      $('win').classList.add('show'); GameSound.win(); burst(220,'center');
      setTimeout(()=>burst(160,'top'), 400);
    },
    countdown(cb){
      hideHint(); const c=$('count'), n=$('countN'); c.classList.add('show');
      let seq=['3','2','1','Valendo!'], i=0;
      const go=()=>{ if(i>=seq.length){ c.classList.remove('show'); cb&&cb(); return; }
        n.textContent=seq[i]; replay(n,'n'); GameSound.count(i<3?1:0); i++; setTimeout(go, 900); };
      go();
    },
    tick(){ GameSound.tick(); },
    timeUp(){ $('timer').classList.add('show','flash'); GameSound.timeUp(); FX.toast('Tempo esgotado'); },
    toast(msg){ const wrap=$('toasts'); const el=document.createElement('div'); el.className='toast';
      el.innerHTML='<span class="dot"></span>'+msg; wrap.appendChild(el);
      setTimeout(()=>el.remove(), 2700); },
    region(name='Intestino delgado'){
      hideHint(); $('regionB').textContent=name; replay($('region'),'show'); GameSound.region();
      setTimeout(()=>$('region').classList.remove('show'), 1900);
    },
    limpar(){
      for(const id of ['banner','dice','qcard','verdict','steal','penalty','win','count','region'])
        $(id)?.classList.remove('show','land','rolling','shake','flash');
      FX.stopTimer(); $('toasts').innerHTML='';
    },
    say(text){ GameNarr.say(text); }
  };
  return FX;
})();

document.addEventListener("click", () => GameSound.resume(), { once: true });
