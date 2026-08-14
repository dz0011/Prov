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
</script>
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
