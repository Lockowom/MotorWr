import assert from 'node:assert/strict';
import {BUILD_REFERENCES} from '../src/data/buildReferences.js';
import {ICON_CATALOG,SKILL_SLOT_ICONS} from '../src/data/iconCatalog.js';
import {EXPANDED_ICONS,EXPANDED_SKILL_SLOT_ICONS,EXPANDED_SKILL_NAME_SLOT} from '../src/data/expandedIcons.js';
import {iconFor,skillIconFor,skillSlotForName,fallbackLabel} from '../src/core/iconResolver.js';

const count=obj=>Object.keys(obj).length;
assert(count(ICON_CATALOG.item)>=40,'Item icon catalog incomplete');
assert(count(ICON_CATALOG.rune)>=25,'Rune icon catalog incomplete');
assert(count(ICON_CATALOG.spell)>=4,'Spell icon catalog incomplete');
assert(count(ICON_CATALOG.ability)>=20,'Ability icon catalog incomplete');
assert(count(SKILL_SLOT_ICONS)+count(EXPANDED_SKILL_SLOT_ICONS)===28,'Champion skill icon roster coverage should be 28');
const failed=[];
for(const build of BUILD_REFERENCES){
 const checks=[
  ...build.finalItems.map(name=>['item',name]),
  ...build.runes.map(name=>['rune',name]),
  ...build.spells.map(name=>['spell',name]),
  ...build.skillPriority.map(name=>['ability',name]),
  ...[build.startingItem,build.enchant].filter(Boolean).map(name=>['item',name])
 ];
 for(const [type,name] of checks){
  const value=iconFor(type,name,build.champion);
  if(!value)failed.push([build.champion,build.role,type,name]);
 }
 if(build.abilities){
   for(const slot of ['P','Q','W','E','R']){
     assert(typeof build.abilities[slot]==='string',build.champion+' missing kit name '+slot);
     assert.equal(skillSlotForName(build.champion,build.abilities[slot]),slot,'Misidentified skill slot');
     assert(iconFor('ability',build.abilities[slot],build.champion),'Missing sourced ability name/icon');
   }
 }
 for(const slot of ['P','Q','W','E','R']){
  assert(skillIconFor(build.champion,slot)?.startsWith('https://www.mobafire.com/images/ability/'),build.champion+' '+slot+' verified guide spell icon is unavailable');
 }
}
assert.deepEqual(failed,[],'All existing and expanded guide items, runes and spells need source images');
assert(count(EXPANDED_ICONS.item)>=55&&count(EXPANDED_ICONS.rune)>=30,'Expanded image dataset not integrated');
assert(count(EXPANDED_SKILL_NAME_SLOT)===100,'Each new champion must have five source-reviewed abilities');
assert.equal(iconFor('item','<script>alert(1)</script>'),null);
assert.equal(iconFor('item','Fictional item'),null);
assert.equal(iconFor('unknown','Flash'),null);
assert.equal(fallbackLabel('Stormsurge'),'S');
assert.equal(fallbackLabel('Flash','Q'),'Q');
assert(iconFor('ability','Five Point Strike','Akali')?.includes('akali-five-point-strike.png'));
assert(skillIconFor('Akali','R')?.endsWith('/akali-perfect-execution.png'));
assert.equal(skillSlotForName('Akali','Five Point Strike'),'Q');
assert.equal(skillSlotForName('Akali','Shuriken Flip'),'E');
assert.equal(skillSlotForName('Akali','Twilight Shroud'),'W');
assert.equal(skillSlotForName('Camille','Tactical Sweep'),'W');
console.log('PASS: source-vetted icon catalog covers current builds, spells, runes and ability slots, with safe fallback');
