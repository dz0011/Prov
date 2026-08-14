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
pin.innerHTML=localStorage.getItem(KEY)?'📌 Pinned':'📌 Pin this view';
host.parentNode.insertBefore(pin,host.nextSibling);
pin.addEventListener('click',function(){
if(localStorage.getItem(KEY)){try{localStorage.removeItem(KEY);}catch(e){}pin.innerHTML='📌 Pin this view';toast('Unpinned \u2014 refreshes will vary again');}
else{try{localStorage.setItem(KEY,JSON.stringify(window.vScene,function(k,v){return k==='ready'?undefined:v;}));pin.innerHTML='📌 Pinned';toast('Pinned \u2014 this arrangement now stays');}catch(e){toast('Could not pin this view');}}
});
}
if(!document.getElementById('poster-view')){
var po=document.createElement('button');po.id='poster-view';po.type='button';po.className='btn ghost';po.style.borderRadius='999px';po.innerHTML='🖼 Save poster';
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
<script>
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
</body>
</html>
