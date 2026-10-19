// MotorWr 2.2.1: navigation and executable modules use network-first freshness.
// Fail offline to verified cached copies; never show a stale module just because
// it was installed before an Akali/build update.
const CACHE='motorwr-personal-release-v2.2.4';
const ICON_CACHE='motorwr-icon-cache-v2.2.4';
const APP_SHELL=['./','./index.html','./multi.html','./camille.html',
 './manifest.webmanifest','./manifest-multi.webmanifest','./manifest-camille.webmanifest','./assets/icon.svg',
 './src/core/multiChampion.js','./src/core/metaPolicy.js','./src/core/metaSync.js',
 './src/data/champions.js','./src/data/tacticalProfiles.js','./src/data/officialRoster.js',
 './src/data/patchNotes.js','./src/data/buildReferences.js','./src/data/iconCatalog.js','./src/data/autoMeta.json','./src/core/iconResolver.js'];
const pageKey=path=>/\/camille(?:\.html)?\/?$/.test(path)?'./camille.html':
 /\/multi(?:\.html)?\/?$/.test(path)?'./multi.html':'./index.html';
const localModule=path=>/\/src\/(?:core|data)\/[^?#]+\.(?:js|json)$/.test(path);

// Keep a last-good copy, but revalidate against the network on each app launch.
// This is essential: a cache-first JavaScript module can otherwise be stale
// forever despite successful Cloudflare deployments and fresh HTML.
async function networkFirst(req,key,forceFresh=false){
 try{
  const request=forceFresh?new Request(req,{cache:'no-store'}):req;
  const response=await fetch(request);
  if(response.ok){
   const copy=response.clone();
   await caches.open(CACHE).then(cache=>cache.put(key,copy)).catch(()=>{});
  }
  return response;
 }catch(err){
  return (await caches.match(key))||Response.error();
 }
}
self.addEventListener('install',event=>{
 event.waitUntil(
  caches.open(CACHE)
   // Fetch all installation resources fresh rather than adopting stale HTTP cache.
   .then(cache=>cache.addAll(APP_SHELL.map(path=>new Request(path,{cache:'reload'}))))
   .then(()=>self.skipWaiting())
 );
});
self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(key=>key.startsWith('motorwr-')&&key!==CACHE&&key!==ICON_CACHE).map(key=>caches.delete(key))))
   .then(()=>self.clients.claim())
 );
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin){
  // Image-only caching for verified icon providers, never arbitrary external requests.
  const editorialIcon=['www.wildriftfire.com','www.mobafire.com'].includes(url.hostname) &&
    /^\/images\/(?:items|runes|summoners|ability)\/[a-z0-9-]+\.png$/.test(url.pathname);
  const riotSpellIcon=url.hostname==='ddragon.leagueoflegends.com' &&
    /^\/cdn\/16\.18\.1\/img\/(?:passive|spell)\/[A-Za-z0-9_-]+\.png$/.test(url.pathname);
  if(req.destination!=='image'||(!editorialIcon&&!riotSpellIcon))return;
  event.respondWith(caches.open(ICON_CACHE).then(async cache=>{
    const cached=await cache.match(req);
    if(cached)return cached;
    try{
      const response=await fetch(req);
      // Cross-origin images can be opaque (no-cors): those are cacheable.
      if(response.ok||response.type==='opaque')await cache.put(req,response.clone()).catch(()=>{});
      return response;
    }catch{
      return (await cache.match(req))||Response.error();
    }
  }).catch(()=>fetch(req)));
  return;
 }
 if(req.mode==='navigate'){
  const key=pageKey(url.pathname);
  event.respondWith(networkFirst(req,key,true));
  return;
 }
 if(localModule(url.pathname)){
  // Includes autoMeta.json, catalogue, profiles and build references.
  event.respondWith(networkFirst(req,req,true));
  return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(async response=>{
  if(response.ok)await caches.open(CACHE).then(cache=>cache.put(req,response.clone())).catch(()=>{});
  return response;
 }).catch(()=>Response.error())));
});
