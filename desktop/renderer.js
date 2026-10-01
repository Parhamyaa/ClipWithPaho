let stream=null;
let recorder=null;
let selectedSource=null;
let chunks=[];
let times=[];
let duration=30;
let running=false;
let clips=[];
let timer=null;
let elapsed=0;

const $=id=>document.getElementById(id);

function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function setText(id,v){$(id).textContent=v;}

async function loadSources(){
  const box=$('sources');
  box.innerHTML='';
  const sources=await window.paho.sources();
  sources.forEach((s,i)=>{
    const el=document.createElement('div');
    el.className='source'+(i===0?' selected':'');
    el.innerHTML=`<img src="${s.thumbnail}"><div class="source-name">${esc(s.name)}</div>`;
    el.onclick=()=>{
      document.querySelectorAll('.source').forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected');
      selectedSource=s;
    };
    box.appendChild(el);
  });
  selectedSource=sources[0]||null;
}

function fmt(sec){
  const m=String(Math.floor(sec/60)).padStart(2,'0');
  const s=String(sec%60).padStart(2,'0');
  return `${m}:${s}`;
}

function updateTimer(){
  if(!running)return;
  elapsed++;
  setText('bigTime',fmt(elapsed));
}

async function startRecording(){
  if(!selectedSource){alert('Bitte zuerst eine Aufnahmequelle auswählen.');return;}
  try{
    stream=await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{mandatory:{
        chromeMediaSource:'desktop',
        chromeMediaSourceId:selectedSource.id,
        maxFrameRate:60
      }}
    });

    chunks=[];times=[];
    recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:12000000});
    recorder.ondataavailable=e=>{
      if(!e.data.size)return;
      chunks.push(e.data);times.push(Date.now());
      const keep=duration*1000+3000;
      while(chunks.length>2 && Date.now()-times[0]>keep){
        chunks.shift();times.shift();
      }
    };
    recorder.onstop=()=>{
      running=false;
      setText('topStatus','BEREIT');
      setText('recordLabel','OFF');
      $('dot').classList.remove('on');
      $('start').textContent='Aufnahme starten';
      $('start').classList.remove('running');
      clearInterval(timer);
      elapsed=0;
      setText('bigTime','00:00');
    };
    recorder.start(1000);
    running=true;
    setText('topStatus','REPLAY BUFFER');
    setText('recordLabel','ON');
    $('dot').classList.add('on');
    $('start').textContent='Aufnahme stoppen';
    $('start').classList.add('running');
    elapsed=0;
    timer=setInterval(updateTimer,1000);
  }catch(e){
    console.error(e);
    alert('Aufnahme konnte nicht gestartet werden. Prüfe die Desktop-Berechtigungen.');
  }
}

function stopRecording(){
  if(recorder && recorder.state!=='inactive')recorder.stop();
  if(stream)stream.getTracks().forEach(t=>t.stop());
  recorder=null;stream=null;
}

async function saveClip(){
  if(!recorder || recorder.state!=='recording'){
    alert('Starte zuerst den Replay Buffer.');
    return;
  }
  recorder.requestData();
  await new Promise(r=>setTimeout(r,100));
  const cutoff=Date.now()-duration*1000;
  let start=0;
  for(let i=0;i<times.length;i++){if(times[i]>=cutoff){start=i;break;}}
  const chosen=chunks.slice(Math.max(0,start));
  if(!chosen.length)return;
  const blob=new Blob(chosen,{type:'video/webm'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const name=`ClipWithPaho-${new Date().toISOString().replace(/[:.]/g,'-')}.webm`;
  a.href=url;a.download=name;a.click();
  URL.revokeObjectURL(url);
  clips.unshift({name,time:new Date().toLocaleString('de-DE'),size:blob.size});
  renderClips();
  showToast();
  await window.paho.notify(`${duration} Sekunden gespeichert`);
}

function showToast(){
  $('toastText').textContent=`${duration} Sekunden · gerade eben`;
  $('toast').classList.remove('hidden');
  clearTimeout(showToast.t);
  showToast.t=setTimeout(()=>$('toast').classList.add('hidden'),3500);
}

function renderClips(){
  const grid=$('clipGrid');
  grid.innerHTML=clips.map(c=>`
    <div class="clip-card">
      <div class="clip-preview"></div>
      <div class="clip-info"><b>${esc(c.name)}</b><span>${esc(c.time)} · ${(c.size/1048576).toFixed(1)} MB</span></div>
    </div>`).join('');
}

function showPage(name){
  ['home','clips','settings'].forEach(x=>$(`${x}Page`).classList.toggle('hidden',x!==name));
  document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===name));
  if(name==='clips')renderClips();
}

document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>showPage(n.dataset.page));

document.querySelectorAll('.duration-grid button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.duration-grid button').forEach(x=>x.classList.remove('selected'));
  b.classList.add('selected');
  duration=Number(b.dataset.sec);
  setText('settingDuration',duration>=60?`${duration/60} Minute${duration>60?'n':''}`:`${duration} Sekunden`);
});

$('start').onclick=()=>running?stopRecording():startRecording();
$('clipNow').onclick=saveClip;
$('refresh').onclick=loadSources;
$('quit').onclick=()=>window.paho.quit();

$('saveHotkey').onclick=async()=>{
  const raw=$('hotkeyInput').value.trim();
  const acc=raw.replace(/\bCtrl\b/gi,'CommandOrControl').replace(/\bCmd\b/gi,'CommandOrControl');
  const ok=await window.paho.setHotkey(acc);
  if(!ok){alert('Hotkey konnte nicht registriert werden. Beispiel: Ctrl+Shift+X');return;}
  const label=raw.toUpperCase();
  setText('hotkeyMini',label);setText('hotkeyTip',label);
  await window.paho.notify(`Hotkey gesetzt: ${raw}`);
};

window.paho.onClip(()=>saveClip());

loadSources();
setText('settingDuration','30 Sekunden');
