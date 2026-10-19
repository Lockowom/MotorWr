import {ICON_CATALOG,SKILL_SLOT_ICONS} from '../data/iconCatalog.js';

// Trusted, exact mappings extracted from existing editorial source images.
// Never guess URLs for unrecognized names: render a text fallback instead.
const TRUSTED_IMAGE=/^https:\/\/(?:www\.wildriftfire\.com|www\.mobafire\.com)\/images\/(?:items|runes|summoners|ability)\/[a-z0-9-]+\.png$/;
export function iconFor(type,name,champion=''){
 if(!['item','rune','spell','ability'].includes(type)||typeof name!=='string'||!name.trim())return null;
 const key=type==='ability'?champion+'|'+name:name;
 const src=ICON_CATALOG[type]?.[key];
 return typeof src==='string'&&TRUSTED_IMAGE.test(src)?src:null;
}
export function skillIconFor(champion,slot){
 const src=SKILL_SLOT_ICONS[champion]?.[slot];
 return typeof src==='string'&&TRUSTED_IMAGE.test(src)?src:null;
}
export function fallbackLabel(name,slot){
 if(slot)return String(slot).toUpperCase().slice(0,2);
 const first=String(name||'?').trim().match(/[A-Za-zÁÉÍÓÚÜÑ0-9]/u);
 return first?first[0].toUpperCase():'?';
}
