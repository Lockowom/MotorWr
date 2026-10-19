const CACHE = 'motorwr-multichampion-beta-v2';
const APP_SHELL = ['./','./index.html','./multi.html','./manifest.webmanifest','./assets/icon.svg','./src/core/multiChampion.js','./src/data/champions.js','./src/data/tacticalProfiles.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('motorwr-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  e.respondWith(fetch(req).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp)).catch(()=>{});}return res;}).catch(()=>caches.match('./index.html')));return;
 }
 e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});}return res;}).catch(()=>cached||Response.error())));
});
