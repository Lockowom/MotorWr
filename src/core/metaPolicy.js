import {getBuildReference,BUILD_SOURCE_PATCH} from '../data/buildReferences.js';

export const AUTO_SCHEMA=1;
const SAFE_PATCH=/^\d{1,2}\.\d{1,2}[a-z]?$/;
const SAFE_SOURCE=/^https:\/\/www\.wildriftfire\.com\/guide\/[a-z0-9-]+\/?$/;
const PATCH_LINK=/^https:\/\/wildrift\.leagueoflegends\.com\/en-us\/news\/(?:game-updates\/wild-rift-patch-notes-[a-z0-9-]+|tags\/patch-notes)\/?$/;

export function validateAutoMeta(raw){
 if(!raw||raw.schema!==AUTO_SCHEMA||!SAFE_PATCH.test(raw.patch)||!PATCH_LINK.test(raw.patchUrl)||
  !Array.isArray(raw.guides)||raw.guides.length>200||
  !/^\d{4}-\d\d-\d\d$/.test(raw.updatedAt))throw Error('Metadatos automáticos inválidos');
 if(raw.patchSubjects!=null){
  for(const key of ['champions','items','runes']){
   const a=raw.patchSubjects[key];
   if(!Array.isArray(a)||a.length>160||
    !a.every(x=>typeof x==='string'&&x.length>=2&&x.length<=95)||
    new Set(a).size!==a.length)throw Error('Secciones de parche inválidas: '+key);
  }
 }
 const seen=new Set();
 for(const guide of raw.guides){
  const key=String(guide.champion)+'|'+guide.role;
  if(seen.has(key)||!['baron','jungle','mid','dragon','support'].includes(guide.role)||
   !guide.champion||!SAFE_PATCH.test(guide.patch)||guide.patch!==raw.patch||
   !SAFE_SOURCE.test(guide.source?.url)||guide.source?.publisher!=='WildRiftFire'||
   !guide.source?.type||!Array.isArray(guide.finalItems)||guide.finalItems.length!==6||
   !Array.isArray(guide.runes)||guide.runes.length!==5||
   !Array.isArray(guide.spells)||guide.spells.length!==2||
   ![...guide.finalItems,...guide.runes,...guide.spells].every(s=>typeof s==='string'&&s.length>=2&&s.length<=100)||
   !/^\d{4}-\d\d-\d\d$/.test(guide.checkedAt))throw Error('Guía automática inválida: '+key);
  seen.add(key);
 }
 return raw;
}

export function resolveBuildReference(champion,role,meta){
 const value=validateAutoMeta(meta);
 const fresh=value.guides.find(x=>x.champion===champion&&x.role===role&&x.patch===value.patch);
 if(fresh)return {
  status:'referenced',reference:fresh,automated:true,
  message:'Referencia editorial actualizada automáticamente y contrastada con su fuente. No se adapta por sí sola al draft.'
 };
 const previous=getBuildReference(champion,role,value.patch);
 if(previous.status==='referenced')return {...previous,automated:false};
 if(previous.status==='stale')return {
  ...previous,automated:false,
  message:'La guía anterior es del parche '+BUILD_SOURCE_PATCH+'. No se recomienda como configuración actual en '+value.patch+'.'
 };
 return previous;
}
export function patchDisplayStatus(meta,editorialPatch){
 validateAutoMeta(meta);
 return meta.patch===editorialPatch?'reviewed':'awaiting_review';
}
