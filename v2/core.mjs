// MotorWr 2.0 beta: motor de análisis sin predicciones de victoria.
export const VERSION='2.0.0-beta.1';
export const ROLES=[['top','Barón'],['jg','Jungla'],['mid','Central'],['adc','Dragón'],['sup','Soporte']];
const VALID_ROLES=new Set(ROLES.map(r=>r[0]));
const curated={
  Camille:{role:'top',kind:'Duelista de presión lateral',build:['Fuerza de la Trinidad','Rompecascos','Eclipse','Baile de la Muerte','Ángel Guardián'],boots:'Punteras de Acero o Mercurio',runes:['Agarre del Perpetuo','Demoler','Segundo Aliento / Revestimiento de Huesos','Perseverancia','Quemadura'],spells:'Destello + Prender',source:'Combinación editorial de WildRiftFire (consulta 18-10-2026) y observación histórica CN 7.3. No es un draft CN validado.',url:'https://www.wildriftfire.com/guide/camille',lane:'Juega alrededor de Q2 y escudo pasivo; no gastes E agresivamente sin conocer al jungla.',late:'Prepara el crash lateral y castiga por un flanco al carry cuando el CC esté gastado.'}
};
const laneRules={
 'Camille|Gwen':'Intercambios cortos. Evita el centro de Q y respeta su niebla W. No prolongues el duelo.',
 'Camille|Jax':'No gastes tu Q2 durante Contraataque. Fuerza el enfriamiento antes de entrar.',
 'Camille|Teemo':'Evita usar Q2 bajo ceguera. Segundo Aliento y Mercurio son situacionales.',
 'Camille|Darius':'Evita acumular sangrado. Conserva movilidad para retirarte.',
 'Camille|Garen':'Evita su E prolongada y remates con R. Busca Q2 tras gastar habilidades.',
 'Camille|Fiora':'No anuncies tu E: su Réplica puede castigar la entrada.',
 'Camille|Renekton':'Prioriza seguridad inicial y aprovecha enfriamientos de su aturdimiento.',
 'Camille|Kennen':'Mercurio situacional; evita iniciar dentro de su definitiva.'
};
export const PROFILES=curated;
export const ROLE_HINTS={
 top:['Aatrox','Akali','Ambessa','Camille','Darius','Dr. Mundo','Fiora','Garen','Gnar','Gragas','Gwen','Irelia','Jax','Jayce','Kayle','Kennen','Malphite','Mordekaiser','Nasus','Olaf','Ornn','Pantheon','Poppy','Renekton','Riven','Rumble','Sett','Shen','Singed','Sion','Teemo','Tryndamere','Urgot','Vayne','Volibear','Wukong','Yasuo','Yone',"K'Santé"],
 jg:['Amumu','Diana','Ekko','Elise','Evelynn','Fiddlesticks','Gragas','Graves','Hecarim','Jarvan IV','Kayn',"Kha'Zix",'Kindred','Lee Sin','Lillia','Master Yi','Nunu y Willump','Olaf','Rammus','Rengar','Shyvana','Skarner','Vi','Viego','Volibear','Warwick','Wukong','Xin Zhao','Nidalee','Taliyah'],
 mid:['Ahri','Akali','Annie','Aurelion Sol','Aurora','Brand','Corki','Diana','Ekko','Fizz','Galio','Heimerdinger','Hwei','Irelia','Kassadin','Katarina','Kennen','LeBlanc','Lissandra','Lux','Malzahar','Mel','Morgana','Orianna','Qiyana','Ryze','Syndra','Taliyah','Talon','Twisted Fate','Veigar','Vex','Viktor','Vladimir','Yasuo','Yone','Zed','Ziggs','Zoe','Zyra'],
 adc:['Akshan','Ashe','Caitlyn','Corki','Draven','Ezreal','Jhin','Jinx',"Kai'Sa",'Kalista',"Kog'Maw",'Lucian','Miss Fortune','Nilah','Samira','Senna','Sivir','Smolder','Tristana','Twitch','Varus','Vayne','Xayah','Yunara','Zeri'],
 sup:['Alistar','Bard','Blitzcrank','Brand','Braum','Galio','Janna','Karma','Leona','Lulu','Lux','Maokai','Milio','Morgana','Nami','Nautilus','Norra','Pyke','Rakan','Rell','Renata Glasc','Senna','Seraphine','Sona','Soraka','Swain','Thresh','Yuumi','Zilean','Zyra']
};
export function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
export function roleHints(name){return ROLES.filter(([r])=>ROLE_HINTS[r].includes(name)).map(([r])=>r);}
function getIndex(roster){return new Map(roster.map(c=>[c.name,c]));}
export function validateDraft(draft,roster){
 const by=getIndex(roster);
 if(!VALID_ROLES.has(draft?.role))throw Error('Selecciona tu posición.');
 if(!by.has(draft?.own))throw Error('Selecciona tu campeón.');
 for(const [id] of ROLES)if(!by.has(draft?.enemies?.[id]))throw Error('Selecciona los cinco campeones enemigos.');
 if(draft?.allies?.[draft.role])throw Error('No puedes usar tu rol también como aliado.');
 const names=[draft.own,...Object.values(draft.enemies),...Object.values(draft.allies||{}).filter(Boolean)];
 if(names.some(n=>!by.has(n)))throw Error('Hay un campeón fuera del catálogo.');
 if(new Set(names).size!==names.length)throw Error('Un campeón no puede estar repetido.');
 return true;
}
function score(team){
 const out={AP:0,AD:0,MIX:0,cc:0,heal:0,shield:0,true:0,dot:0,burst:0,engage:0,assassin:0,poke:0};
 for(const c of team){
  out[c.damage]=(out[c.damage]||0)+1;
  out.cc+=Number(c.cc||0);
  for(const tag of c.tags)if(tag in out && tag!=='cc')out[tag]++;
 }
 return out;
}
function grade(n,high,medium){return n>=high?'ALTO':n>=medium?'MODERADO':'BAJO';}
function rolePlan(role){
 const plans={
  top:['Gestiona oleadas antes de rotar.','Presiona lateral solo con visión de jungla.','Antes de un objetivo, prepara el crash o decide un intercambio de estructuras.'],
  jg:['Revisa prioridad de las líneas antes de invadir.','Planifica los objetivos con visión y recursos suficientes.','No fuerces objetivos 50/50 innecesarios.'],
  mid:['Empuja central antes de rotar.','Controla visión de ambos costados del río.','Prioriza oleadas y objetivos, no persecuciones sin información.'],
  adc:['Prioriza oro y supervivencia.','Evita adelantar oleadas sin cobertura.','En peleas, golpea al objetivo accesible desde una posición segura.'],
  sup:['Gestiona visión antes de objetivos.','Conserva protección o control para el carry.','No abandones al tirador sin una ventana segura.']
 };
 return plans[role];
}
export function analyze(draft,roster,settings={}){
 validateDraft(draft,roster);
 const by=getIndex(roster);
 const own=by.get(draft.own);
 const opponents=ROLES.map(([role])=>({...by.get(draft.enemies[role]),role}));
 const allies=Object.values(draft.allies||{}).filter(Boolean).map(n=>by.get(n));
 const enemy=score(opponents),friendly=score([own,...allies]);
 const rival=by.get(draft.enemies[draft.role]);
 const laneNumber=(rival.tags.includes('ranged')?2:0)+(rival.tags.includes('poke')?1:0)+(rival.tags.includes('burst')?1:0)+(rival.tags.includes('cc')?1:0)+(rival.tags.includes('true')?1:0);
 const laneRisk=grade(laneNumber,4,2);
 const teamRisk=grade((enemy.cc>=8?2:enemy.cc>=4?1:0)+(enemy.burst>=3?2:enemy.burst>=2?1:0)+(enemy.engage>=2?1:0),4,2);
 const cc=grade(enemy.cc,8,4);
 const profile=curated[draft.own];
 const heroPlan=profile?.role===draft.role ? profile : null;
 const threat=settings.threat&&opponents.find(c=>c.name===settings.threat);
 const magicWeight=enemy.AP+enemy.MIX/2,physicalWeight=enemy.AD+enemy.MIX/2;
 let items=heroPlan?[...heroPlan.build]:[], boots=heroPlan?.boots||null;
 const notes=[];
 if(heroPlan){
  if(magicWeight>=3 || (threat&&threat.damage!=='AD')){
   boots='Botas de Mercurio';
   const defense=enemy.dot>=2?'Fuerza de la Naturaleza':'Fauces de Malmortius';
   items=items.filter(x=>x!=='Baile de la Muerte');
   items.splice(threat?1:2,0,defense);
   items=items.slice(0,5);
   notes.push('Defensa mágica ajustada a la composición: adaptación del motor, no build CN individual.');
  }
  if(threat&&threat.damage==='AD'){
   items=items.filter(x=>x!=='Ángel Guardián');
   items.splice(2,0,'Baile de la Muerte');
   items=[...new Set(items)].slice(0,5);
   notes.push('Defensa física priorizada por amenaza principal.');
  }
 }else{
  notes.push('No tenemos una build individual validada para este campeón y rol. Evitamos inventar objetos, runas o porcentajes de victoria.');
 }
 if(enemy.heal>=3)notes.push('Curación elevada: valora Heridas Graves, según aliados y curación real.');
 if(enemy.shield>=3)notes.push('Varios escudos: considera anti-escudo cuando limiten tus eliminaciones.');
 if(enemy.true)notes.push('Daño verdadero presente: la armadura y resistencia mágica no reducen ese componente.');
 if(!threat)notes.push('Selecciona a quién va más adelantado para priorizarlo.');
 const lines=rolePlan(draft.role).slice();
 if(enemy.cc>=8)lines.push('Control elevado: evita iniciar frontalmente sin enfriamientos enemigos.');
 if(magicWeight>=3)lines.push('Varias amenazas AP: gestiona las defensas antes de pelear en grupo.');
 const laneNote=laneRules[draft.own+'|'+rival.name]||heroPlan?.lane||'Respeta el alcance, administra recursos y adapta intercambios al rival de tu línea.';
 const lateNote=heroPlan?.late||lines[2];
 return {own:own.name,role:draft.role,rival:rival.name,opponents,allies,enemy,friendly,cc,laneRisk,teamRisk,magicWeight,physicalWeight,profile:heroPlan,items,boots,notes,lines,laneNote,lateNote,threat:threat?.name||null,coverage:heroPlan?'REFERENCIA EDITORIAL':'EXPLORATORIA',version:VERSION};
}
export function guideText(p){
 const role=ROLES.find(r=>r[0]===p.role)?.[1]||p.role;
 return ['MotorWr '+p.version,p.own+' / '+role,'Rival: '+p.rival,'Riesgo en línea: '+p.laneRisk+' · pelea: '+p.teamRisk,'Daño: AP '+p.enemy.AP+' / AD '+p.enemy.AD+' / MIX '+p.enemy.MIX+' · CC '+p.cc,'Cobertura: '+p.coverage,p.profile?'Botas: '+p.boots+' | Objetos: '+p.items.join(' → ')+' | Runa: '+p.profile.runes[0]:'Build individual: pendiente de validación',p.laneNote,...p.lines,'No es información en vivo ni una build china confirmada para este draft.'].join('\n');
}
