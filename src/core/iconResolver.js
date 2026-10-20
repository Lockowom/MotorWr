import {EXPANDED_ICONS,EXPANDED_SKILL_SLOT_ICONS,EXPANDED_SKILL_NAME_SLOT} from '../data/expandedIcons.js';
import {ICON_CATALOG,SKILL_SLOT_ICONS,SKILL_NAME_SLOT} from '../data/iconCatalog.js';

// Trusted, exact mappings extracted from existing editorial source images.
// Never guess URLs for unrecognized names: render a text fallback instead.
const TRUSTED_IMAGE=/^https:\/\/(?:www\.wildriftfire\.com\/images\/(?:items|runes|summoners)\/[a-z0-9-]+|www\.mobafire\.com\/images\/ability\/[a-z0-9-]+)\.png$/;
export function iconFor(type,name,champion=''){
 if(!['item','rune','spell','ability'].includes(type)||typeof name!=='string'||!name.trim())return null;
 const key=type==='ability'?champion+'|'+name:name;
 const src=ICON_CATALOG[type]?.[key]??EXPANDED_ICONS[type]?.[key];
 return typeof src==='string'&&TRUSTED_IMAGE.test(src)?src:null;
}
export function skillSlotForName(champion,name){
 return SKILL_NAME_SLOT[champion+'|'+name]||EXPANDED_SKILL_NAME_SLOT[champion+'|'+name]||null;
}
export function skillIconFor(champion,slot){
 const src=SKILL_SLOT_ICONS[champion]?.[slot]??EXPANDED_SKILL_SLOT_ICONS[champion]?.[slot];
 return typeof src==='string'&&TRUSTED_IMAGE.test(src)?src:null;
}
export function fallbackLabel(name,slot){
 if(slot)return String(slot).toUpperCase().slice(0,2);
 const first=String(name||'?').trim().match(/[A-Za-zÁÉÍÓÚÜÑ0-9]/u);
 return first?first[0].toUpperCase():'?';
}
