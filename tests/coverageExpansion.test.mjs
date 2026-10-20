import assert from 'node:assert/strict';
import {BUILD_REFERENCES,getBuildReference} from '../src/data/buildReferences.js';
import {EXPANDED_REFERENCES} from '../src/data/expandedBuilds.js';
import {EXPANDED_ICONS,EXPANDED_SKILL_SLOT_ICONS,EXPANDED_SKILL_NAME_SLOT} from '../src/data/expandedIcons.js';
import {OFFICIAL_ROSTER} from '../src/data/officialRoster.js';
import {iconFor,skillIconFor,skillSlotForName} from '../src/core/iconResolver.js';
import {resolveBuildReference} from '../src/core/metaPolicy.js';
import meta from '../src/data/autoMeta.json' with {type:'json'};

assert.equal(EXPANDED_REFERENCES.length,28);
assert.equal(new Set(EXPANDED_REFERENCES.map(x=>x.champion)).size,20);
assert.equal(BUILD_REFERENCES.length,40);
assert.equal(new Set(BUILD_REFERENCES.map(x=>x.champion)).size,28);
assert.equal(new Set(BUILD_REFERENCES.map(x=>x.champion+'|'+x.role)).size,40);
const official=new Set(OFFICIAL_ROSTER.map(x=>x.name));
for(const b of EXPANDED_REFERENCES){
 assert(official.has(b.champion),'Not in official Wild Rift roster: '+b.champion);
 assert.equal(b.patch,'7.3b','Do not silently use a different patch');
 assert.equal(b.checkedAt,'2026-10-20','Guide provenance date missing');
 assert.equal(b.source.publisher,'WildRiftFire');
 assert.match(b.source.url,/^https:\/\/www\.wildriftfire\.com\/guide\/[a-z0-9-]+$/);
 assert.deepEqual(b.skillPriority,[],'Unverified skill priorities must not be fabricated');
 assert.equal(b.skillPriorityStatus,'pending_review');
 assert.equal(b.finalItems.length,6);
 assert.equal(b.runes.length,5);
 assert.equal(b.spells.length,2);
 assert.deepEqual(Object.keys(b.abilities).sort(),['E','P','Q','R','W']);
 assert.equal(getBuildReference(b.champion,b.role).status,'referenced');
 assert.equal(getBuildReference(b.champion,b.role,'7.4').status,'stale');
 assert.equal(resolveBuildReference(b.champion,b.role,meta).status,'referenced');
 for(const [type,names] of [['item',b.finalItems],['rune',b.runes],['spell',b.spells]]){
  for(const name of names)assert(iconFor(type,name,b.champion),b.champion+' '+b.role+' missing '+type+': '+name);
 }
 if(b.startingItem)assert(iconFor('item',b.startingItem));
 for(const [slot,name] of Object.entries(b.abilities)){
  assert(name.length>=3, 'Invalid source skill label');
  assert.equal(skillSlotForName(b.champion,name),slot);
  assert(iconFor('ability',name,b.champion),'No skill icon '+b.champion+' '+name);
  assert(skillIconFor(b.champion,slot),'No slot icon '+b.champion+' '+slot);
  assert.match(skillIconFor(b.champion,slot),/^https:\/\/www\.mobafire\.com\/images\/ability\/[a-z0-9-]+\.png$/);
 }
}
assert.equal(Object.keys(EXPANDED_SKILL_SLOT_ICONS).length,20);
assert.equal(Object.keys(EXPANDED_SKILL_NAME_SLOT).length,100);
assert(Object.keys(EXPANDED_ICONS.item).length>=50);
assert(Object.keys(EXPANDED_ICONS.rune).length>=30);
assert(Object.keys(EXPANDED_ICONS.ability).length===100);
assert.equal(getBuildReference('Lux','baron').status,'missing','Do not extrapolate into off-role');
assert.equal(getBuildReference('Viego','support').status,'missing','Unverified roles stay blocked');
assert.equal(getBuildReference('Diana','dragon').status,'missing');
console.log('PASS: 28 new patch-verified builds, 20 champions, correct roles, 100 source-confirmed skills and no invented priorities');
