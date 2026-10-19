// MotorWr 2.0: independent champion selection and draft context.
// No item recommendations are generated without verified champion-specific data.
export const ROLES = Object.freeze(["baron","jungle","mid","dragon","support"]);
export function normalizeChampionName(value) {
  return String(value ?? "").trim().toLocaleLowerCase("en");
}
export function createDraft({champion,role,allies=[],enemies=[]}={}) {
  if (!champion || !String(champion).trim()) throw new Error("Selecciona tu campeón.");
  if (!ROLES.includes(role)) throw new Error("Selecciona una posición válida.");
  if (!Array.isArray(allies) || allies.length > 4 || !Array.isArray(enemies) || enemies.length > 5) throw new Error("Composición inválida.");
  const selected=normalizeChampionName(champion);
  const normalize=arr=>arr.map(x=>String(x||"").trim()).filter(Boolean);
  const team=normalize(allies), opponents=normalize(enemies);
  if ([...team,...opponents].some(x=>normalizeChampionName(x)===selected)) throw new Error("El campeón seleccionado está duplicado.");
  if (new Set(team.map(normalizeChampionName)).size!==team.length || new Set(opponents.map(normalizeChampionName)).size!==opponents.length) throw new Error("Hay campeones duplicados en un equipo.");
  return {champion:String(champion).trim(),role,allies:team,enemies:opponents};
}
export function championRecommendation(draft, verifiedProfiles={}) {
  const profile=verifiedProfiles[normalizeChampionName(draft.champion)];
  if (!profile || !profile.roles?.includes(draft.role) || !profile.source || !profile.patch) {
    return {status:"unverified",message:"No existe una build verificada para este campeón y posición.",draft};
  }
  return {status:"verified",profile,draft};
}
