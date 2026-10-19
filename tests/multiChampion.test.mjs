import assert from "node:assert/strict";
import {CHAMPIONS,CHAMPION_BY_NAME} from "../src/data/champions.js";
import {ROLES,createDraft,analyzeComposition,championRecommendation} from "../src/core/multiChampion.js";

assert.equal(CHAMPIONS.length,138,"Catálogo heredado debe permanecer íntegro.");
assert.equal(new Set(CHAMPIONS.map(c=>c.name)).size,CHAMPIONS.length);
assert.equal(ROLES.length,5,"Hay que incluir los cinco roles.");
const base={champion:"Camille",role:"baron",allies:["Jarvan IV","Orianna","Jinx","Braum"],enemies:["Gwen","Viego","Brand","Lucian","Lux"]};
const draft=createDraft(base);
const analysis=analyzeComposition(draft,CHAMPION_BY_NAME);
assert.equal(analysis.enemyLane,"Gwen");
assert.equal(analysis.coverage.complete,true);
assert.equal(analysis.composition.magic,3);
assert.equal(analysis.composition.physical,2);
assert.equal(analysis.role,"baron");
assert.equal(championRecommendation(draft).status,"unverified","Nunca simular build verificada.");
for(const role of ROLES){
  const profile=createDraft({...base,role});
  assert.equal(analyzeComposition(profile,CHAMPION_BY_NAME).role,role);
}
assert.throws(()=>createDraft({...base,champion:"Gwen"}),/repetirse/);
assert.throws(()=>createDraft({...base,allies:["Gwen"]}),/repetirse/);
assert.throws(()=>createDraft({...base,enemies:["Gwen","Gwen"]}),/repetirse/);
assert.throws(()=>createDraft({...base,role:"invalid"}),/posición/);
assert.throws(()=>createDraft({...base,champion:""}),/campeón/);
assert.throws(()=>analyzeComposition(createDraft({...base,enemies:["Fantasma"]}),CHAMPION_BY_NAME),/fuera del catálogo/);
const partial=analyzeComposition(createDraft({...base,enemies:["Gwen"]}),CHAMPION_BY_NAME);
assert.equal(partial.coverage.complete,false);
assert(partial.advice.warnings.some(x=>x.includes("parcial")));
const known={camille:{roles:["baron"],patch:"7.3b",source:"https://example.com/verified"}};
assert.equal(championRecommendation(draft,known).status,"verified");
assert.equal(championRecommendation(createDraft({...base,role:"mid"}),known).status,"unverified");
console.log("PASS: 138 campeones, 5 roles, composición, faltantes, duplicados, evidencia.");
