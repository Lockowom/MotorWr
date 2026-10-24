// Scheduled release-safe updater; GitHub Actions validates before committing only audited metadata.
// Sources are public and checked conservatively; production deployment happens after tests.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {OFFICIAL_PATCH_INDEX,parseOfficialPatchIndex,parseOfficialPatchSubjects,parseEditorialGuide,comparePatch,stableGuideFingerprint} from '../src/core/metaSync.js';
import {validateAutoMeta} from '../src/core/metaPolicy.js';
import {BUILD_REFERENCES} from '../src/data/buildReferences.js';
import {OFFICIAL_ROSTER} from '../src/data/officialRoster.js';

const file=fileURLToPath(new URL('../src/data/autoMeta.json',import.meta.url));
const old=validateAutoMeta(JSON.parse(fs.readFileSync(file,'utf8')));
const flags=new Set(process.argv.slice(2));
const dry=flags.has('--dry-run');
const noGuides=flags.has('--no-guides');
const day=new Date().toISOString().slice(0,10);
const sourceResults=[];
async function request(url,maxBytes=2_000_000){
 const parsed=new URL(url);
 if(!['wildrift.leagueoflegends.com','www.wildriftfire.com'].includes(parsed.hostname)||parsed.protocol!=='https:')throw Error('Non-allowlisted source '+url);
 const timeout=AbortSignal.timeout(18000);
 const res=await fetch(url,{signal:timeout,headers:{'User-Agent':'MotorWr-MetaAudit/1.0 (+https://github.com/Lockowom/MotorWr)','Accept':'text/html,application/xhtml+xml'}});
 if(!res.ok)throw Error('Source HTTP '+res.status+' '+parsed.hostname+parsed.pathname);
 const type=res.headers.get('content-type')||'';
 if(!type.includes('text/html')&&!type.includes('text/plain'))throw Error('Unexpected source Content-Type '+type);
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<100||bytes.length>maxBytes)throw Error('Unexpected source length '+bytes.length);
 return bytes.toString('utf8');
}
const official=await request(OFFICIAL_PATCH_INDEX);
const latest=parseOfficialPatchIndex(official);
if(comparePatch(latest.patch,old.patch)<0)throw Error('Official source went backwards; keep last known-good metadata.');
// An empty extraction means "unknown", not "no champion/item/rune changes".
let patchSubjects=old.patchSubjects &&
 Object.values(old.patchSubjects).some(section=>Array.isArray(section)&&section.length)
 ?old.patchSubjects:null;
if(comparePatch(latest.patch,old.patch)>0||!patchSubjects){
 const current=old.patch.split('.').map(x=>parseInt(x,10));
 const next=latest.patch.split('.').map(x=>parseInt(x,10));
 if(next[0]-current[0]>1||next[0]<current[0]||(next[0]===current[0]&&next[1]-current[1]>1)){
  throw Error('Unusual patch jump '+old.patch+' => '+latest.patch+' needs manual review');
 }
 // Never promote an unconfirmed slug/404 as a valid official article.
 const noteBody=await request(latest.url,3_000_000);
 if(!noteBody.toLowerCase().includes(latest.patch))throw Error('Official article does not contain the detected patch');
 const extracted=parseOfficialPatchSubjects(noteBody,OFFICIAL_ROSTER.map(x=>x.name));
 patchSubjects=Object.values(extracted).some(section=>section.length)?extracted:null;
}
const patch=comparePatch(latest.patch,old.patch)>0?latest.patch:old.patch;
const source=new Map(BUILD_REFERENCES.map(r=>[r.champion,r.source.url]));
const groups=new Map();
for(const ref of BUILD_REFERENCES){
 if(!groups.has(ref.champion))groups.set(ref.champion,[]);
 groups.get(ref.champion).push(ref.role);
}
let updated=0,checked=0,errors=[];
const preserved=old.guides.filter(x=>x.patch===patch);
const guideMap=new Map(preserved.map(x=>[x.champion+'|'+x.role,x]));
// A low-volume allowlist of existing references, not a full 142-champion crawl.
if(!noGuides){
 for(const [champion,roles] of groups){
  const url=source.get(champion);
  try{
   const guideHtml=await request(url,2_000_000);
   const parsed=parseEditorialGuide(guideHtml,champion,roles);
   checked++;
   for(const p of parsed){
    if(p.patch!==patch){sourceResults.push(champion+' '+p.role+': fuente '+p.patch+' distinta del parche '+patch);continue;}
    const baseline=BUILD_REFERENCES.find(r=>r.champion===champion&&r.role===p.role);
    if(!baseline||!OFFICIAL_ROSTER.some(r=>r.name===champion))throw Error('Unregistered source/role');
    const key=champion+'|'+p.role;
    const existing=guideMap.get(key);
    const candidate={
     champion,role:p.role,patch,checkedAt:day,
     source:{publisher:'WildRiftFire',type:'third_party_editorial',url},
     finalItems:p.finalItems,runes:p.runes,spells:p.spells,
     // Skill order is NOT automatically inferred from a fragile website diagram.
     skillPriority:patch===baseline.patch?[...baseline.skillPriority]:[],
     skillPriorityStatus:patch===baseline.patch?'prior_editorial':'pending_review'
    };
    // Keep verified, patch-matched ability identities when the editorial source updates
    // objects/runes. Do not imply that an ability level-up order has been verified.
    if(p.abilities)candidate.abilities={...p.abilities};
    else if(baseline.abilities && baseline.patch===patch)candidate.abilities={...baseline.abilities};
    const previousFingerprint=existing?stableGuideFingerprint(existing):stableGuideFingerprint(baseline);
    const fingerprint=stableGuideFingerprint(candidate);
    if(existing&&previousFingerprint===fingerprint)continue;
    if(!existing&&baseline.patch===patch&&fingerprint===previousFingerprint)continue;
    guideMap.set(key,candidate);
    updated++;
   }
  }catch(e){errors.push(champion+': '+e.message)}
  // Avoid bursts or high-frequency crawling to the editorial provider.
  await new Promise(resolve=>setTimeout(resolve,220));
 }
}
if(!noGuides&&checked===0&&groups.size)throw Error('No editorial sources validated: '+errors.join(' | '));
if(flags.has('--strict-sources')&&errors.length)throw Error('Source adapter failures: '+errors.join(' | '));
const candidate={
 schema:1,
 patch,
 patchUrl:patch===old.patch?old.patchUrl:latest.url,
 updatedAt:old.updatedAt,
 officialSource:OFFICIAL_PATCH_INDEX,
 guides:[...guideMap.values()].sort((a,b)=>(a.champion+'|'+a.role).localeCompare(b.champion+'|'+b.role)),
 patchSubjects,
 warning:[
  ...(errors.length?['Algunas fuentes editoriales necesitan revisión; se conservaron los últimos datos válidos.']:[]),
  ...(patchSubjects===null?['La lista de cambios de campeones, objetos y runas del nuevo parche no se pudo clasificar con certeza. Consultar notas oficiales.']:[])
 ].join(' ')||null
};
const before=JSON.stringify({...old,updatedAt:'x'});
const after=JSON.stringify({...candidate,updatedAt:'x'});
const changed=before!==after;
if(changed)candidate.updatedAt=day;
validateAutoMeta(candidate);
const report={officialPatch:latest.patch,activePatch:candidate.patch,guideSourcesChecked:checked,guideChanges:updated,partialFailures:errors,changed,dryRun:dry};
console.log('META_SYNC_REPORT '+JSON.stringify(report));
for(const msg of sourceResults)console.log('META_SYNC_PENDING '+msg);
if(errors.length)for(const e of errors)console.warn('META_SYNC_WARNING '+e);
if(changed&&!dry){
 fs.writeFileSync(file,JSON.stringify(candidate,null,2)+'\n');
 console.log('Updated audited autoMeta.json; the workflow will validate and deploy the current environment.');
}else console.log('No committed changes (or dry-run).');
