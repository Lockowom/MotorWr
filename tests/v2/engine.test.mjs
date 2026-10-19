import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyze,validateDraft,roleHints,guideText,VERSION} from '../../v2/core.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../../v2/data/champions.json',import.meta.url),'utf8'));
const roster=data.champions;
const draft=()=>({role:'top',own:'Camille',allies:{},enemies:{top:'Gwen',jg:'Viego',mid:'Brand',adc:'Lucian',sup:'Lux'}});
test('Riot roster expanded without duplicates',()=>{
 assert.ok(roster.length>=146);
 assert.equal(new Set(roster.map(c=>c.name)).size,roster.length);
 for(const name of ["Camille","K'Santé","Skarner","Taliyah","Mel","Nidalee","Norra","Rell","Smolder"])assert.ok(roster.find(c=>c.name===name),name);
});
test('all five roles can be selected for tactical analysis',()=>{
 const samples={top:'Camille',jg:'Lee Sin',mid:'Syndra',adc:'Jinx',sup:'Nami'};
 for(const [role,own] of Object.entries(samples)){
  const d=draft();d.role=role;d.own=own;
  if(Object.values(d.enemies).includes(own))d.enemies[role]='Garen';
  const p=analyze(d,roster);
  assert.equal(p.role,role);
  assert.equal(p.own,own);
  assert.equal(p.opponents.length,5);
 }
});
test('example draft: high teamfight danger, 3 AP and 2 AD',()=>{
 const p=analyze(draft(),roster);
 assert.equal(p.enemy.AP,3);assert.equal(p.enemy.AD,2);assert.equal(p.teamRisk,'ALTO');
 assert.equal(p.profile?.runes?.[0],'Agarre del Perpetuo');
 assert.ok(p.items.includes('Fuerza de la Naturaleza'));
 assert.equal(p.items.length,5);
});
test('source-limited champs never get a fabricated exact build',()=>{
 const d=draft();d.role='adc';d.own='Jinx';
 const p=analyze(d,roster);
 assert.equal(p.coverage,'EXPLORATORIA');
 assert.equal(p.profile,null);
 assert.equal(p.items.length,0);
 assert.match(guideText(p),/pendiente de validación/);
});
test('known direct matchups are champion-specific',()=>{
 const p=analyze(draft(),roster);
 assert.match(p.laneNote,/Q/);
});
test('threat-specific build adjustments are deterministic',()=>{
 const d=draft();
 const p=analyze(d,roster,{threat:'Brand'});
 assert.equal(p.threat,'Brand');
 assert.ok(p.items.includes('Fuerza de la Naturaleza'));
 assert.equal(p.items.length,5);
});
test('duplicated champions are rejected',()=>{
 const d=draft();d.enemies.mid='Camille';assert.throws(()=>validateDraft(d,roster),/repetido/);
});
test('duplicate ally and enemy rejected',()=>{
 const d=draft();d.allies.mid='Lux';assert.throws(()=>validateDraft(d,roster),/repetido/);
});
test('invalid and missing draft fields are rejected',()=>{
 const d=draft();d.enemies.top='';assert.throws(()=>analyze(d,roster),/cinco/);
 d.enemies.top='Gwen';d.role='???';assert.throws(()=>analyze(d,roster),/posición/);
});
test('role recommendations are guidance only',()=>{
 assert.ok(roleHints('Jinx').includes('adc'));
 assert.ok(roleHints('Camille').includes('top'));
 assert.ok(VERSION.includes('beta'));
});
test('UI bundle links local static resources',()=>{
 const html=fs.readFileSync(new URL('../../v2/index.html',import.meta.url),'utf8');
 for(const path of ['./app.mjs','./styles.css','./manifest.webmanifest'])assert.ok(html.includes(path),path);
 const sw=fs.readFileSync(new URL('../../v2/sw.js',import.meta.url),'utf8');
 assert.ok(sw.includes('./data/champions.json'));
});
