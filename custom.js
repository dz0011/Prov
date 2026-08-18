/* ===== GUEST DATA GATE: guest data only moves to an account created from THIS guest session ===== */
(function(){
if(window.__guestGate)return;window.__guestGate=1;
/* remember which auth action the user chose on the sign-in screen */
document.addEventListener('click',function(e){
if(e.target.closest&&e.target.closest('#auth-signup')){try{sessionStorage.setItem('prov.auth.mode','create');}catch(e2){}}
else if(e.target.closest&&e.target.closest('#auth-signin')){try{sessionStorage.setItem('prov.auth.mode','signin');}catch(e2){}}
},true);
function allowed(uid){
try{if(localStorage.getItem('prov.guestbound.'+uid)==='1')return true;}catch(e){}
try{if(sessionStorage.getItem('prov.auth.mode')==='create')return true;}catch(e){}
return false;
}
if(typeof db!=='undefined'&&db&&db.auth){
db.auth.onAuthStateChange(function(ev,ses){
if(!(ses&&ses.user))return;
var uid=ses.user.id;
try{
if(allowed(uid)){
/* account created from guest (or previously bound): make guest data visible to the merge */
var v=localStorage.getItem('provenance.vault');
if(v&&!localStorage.getItem('provenance.local'))localStorage.setItem('provenance.local',v);
}else{
/* unrelated account: lock guest data away so it can NOT be absorbed */
var l=localStorage.getItem('provenance.local');
if(l){localStorage.setItem('provenance.vault',l);localStorage.removeItem('provenance.local');}
var g=localStorage.getItem('provenance.guestbackup');
if(g){localStorage.setItem('provenance.vault',g);localStorage.removeItem('provenance.guestbackup');}
}
}catch(e){}
});
}
})();
/* ================= 1) PIGMENT CLOUD ================= */
(function(){
function addItem(){
var m=document.getElementById('menu');if(!m||m.querySelector('[data-action="open-pigments"]'))return;
var b=document.createElement('button');b.type='button';b.dataset.action='open-pigments';b.innerHTML='🎨 Your pigments';
var so=m.querySelector('[data-action="sign-out"]');m.insertBefore(b,so||null);
}
addItem();setTimeout(addItem,800);
function pigmentData(){
var map={};
(state.entries||[]).forEach(function(e){
var p=null;for(var i=0;i<state.paintings.length;i++){if(state.paintings[i].id===e.paintingId){p=state.paintings[i];break;}}
(e.colors||[]).forEach(function(c){
var hex=String(c.hex||'').toLowerCase();if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(hex))return;
if(!map[hex])map[hex]={hex:hex,n:0,works:{}};
map[hex].n++;if(p)map[hex].works[p.id]=1;
});
});
return Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return b.n-a.n;});
}
window.openPigments=function(){
var list=pigmentData();window.__pigs=list;
openModal('<div class="overlay" data-action="overlay-close"><div class="panel" style="max-width:560px">'
+'<div class="panel-head"><h2>Your pigments</h2><button type="button" class="icon-btn" data-action="close-modal">✕</button></div>'
+'<p class="hint" style="margin:0 0 10px">Every color you\u2019ve logged, most-used first. Tap a swatch to see the works that used it.</p>'
+'<div style="display:flex;flex-wrap:wrap;gap:8px">'
+(list.length?list.map(function(c,i){return '<button type="button" data-action="pig-tap" data-i="'+i+'" style="width:40px;height:40px;border-radius:12px;border:1px solid rgba(128,128,128,.35);background:'+c.hex+'" aria-label="'+c.hex+'"></button>';}).join(''):'<p class="etext">No colors logged yet \u2014 add palette photos to an entry.</p>')
+'</div><div id="pig-detail" style="margin-top:12px"></div></div></div>');
};
document.addEventListener('click',function(e){
var g=e.target.closest('[data-action="open-pigments"]');
if(g){e.stopImmediatePropagation();var m=document.getElementById('menu');if(m)m.classList.remove('open');openPigments();return;}
var t=e.target.closest('[data-action="pig-tap"]');
if(t){var c=(window.__pigs||[])[+t.dataset.i];if(!c)return;
var ids=Object.keys(c.works);
var html='<p class="etext" style="margin:0 0 6px"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:'+c.hex+';vertical-align:-2px"></span> '+c.hex+' \u00b7 logged '+c.n+'\u00d7 in '+ids.length+' work'+(ids.length===1?'':'s')+':</p>';
html+=ids.map(function(id){var p=getP(id);if(!p)return '';return '<button type="button" class="btn ghost" data-action="pig-open" data-id="'+p.id+'" style="margin:0 6px 6px 0">'+(p.number?pad2(p.number)+' \u00b7 ':'')+esc(p.title)+'</button>';}).join('');
document.getElementById('pig-detail').innerHTML=html;return;}
var o=e.target.closest('[data-action="pig-open"]');
if(o){closeModal();view={name:'painting',id:o.dataset.id};render();window.scrollTo(0,0);}
},true);
})();
/* ================= 2) PIN A VIEW + PNG POSTER ================= */
(function(){
var KEY='provenance.pinnedScene';
var _bs=buildScene;
buildScene=function(){
try{var raw=localStorage.getItem(KEY);if(raw){var s=JSON.parse(raw);if(s&&s.works&&s.works.length)return s;}}catch(e){}
return _bs();
};
function addButtons(){
var host=document.querySelector('[data-action="viewer-remix"]');if(!host)return;
if(!document.getElementById('pin-view')){
var pin=document.createElement('button');pin.id='pin-view';pin.type='button';pin.className='btn ghost';pin.style.borderRadius='999px';
pin.innerHTML='📌';pin.style.opacity=localStorage.getItem(KEY)?'1':'.55';
host.parentNode.insertBefore(pin,host.nextSibling);
pin.addEventListener('click',function(){
if(localStorage.getItem(KEY)){try{localStorage.removeItem(KEY);}catch(e){}pin.style.opacity='.55';toast('Unpinned \u2014 refreshes will vary again');}
else{try{localStorage.setItem(KEY,JSON.stringify(window.vScene,function(k,v){return k==='ready'?undefined:v;}));pin.style.opacity='1';toast('Pinned \u2014 this arrangement now stays');}catch(e){toast('Could not pin this view');}}
});
}
if(!document.getElementById('poster-view')){
var po=document.createElement('button');po.id='poster-view';po.type='button';po.className='btn ghost';po.style.borderRadius='999px';po.innerHTML='🖼';
var pin2=document.getElementById('pin-view');
host.parentNode.insertBefore(po,pin2?pin2.nextSibling:host.nextSibling);
po.addEventListener('click',function(){
var cv=document.getElementById('viewer-canvas');if(!cv)return;
try{var a=document.createElement('a');a.download='provenance-viewer.png';a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();toast('Poster saved to your downloads');}catch(e){toast('Could not save poster');}
});
}
}
if(typeof render==='function'){var _r=render;render=function(){var r=_r.apply(this,arguments);setTimeout(addButtons,60);return r;};}
})();
/* No "Guest mode…" toast while the sign-in screen is showing
   (fixes: guest in browser -> install -> first open lands on sign-in with a stray guest popup) */
(function(){
if(typeof window.toast!=='function')return;
var _t=window.toast;
window.toast=function(msg){
try{
var a=document.getElementById('auth-screen');
var authOn=a&&getComputedStyle(a).display!=='none';
if(authOn&&typeof msg==='string'&&/guest mode/i.test(msg))return;
}catch(e){}
return _t.apply(this,arguments);
};
})();
/* ============ SHARE MENU: PDF via Email/Signal, photo via Instagram, Save PDF ============ */
(function(){
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej();};document.head.appendChild(s);});}
function ensurePdfLib(){return window.html2pdf?Promise.resolve():loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');}
function docHTML(kind,id){
var h='<div style="font-family:Georgia,serif;color:#222;background:#fff;padding:6px">';
if(kind==='work'){var p=getP(id);if(!p)return '<p>Missing work</p>';var es=entriesOf(id);
h+='<h1 style="font-size:26px;margin:0 0 2px">'+(p.number?String(p.number).padStart(2,'0')+' — ':'')+esc(p.title)+'</h1>'
+'<p style="margin:0 0 12px;color:#666;font-size:12px">'+esc(p.medium||'')+(p.started?' · started '+esc(p.started):'')+' · Provenance art journal</p>';
es.forEach(function(e){h+='<div style="margin:0 0 14px;border-top:1px solid #ddd;padding-top:10px"><p style="margin:0 0 6px;font-size:12px;color:#666">'+fmtDateTime(e.date)+'</p>'+(e.text?'<p style="margin:0 0 8px;font-size:14px">'+esc(e.text)+'</p>':'')+((e.images||[]).map(function(s){return '<img src="'+s+'" style="max-width:100%;border-radius:6px;margin:0 6px 6px 0">';}).join(''))+'</div>';});
}else{var e=state.entries.find(function(x){return x.id===id;});if(!e)return '<p>Missing entry</p>';var p2=getP(e.paintingId);
h+='<h1 style="font-size:22px;margin:0 0 2px">Provenance — shared entry</h1><p style="margin:0 0 10px;color:#666;font-size:12px">'+(p2?(p2.number?String(p2.number).padStart(2,'0')+' — ':'')+esc(p2.title)+' · ':'')+fmtDateTime(e.date)+'</p>'+(e.text?'<p style="font-size:14px;margin:0 0 8px">'+esc(e.text)+'</p>':'')+((e.images||[]).map(function(s){return '<img src="'+s+'" style="max-width:100%;border-radius:6px;margin:0 6px 6px 0">';}).join(''));}
return h+'</div>';
}
function makePDF(kind,id){toast('Building PDF…');
return ensurePdfLib().then(function(){
var wrap=document.createElement('div');wrap.innerHTML=docHTML(kind,id);document.body.appendChild(wrap);
var opt={margin:[8,8,10,8],filename:'provenance.pdf',image:{type:'jpeg',quality:.92},html2canvas:{scale:2,useCORS:true,backgroundColor:'#fff'},jsPDF:{unit:'mm',format:'a4'}};
return window.html2pdf().set(opt).from(wrap).output('blob').then(function(b){wrap.remove();return b;},function(){wrap.remove();return null;});
},function(){toast('⚠ Needs internet the first time to load the PDF engine');return null;});}
function shareBlob(blob,name,type,note){if(!blob)return;
var file=new File([blob],name,{type:type});
if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:'Provenance',text:note||''}).catch(function(){});}
else{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Saved to downloads — attach it from there');}}
function firstImageBlob(kind,id){var src=null;
if(kind==='work'){var es=entriesOf(id);for(var i=0;i<es.length;i++){if((es[i].images||[]).length){src=es[i].images[0];break;}}}
else{var e=state.entries.find(function(x){return x.id===id;});src=e&&(e.images||[])[0];}
if(!src)return Promise.resolve(null);return fetch(src).then(function(r){return r.blob();}).catch(function(){return null;});}
function openShareMenu(kind,id){closeModal();window.__shareCtx={kind:kind,id:id};
openModal('<div class="overlay" data-action="overlay-close"><div class="panel" style="max-width:400px"><div class="panel-head"><h2>Share</h2><button type="button" class="icon-btn" data-action="close-modal">✕</button></div><div style="display:flex;flex-direction:column;gap:8px">'
+'<button type="button" class="btn ghost" data-action="shm-pdf" style="justify-content:flex-start">📄 Save PDF to device</button>'
+'<button type="button" class="btn ghost" data-action="shm-email" style="justify-content:flex-start">📧 Email as PDF</button>'
+'<button type="button" class="btn ghost" data-action="shm-signal" style="justify-content:flex-start">💬 Signal as PDF</button>'
+'<button type="button" class="btn ghost" data-action="shm-insta" style="justify-content:flex-start">📸 Instagram (photo)</button>'
+'</div><p class="hint" style="margin:10px 0 0">Email & Signal attach the PDF via your phone\u2019s share sheet; Instagram gets a photo (it can\u2019t take PDFs).</p></div></div>');}
window.shareWorkPDF=function(id){openShareMenu('work',id);};
window.shareEntryPDF=function(id){openShareMenu('entry',id);};
document.addEventListener('click',function(e){var c=window.__shareCtx;if(!c)return;
if(e.target.closest('[data-action="shm-pdf"]')){e.stopImmediatePropagation();closeModal();makePDF(c.kind,c.id).then(function(bl){if(!bl)return;var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download='provenance.pdf';a.click();toast('✓ PDF saved');});return;}
if(e.target.closest('[data-action="shm-email"]')){e.stopImmediatePropagation();closeModal();makePDF(c.kind,c.id).then(function(bl){shareBlob(bl,'provenance.pdf','application/pdf','Provenance — my art journal');});return;}
if(e.target.closest('[data-action="shm-signal"]')){e.stopImmediatePropagation();closeModal();makePDF(c.kind,c.id).then(function(bl){shareBlob(bl,'provenance.pdf','application/pdf');});return;}
if(e.target.closest('[data-action="shm-insta"]')){e.stopImmediatePropagation();closeModal();firstImageBlob(c.kind,c.id).then(function(bl){shareBlob(bl,'provenance.jpg','image/jpeg');});return;}
},true);
})();
/* Double the invisible left/right tap-circles in the photo viewer */
function zoomLB(){
var lb=document.getElementById('lightbox');if(!lb)return;
var els=[].slice.call(lb.querySelectorAll('.lb-btn,[data-lb-nav]'));
if(!els.length){lb.querySelectorAll('*').forEach(function(el){
var cs=getComputedStyle(el);
if(cs.borderRadius.indexOf('50%')!==-1&&(cs.backgroundColor==='rgba(0, 0, 0, 0)'||cs.backgroundColor==='transparent')&&el.offsetWidth>10&&el.offsetWidth<160)els.push(el);});}
els.forEach(function(el){if(el.dataset.zoomed)return;el.dataset.zoomed='1';
var w=el.offsetWidth||64,h=el.offsetHeight||64;
el.style.width=(w*2)+'px';el.style.height=(h*2)+'px';});
}
if(typeof showLB==='function'&&!showLB._zoom){var _sl=showLB;showLB=function(){var r=_sl.apply(this,arguments);setTimeout(zoomLB,40);return r;};showLB._zoom=1;}
document.addEventListener('click',function(e){if(e.target.closest('#lightbox'))setTimeout(zoomLB,40);},true);
/* + buttons only exist after the page decides it's not the Viewer */
if(typeof render==='function'&&!render._fabGo){
var _fr=render;
render=function(){var r=_fr.apply(this,arguments);
var shell=document.getElementById('app-shell');
var hide=(view&&view.name==='viewer')||(shell&&shell.style.display==='none');
document.body.classList.toggle('fabs-go',!hide);
return r;};
render._fabGo=1;
}
/* ===== Rabbit page: weighted random clouds, fixed distant mountains, cloud-soar ===== */
(function(){
/* 1 or 6 clouds = 5% each; 2–5 split the remaining 90% equally (22.5% each) */
function cloudCount(){
var r=Math.random()*100;
if(r<5)return 1;
if(r<10)return 6;
return 2+Math.min(3,Math.floor((r-10)/22.5));
}
/* The mountains are a fixed silhouette — identical every single visit */
var MOUNTAIN='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 160" preserveAspectRatio="none"><path d="M0 160 L0 120 L90 70 L170 110 L260 40 L340 96 L430 60 L520 118 L610 30 L700 92 L790 55 L880 112 L970 48 L1060 100 L1140 70 L1200 110 L1200 160 Z" fill="#7d8fa3" opacity="0.5"/><path d="M0 160 L0 140 L120 100 L240 132 L360 92 L480 138 L600 84 L720 134 L840 96 L960 140 L1080 108 L1200 136 L1200 160 Z" fill="#5d6d80" opacity="0.6"/></svg>');
function decorate(page){
var ds=page.querySelectorAll('div'),i;
for(i=0;i<ds.length;i++){if((ds[i].textContent||'').trim()==='☁️')ds[i].parentNode.removeChild(ds[i]);}
if(!page.querySelector('.rb-mountains')){
var m=document.createElement('div');m.className='rb-mountains';
m.style.cssText='position:absolute;left:0;right:0;top:62%;height:12%;transform:translateY(-98%);background:url("'+MOUNTAIN+'") center bottom/100% 100% no-repeat;pointer-events:none;';
page.insertBefore(m,page.firstChild);
}
if(!page.querySelector('.rb-cloud')){
var n=cloudCount();
for(var c=0;c<n;c++){
var cl=document.createElement('div');cl.className='rb-cloud';cl.textContent='☁️';
cl.style.cssText='position:absolute;top:'+(4+Math.random()*30)+'%;left:'+(4+Math.random()*88)+'%;font-size:'+(26+Math.random()*26)+'px;opacity:'+(0.7+Math.random()*0.25).toFixed(2)+';cursor:pointer;';
page.appendChild(cl);
}
}
}
var mo=new MutationObserver(function(muts){
for(var i=0;i<muts.length;i++){var added=muts[i].addedNodes;
for(var j=0;j<added.length;j++){var n=added[j];if(n.nodeType===1&&n.id==='rabbit-page')decorate(n);}}
});
mo.observe(document.body,{childList:true});
/* Tap a cloud: soar up, try to eat it, fail, hop home; cloud just wobbles */
window.addEventListener('click',function(e){
var page=document.getElementById('rabbit-page');if(!page)return;
if(page._soaring){e.stopImmediatePropagation();e.preventDefault();return;}
var cl=e.target.closest?e.target.closest('.rb-cloud'):null;
if(!cl)return;
e.stopImmediatePropagation();e.preventDefault();
var b=null,ds=page.querySelectorAll('div');
for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰'){b=ds[i];break;}}
if(!b)return;
page._soaring=1;b.style.zIndex=9;
var rs=parseFloat(getComputedStyle(b).getPropertyValue('--rs'))||2.2;
var pr=page.getBoundingClientRect(),cr=cl.getBoundingClientRect();
var cxp=(cr.left+cr.width/2-pr.left)/pr.width*100, cyp=(cr.top+cr.height/2-pr.top)/pr.height*100;
var base='translate(-50%,-50%) scale(', lean=(cxp>50?1:-1);
b.style.animation='none';
var anim=b.animate([
{left:'50%',top:'56%',transform:base+rs+')',offset:0},
{left:'50%',top:'60%',transform:base+(rs*0.8)+') rotate('+(lean*-6)+'deg)',offset:.12},
{left:((50+cxp)/2)+'%',top:((56+cyp)/2+6)+'%',transform:base+(rs*1.45)+') rotate('+(lean*10)+'deg)',offset:.38},
{left:cxp+'%',top:cyp+'%',transform:base+(rs*0.65)+') rotate('+(lean*4)+'deg)',offset:.55},
{left:cxp+'%',top:cyp+'%',transform:base+(rs*0.72)+') rotate('+(lean*-8)+'deg)',offset:.63},
{left:cxp+'%',top:cyp+'%',transform:base+(rs*0.65)+') rotate('+(lean*6)+'deg)',offset:.71},
{left:'50%',top:'56%',transform:base+rs+') rotate(0deg)',offset:1}
],{duration:2300,easing:'ease-in-out'});
setTimeout(function(){cl.animate([
{transform:'translate(0,0) rotate(0deg)'},
{transform:'translate(-6px,2px) rotate(-4deg)'},
{transform:'translate(5px,-2px) rotate(3deg)'},
{transform:'translate(-3px,1px) rotate(-2deg)'},
{transform:'translate(0,0) rotate(0deg)'}
],{duration:600,easing:'ease-in-out'});},1250);
anim.onfinish=function(){b.style.animation='rabbithop 1.6s ease-in-out infinite';b.style.zIndex='';page._soaring=0;};
},true);
})();
/* ===== Rabbit v3: bunny stays fully on-screen; mouth meets the flower ===== */
window.addEventListener('pointerdown',function(e){
var page=document.getElementById('rabbit-page');if(!page||page._soaring)return;
var f=e.target&&e.target.closest?e.target.closest('span'):null;
if(!f||f.parentNode!==page)return;
if(!/🌼||🌺||🌷||💮|/.test(f.textContent||''))return;
var b=null,ds=page.querySelectorAll('div');
for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰'){b=ds[i];break;}}
if(!b)return;
var pr=page.getBoundingClientRect(),fr=f.getBoundingClientRect();
var fx=fr.left+fr.width/2-pr.left, fy=fr.top+fr.height/2-pr.top;
var W=141,H=141;                 /* ~64px glyph x 2.2 scale */
var hw=W/2+44, hh=H/2+44;        /* margin = half bunny + chomp stretch */
var faceRight=fx>pr.width/2;
var mouthX=(faceRight?1:-1)*0.32*W, mouthY=0.20*H;
var cx=fx-mouthX, cy=fy-mouthY;  /* center that puts the mouth on the flower */
var rx=Math.max(hw,Math.min(pr.width-hw,cx));
var ry=Math.max(hh,Math.min(pr.height-hh,cy));
b.style.left=(rx/pr.width*100)+'%';
b.style.top=(ry/pr.height*100)+'%';
var sx=fx-(rx+mouthX), sy=fy-(ry+mouthY);   /* residual reach when clamped */
sx=Math.max(-34,Math.min(34,sx)); sy=Math.max(-26,Math.min(26,sy));
b.style.setProperty('--sx',sx.toFixed(1)+'px');
b.style.setProperty('--sy',sy.toFixed(1)+'px');
var clamped=(rx!==cx||ry!==cy);
b.style.setProperty('--tilt',(clamped?(faceRight?7:-7):0)+'deg');
},true);
/* Magical entrance sparkles + keep soar-clouds low enough to stay on-screen */
(function(){
var mo=new MutationObserver(function(muts){
for(var i=0;i<muts.length;i++){var added=muts[i].addedNodes;
for(var j=0;j<added.length;j++){var n=added[j];
if(n.nodeType===1&&n.id==='rabbit-page'){
var cls=n.querySelectorAll('.rb-cloud');
for(var c=0;c<cls.length;c++){if(parseFloat(cls[c].style.top)<7)cls[c].style.top=(7+Math.random()*4)+'%';}
for(var s=0;s<7;s++){
var sp=document.createElement('span');sp.className='rb-sparkle';sp.textContent=(s%2?'✨':'🌟');
sp.style.cssText='top:'+(6+Math.random()*40)+'%;left:'+(6+Math.random()*88)+'%;font-size:'+(14+Math.random()*18)+'px;animation-delay:'+(Math.random()*0.5).toFixed(2)+'s';
n.appendChild(sp);setTimeout(function(el){return function(){el.remove();};}(sp),2000);
}
}}}});
mo.observe(document.body,{childList:true});
})();
/* ===== Rabbit v4: exact mouth-to-flower, sharp-magical entrance, working cloud soar ===== */
(function(){
var W=141,H=141;
function findBunny(page){var ds=page.querySelectorAll('div');for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰')return ds[i];}return null;}
function cloudCount(){var r=Math.random()*100;if(r<5)return 1;if(r<10)return 6;return 2+Math.min(3,Math.floor((r-10)/22.5));}
var MOUNTAIN='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 160" preserveAspectRatio="none"><path d="M0 160 L0 120 L90 70 L170 110 L260 40 L340 96 L430 60 L520 118 L610 30 L700 92 L790 55 L880 112 L970 48 L1060 100 L1140 70 L1200 110 L1200 160 Z" fill="#7d8fa3" opacity="0.5"/><path d="M0 160 L0 140 L120 100 L240 132 L360 92 L480 138 L600 84 L720 134 L840 96 L960 140 L1080 108 L1200 136 L1200 160 Z" fill="#5d6d80" opacity="0.6"/></svg>');
function decorate(page){
var ds=page.querySelectorAll('div'),i;
for(i=0;i<ds.length;i++){if((ds[i].textContent||'').trim()==='☁️'&&!ds[i].className)ds[i].parentNode.removeChild(ds[i]);}
if(!page.querySelector('.rb-mountains')){var m=document.createElement('div');m.className='rb-mountains';m.style.cssText='position:absolute;left:0;right:0;top:62%;height:12%;transform:translateY(-98%);background:url("'+MOUNTAIN+'") center bottom/100% 100% no-repeat;pointer-events:none;';page.insertBefore(m,page.firstChild);}
if(!page.querySelector('.rb-cloud')){var n=cloudCount();for(var c=0;c<n;c++){var cl=document.createElement('div');cl.className='rb-cloud';cl.textContent='☁️';cl.style.cssText='position:absolute;top:'+(7+Math.random()*27)+'%;left:'+(4+Math.random()*88)+'%;font-size:'+(26+Math.random()*26)+'px;opacity:'+(0.7+Math.random()*0.25).toFixed(2)+';cursor:pointer;';page.appendChild(cl);}}
if(!page.querySelector('.rb-sparkle')){for(var s=0;s<7;s++){var sp=document.createElement('span');sp.className='rb-sparkle';sp.textContent=(s%2?'✨':'🌟');sp.style.cssText='top:'+(6+Math.random()*40)+'%;left:'+(6+Math.random()*88)+'%;font-size:'+(14+Math.random()*18)+'px;animation-delay:'+(Math.random()*0.5).toFixed(2)+'s';page.appendChild(sp);setTimeout(function(el){return function(){el.remove();};}(sp),2000);}}
}
var mo=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var added=muts[i].addedNodes;for(var j=0;j<added.length;j++){var n=added[j];if(n.nodeType===1&&n.id==='rabbit-page')decorate(n);}}});
mo.observe(document.body,{childList:true});
/* Eating: mouth (not center) lands exactly on the flower */
window.addEventListener('pointerdown',function(e){
var page=document.getElementById('rabbit-page');if(!page||page._soaring)return;
var f=e.target&&e.target.closest?e.target.closest('span'):null;
if(!f||f.parentNode!==page)return;
if(!/[🌼🌸🌺🌻🌷💮🪻]/.test(f.textContent||''))return;
var b=findBunny(page);if(!b||b._v4eat)return;
var pr=page.getBoundingClientRect(),fr=f.getBoundingClientRect();
var fx=fr.left+fr.width/2-pr.left, fy=fr.top+fr.height/2-pr.top;
var s=(fx>pr.width/2)?1:-1, th=0.52*s;
var mx=0.45*W*s, rx=mx*Math.cos(th), ry=mx*Math.sin(th);
var hw=W/2+40, hh=H/2+40;
var ccx=Math.max(hw,Math.min(pr.width-hw,fx-rx));
var ccy=Math.max(hh,Math.min(pr.height-hh,fy-ry));
var stX=Math.max(-30,Math.min(30,fx-(ccx+rx))), stY=Math.max(-24,Math.min(24,fy-(ccy+ry)));
var flip=(s===1?-1:1), tilt=th*180/Math.PI;
b._v4eat=1;window.__rabbitEat=1;
b.style.animation='none';
b.style.transition='left 1.35s ease-in-out, top 1.35s ease-in-out, transform 1.35s ease-in-out';
b.style.transform='translate(-50%,-50%) scale(2.2) scaleX('+flip+') rotate('+(s*8)+'deg)';
b.style.left=(ccx/pr.width*100)+'%';
b.style.top=(ccy/pr.height*100)+'%';
setTimeout(function(){
b.animate([
{transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+') rotate('+(s*10)+'deg)'},
{transform:'translate(-50%,-50%) translate('+stX+'px,'+stY+'px) scale(2.25) scaleX('+flip+') rotate('+tilt+'deg)',offset:.35},
{transform:'translate(-50%,-50%) translate('+stX+'px,'+stY+'px) scale(2.12) scaleX('+flip+') rotate('+(tilt*.8)+'deg)',offset:.55},
{transform:'translate(-50%,-50%) translate('+stX+'px,'+stY+'px) scale(2.25) scaleX('+flip+') rotate('+tilt+'deg)',offset:.78},
{transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+') rotate(0deg)'}
],{duration:750,easing:'ease-in-out'});
for(var p=0;p<3;p++){var pt=document.createElement('span');pt.className='rb-petal';pt.textContent='✿';pt.style.cssText='left:'+(fx+(Math.random()*26-13))+'px;top:'+(fy+(Math.random()*16-8))+'px;font-size:'+(10+Math.random()*8)+'px;';page.appendChild(pt);setTimeout(function(el){return function(){el.remove();};}(pt),950);}
f.textContent='';
},1400);
setTimeout(function(){b.style.transform='translate(-50%,-50%) scale(2.2)';b.style.left='50%';b.style.top='56%';},2350);
setTimeout(function(){b.style.transition='';b.style.animation='rabbithop 1.6s ease-in-out infinite';b._v4eat=0;window.__rabbitEat=0;},3850);
},true);
/* Cloud tap: soar, fail to eat, return; cloud just wobbles */
window.addEventListener('click',function(e){
var page=document.getElementById('rabbit-page');if(!page)return;
if(page._soaring){e.stopImmediatePropagation();e.preventDefault();return;}
var cl=e.target.closest?e.target.closest('.rb-cloud'):null;
if(!cl)return;
e.stopImmediatePropagation();e.preventDefault();
var b=findBunny(page);if(!b)return;
page._soaring=1;b.style.zIndex=9;b.style.animation='none';
var pr=page.getBoundingClientRect(),cr=cl.getBoundingClientRect();
var cxp=(cr.left+cr.width/2-pr.left)/pr.width*100, cyp=Math.max(10,(cr.top+cr.height/2-pr.top)/pr.height*100);
var flip=(cxp>50?-1:1);
var anim=b.animate([
{left:'50%',top:'56%',transform:'translate(-50%,-50%) scale(2.2)'},
{left:'50%',top:'60%',transform:'translate(-50%,-50%) scale(1.8) rotate('+(flip*-6)+'deg)',offset:.12},
{left:((50+cxp)/2)+'%',top:((56+cyp)/2+6)+'%',transform:'translate(-50%,-50%) scale(3.1) rotate('+(flip*10)+'deg)',offset:.38},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.5) rotate('+(flip*4)+'deg)',offset:.55},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.6) rotate('+(flip*-8)+'deg)',offset:.66},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.5) rotate('+(flip*6)+'deg)',offset:.76},
{left:'50%',top:'56%',transform:'translate(-50%,-50%) scale(2.2)'}
],{duration:2300,easing:'ease-in-out'});
setTimeout(function(){cl.animate([{transform:'translate(0,0) rotate(0)'},{transform:'translate(-6px,2px) rotate(-4deg)'},{transform:'translate(5px,-2px) rotate(3deg)'},{transform:'translate(0,0) rotate(0)'}],{duration:600,easing:'ease-in-out'});},1250);
anim.onfinish=function(){b.style.animation='rabbithop 1.6s ease-in-out infinite';b.style.zIndex='';page._soaring=0;};
},true);
})();
/* ===== Rabbit v5: refresh returns to a fresh field + tiny chomp sound ===== */
(function(){
if(window.__rabbitV5)return;window.__rabbitV5=1;
var KEY='prov.rabbit.open';
/* --- synthesized chomp (no files; unlocked by the tap gesture) --- */
var AC=null;
function ensureAC(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended'){AC.resume().catch(function(){});}return AC;}
function chomp(){var ac=ensureAC();if(!ac)return;var t=ac.currentTime;
for(var i=0;i<2;i++){var at=t+i*0.13;
var o=ac.createOscillator(),g=ac.createGain();
o.type='square';o.frequency.setValueAtTime(210-i*40,at);o.frequency.exponentialRampToValueAtTime(65,at+0.09);
g.gain.setValueAtTime(0.0001,at);g.gain.exponentialRampToValueAtTime(0.11,at+0.012);g.gain.exponentialRampToValueAtTime(0.0001,at+0.11);
o.connect(g);g.connect(ac.destination);o.start(at);o.stop(at+0.13);
var len=Math.floor(ac.sampleRate*0.06),nb=ac.createBuffer(1,len,ac.sampleRate),d=nb.getChannelData(0);
for(var j=0;j<len;j++){d[j]=(Math.random()*2-1)*Math.pow(1-j/len,2);}
var n=ac.createBufferSource();n.buffer=nb;
var bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=850+i*350;
var ng=ac.createGain();ng.gain.setValueAtTime(0.07,at);ng.gain.exponentialRampToValueAtTime(0.0001,at+0.06);
n.connect(bp);bp.connect(ng);ng.connect(ac.destination);n.start(at);}
}
window.addEventListener('pointerdown',function(e){
var page=document.getElementById('rabbit-page');if(!page||page._soaring)return;
var f=e.target&&e.target.closest?e.target.closest('span'):null;
if(!f||f.parentNode!==page)return;
if(!/[🌼🌸🌺🌻🌷💮🪻]/.test(f.textContent||''))return;
ensureAC();setTimeout(chomp,1400);   /* bites at the same moment the flower disappears */
},true);
/* --- remember open/closed; refresh reopens a NEW field --- */
var mo=new MutationObserver(function(muts){
for(var i=0;i<muts.length;i++){var m=muts[i],j,n;
for(j=0;j<m.addedNodes.length;j++){n=m.addedNodes[j];
if(n.nodeType===1&&n.id==='rabbit-page'){
try{sessionStorage.setItem(KEY,'1');}catch(e){}
var ds=n.querySelectorAll('div');
for(var k=0;k<ds.length;k++){var tx=(ds[k].textContent||'');if(tx.indexOf('tap anywhere')!==-1||tx.indexOf('tap the rabbit')!==-1){ds[k].parentNode.removeChild(ds[k]);}}
}}
for(j=0;j<m.removedNodes.length;j++){n=m.removedNodes[j];
if(n.nodeType===1&&n.id==='rabbit-page'){try{sessionStorage.removeItem(KEY);}catch(e){}}}
}
});
mo.observe(document.body,{childList:true});
function openRabbitClone(){
if(document.getElementById('rabbit-page'))return;
var o=document.createElement('div');o.id='rabbit-page';
o.style.cssText='position:fixed;inset:0;z-index:300;overflow:hidden;cursor:pointer;background:linear-gradient(#8EC9E8 0%,#BFE3F2 46%,#DFF3D8 62%,#79B45C 62%,#4E8A3C 100%)';
o.innerHTML='<div style="position:absolute;left:50%;top:56%;--rs:2.2;transform:translate(-50%,-50%) scale(2.2);font-size:64px;animation:rabbithop 1.6s ease-in-out infinite">🐇</div>';
document.body.appendChild(o);
}
if(typeof render==='function'&&!render._rabbitRestore){
var _r=render;
render=function(){var r=_r.apply(this,arguments);
setTimeout(function(){
var auth=document.getElementById('auth-screen');
var shell=document.getElementById('app-shell');
var authOn=auth&&getComputedStyle(auth).display!=='none';
if(!authOn&&shell&&shell.style.display!=='none'){
try{if(sessionStorage.getItem(KEY)==='1')openRabbitClone();}catch(e){}
}
},120);
return r;};
render._rabbitRestore=1;
}
})();
/* ===== Viewer v11: ONLY your photos, melted together (no digital shapes) ===== */
(function(){
function hexA(hex,a){var h=String(hex||'#8B877C').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var n=parseInt(h,16);if(isNaN(n))return 'rgba(139,135,124,'+a+')';return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
var _prevDV=window.drawViewer,_prevPC=window.paintCurrent;
function photoScene(){
var rnd=mulberry32((Math.random()*1e9)>>>0);
var s={washes:[],shards:[]};
var ps=[...state.paintings].sort(function(a,b){return (a.number||0)-(b.number||0);});
ps.forEach(function(p,pi){
var es=entriesOf(p.id);
var cols=uniqueColors(es).map(function(c){return c.hex;});
var srcs=[];es.forEach(function(e){(e.images||[]).forEach(function(src){if(srcs.length<4)srcs.push(src);});});
var cx=.5+Math.cos(pi*2.399963+rnd()*.8)*(.16+rnd()*.22), cy=.5+Math.sin(pi*2.399963+rnd()*.8)*(.16+rnd()*.22);
for(var w=0;w<2&&cols.length;w++)s.washes.push({hex:cols[(rnd()*cols.length)|0],fx:cx+(rnd()-.5)*.5,fy:cy+(rnd()-.5)*.5,fr:.3+rnd()*.45,al:.05+rnd()*.07,sp:.02+rnd()*.03,ph:rnd()*6.28,amp:.02+rnd()*.03});
srcs.forEach(function(src){
var pa={src:src,fx:cx+(rnd()-.5)*.36,fy:cy+(rnd()-.5)*.36,ready:null,frags:[]};
var nf=9+((rnd()*5)|0);
for(var f=0;f<nf;f++){pa.frags.push({sx:rnd()*.7,sy:rnd()*.7,sw:.3+rnd()*.45,sh:.3+rnd()*.45,ox:(rnd()-.5)*.62,oy:(rnd()-.5)*.62,dw:.18+rnd()*.34,rh:.6+rnd()*.9,rot:(rnd()-.5)*1.2,al:.10+rnd()*.16,blur:rnd()<.55?(1+rnd()*3):0,dsp:.03+rnd()*.05,dph:rnd()*6.28});}
s.shards.push(pa);});
});
return s;
}
function photoPaint(x,W,H,s,t){
var k=W/540;
x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';
x.fillStyle='#181b20';x.fillRect(0,0,W,H);
x.globalCompositeOperation='lighter';
(s.washes||[]).forEach(function(L){var gx=(L.fx+Math.sin(t*(L.sp||.03)+(L.ph||0))*(L.amp||.03))*W,gy=(L.fy+Math.cos(t*(L.sp||.03)*.8+(L.ph||0))*(L.amp||.03))*H,gr=(L.fr||.35)*H;var g=x.createRadialGradient(gx,gy,0,gx,gy,gr);g.addColorStop(0,hexA(L.hex,Math.min(.12,(L.al||.08)*1.3)));g.addColorStop(1,hexA(L.hex,0));x.fillStyle=g;x.fillRect(0,0,W,H);});
x.globalCompositeOperation='source-over';
(s.shards||[]).forEach(function(pa){
if(!pa.ready)return;var iw=pa.ready.width||4,ih=pa.ready.height||3;
(pa.frags||[]).forEach(function(fr){
var dw=(fr.dw||.2)*W,dh=dw*(fr.rh||1);
var dx=Math.sin(t*(fr.dsp||.04)+(fr.dph||0))*.012*W, dy=Math.cos(t*(fr.dsp||.04)*.8+(fr.dph||0))*.012*H;
x.save();x.translate((pa.fx+(fr.ox||0))*W+dx,(pa.fy+(fr.oy||0))*H+dy);x.rotate(fr.rot||0);
if(fr.blur)x.filter='blur('+(fr.blur*k).toFixed(1)+'px)';
x.globalAlpha=Math.min(.34,fr.al||.18);
x.drawImage(pa.ready,(fr.sx||0)*iw,(fr.sy||0)*ih,Math.max(1,(fr.sw||.3)*iw),Math.max(1,(fr.sh||.3)*ih),-dw/2,-dh/2,dw,dh);
x.restore();});});
/* melt pass: fuse the frame into itself so the photos morph together */
x.save();x.filter='blur('+(6*k).toFixed(1)+'px)';
x.globalAlpha=.22;x.drawImage(x.canvas,0,0,W,H,4*k,5*k,W,H);
x.globalAlpha=.15;x.drawImage(x.canvas,0,0,W,H,-5*k,-4*k,W,H);
x.restore();
x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';
var vg=x.createRadialGradient(W/2,H/2,H/3,W/2,H/2,H*.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.30)');x.fillStyle=vg;x.fillRect(0,0,W,H);
}
function photoDraw(){
var cv=document.getElementById('viewer-canvas');if(!cv)return;
try{cancelAnimationFrame(vRaf);}catch(e){}
cv.width=540;cv.height=675;
var s=window.__photoScene;window.vScene=s;
var paint=function(){photoPaint(cv.getContext('2d'),cv.width,cv.height,s,window.vT||0);};
paint();
var seen={};
(s.shards||[]).forEach(function(pa){if(!pa.src||seen[pa.src])return;seen[pa.src]=1;var im=new Image();im.onload=function(){pa.ready=im;paint();};im.src=pa.src;});
if(typeof VSPEEDS!=='undefined'&&typeof vSpeedIdx!=='undefined'&&VSPEEDS[vSpeedIdx]>0){var loop=function(){vRaf=requestAnimationFrame(loop);if(document.hidden)return;window.vT=(window.vT||0)+0.016*VSPEEDS[vSpeedIdx];paint();};vRaf=requestAnimationFrame(loop);}
if(typeof syncSpeedIco==='function')syncSpeedIco();
}
window.drawViewer=function(){
if(!state.paintings.length){return _prevDV?_prevDV.apply(this,arguments):undefined;}
window.__photoScene=photoScene();photoDraw();
};
window.paintCurrent=function(){
var cv=document.getElementById('viewer-canvas');if(!cv)return;
if(!window.__photoScene||!state.paintings.length){return _prevPC?_prevPC.apply(this,arguments):undefined;}
photoPaint(cv.getContext('2d'),cv.width,cv.height,window.__photoScene,window.vT||0);
};
})();
/* ===== Rabbit v6: thin far mountains (always identical), tappable clouds, random facing ===== */
(function(){
if(window.__rabbitV6)return;window.__rabbitV6=1;
var MOUNTAIN='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 90" preserveAspectRatio="none"><path d="M0 90 L0 66 L60 44 L110 60 L170 26 L230 56 L300 34 L360 62 L430 20 L500 54 L560 36 L620 60 L690 24 L760 56 L820 40 L880 62 L950 30 L1010 56 L1080 42 L1140 60 L1200 50 L1200 90 Z" fill="#8fa2b5" opacity="0.45"/><path d="M0 90 L0 78 L90 62 L180 76 L270 58 L360 78 L450 54 L540 76 L630 60 L720 78 L810 62 L900 78 L990 64 L1080 78 L1200 70 L1200 90 Z" fill="#6d7f92" opacity="0.5"/></svg>');
function findBunny(page){var ds=page.querySelectorAll('div');for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰')return ds[i];}return null;}
function cloudCount(){var r=Math.random()*100;if(r<5)return 1;if(r<10)return 6;return 2+Math.min(3,Math.floor((r-10)/22.5));}
function decorate(page){
var ds=page.querySelectorAll('div'),i;
for(i=0;i<ds.length;i++){if((ds[i].textContent||'').trim()==='☁️'&&!ds[i].className)ds[i].parentNode.removeChild(ds[i]);}
var m=page.querySelector('.rb-mountains');
if(!m){m=document.createElement('div');m.className='rb-mountains';page.insertBefore(m,page.firstChild);}
m.style.cssText='position:absolute;left:0;right:0;top:62%;height:6%;transform:translateY(-100%);background:url("'+MOUNTAIN+'") center bottom/100% 100% no-repeat;pointer-events:none;opacity:.85;';
if(!page.querySelector('.rb-cloud')){var n=cloudCount();for(var c=0;c<n;c++){var cl=document.createElement('div');cl.className='rb-cloud';cl.textContent='☁️';cl.style.cssText='position:absolute;top:'+(7+Math.random()*27)+'%;left:'+(4+Math.random()*88)+'%;font-size:'+(26+Math.random()*26)+'px;opacity:'+(0.7+Math.random()*0.25).toFixed(2)+';cursor:pointer;';page.appendChild(cl);}}
var b=findBunny(page);
if(b&&!b._faced){b._faced=1;b.style.setProperty('--flip',Math.random()<.5?'1':'-1');}
}
var mo=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var added=muts[i].addedNodes;for(var j=0;j<added.length;j++){var n=added[j];if(n.nodeType===1&&n.id==='rabbit-page')decorate(n);}}});
mo.observe(document.body,{childList:true});
/* Tap a cloud: soar up, try to eat it, give up, hop home; cloud wobbles, unharmed */
window.addEventListener('click',function(e){
var page=document.getElementById('rabbit-page');if(!page)return;
if(page._soaring){e.stopImmediatePropagation();e.preventDefault();return;}
var cl=e.target.closest?e.target.closest('.rb-cloud'):null;
if(!cl)return;
e.stopImmediatePropagation();e.preventDefault();
var b=findBunny(page);if(!b)return;
page._soaring=1;b.style.zIndex=9;b.style.animation='none';
var pr=page.getBoundingClientRect(),cr=cl.getBoundingClientRect();
var cxp=(cr.left+cr.width/2-pr.left)/pr.width*100, cyp=Math.max(10,(cr.top+cr.height/2-pr.top)/pr.height*100);
var flip=(cxp>50?-1:1);
var anim=b.animate([
{left:'50%',top:'56%',transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+')'},
{left:'50%',top:'60%',transform:'translate(-50%,-50%) scale(1.8) scaleX('+flip+') rotate('+(flip*-6)+'deg)',offset:.12},
{left:((50+cxp)/2)+'%',top:((56+cyp)/2+6)+'%',transform:'translate(-50%,-50%) scale(3.1) scaleX('+flip+') rotate('+(flip*10)+'deg)',offset:.38},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.5) scaleX('+flip+') rotate('+(flip*4)+'deg)',offset:.55},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.6) scaleX('+flip+') rotate('+(flip*-8)+'deg)',offset:.66},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.5) scaleX('+flip+') rotate('+(flip*6)+'deg)',offset:.76},
{left:'50%',top:'56%',transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+')'}
],{duration:2300,easing:'ease-in-out'});
setTimeout(function(){cl.animate([{transform:'translate(0,0) rotate(0)'},{transform:'translate(-6px,2px) rotate(-4deg)'},{transform:'translate(5px,-2px) rotate(3deg)'},{transform:'translate(0,0) rotate(0)'}],{duration:600,easing:'ease-in-out'});},1250);
anim.onfinish=function(){b.style.animation='rabbithop 1.6s ease-in-out infinite';b.style.zIndex='';page._soaring=0;};
},true);
})();
/* ===== Rabbit v7: hop while traveling (no more sliding) ===== */
(function(){
if(window.__rabbitHop)return;window.__rabbitHop=1;
function findBunny(page){var ds=page.querySelectorAll('div');for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰')return ds[i];}return null;}
function hopTop(b,page,dur){
var rect=page.getBoundingClientRect();
var startPx=parseFloat(getComputedStyle(b).top)||0;
var endPct=parseFloat(b.style.top);if(isNaN(endPct))endPct=56;
var endPx=endPct/100*rect.height;
var dist=Math.abs(endPx-startPx);
var H=Math.max(2,Math.min(5,Math.round(dur/340)));      /* ~4 hops per trip */
var hopH=Math.min(46,14+dist*0.10);                      /* bigger distance = bigger hops */
var kf=[{top:startPx+'px',easing:'ease-out'}];
for(var i=0;i<H;i++){
var t0=i/H,t1=(i+1)/H,tm=(t0+t1)/2;
kf.push({top:(startPx+(endPx-startPx)*tm-hopH)+'px',offset:+tm.toFixed(4),easing:'ease-in'});
kf.push({top:(startPx+(endPx-startPx)*t1)+'px',offset:+t1.toFixed(4),easing:'ease-out'});
}
b.animate(kf,{duration:dur});
}
window.addEventListener('pointerdown',function(e){
var page=document.getElementById('rabbit-page');if(!page||page._soaring)return;
var f=e.target&&e.target.closest?e.target.closest('span'):null;
if(!f||f.parentNode!==page)return;
if(!/[🌼🌸🌺🌻🌷💮🪻]/.test(f.textContent||''))return;
var b=findBunny(page);if(!b||b._hop)return;
b._hop=1;
setTimeout(function(){hopTop(b,page,1400);},0);    /* outbound hops */
setTimeout(function(){hopTop(b,page,1400);},2360); /* home hops */
setTimeout(function(){b._hop=0;},3900);
},true);
})();
/* ===== Viewer tab: exactly halfway between the Works button and the right edge ===== */
(function(){
function place(){
var vt=document.querySelector('.tab.tab-viewer');if(!vt)return;
var tabs=vt.parentElement;if(!tabs)return;
var works=null,ts=tabs.querySelectorAll('.tab');
for(var i=0;i<ts.length;i++){if((ts[i].textContent||'').indexOf('Works')!==-1&&ts[i]!==vt){works=ts[i];break;}}
if(!works)return;
if(vt.dataset.vtop===undefined){vt.dataset.vtop=String(vt.getBoundingClientRect().top-tabs.getBoundingClientRect().top);}
tabs.style.position='relative';
var pr=tabs.getBoundingClientRect(),wr=works.getBoundingClientRect();
var M=(wr.right+window.innerWidth)/2;
vt.style.position='absolute';
vt.style.top=vt.dataset.vtop+'px';
vt.style.left=Math.max(0,M-pr.left-vt.offsetWidth/2)+'px';
vt.style.margin='0';
}
window.addEventListener('resize',place);
if(typeof render==='function'&&!render._vtPlace){var _r=render;render=function(){var r=_r.apply(this,arguments);setTimeout(place,60);return r;};render._vtPlace=1;}
setTimeout(place,120);setTimeout(place,600);
})();
/* ================= PROVENANCE FINAL PATCH (consolidated) ================= */
(function(){
if(window.__finalPatch)return;window.__finalPatch=1;
function hexA(hex,a){var h=String(hex||'#8B877C').replace('#','');if(h.length===3)h=h.split('').map(function(c){return c+c;}).join('');var n=parseInt(h,16);if(isNaN(n))return 'rgba(139,135,124,'+a+')';return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')';}
function sgn(x){return x>0?1:x<0?-1:0;}
var _prevDV=window.drawViewer,_prevPC=window.paintCurrent;
/* ---- 1) Viewer: ONLY the user's photos, melted (no geometric shapes) ---- */
function photoScene(){
var rnd=mulberry32((Math.random()*1e9)>>>0);var s={washes:[],shards:[]};
var ps=[...state.paintings].sort(function(a,b){return (a.number||0)-(b.number||0);});
ps.forEach(function(p){
var es=entriesOf(p.id);var cols=uniqueColors(es).map(function(c){return c.hex;});
var srcs=[];es.forEach(function(e){(e.images||[]).forEach(function(src){if(srcs.length<4)srcs.push(src);});});
var cx=.5+Math.cos((p.number||0)*2.399963+rnd()*.8)*(.16+rnd()*.22), cy=.5+Math.sin((p.number||0)*2.399963+rnd()*.8)*(.16+rnd()*.22);
for(var w=0;w<2&&cols.length;w++)s.washes.push({hex:cols[(rnd()*cols.length)|0],fx:cx+(rnd()-.5)*.5,fy:cy+(rnd()-.5)*.5,fr:.3+rnd()*.45,al:.05+rnd()*.07,sp:.02+rnd()*.03,ph:rnd()*6.28,amp:.02+rnd()*.03});
srcs.forEach(function(src){
var pa={src:src,fx:cx+(rnd()-.5)*.36,fy:cy+(rnd()-.5)*.36,ready:null,frags:[]};
var nf=9+((rnd()*5)|0);
for(var f=0;f<nf;f++){pa.frags.push({sx:rnd()*.7,sy:rnd()*.7,sw:.3+rnd()*.45,sh:.3+rnd()*.45,ox:(rnd()-.5)*.62,oy:(rnd()-.5)*.62,dw:.18+rnd()*.34,rh:.6+rnd()*.9,rot:(rnd()-.5)*1.2,al:.10+rnd()*.16,blur:rnd()<.55?(1+rnd()*3):0,dsp:.03+rnd()*.05,dph:rnd()*6.28});}
s.shards.push(pa);});
});
return s;
}
function photoPaint(x,W,H,s,t){
var k=W/540;
x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';
x.fillStyle='#181b20';x.fillRect(0,0,W,H);
x.globalCompositeOperation='lighter';
(s.washes||[]).forEach(function(L){var gx=(L.fx+Math.sin(t*(L.sp||.03)+(L.ph||0))*(L.amp||.03))*W,gy=(L.fy+Math.cos(t*(L.sp||.03)*.8+(L.ph||0))*(L.amp||.03))*H,gr=(L.fr||.35)*H;var g=x.createRadialGradient(gx,gy,0,gx,gy,gr);g.addColorStop(0,hexA(L.hex,Math.min(.12,(L.al||.08)*1.3)));g.addColorStop(1,hexA(L.hex,0));x.fillStyle=g;x.fillRect(0,0,W,H);});
x.globalCompositeOperation='source-over';
(s.shards||[]).forEach(function(pa){
if(!pa.ready)return;var iw=pa.ready.width||4,ih=pa.ready.height||3;
(pa.frags||[]).forEach(function(fr){
var dw=(fr.dw||.2)*W,dh=dw*(fr.rh||1);
var dx=Math.sin(t*(fr.dsp||.04)+(fr.dph||0))*.012*W, dy=Math.cos(t*(fr.dsp||.04)*.8+(fr.dph||0))*.012*H;
x.save();x.translate((pa.fx+(fr.ox||0))*W+dx,(pa.fy+(fr.oy||0))*H+dy);x.rotate(fr.rot||0);
if(fr.blur)x.filter='blur('+(fr.blur*k).toFixed(1)+'px)';
x.globalAlpha=Math.min(.34,fr.al||.18);
x.drawImage(pa.ready,(fr.sx||0)*iw,(fr.sy||0)*ih,Math.max(1,(fr.sw||.3)*iw),Math.max(1,(fr.sh||.3)*ih),-dw/2,-dh/2,dw,dh);
x.restore();});});
x.save();x.filter='blur('+(6*k).toFixed(1)+'px)';
x.globalAlpha=.22;x.drawImage(x.canvas,0,0,W,H,4*k,5*k,W,H);
x.globalAlpha=.15;x.drawImage(x.canvas,0,0,W,H,-5*k,-4*k,W,H);
x.restore();
x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';
var vg=x.createRadialGradient(W/2,H/2,H/3,W/2,H/2,H*.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.30)');x.fillStyle=vg;x.fillRect(0,0,W,H);
}
function photoDraw(){
var cv=document.getElementById('viewer-canvas');if(!cv)return;
try{cancelAnimationFrame(vRaf);}catch(e){}
cv.width=540;cv.height=675;
var s=window.__photoScene;window.vScene=s;
var paint=function(){photoPaint(cv.getContext('2d'),cv.width,cv.height,s,window.vT||0);};
paint();
var seen={};
(s.shards||[]).forEach(function(pa){if(!pa.src||seen[pa.src])return;seen[pa.src]=1;var im=new Image();im.onload=function(){pa.ready=im;paint();};im.src=pa.src;});
if(typeof VSPEEDS!=='undefined'&&typeof vSpeedIdx!=='undefined'&&VSPEEDS[vSpeedIdx]>0){var loop=function(){vRaf=requestAnimationFrame(loop);if(document.hidden)return;window.vT=(window.vT||0)+0.016*VSPEEDS[vSpeedIdx];paint();};vRaf=requestAnimationFrame(loop);}
if(typeof syncSpeedIco==='function')syncSpeedIco();
}
window.drawViewer=function(){if(!state.paintings.length){return _prevDV?_prevDV.apply(this,arguments):undefined;}window.__photoScene=photoScene();photoDraw();};
window.paintCurrent=function(){var cv=document.getElementById('viewer-canvas');if(!cv)return;if(!window.__photoScene||!state.paintings.length){return _prevPC?_prevPC.apply(this,arguments):undefined;}photoPaint(cv.getContext('2d'),cv.width,cv.height,window.__photoScene,window.vT||0);};
/* ---- 2) Refresh on the rabbit page -> a NEW field ---- */
var RKEY='prov.rabbit.open';
new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i],j,n;
for(j=0;j<m.addedNodes.length;j++){n=m.addedNodes[j];if(n.nodeType===1&&n.id==='rabbit-page'){try{sessionStorage.setItem(RKEY,'1');}catch(e){}}}
for(j=0;j<m.removedNodes.length;j++){n=m.removedNodes[j];if(n.nodeType===1&&n.id==='rabbit-page'){try{sessionStorage.removeItem(RKEY);}catch(e){}}}}}).observe(document.body,{childList:true});
function openRabbitClone(){
if(document.getElementById('rabbit-page'))return;
var o=document.createElement('div');o.id='rabbit-page';
o.style.cssText='position:fixed;inset:0;z-index:300;overflow:hidden;cursor:pointer;background:linear-gradient(#8EC9E8 0%,#BFE3F2 46%,#DFF3D8 62%,#79B45C 62%,#4E8A3C 100%)';
o.innerHTML='<div style="position:absolute;left:50%;top:56%;--rs:2.2;transform:translate(-50%,-50%) scale(2.2);font-size:64px;animation:rabbithop 1.6s ease-in-out infinite">🐇</div>';
document.body.appendChild(o);
}
if(typeof render==='function'&&!render._rabbitRestore){var _rr=render;render=function(){var r=_rr.apply(this,arguments);setTimeout(function(){var auth=document.getElementById('auth-screen'),shell=document.getElementById('app-shell');var authOn=auth&&getComputedStyle(auth).display!=='none';if(!authOn&&shell&&shell.style.display!=='none'){try{if(sessionStorage.getItem(RKEY)==='1')openRabbitClone();}catch(e){}}},120);return r;};render._rabbitRestore=1;}
/* ---- 3) Tap ANY cloud -> soar, try to eat, fail, return ---- */
window.addEventListener('click',function(e){
var page=document.getElementById('rabbit-page');if(!page)return;
if(page._soaring){e.stopImmediatePropagation();e.preventDefault();return;}
var el=e.target,cl=null;
if(el&&el.closest)cl=el.closest('.rb-cloud');
if(!cl&&el&&(el.textContent||'').trim()==='☁️')cl=el;
if(!cl)return;
e.stopImmediatePropagation();e.preventDefault();
var b=null,ds=page.querySelectorAll('div');
for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰'){b=ds[i];break;}}
if(!b)return;
page._soaring=1;b.style.zIndex=9;b.style.animation='none';
var pr=page.getBoundingClientRect(),cr=cl.getBoundingClientRect();
var cxp=(cr.left+cr.width/2-pr.left)/pr.width*100, cyp=Math.max(10,(cr.top+cr.height/2-pr.top)/pr.height*100);
var flip=(cxp>50?-1:1);
var anim=b.animate([
{left:'50%',top:'56%',transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+')'},
{left:'50%',top:'60%',transform:'translate(-50%,-50%) scale(1.8) scaleX('+flip+') rotate('+(flip*-6)+'deg)',offset:.12},
{left:((50+cxp)/2)+'%',top:((56+cyp)/2+6)+'%',transform:'translate(-50%,-50%) scale(3.1) scaleX('+flip+') rotate('+(flip*10)+'deg)',offset:.38},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.5) scaleX('+flip+') rotate('+(flip*4)+'deg)',offset:.55},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.6) scaleX('+flip+') rotate('+(flip*-8)+'deg)',offset:.66},
{left:cxp+'%',top:cyp+'%',transform:'translate(-50%,-50%) scale(1.5) scaleX('+flip+') rotate('+(flip*6)+'deg)',offset:.76},
{left:'50%',top:'56%',transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+')'}
],{duration:2300,easing:'ease-in-out'});
setTimeout(function(){cl.animate([{transform:'translate(0,0) rotate(0)'},{transform:'translate(-6px,2px) rotate(-4deg)'},{transform:'translate(5px,-2px) rotate(3deg)'},{transform:'translate(0,0) rotate(0)'}],{duration:600,easing:'ease-in-out'});},1250);
anim.onfinish=function(){b.style.animation='rabbithop 1.6s ease-in-out infinite';b.style.zIndex='';page._soaring=0;};
},true);
/* ---- 4) Eat flowers WITHOUT ever crossing the edge (bend/twist to reach) ---- */
window.addEventListener('pointerdown',function(e){
var page=document.getElementById('rabbit-page');if(!page||page._soaring)return;
var f=e.target&&e.target.closest?e.target.closest('span'):null;
if(!f||f.parentNode!==page)return;
if(!/[🌼🌸🌺🌻🌷🌹💮🪻]/.test(f.textContent||''))return;
var b=null,ds=page.querySelectorAll('div');
for(var i=0;i<ds.length;i++){var t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰'){b=ds[i];break;}}
if(!b)return;
var pr=page.getBoundingClientRect(),fr=f.getBoundingClientRect();
var fx=fr.left+fr.width/2-pr.left, fy=fr.top+fr.height/2-pr.top;
var W=141,H=141,s=sgn(fx-pr.width/2)||1, th=0.52*s;
var mx=0.45*W*s, rx=mx*Math.cos(th), ry=mx*Math.sin(th);
var hw=115,hh=115;
var ccx=Math.max(hw,Math.min(pr.width-hw,fx-rx));
var ccy=Math.max(hh,Math.min(pr.height-hh,fy-ry));
var clamped=(ccx!==fx-rx)||(ccy!==fy-ry);
b.style.left=(ccx/pr.width*100)+'%';
b.style.top=(ccy/pr.height*100)+'%';
var stX=Math.max(-34,Math.min(34,fx-(ccx+rx))), stY=Math.max(-26,Math.min(26,fy-(ccy+ry)));
var flip=(s===1?-1:1), tilt=th*180/Math.PI, bend=clamped?(s*10):0;
setTimeout(function(){
b.animate([
{transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+') rotate('+(s*10)+'deg)'},
{transform:'translate(-50%,-50%) translate('+stX+'px,'+stY+'px) scale(2.25) scaleX('+flip+') rotate('+(tilt+bend)+'deg)',offset:.35},
{transform:'translate(-50%,-50%) translate('+stX+'px,'+stY+'px) scale(2.12) scaleX('+flip+') rotate('+((tilt+bend)*.8)+'deg)',offset:.55},
{transform:'translate(-50%,-50%) translate('+stX+'px,'+stY+'px) scale(2.25) scaleX('+flip+') rotate('+(tilt+bend)+'deg)',offset:.78},
{transform:'translate(-50%,-50%) scale(2.2) scaleX('+flip+') rotate(0deg)'}
],{duration:750,easing:'ease-in-out'});
},1400);
},true);
})();
/* ===== Viewer v12: photos-only for anyone with uploads; geometric wall only for empty guests ===== */
(function(){
if(window.__viewerV12)return;window.__viewerV12=1;
var _prevDV=window.drawViewer,_prevPC=window.paintCurrent;
function hasPhotos(){for(var i=0;i<state.entries.length;i++){if((state.entries[i].images||[]).length)return true;}return false;}
function photoOnlyScene(){
var rnd=mulberry32((Math.random()*1e9)>>>0);
var s={base:[],shards:[],grain:[]};
var srcs=[];
(state.entries||[]).forEach(function(e){(e.images||[]).forEach(function(src){if(srcs.indexOf(src)===-1)srcs.push(src);});});
srcs=srcs.slice(0,6);
srcs.forEach(function(src,si){
var ang=si*2.399963+rnd()*.6;
var cx=.5+Math.cos(ang)*(.14+rnd()*.2), cy=.5+Math.sin(ang)*(.14+rnd()*.2);
s.base.push({src:src,ready:null,fx:cx+(rnd()-.5)*.3,fy:cy+(rnd()-.5)*.3,rot:(rnd()-.5)*.8,dw:.9+rnd()*.7,rh:.7+rnd()*.6,sx:rnd()*.5,sy:rnd()*.5,sw:.5,sh:.5});
var pa={src:src,ready:null,fx:cx+(rnd()-.5)*.3,fy:cy+(rnd()-.5)*.3,frags:[]};
var nf=8+((rnd()*5)|0);
for(var f=0;f<nf;f++){pa.frags.push({sx:rnd()*.7,sy:rnd()*.7,sw:.3+rnd()*.45,sh:.3+rnd()*.45,ox:(rnd()-.5)*.6,oy:(rnd()-.5)*.6,dw:.16+rnd()*.3,rh:.6+rnd()*.9,rot:(rnd()-.5)*1.2,al:.10+rnd()*.16,blur:rnd()<.5?(1+rnd()*3):0,dsp:.03+rnd()*.05,dph:rnd()*6.28});}
s.shards.push(pa);
});
for(var g=0;g<120;g++)s.grain.push({fx:rnd(),fy:rnd(),r:.5+rnd()*2,a:.02+rnd()*.05,light:rnd()<.5});
return s;
}
function photoOnlyPaint(x,W,H,s,t){
var k=W/540;
x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';
x.fillStyle='#16181d';x.fillRect(0,0,W,H);
/* ambient ground: huge blurred pieces of YOUR photos (no invented shapes) */
(s.base||[]).forEach(function(b){
if(!b.ready)return;var iw=b.ready.width||4,ih=b.ready.height||3;var dw=b.dw*W,dh=dw*b.rh;
x.save();x.translate(b.fx*W,b.fy*H);x.rotate(b.rot||0);
x.filter='blur('+(26*k).toFixed(1)+'px)';x.globalAlpha=.45;
x.drawImage(b.ready,(b.sx||0)*iw,(b.sy||0)*ih,Math.max(1,(b.sw||.5)*iw),Math.max(1,(b.sh||.5)*ih),-dw/2,-dh/2,dw,dh);
x.restore();});
x.filter='none';x.globalAlpha=1;
/* the collage itself */
(s.shards||[]).forEach(function(pa){
if(!pa.ready)return;var iw=pa.ready.width||4,ih=pa.ready.height||3;
(pa.frags||[]).forEach(function(fr){
var dw=(fr.dw||.2)*W,dh=dw*(fr.rh||1);
var dx=Math.sin(t*(fr.dsp||.04)+(fr.dph||0))*.012*W, dy=Math.cos(t*(fr.dsp||.04)*.8+(fr.dph||0))*.012*H;
x.save();x.translate((pa.fx+(fr.ox||0))*W+dx,(pa.fy+(fr.oy||0))*H+dy);x.rotate(fr.rot||0);
if(fr.blur)x.filter='blur('+(fr.blur*k).toFixed(1)+'px)';
x.globalAlpha=Math.min(.34,fr.al||.18);
x.drawImage(pa.ready,(fr.sx||0)*iw,(fr.sy||0)*ih,Math.max(1,(fr.sw||.3)*iw),Math.max(1,(fr.sh||.3)*ih),-dw/2,-dh/2,dw,dh);
x.restore();});});
/* melt the frame into itself so photos morph together */
x.save();x.filter='blur('+(6*k).toFixed(1)+'px)';
x.globalAlpha=.22;x.drawImage(x.canvas,0,0,W,H,4*k,5*k,W,H);
x.globalAlpha=.15;x.drawImage(x.canvas,0,0,W,H,-5*k,-4*k,W,H);
x.restore();
/* photographic grain + vignette only */
x.globalCompositeOperation='source-over';x.globalAlpha=1;x.filter='none';
(s.grain||[]).forEach(function(g3){x.fillStyle=g3.light?'rgba(244,242,236,'+g3.a+')':'rgba(0,0,0,'+g3.a+')';x.beginPath();x.arc(g3.fx*W,g3.fy*H,g3.r,0,7);x.fill();});
var vg=x.createRadialGradient(W/2,H/2,H/3,W/2,H/2,H*.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.30)');x.fillStyle=vg;x.fillRect(0,0,W,H);
}
window.drawViewer=function(){
if(!hasPhotos())return _prevDV?_prevDV.apply(this,arguments):undefined;   /* guests w/o uploads keep the geometric wall */
var cv=document.getElementById('viewer-canvas');if(!cv)return;
try{cancelAnimationFrame(vRaf);}catch(e){}
cv.width=540;cv.height=675;
var s=photoOnlyScene();window.__poScene=s;window.vScene=s;window.vT=0;
var paint=function(){photoOnlyPaint(cv.getContext('2d'),cv.width,cv.height,s,window.vT||0);};
paint();
var seen={};
function reg(o){if(!o.src||seen[o.src])return;seen[o.src]=1;var im=new Image();im.onload=function(){s.base.forEach(function(b){if(b.src===o.src)b.ready=im;});s.shards.forEach(function(p){if(p.src===o.src)p.ready=im;});paint();};im.src=o.src;}
s.base.forEach(reg);s.shards.forEach(reg);
if(typeof VSPEEDS!=='undefined'&&typeof vSpeedIdx!=='undefined'&&VSPEEDS[vSpeedIdx]>0){var loop=function(){vRaf=requestAnimationFrame(loop);if(document.hidden)return;window.vT=(window.vT||0)+0.016*VSPEEDS[vSpeedIdx];paint();};vRaf=requestAnimationFrame(loop);}
if(typeof syncSpeedIco==='function')syncSpeedIco();
};
window.paintCurrent=function(){
if(!hasPhotos())return _prevPC?_prevPC.apply(this,arguments):undefined;
var cv=document.getElementById('viewer-canvas');if(!cv||!window.__poScene)return;
photoOnlyPaint(cv.getContext('2d'),cv.width,cv.height,window.__poScene,window.vT||0);
};
})();
/* ===== SHARE FIX v3: unique filenames + PDFs with real content ===== */
(function(){
function slug(s){s=String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return s||'untitled';}
function workFile(id){var p=getP(id);if(!p)return 'Provenance-work';return 'Provenance-'+(p.number?p.number+'-':'')+slug(p.title);}
function entryFile(id){var e=null;for(var i=0;i<state.entries.length;i++){if(state.entries[i].id===id){e=state.entries[i];break;}}
if(!e)return 'Provenance-entry';var d=new Date(e.date);var p=getP(e.paintingId);
return 'Provenance-'+(p?(p.number?p.number+'-':'')+slug(p.title)+'-':'')+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function esc2(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
function loadHtml2Pdf(){if(window.html2pdf)return Promise.resolve();return new Promise(function(res,rej){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
function buildShareHTML(kind,id){
var h='<div style="font-family:Georgia,serif;color:#191A20;background:#ffffff;padding:24px">';
if(kind==='work'){var p=getP(id);if(!p)return '<p>Missing work</p>';var es=entriesOf(id);
h+='<div style="font-size:34px;font-weight:bold;color:#2733C9">'+(p.number?String(p.number).padStart(2,'0'):'')+'</div>'
+'<h1 style="font-size:26px;margin:4px 0">'+esc2(p.title)+'</h1>'
+'<p style="color:#555;font-size:12px;margin:0 0 14px">'+esc2(p.medium||'')+(p.size?' · '+esc2(p.size):'')+' · Provenance art journal</p>';
es.forEach(function(e){h+='<div style="border-top:1px solid #ddd;margin:12px 0;padding-top:10px"><p style="color:#777;font-size:11px;margin:0 0 6px">'+esc2(fmtDateTime(e.date))+'</p>'+(e.text?'<p style="font-size:13px;line-height:1.5;margin:0 0 8px">'+esc2(e.text)+'</p>':'')+((e.images||[]).map(function(s){return '<img src="'+s+'" style="max-width:100%;border-radius:6px;margin:0 6px 6px 0">';}).join(''))+'</div>';});
}else{var e=state.entries.find(function(x){return x.id===id;});if(!e)return '<p>Missing entry</p>';var p2=getP(e.paintingId);
h+='<h1 style="font-size:22px;margin:0 0 4px">'+(p2?esc2(p2.title):'Studio session')+'</h1><p style="color:#777;font-size:11px;margin:0 0 10px">'+esc2(fmtDateTime(e.date))+' · Provenance art journal</p>'+(e.text?'<p style="font-size:13px;line-height:1.5">'+esc2(e.text)+'</p>':'')+((e.images||[]).map(function(s){return '<img src="'+s+'" style="max-width:100%;border-radius:6px;margin:0 6px 6px 0">';}).join(''));}
return h+'</div>';}
function makePdfBlob(html){
return loadHtml2Pdf().then(function(){
var cover=document.createElement('div');cover.style.cssText='position:fixed;inset:0;background:rgba(20,21,27,.94);z-index:99999;display:flex;align-items:center;justify-content:center;color:#F4F2EC;font:600 15px sans-serif;';cover.textContent='Making PDF…';
var holder=document.createElement('div');holder.style.cssText='position:fixed;left:0;top:0;width:794px;background:#fff;z-index:99998;pointer-events:none;';
holder.innerHTML=html;document.body.appendChild(holder);document.body.appendChild(cover);
var opt={margin:[8,8,10,8],image:{type:'jpeg',quality:.92},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',scrollX:0,scrollY:0},jsPDF:{unit:'mm',format:'a4'}};
return window.html2pdf().set(opt).from(holder).output('blob').then(function(b){holder.remove();cover.remove();return b;},function(){holder.remove();cover.remove();return null;});
});}
function shareBlob(blob,filename,mime,text){if(!blob)return;
var f=new File([blob],filename,{type:mime});
if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Provenance',text:text||''}).catch(function(){});}
else{var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();a.remove();toast('Saved to Downloads');}}
function openShare3(kind,id){window.__shareCtx3={kind:kind,id:id};
openModal('<div class="overlay" data-action="overlay-close"><div class="panel" style="max-width:400px"><div class="panel-head"><h2 style="font-size:20px">Share as PDF</h2><button type="button" class="icon-btn" data-action="close-modal">✕</button></div><div style="display:flex;flex-direction:column;gap:8px">'
+'<button type="button" class="btn ghost" data-action="sh3-email" style="justify-content:flex-start">📧 Email the PDF</button>'
+'<button type="button" class="btn ghost" data-action="sh3-signal" style="justify-content:flex-start">💬 Signal the PDF</button>'
+'<button type="button" class="btn ghost" data-action="sh3-insta" style="justify-content:flex-start">📸 Instagram (photo)</button>'
+'<button type="button" class="btn ghost" data-action="sh3-save" style="justify-content:flex-start">📥 Save PDF to device</button>'
+'</div><p class="hint" style="margin:10px 0 0">Email & Signal open your phone\u2019s share sheet with the PDF attached. Instagram only accepts photos, so it receives the artwork photo.</p></div></div>');}
document.addEventListener('click',function(e){
var t=e.target.closest('[data-action^="sh3-"]');if(!t)return;
e.stopImmediatePropagation();e.preventDefault();
var ctx=window.__shareCtx3;if(!ctx)return;
closeModal();
var name=(ctx.kind==='work')?workFile(ctx.id):entryFile(ctx.id);
var act=t.dataset.action;
if(act==='sh3-save'){toast('Making PDF…');makePdfBlob(buildShareHTML(ctx.kind,ctx.id)).then(function(b){if(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name+'.pdf';document.body.appendChild(a);a.click();a.remove();toast('PDF saved');}});}
else if(act==='sh3-insta'){var src=null;if(ctx.kind==='work'){var es=entriesOf(ctx.id);for(var i=0;i<es.length&&!src;i++)src=(es[i].images||[])[0];}else{var en=state.entries.find(function(x){return x.id===ctx.id;});src=en&&(en.images||[])[0];}if(!src){toast('No photo to share yet');return;}fetch(src).then(function(r){return r.blob();}).then(function(b){shareBlob(b,name+'.jpg','image/jpeg','Made in Provenance');});}
else{toast('Making PDF…');makePdfBlob(buildShareHTML(ctx.kind,ctx.id)).then(function(b){shareBlob(b,name+'.pdf','application/pdf','Provenance — work log');});}
},true);
function install(){window.shareWorkPDF=function(id){openShare3('work',id);};window.shareEntryPDF=function(id){openShare3('entry',id);};}
if(document.readyState==='complete')install();else window.addEventListener('load',install);
})();
/* ===== FIX A: unique share filenames (work + date + time) ===== */
(function(){
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'untitled';}
function p2(n){return String(n).padStart(2,'0');}
function stamp(){var d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+'-'+p2(d.getHours())+p2(d.getMinutes())+p2(d.getSeconds());}
window.provFileName=function(ctx){
if(ctx&&ctx.kind==='work'){var p=getP(ctx.id);if(p)return 'Provenance-'+(p.number?String(p.number)+'-':'')+slug(p.title)+'-'+stamp();}
if(ctx&&ctx.kind==='entry')return 'Provenance-entry-'+stamp();
return 'Provenance-'+stamp();
};
function esc2(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
function loadHtml2Pdf(){
if(window.html2pdf)return Promise.resolve();
return new Promise(function(res,rej){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
}
function buildShareHTML(kind,id){
var h='<div style="font-family:Georgia,serif;color:#191A20;background:#ffffff;padding:24px">';
if(kind==='work'){
var p=getP(id);if(!p)return '';
var es=entriesOf(id);
h+='<div style="font-size:34px;font-weight:bold;color:#2733C9">'+(p.number?p2(p.number):'')+'</div>'
+'<h1 style="font-size:26px;margin:4px 0">'+esc2(p.title)+'</h1>'
+'<p style="color:#555;font-size:12px;margin:0 0 14px">'+esc2(p.medium||'')+(p.size?' · '+esc2(p.size):'')+' · started '+esc2(fmtShort(p.createdAt))+' · Provenance art journal</p>';
es.forEach(function(e){
h+='<div style="border-top:1px solid #ddd;margin:12px 0;padding-top:10px">'
+'<p style="color:#777;font-size:11px;margin:0 0 6px">'+esc2(fmtDateTime(e.date))+'</p>'
+(e.text?'<p style="font-size:13px;line-height:1.5;margin:0 0 8px">'+esc2(e.text)+'</p>':'')
+((e.images||[]).map(function(s){return '<img src="'+s+'" style="max-width:100%;border-radius:6px;margin:0 6px 6px 0">';}).join(''))+'</div>';});
}else{
var e=state.entries.find(function(x){return x.id===id;});if(!e)return '';
var pw=getP(e.paintingId);
h+='<h1 style="font-size:22px;margin:0 0 4px">'+(pw?esc2(pw.title):'Studio session')+'</h1>'
+'<p style="color:#777;font-size:11px;margin:0 0 10px">'+esc2(fmtDateTime(e.date))+' · Provenance art journal</p>'
+(e.text?'<p style="font-size:13px;line-height:1.5">'+esc2(e.text)+'</p>':'')
+((e.images||[]).map(function(s){return '<img src="'+s+'" style="max-width:100%;border-radius:6px;margin:0 6px 6px 0">';}).join(''));
}
return h+'</div>';
}
function makePdfBlob(html){
return loadHtml2Pdf().then(function(){
var holder=document.createElement('div');
holder.style.cssText='position:fixed;left:-10000px;top:0;width:794px;pointer-events:none';
holder.innerHTML=html;document.body.appendChild(holder);
var opt={margin:10,image:{type:'jpeg',quality:.9},html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4'}};
return window.html2pdf().set(opt).from(holder).output('blob').then(function(b){holder.remove();return b;},function(){holder.remove();return null;});
});
}
function shareBlob(blob,filename,mime,text){
try{
var f=new File([blob],filename,{type:mime});
if(navigator.share&&navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:'Provenance',text:text||''}).catch(function(){});return;}
}catch(e){}
var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
toast('Saved to Downloads — attach it from there');
}
function openShareMenu2(kind,id){
window.__shareCtx2={kind:kind,id:id};
openModal('<div class="overlay" data-action="overlay-close"><div class="panel" style="max-width:400px">'
+'<div class="panel-head"><h2 style="font-size:20px">Share as PDF</h2><button type="button" class="icon-btn" data-action="close-modal">✕</button></div>'
+'<div style="display:flex;flex-direction:column;gap:8px">'
+'<button type="button" class="btn ghost" data-action="pv2-email" style="justify-content:flex-start">📧 Email the PDF</button>'
+'<button type="button" class="btn ghost" data-action="pv2-signal" style="justify-content:flex-start">💬 Signal the PDF</button>'
+'<button type="button" class="btn ghost" data-action="pv2-insta" style="justify-content:flex-start">📸 Instagram (photo)</button>'
+'<button type="button" class="btn ghost" data-action="pv2-save" style="justify-content:flex-start">📥 Save PDF to device</button>'
+'</div><p class="hint" style="margin:10px 0 0">Filenames include the work and the exact time, so every export is unique.</p></div></div>');
}
/* take over the Share buttons once the built-in share code has loaded */
window.addEventListener('load',function(){
window.shareWorkPDF=function(id){openShareMenu2('work',id);};
window.shareEntryPDF=function(id){openShareMenu2('entry',id);};
});
document.addEventListener('click',function(e){
var t=e.target.closest('[data-action^="pv2-"]');if(!t)return;
e.stopImmediatePropagation();e.preventDefault();
var ctx=window.__shareCtx2;if(!ctx)return;
closeModal();
var act=t.dataset.action;
if(act==='pv2-insta'){
var src=null;
if(ctx.kind==='work'){var es=entriesOf(ctx.id);for(var i=0;i<es.length&&!src;i++)src=(es[i].images||[])[0];}
else{var en=state.entries.find(function(x){return x.id===ctx.id;});src=en&&(en.images||[])[0];}
if(!src){toast('No photo to share yet');return;}
fetch(src).then(function(r){return r.blob();}).then(function(b){shareBlob(b,provFileName(ctx)+'.jpg','image/jpeg','Made in Provenance');});
}else{
toast('Making PDF…');
makePdfBlob(buildShareHTML(ctx.kind,ctx.id)).then(function(b){
if(!b){toast('Could not build the PDF');return;}
if(act==='pv2-save'){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=provFileName(ctx)+'.pdf';a.click();toast('PDF saved');}
else shareBlob(b,provFileName(ctx)+'.pdf','application/pdf','Provenance — work log');
});
}
},true);
})();

/* ===== FIX B: rabbit always in front of flowers (natural depth) ===== */
(function(){
var FLOW=['🌼','','🌺','','🌷','🌹','💮','🪻','🍃'];
function fixLayers(page){
var sp=page.querySelectorAll('span'),i,t;
for(i=0;i<sp.length;i++){t=(sp[i].textContent||'').trim();
if(FLOW.indexOf(t)!==-1)sp[i].style.zIndex='2';
else if(t==='🌿'||t==='🌾'||t==='☘️'||t==='🌱')sp[i].style.zIndex='1';}
var st=page.querySelectorAll('.rb-stem');for(i=0;i<st.length;i++)st[i].style.zIndex='2';
var ds=page.querySelectorAll('div'),b=null;
for(i=0;i<ds.length;i++){t=(ds[i].textContent||'').trim();if(t==='🐇'||t==='🐰'){b=ds[i];break;}}
if(b)b.style.zIndex='5';
var cl=page.querySelectorAll('.rb-cloud,.rb-cloud2');for(i=0;i<cl.length;i++)cl[i].style.zIndex='6';
var sun=page.querySelector('.rb-sun2')||page.querySelector('.rb-sun');if(sun)sun.style.zIndex='7';
}
var iv=null;
function tick(){var p=document.getElementById('rabbit-page');if(!p){if(iv){clearInterval(iv);iv=null;}return;}fixLayers(p);}
new MutationObserver(function(){tick();if(document.getElementById('rabbit-page')&&!iv)iv=setInterval(tick,400);}).observe(document.body,{childList:true});
tick();
})();
/* ===== Viewer row: 🖼 left · ↻ center · 🐢 right (after pin/save removed) ===== */
(function(){
function fixRow(){
var rem=document.querySelector('#view [data-action="viewer-remix"]');
if(!rem)return;
var row=rem.parentNode;
var po=document.getElementById('poster-view');
var spd=document.getElementById('vspeed-ico');
row.style.display='grid';
row.style.gridTemplateColumns='1fr auto 1fr';
row.style.alignItems='center';
row.style.width='100%';
if(po&&po.parentNode!==row)row.insertBefore(po,row.firstChild);
if(po){po.style.gridColumn='1';po.style.justifySelf='center';}
rem.style.gridColumn='2';rem.style.justifySelf='center';
if(spd&&spd.parentNode!==row)row.appendChild(spd);
if(spd){spd.style.gridColumn='3';spd.style.justifySelf='center';spd.style.position='static';spd.style.transform='none';}
}
if(typeof render==='function'&&!render._rowFix3){var _r=render;render=function(){var r=_r.apply(this,arguments);setTimeout(fixRow,0);setTimeout(fixRow,250);return r;};render._rowFix3=1;}
if(typeof drawViewer==='function'&&!drawViewer._rowFix3){var _d=drawViewer;drawViewer=function(){var r=_d.apply(this,arguments);setTimeout(fixRow,0);setTimeout(fixRow,250);return r;};drawViewer._rowFix3=1;}
setTimeout(fixRow,150);setTimeout(fixRow,700);
})();

/* ===== Work pages: tap the empty band (right of "← All works", below the header) toggles light/dark ===== */
(function(){
document.addEventListener('click',function(e){
if(typeof view==='undefined'||view.name!=='painting')return;
if(e.target.closest('button,a,input,select,textarea,label,.menu,.card,.panel,.film,.thumb,.entry'))return;
var top=document.querySelector('header.top');
var head=document.querySelector('#view .pd-head');
if(!top||!head)return;
var y=e.clientY;
if(y<top.getBoundingClientRect().bottom||y>head.getBoundingClientRect().top)return;
var dark=!document.body.classList.contains('dark');
document.body.classList.toggle('dark',dark);
try{localStorage.setItem('provenance.theme',dark?'dark':'light');}catch(e2){}
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',dark?'#191A20':'#F2F1EC');
},true);
})();
/* ===== Data rescue: device journal -> cloud, self-healing ===== */
(function(){
if(window.__dataRescue)return;window.__dataRescue=1;
function count(g){return ((g&&g.paintings)||[]).length+((g&&g.entries)||[]).length;}
function backup(){try{var raw=localStorage.getItem('provenance.local');if(raw&&count(JSON.parse(raw)))localStorage.setItem('provenance.guestbackup',raw);}catch(e){}}
function localSrc(){try{return JSON.parse(localStorage.getItem('provenance.guestbackup')||localStorage.getItem('provenance.local')||'null');}catch(e){return null;}}
/* one-time shrink so big payloads stop failing */
var shrinking=false;
function shrinkOnce(done){
if(shrinking||localStorage.getItem('prov.shrunk2')){if(done)done();return;}
shrinking=true;
var q=[];(state.entries||[]).forEach(function(e){(e.images||[]).forEach(function(s,i){if((s||'').length>250000)q.push({e:e,i:i});});});
(function next(){
var it=q.shift();
if(!it){try{localStorage.setItem('prov.shrunk2','1');}catch(e){}shrinking=false;if(done)done();return;}
var old=it.e.images[it.i],img=new Image();
img.onload=function(){try{var max=1000,sc=Math.min(1,max/Math.max(img.width,img.height));var c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));c.getContext('2d').drawImage(img,0,0,c.width,c.height);var nw=c.toDataURL('image/jpeg',.72);it.e.images[it.i]=nw;if(it.e.thumbs)it.e.thumbs[it.i]=nw;if(it.e.cover===old)it.e.cover=nw;}catch(e){}setTimeout(next,60);};
img.onerror=function(){setTimeout(next,60);};
img.src=old;
})();
}
/* push device journal to cloud whenever signed in and cloud is missing it */
function sync(){
if(typeof db==='undefined'||!db||!db.auth)return;
backup();
var src=localSrc();if(!src||!count(src))return;
db.auth.getUser().then(function(u){
if(!u||!u.data||!u.data.user)return;
db.from('journals').select('data').eq('user_id',u.data.user.id).maybeSingle().then(function(res){
var cloud=(res&&res.data&&res.data.data)||null;
var merged={paintings:(cloud&&cloud.paintings)||[],entries:(cloud&&cloud.entries)||[]};
var changed=false;
(src.paintings||[]).forEach(function(p){if(!merged.paintings.some(function(x){return x.id===p.id;})){merged.paintings.push(p);changed=true;}});
(src.entries||[]).forEach(function(en){if(!merged.entries.some(function(x){return x.id===en.id;})){merged.entries.push(en);changed=true;}});
if(!changed)return;
shrinkOnce(function(){
state=merged;
save().then(function(){render();toast('Device journal synced to your account ✓');});
});
});
});
}
/* if a signed-in load ever shows empty while cloud has data, re-load */
function reloadIfEmpty(){
if(typeof isGuest==='function'&&isGuest())return;
if(count(state))return;
if(typeof loadJournal==='function')loadJournal().then(function(){render();});
}
window.addEventListener('load',function(){setTimeout(sync,2000);setTimeout(reloadIfEmpty,3500);});
if(typeof db!=='undefined'&&db&&db.auth)db.auth.onAuthStateChange(function(ev,ses){if((ev==='SIGNED_IN'||ev==='INITIAL_SESSION')&&ses){setTimeout(sync,2000);setTimeout(reloadIfEmpty,3500);}});
})();
/* ===== In-App Welcome Message for New Users (No SMTP needed) ===== */
(function(){
  if(window.__inAppWelcome) return;
  window.__inAppWelcome = 1;

  function showWelcome() {
    if(typeof openModal !== 'function') return;
    openModal('<div class="overlay" data-action="overlay-close"><div class="panel" style="max-width:520px">'
      +'<div class="panel-head"><h2 style="font-size:22px;margin:0">Welcome to Provenance</h2><button type="button" class="icon-btn" data-action="close-modal">✕</button></div>'
      +'<div style="display:flex;flex-direction:column;gap:18px;font-size:15px;line-height:1.6;color:var(--ink);padding:4px 0">'
        +'<div><b style="font-size:16px">Your art journal.</b><br>Catalog each work, then log sessions as it develops — notes, progress photos, and the exact colors on your palette. Everything lands on your <b>Timeline</b>, while <b>Works</b> keeps one card per piece.</div>'
        +'<div><b style="font-size:16px">Getting around.</b><br><b>+ New Work</b> catalogs a piece; <b>+ New Entry</b> logs a session. Hold any photo to mark it Work, Other, or delete it. Sort and search from either page, and use the ⚙ menu for backups and settings.</div>'
        +'<div><b style="font-size:16px">The Viewer.</b><br>A living visualization composed from your photos and palettes. Tap it to cycle its movement, or hit ↻ for a brand-new arrangement.</div>'
      +'</div>'
      +'<div class="panel-foot"><span class="spacer"></span><button type="button" class="btn primary" data-action="close-modal">Start exploring</button></div>'
      +'</div></div>');
  }

  // Trigger only on the very first login of a specific user
  if (typeof db !== 'undefined' && db && db.auth) {
    db.auth.onAuthStateChange(function(ev, ses) {
      if ((ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION') && ses && ses.user) {
        var uid = ses.user.id;
        var key = 'prov.welcomed.' + uid;
        try {
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, '1');
            // slight delay so the app UI renders behind the modal
            setTimeout(showWelcome, 600); 
          }
        } catch(e) {}
      }
    });
  }
})();
/* ===== DEFINITIVE COVER PHOTO FIX ===== */
(function(){
  if(window.__coverFixFinal) return;
  window.__coverFixFinal = 1;

  // 1. Intercept cover pick and force a DIRECT cloud write (bypasses the failing save wrapper)
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target.closest('[data-action="pick-cover"]') : null;
    if(!t) return;
    var pid = window._editingPainting;
    var p = (typeof getP === 'function') ? getP(pid) : null;
    if(!p) return;
    
    var newCover = t.dataset.src;
    p.cover = newCover; // Update memory immediately
    
    // Force direct cloud upsert after a slight delay
    setTimeout(function(){
      if(typeof db !== 'undefined' && db && db.auth){
        db.auth.getUser().then(function(res){
          var u = res && res.data && res.data.user;
          if(!u) return;
          db.from('journals').upsert({
            user_id: u.id,
            data: state,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' }).then(function(){
            if(typeof toast === 'function') toast('Cover saved to cloud ✓');
          }).catch(function(err){
            console.error('Cover cloud save failed:', err);
          });
        });
      }
    }, 800); 
  }, true); 

  // 2. Force the Works grid to display the chosen cover after every render
  function patchCovers(){
    var cards = document.querySelectorAll('.pcard[data-id]');
    for(var i=0; i<cards.length; i++){
      var id = cards[i].getAttribute('data-id');
      var p = (typeof getP === 'function') ? getP(id) : null;
      if(!p || !p.cover) continue;
      
      var img = cards[i].querySelector('.pcover img');
      if(img){
        if(img.getAttribute('src') !== p.cover) img.setAttribute('src', p.cover);
      } else {
        var ghost = cards[i].querySelector('.pnum-ghost');
        if(ghost){
          var ni = document.createElement('img');
          ni.src = p.cover; ni.alt = ''; ni.loading = 'lazy';
          ni.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
          ghost.replaceWith(ni);
        }
      }
    }
  }

  if(typeof render === 'function' && !render.__coverPatch){
    var _origRender = render;
    render = function(){
      var r = _origRender.apply(this, arguments);
      setTimeout(patchCovers, 50);
      setTimeout(patchCovers, 600);
      return r;
    };
    render.__coverPatch = 1;
  }

  // 3. Override pcardHTML to ensure it ALWAYS respects p.cover when drawing cards
  if(typeof pcardHTML === 'function' && !pcardHTML.__coverPatch){
    var _origPcard = pcardHTML;
    pcardHTML = function(p, i){
      var h = _origPcard(p, i);
      if(p && p.cover){
        var tmp = document.createElement('div');
        tmp.innerHTML = h;
        var im = tmp.querySelector('.pcover img');
        if(im) im.setAttribute('src', p.cover);
        else {
          var ghost = tmp.querySelector('.pnum-ghost');
          if(ghost){
            var ni = document.createElement('img');
            ni.src = p.cover; ni.alt=''; ni.className='pcover-img';
            ni.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:inherit;';
            ghost.replaceWith(ni);
          }
        }
        h = tmp.innerHTML;
      }
      return h;
    };
    pcardHTML.__coverPatch = 1;
  }
})();
/* ===== BULLETPROOF FIXES: Delete, Medium Default, No Autofocus Flash ===== */
(function(){
  if(window.__bulletproofFixes) return;
  window.__bulletproofFixes = 1;

  /* 1. DELETE ACCOUNT: Never freezes, hard-failsafe reload */
  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest ? e.target.closest('[data-action="delete-account"]') : null;
    if(!btn) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if(typeof closeModal === 'function') closeModal();

    if(typeof isGuest === 'function' && isGuest()){
      if(confirm('Delete all guest data on this device?')){
        try{ localStorage.clear(); sessionStorage.clear(); }catch(err){}
        location.reload();
      }
      return;
    }

    openModal('<div class="overlay" data-action="overlay-close"><div class="panel" style="max-width:360px">'
      +'<div class="panel-head"><h2 style="font-size:20px">Delete account?</h2><button type="button" class="icon-btn" data-action="close-modal">✕</button></div>'
      +'<p class="etext" style="margin:4px 0 12px">This permanently deletes your journal and account. Type <b>DELETE</b> to confirm.</p>'
      +'<input type="text" id="nuke-conf" placeholder="DELETE" autocomplete="off" style="width:100%;padding:10px;font-size:16px;">'
      +'<div class="panel-foot" style="margin-top:12px;"><button type="button" class="btn ghost" data-action="close-modal">Cancel</button>'
      +'<button type="button" class="btn primary" id="nuke-go" style="background:#d32f2f;color:white;">Delete forever</button></div></div></div>');

    document.getElementById('nuke-go').addEventListener('click', function(){
      var val = (document.getElementById('nuke-conf').value || '').trim();
      if(val !== 'DELETE'){
        alert('Please type DELETE exactly.');
        return;
      }
      
      closeModal();
      
      var overlay = document.createElement('div');
      overlay.id = 'nuke-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-family:sans-serif;';
      overlay.textContent = 'Deleting account...';
      document.body.appendChild(overlay);

      var done = false;
      function finish(){
        if(done) return;
        done = true;
        try{ localStorage.clear(); sessionStorage.clear(); }catch(err){}
        // Force hard redirect to clear app state and break any frozen loops
        window.location.href = window.location.origin + window.location.pathname + '?_=' + Date.now();
      }

      // Hard failsafe: reload after 3 seconds NO MATTER WHAT
      setTimeout(finish, 3000);

      if(typeof db !== 'undefined' && db && db.auth){
        db.auth.getUser().then(function(res){
          var u = res && res.data && res.data.user;
          if(u){
            // Fire requests without awaiting to prevent hanging on slow Supabase responses
            try{ db.from('journals').delete().eq('user_id', u.id).catch(function(){}); }catch(err){}
            try{ db.rpc('delete_own_account').catch(function(){}); }catch(err){}
            try{ db.auth.signOut().catch(function(){}); }catch(err){}
          }
          // Give network 1.5s to process, then force reload
          setTimeout(finish, 1500);
        }).catch(function(){
          setTimeout(finish, 500);
        });
      } else {
        setTimeout(finish, 500);
      }
    });
  }, true);

  /* 2 & 3. NEW WORK MODAL: Medium default + No autofocus flash */
  var mo = new MutationObserver(function(muts){
    for(var i=0; i<muts.length; i++){
      for(var j=0; j<muts[i].addedNodes.length; j++){
        var el = muts[i].addedNodes[j];
        if(el.nodeType === 1 && el.querySelector && el.querySelector('#pform')){
          
          // Fix Medium: Force empty selection for New Work
          var sel = el.querySelector('select[name="medium"]');
          if(sel){
            var titleInp = el.querySelector('input[name="title"]');
            if(!titleInp || !titleInp.value){
              sel.value = ''; // Selects the default "—" option
            }
          }

          // Fix Autofocus Flash: Override the .focus() method on the title input
          var titleInput = el.querySelector('input[name="title"]');
          if(titleInput){
            // Swallows the core app's auto-focus script so the keyboard doesn't flash
            titleInput.focus = function(){ /* do nothing */ };
            titleInput.blur();
            titleInput.removeAttribute('autofocus');
          }
        }
      }
    }
  });
  mo.observe(document.body, {childList: true, subtree: true});

})();
/* ===== EXIT APP ON BACK BUTTON (Sign-in page only) ===== */
(function(){
  if(window.__authBackExit) return;
  window.__authBackExit = 1;

  var exitPending = false;
  
  // Pushes a dummy history state so the back button has something to "pop"
  function ensureAuthSentinel(){
    var auth = document.getElementById('auth-screen');
    var authOn = auth && getComputedStyle(auth).display !== 'none';
    if(authOn && !exitPending){
      try{ 
        history.replaceState({appRoot:1}, '');
        history.pushState({authSentinel:1}, ''); 
      }catch(e){}
    }
  }

  // Watch for the auth screen becoming visible
  var authEl = document.getElementById('auth-screen');
  if(authEl){
    var mo = new MutationObserver(ensureAuthSentinel);
    mo.observe(authEl, {attributes: true, attributeFilter: ['style', 'class']});
  }
  setTimeout(ensureAuthSentinel, 800);

  // Intercept the back button
  window.addEventListener('popstate', function(e){
    var auth = document.getElementById('auth-screen');
    var authOn = auth && getComputedStyle(auth).display !== 'none';
    
    if(authOn){
      if(exitPending){
        // Second back press -> EXIT APP
        if(window.navigator.app && window.navigator.app.exitApp){
          window.navigator.app.exitApp(); // Android native wrapper
        } else {
          window.close(); // Works if the PWA was launched from home screen
          // Fallback for stubborn browsers: blanking the window effectively "closes" the PWA view
          setTimeout(function(){ window.location.href = 'about:blank'; }, 100);
        }
      } else {
        exitPending = true;
        if(typeof toast === 'function') toast('Tap back again to exit');
        
        // Re-push sentinel so the NEXT back press fires this event again
        setTimeout(function(){
          try{ history.pushState({authSentinel:1}, ''); }catch(err){}
        }, 50);
        
        // Auto-reset if they don't press back again within 3 seconds
        setTimeout(function(){ 
          exitPending = false; 
          ensureAuthSentinel();
        }, 3000);
      }
    }
  }, true);
  
  // Reset the pending exit if they tap the screen instead of hitting back again
  document.addEventListener('click', function(e){
    if(exitPending && e.target.closest('#auth-screen')){
      exitPending = false;
    }
  }, true);
})();
/* ===== GUEST GATE finalize: mark the bound account; keep vault for guest sessions ===== */
(function(){
if(window.__guestGate2)return;window.__guestGate2=1;
if(typeof db!=='undefined'&&db&&db.auth){
db.auth.onAuthStateChange(function(ev,ses){
if(!(ses&&ses.user))return;
var uid=ses.user.id,mode=null;
try{mode=sessionStorage.getItem('prov.auth.mode');}catch(e){}
if(mode!=='create')return;
try{localStorage.setItem('prov.guestbound.'+uid,'1');}catch(e){}
if(!localStorage.getItem('provenance.local')){ /* merge succeeded */
try{localStorage.removeItem('provenance.vault');sessionStorage.removeItem('prov.auth.mode');}catch(e){}
}
});
}
/* re-entering Guest Mode unlocks the vault so the guest keeps their own work */
if(typeof startGuest==='function'){
var _sg=startGuest;
startGuest=function(){try{var v=localStorage.getItem('provenance.vault');if(v&&!localStorage.getItem('provenance.local'))localStorage.setItem('provenance.local',v);}catch(e){}return _sg.apply(this,arguments);};
}
})();
/* ===== POLISH PACK: welcome tap-close, refresh stays on Works, cover sticks, faster loads ===== */
(function(){
if(window.__polishPack)return;window.__polishPack=1;

/* 1) Welcome modal: tapping anywhere in the white body also closes it */
document.addEventListener('click',function(e){
var panel=e.target&&e.target.closest?e.target.closest('.panel'):null;
if(!panel)return;
var h=panel.querySelector('.panel-head h2');
if(!h||h.textContent.indexOf('Welcome to Provenance')===-1)return;
if(e.target.closest('button, a, input, textarea, select, [data-action]'))return;
if(typeof closeModal==='function')closeModal();
},true);

/* 2) Refreshing the browser returns you to the page you were on (Works stays Works) */
function saveView(){try{if(typeof view!=='undefined')sessionStorage.setItem('prov.view',JSON.stringify(view));}catch(e){}}
if(typeof render==='function'&&!render.__vr){var _r=render;render=function(){saveView();return _r.apply(this,arguments);};render.__vr=1;}
function restoreView(){
try{
var v=JSON.parse(sessionStorage.getItem('prov.view')||'null');
if(!v)return;
if(v.name==='painting'&&typeof getP==='function'&&!getP(v.id))v={name:'paintings'};
if(v.name==='paintings'||v.name==='painting'){view=v;render();}
}catch(e){}
}
window.addEventListener('load',function(){setTimeout(restoreView,900);setTimeout(restoreView,2200);});

/* 3) Cover pick: force a direct cloud write so the cover ALWAYS sticks */
document.addEventListener('click',function(e){
var t=e.target&&e.target.closest?e.target.closest('[data-action="pick-cover"]'):null;
if(!t)return;
setTimeout(function(){
if(typeof db==='undefined'||!db||!db.auth)return;
db.auth.getUser().then(function(res){
var u=res&&res.data&&res.data.user;if(!u)return;
db.from('journals').upsert({user_id:u.id,data:state,updated_at:new Date().toISOString()},{onConflict:'user_id'}).catch(function(){});
});
},900);
},true);

/* 4) One-time deep optimize: shrink stored photos so refreshes are fast and saves never fail */
if(!localStorage.getItem('prov.deepshrunk')){
var run=function(){
var q=[];
(state.entries||[]).forEach(function(en){(en.images||[]).forEach(function(s,i){if((s||'').length>150000)q.push({en:en,i:i});});});
if(!q.length){try{localStorage.setItem('prov.deepshrunk','1');}catch(e){}return;}
(function next(){
var it=q.shift();
if(!it){try{localStorage.setItem('prov.deepshrunk','1');}catch(e){}
if(typeof save==='function')save().then(function(){if(typeof render==='function')render();toast('Photos optimized — refreshes are faster now');});return;}
var img=new Image();
img.onload=function(){try{var max=1000,sc=Math.min(1,max/Math.max(img.width,img.height));var c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));c.getContext('2d').drawImage(img,0,0,c.width,c.height);it.en.images[it.i]=c.toDataURL('image/jpeg',.72);}catch(e){}setTimeout(next,50);};
img.onerror=function(){setTimeout(next,50);};
img.src=it.en.images[it.i];
})();
};
window.addEventListener('load',function(){setTimeout(run,3000);});
}
})();
/* ===== DELETE WORK: closes the Edit window, lands on Works, works first try ===== */
(function(){
if(window.__delWorkFix)return;window.__delWorkFix=1;
document.addEventListener('click',function(e){
var t=e.target&&e.target.closest?e.target.closest('[data-action="delete-painting"]'):null;
if(!t)return;
e.stopImmediatePropagation();
e.preventDefault();
var id=t.getAttribute('data-id');
var p=(typeof getP==='function')?getP(id):null;
if(!p)return;
var label=(p.title&&p.title!=='Untitled')?p.title:(p.number?('Work '+p.number):'this work');
if(!window.confirm('Delete \u201C'+label+'\u201D and all of its entries?'))return;
state.paintings=state.paintings.filter(function(x){return x.id!==id;});
state.entries=state.entries.filter(function(x){return x.paintingId!==id;});
if(typeof closeModal==='function')closeModal();   /* the Edit window actually closes now */
view={name:'paintings',q:''};                      /* straight back to the Works page */
render();
toast('Work deleted');
if(typeof save==='function')save();                /* cloud sync in the background */
},true);
})();
