// MotorWr 2.0 — modelo de draft neutral a campeón, sin atribuir cifras al servidor.
export const ROLES = Object.freeze(["baron", "jungle", "mid", "dragon", "support"]);
export const ROLE_LABELS = Object.freeze({baron:"Barón",jungle:"Jungla",mid:"Central",dragon:"Dragón",support:"Soporte"});

export function normalizeChampionName(value) {
  return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en");
}
export function createDraft({champion,role,allies=[],enemies=[]}={}) {
  const chosen=String(champion ?? "").trim();
  if (!chosen) throw new Error("Selecciona tu campeón.");
  if (!ROLES.includes(role)) throw new Error("Selecciona una posición válida.");
  if (!Array.isArray(allies) || allies.length > 4 || !Array.isArray(enemies) || enemies.length > 5) {
    throw new Error("Composición inválida.");
  }
  const clean=arr=>arr.map(x=>String(x ?? "").trim());
  const teammates=clean(allies),opponents=clean(enemies);
  const selected=[chosen,...teammates,...opponents].filter(Boolean).map(normalizeChampionName);
  if (new Set(selected).size!==selected.length) throw new Error("Un campeón no puede repetirse en el draft.");
  return {champion:chosen,role,allies:teammates,enemies:opponents};
}
export function championRecommendation(draft, verifiedProfiles={}) {
  const profile=verifiedProfiles[normalizeChampionName(draft.champion)];
  if (!profile || !profile.roles?.includes(draft.role) || !profile.source || !profile.patch) {
    return {status:"unverified",message:"No existe una build verificada para este campeón y posición.",draft};
  }
  return {status:"verified",profile,draft};
}

const ROLE_GOALS=Object.freeze({
  baron:"Gestiona oleadas y teletransportes o rotaciones; evalúa presión lateral frente a agrupamiento según objetivos.",
  jungle:"Coordina prioridades de líneas y visión antes de invadir; decide rutas por información disponible.",
  mid:"Controla la oleada central y rota solo después de comprobar visión y prioridad lateral.",
  dragon:"Prioriza oro seguro y posición en peleas; evita exponerte sin información del flanco.",
  support:"Asegura visión y protege a tu principal fuente de daño; busca entradas solo con apoyo cercano."
});

export function analyzeComposition(draft,catalog) {
  if (!(catalog instanceof Map)) throw new TypeError("Se requiere un catálogo de campeones.");
  const find=name=>name?catalog.get(normalizeChampionName(name)):null;
  const own=find(draft.champion);
  if (!own) throw new Error("Tu campeón no está en el catálogo.");
  const allies=draft.allies.filter(Boolean).map(find);
  const enemies=draft.enemies.filter(Boolean).map(find);
  if ([...allies,...enemies].some(x=>!x)) throw new Error("Hay campeones fuera del catálogo.");
  const has=(c,t)=>c.tags.includes(t);
  const count=(arr,t)=>arr.filter(c=>has(c,t)).length;
  const magic=enemies.filter(c=>c.damage==="AP").length;
  const physical=enemies.filter(c=>c.damage==="AD").length;
  const mixed=enemies.filter(c=>c.damage==="MIX").length;
  const cc=enemies.reduce((sum,c)=>sum+c.cc,0);
  const control=cc>=8?"ALTO":cc>=4?"MEDIO":"BAJO";
  const enemyLane=find(draft.enemies[ROLES.indexOf(draft.role)]);
  const laneFlags=[];
  if(enemyLane){
    if(has(enemyLane,"ranged") && !has(own,"ranged"))laneFlags.push("El rival puede hostigarte a distancia; conserva vida y controla la oleada.");
    if(has(enemyLane,"heal"))laneFlags.push("El rival tiene herramientas de curación; calcula los intercambios prolongados.");
    if(enemyLane.cc>=2)laneFlags.push("Respeta las ventanas de control de masas del rival.");
    if(has(enemyLane,"true"))laneFlags.push("El rival tiene daño verdadero: la armadura o la resistencia mágica no lo mitigan.");
    if(!laneFlags.length)laneFlags.push("Evalúa los enfriamientos y la posición de la oleada antes de intercambiar.");
  }
  const strengths=[];
  if(has(own,"ranged"))strengths.push("Puedes presionar desde rango cuando tu posición sea segura.");
  if(has(own,"mobile"))strengths.push("Reserva tu movilidad para aprovechar ventanas o salir de una pelea.");
  if(has(own,"cc"))strengths.push("Coordina tu control con los aliados antes de iniciar.");
  if(has(own,"heal")||has(own,"shield"))strengths.push("Aprovecha tus herramientas de supervivencia sin sobreextenderte.");
  if(has(own,"assassin"))strengths.push("Busca flancos cuando los rivales hayan gastado sus controles.");
  if(has(own,"tank"))strengths.push("Da espacio a tus aliados y evita iniciar sin seguimiento.");
  if(has(own,"poke"))strengths.push("Desgasta antes de comprometer una pelea por objetivos.");
  if(has(own,"bruiser"))strengths.push("Evalúa si conviene duelo lateral o reunión con el equipo.");
  if(!strengths.length)strengths.push("Prioriza economía, visión y uso disciplinado de habilidades.");
  const warnings=[];
  if(enemies.length<5)warnings.push("Análisis parcial: faltan rivales por seleccionar.");
  if(magic>=3)warnings.push("Múltiples fuentes AP: revisa defensa mágica según daño real recibido.");
  if(physical>=3)warnings.push("Múltiples fuentes AD: valora mitigación física según amenazas.");
  if(count(enemies,"heal")>=2)warnings.push("Varias fuentes de curación: evalúa Heridas Graves en el equipo según el parche.");
  if(count(enemies,"shield")>=2)warnings.push("Múltiples escudos: coordina daño y ventanas de entrada.");
  if(cc>=8)warnings.push("Control elevado: conserva herramientas de limpieza, movilidad o protección según el campeón.");
  if(count(enemies,"engage")>=2)warnings.push("Composición de iniciación: mantén visión de flancos y distancias.");
  if(count(enemies,"burst")>=2)warnings.push("Amenazas de ráfaga: evita entrar aislado y anticipa enfriamientos.");
  const ownTeam=[own,...allies];
  if(count(ownTeam,"tank")===0 && ownTeam.length===5)warnings.push("Tu equipo no presenta un tanque claro según etiquetas editoriales; prioriza posicionamiento.");
  return {
    champion:own.name,role:draft.role,enemyLane:enemyLane?.name??null,
    coverage:{allies:allies.length,enemies:enemies.length,complete:enemies.length===5 && allies.length===4},
    composition:{magic,physical,mixed,control,ccScore:cc,healers:count(enemies,"heal"),shields:count(enemies,"shield"),tanks:count(enemies,"tank"),engage:count(enemies,"engage")},
    advice:{role:ROLE_GOALS[draft.role],own:strengths,lane:laneFlags,warnings},
    provenance:"Análisis heurístico editorial a partir de etiquetas locales; no son estadísticas oficiales, win rates, builds ni datos en directo."
  };
}
