import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const base='https://motorwr.test/';
const key=input=>new URL(typeof input==='string'?input:input.url,base).href;
const network=new Map();
const disk=new Map();
let isOffline=false;
const calls=[];
const listeners={};
class RequestMock {
 constructor(input, options={}){
  this.url=key(input);
  this.method=typeof input==='string'?'GET':(input.method||'GET');
  this.mode=typeof input==='string'?'same-origin':(input.mode||'same-origin');
  this.cache=options.cache||'default';
  this.destination=typeof input==='string'?'':(input.destination||'');
 }
}
const caches={
 match:async request=>disk.get(key(request))?.clone(),
 open:async()=>({
  match:async request=>disk.get(key(request))?.clone(),
  put:async(request,response)=>{disk.set(key(request),response.clone());},
  addAll:async requests=>{for(const r of requests){const response=await networkFetch(r);disk.set(key(r),response.clone());}}
 }),
 keys:async()=>['motorwr-personal-release-v2.2.3','motorwr-icon-cache-v2.2.3'],
 delete:async()=>true
};
async function networkFetch(request){
 const uri=key(request);
 calls.push({uri,cache:request.cache});
 if(isOffline)throw new Error('Offline');
 if(!network.has(uri))return new Response('Not found',{status:404});
 return new Response(network.get(uri),{status:200,headers:{'content-type':'text/plain'}});
}
const code=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
vm.runInNewContext(code,{
 self:{location:{origin:base.slice(0,-1)},addEventListener:(name,callback)=>{listeners[name]=callback;}},
 caches,fetch:networkFetch,Request:RequestMock,Response,URL,Promise
},{filename:'sw.js'});
assert.equal(typeof listeners.fetch,'function');
async function retrieve(path,mode='same-origin',method='GET'){
 let response=null;
 listeners.fetch({request:new RequestMock({url:base+path,mode,method}),respondWith:value=>{response=Promise.resolve(value);}});
 return response?await response:null;
}
const modulePath='src/data/buildReferences.js';
disk.set(key(modulePath),new Response('old Akali-less build'));
network.set(key(modulePath),'new source-backed Akali reference');
const first=await retrieve(modulePath);
assert.equal(await first.text(),'new source-backed Akali reference','Network must override stale cached JS');
assert.equal(await (await caches.match(modulePath)).text(),'new source-backed Akali reference','Fresh JS must replace stale cached asset');
assert.equal(calls.at(-1).cache,'no-store','JS module should not reuse browser HTTP cache');
isOffline=true;
const offlineModule=await retrieve(modulePath);
assert.equal(await offlineModule.text(),'new source-backed Akali reference','Offline module must use last good cache');
isOffline=false;

const metaPath='src/data/autoMeta.json';
disk.set(key(metaPath),new Response('{"patch":"7.3a"}'));
network.set(key(metaPath),'{"patch":"7.3b"}');
assert.equal(await (await retrieve(metaPath)).text(),'{"patch":"7.3b"}');
assert.equal(calls.at(-1).cache,'no-store');

network.set(key('camille.html'),'legacy Camille');
network.set(key('index.html'),'MotorWr main');
assert.equal(await (await retrieve('camille.html','navigate')).text(),'legacy Camille');
assert.equal(await (await retrieve('index.html','navigate')).text(),'MotorWr main');
assert.equal(await (await caches.match('camille.html')).text(),'legacy Camille');
assert.equal(await (await caches.match('index.html')).text(),'MotorWr main');
isOffline=true;
assert.equal(await (await retrieve('camille.html','navigate')).text(),'legacy Camille','Offline navigation must not confuse Camille and main');
assert.equal(await (await retrieve('index.html','navigate')).text(),'MotorWr main','Offline main navigation must show MotorWr');
assert.equal(await (await retrieve(modulePath)).text(),'new source-backed Akali reference');
assert.equal((await retrieve('missing-file.js')).status,0,'Offline unknown resources should report network failure');
assert.equal(await retrieve('index.html','same-origin','POST'),null,'POST must bypass worker');
let outside=null;
listeners.fetch({request:new RequestMock({url:'https://example.com/asset.js'}),respondWith:value=>{outside=value;}});
assert.equal(outside,null,'Cross-origin requests must not be intercepted');
const publisherIcon='https://www.wildriftfire.com/images/items/stormsurge.png';
network.set(publisherIcon,'icon bytes');
isOffline=false;
let iconResponse=null;
listeners.fetch({request:new RequestMock({url:publisherIcon,destination:'image'}),respondWith:value=>{iconResponse=Promise.resolve(value);}});
assert.equal(await (await iconResponse).text(),'icon bytes','Publisher icon should render');
assert.equal(await (await caches.match(publisherIcon)).text(),'icon bytes','Publisher icon should enter offline cache');
isOffline=true;
let offlineIcon=null;
listeners.fetch({request:new RequestMock({url:publisherIcon,destination:'image'}),respondWith:value=>{offlineIcon=Promise.resolve(value);}});
assert.equal(await (await offlineIcon).text(),'icon bytes','Previously viewed icon should remain available offline');
let offsiteOther=null;
listeners.fetch({request:new RequestMock({url:'https://tracker.example.com/pixel.png',destination:'image'}),respondWith:value=>{offsiteOther=value;}});
assert.equal(offsiteOther,null,'Do not intercept unknown third-party images');
console.log('PASS: network-first modules, fallback, routed pages, allowlisted source icons and offline icon reuse');
