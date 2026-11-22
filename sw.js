const VERSION='v2';
const CACHE='watar-'+VERSION;
const FONTS='fonts-watar';
const FONT_CSS='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';
const FILES=['./','./index.html','./manifest.webmanifest','./storage.js','./sw.js','./icon-192.png','./icon-512.png','./maskable-192.png','./maskable-512.png','./apple-touch-icon.png','./favicon-32.png','./check.html'];
async function cacheFonts(){
  try{
    const c=await caches.open(FONTS);
    const r=await fetch(FONT_CSS);
    if(!r.ok)return;
    const css=await r.clone().text();
    await c.put(FONT_CSS,r);
    const urls=[...new Set(css.match(/https:\/\/fonts\.gstatic\.com[^)'"\s]+/g)||[])];
    await Promise.all(urls.map(u=>fetch(u).then(x=>x.ok&&c.put(u,x)).catch(()=>{})));
  }catch(e){}
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(cacheFonts).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('watar-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>cacheFonts()).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(r,{ignoreVary:true}).then(hit=>hit||fetch(r).then(res=>{
      if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());
      return res;
    }).catch(()=>Response.error()))));
    return;
  }
  if(u.origin!==location.origin)return;
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    if(hit)return hit;
    return fetch(r).then(res=>{
      if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}
      return res;
    }).catch(()=>r.mode==='navigate'?caches.match('./index.html'):Response.error());
  }));
});
