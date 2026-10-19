import assert from 'node:assert/strict';
import {BUILD_REFERENCES} from '../src/data/buildReferences.js';
import {ICON_CATALOG,SKILL_SLOT_ICONS} from '../src/data/iconCatalog.js';
import {iconFor,skillIconFor,skillSlotForName,fallbackLabel} from '../src/core/iconResolver.js';

const count=obj=>Object.keys(obj).length;
assert(count(ICON_CATALOG.item)>=40,'Item icon catalog incomplete');
assert(count(ICON_CATALOG.rune)>=25,'Rune icon catalog incomplete');
assert(count(ICON_CATALOG.spell)>=4,'Spell icon catalog incomplete');
assert(count(ICON_CATALOG.ability)>=20,'Ability icon catalog incomplete');
assert(count(SKILL_SLOT_ICONS)>=8,'Champion skill icon catalog incomplete');
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
 for(const slot of ['P','Q','W','E','R']){
  assert(skillIconFor(build.champion,slot)?.startsWith('https://ddragon.leagueoflegends.com/cdn/16.18.1/img/'),build.champion+' '+slot+' official spell icon is unavailable');
 }
}
assert.deepEqual(failed,[],'Every item/rune/spell/ability in the current published guide set needs a real source icon');
assert.equal(iconFor('item','<script>alert(1)</script>'),null);
assert.equal(iconFor('item','Fictional item'),null);
assert.equal(iconFor('unknown','Flash'),null);
assert.equal(fallbackLabel('Stormsurge'),'S');
assert.equal(fallbackLabel('Flash','Q'),'Q');
assert(iconFor('ability','Five Point Strike','Akali')?.includes('akali-five-point-strike.png'));
assert(skillIconFor('Akali','R')?.includes('AkaliR.png'));
assert.equal(skillSlotForName('Akali','Five Point Strike'),'Q');
assert.equal(skillSlotForName('Akali','Shuriken Flip'),'E');
assert.equal(skillSlotForName('Akali','Twilight Shroud'),'W');
assert.equal(skillSlotForName('Camille','Tactical Sweep'),'W');
console.log('PASS: source-vetted icon catalog covers current builds, spells, runes and ability slots, with safe fallback');
