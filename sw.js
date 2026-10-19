// Offline-first shell with a network-first, validated live-meta resource.
// Preserve offline routing independently for main MotorWr, optional /multi, and legacy /camille.
const CACHE='motorwr-personal-release-v2.2.0';
const APP_SHELL=['./','./index.html','./multi.html','./camille.html','./manifest.webmanifest','./manifest-multi.webmanifest','./manifest-camille.webmanifest','./assets/icon.svg',
 './src/core/multiChampion.js','./src/core/metaPolicy.js','./src/core/metaSync.js',
 './src/data/champions.js','./src/data/tacticalProfiles.js','./src/data/officialRoster.js',
 './src/data/patchNotes.js','./src/data/buildReferences.js','./src/data/autoMeta.json'];
const pageKey=path=>/\/camille(?:\.html)?\/?$/.test(path)?'./camille.html':
 /\/multi(?:\.html)?\/?$/.test(path)?'./multi.html':'./index.html';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('motorwr-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 const dynamic=url.pathname.endsWith('/src/data/autoMeta.json');
 if(req.mode==='navigate'){
  const key=pageKey(url.pathname);
  event.respondWith(fetch(req).then(async res=>{
   if(res.ok){const cache=await caches.open(CACHE);await cache.put(key,res.clone()).catch(()=>{});}
   return res;
  }).catch(()=>caches.match(key).then(res=>res||caches.match('./index.html')||Response.error())));
  return;
 }
 if(dynamic){
  event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(async res=>{
   if(res.ok){const cache=await caches.open(CACHE);await cache.put('./src/data/autoMeta.json',res.clone()).catch(()=>{});}
   return res;
  }).catch(()=>caches.match('./src/data/autoMeta.json').then(res=>res||Response.error())));
  return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
  if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{});}
  return res;
 }).catch(()=>Response.error())));
});
