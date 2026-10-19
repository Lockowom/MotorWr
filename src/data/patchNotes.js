// Cambios FACTUALES del parche 7.3b, transcritos y resumidos de notas oficiales de Riot.
// No inferir builds ni tasa de victorias de estas modificaciones.
export const PATCH_CHANGES=Object.freeze({
  "patch": "7.3b",
  "published": "2026-10-14",
  "source": "https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3b/",
  "champions": {
    "Volibear": {
      "direction": "buff",
      "summary": "Mejoras a la proporción de DA y curación de Acometida frenética."
    },
    "Jhin": {
      "direction": "buff",
      "summary": "Mejora al daño de impacto crítico y al escalado de daño de Susurro."
    },
    "Tryndamere": {
      "direction": "buff",
      "summary": "Mayor probabilidad crítica por Furia y mejoras de daño de Cuchillada giratoria."
    },
    "Hwei": {
      "direction": "nerf",
      "summary": "Reducción de daño, escudos y alcance/daño de varias habilidades."
    },
    "Nocturne": {
      "direction": "nerf",
      "summary": "Menos vida por nivel, daño de Q ajustado y mayor enfriamiento de definitiva."
    },
    "Yunara": {
      "direction": "nerf",
      "summary": "Reducción al daño de su habilidad inicial y aumento del enfriamiento de definitiva."
    },
    "Senna": {
      "direction": "nerf",
      "summary": "Menor daño crítico, DA por acumulación y daño base de Oscuridad penetrante."
    },
    "Yasuo": {
      "direction": "buff",
      "summary": "Aumentan el daño crítico estándar y el escudo de su pasiva."
    }
  },
  "items": [
    {
      "name": "Youmuu's Ghostblade",
      "note": "Precio 3000 → 2900 de oro."
    },
    {
      "name": "Locket of the Iron Solari",
      "note": "Precio 2600 → 2500; vida 200 → 300."
    },
    {
      "name": "Thornmail",
      "note": "Precio 2700 → 2850."
    },
    {
      "name": "Warmog's Armor",
      "note": "Umbral de activación 900 → 1250 de vida adicional."
    },
    {
      "name": "Statikk Shiv",
      "note": "Precio 3000 → 2900 y cargas potenciadas por ataque 5 → 7."
    },
    {
      "name": "Yun Tal Wildarrows",
      "note": "Precio 3100 → 3000."
    }
  ],
  "runes": [
    {
      "name": "Electrocute",
      "note": "Daño base inicial 40 → 60; daño máximo 210 sin cambios."
    },
    {
      "name": "Cheap Shot",
      "note": "Enfriamiento 7 s → 5 s."
    },
    {
      "name": "Grasp of the Undying",
      "note": "Daño 3,3% → 3% de vida máxima; crecimiento de vida 10 → 8."
    },
    {
      "name": "Aery",
      "note": "Escudo de 25–120 → 20–100 (más escalados sin cambio)."
    }
  ]
});
export function patchChangeForChampion(name){return PATCH_CHANGES.champions[name]??null;}
export function patchChangesForItems(items=[]){return PATCH_CHANGES.items.filter(x=>items.some(i=>i.toLowerCase()===x.name.toLowerCase()));}
export function patchChangesForRunes(runes=[]){return PATCH_CHANGES.runes.filter(x=>runes.some(i=>i.toLowerCase()===x.name.toLowerCase()));}
