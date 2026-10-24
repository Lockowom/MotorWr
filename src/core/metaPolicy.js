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
 const validAbilities=kit=>kit&&typeof kit==='object'&&!Array.isArray(kit)&&
  ['P','Q','W','E','R'].every(k=>typeof kit[k]==='string'&&kit[k].length>=2&&kit[k].length<=100&&
   !/[<>]/.test(kit[k]))&&Object.keys(kit).length===5;
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
  if(guide.abilities!==undefined&&!validAbilities(guide.abilities))throw Error('Kit de habilidades inválido: '+key);
  seen.add(key);
 }
 return raw;
}

export function resolveBuildReference(champion,role,meta){
 const value=validateAutoMeta(meta);
 const fresh=value.guides.find(x=>x.champion===champion&&x.role===role&&x.patch===value.patch);
 if(fresh){
  // Build/runes/spells are current, but an ability icon list may only exist in
  // the older editorial snapshot. Surface that age instead of claiming review.
  const historical=getBuildReference(champion,role,BUILD_SOURCE_PATCH);
  const previous=historical.reference;
  const reference={...fresh};
  if(fresh.abilities){
   reference.abilitiesVerifiedPatch=fresh.patch;
  }else if(previous?.abilities){
   reference.abilities={...previous.abilities};
   reference.abilitiesVerifiedPatch=previous.patch;
  }
  if(!Array.isArray(reference.skillPriority)||!reference.skillPriority.length){
   if(previous?.skillPriorityStatus==='source_reviewed' && previous.skillPriority?.length){
    reference.priorSkillPriority=[...previous.skillPriority];
    reference.priorSkillPriorityPatch=previous.patch;
   }
  }
  return {
   status:'referenced',reference,automated:true,
   message:'Build y runas contrastadas para '+value.patch+'. Las habilidades indican separadamente su último parche revisado.'
  };
 }
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
