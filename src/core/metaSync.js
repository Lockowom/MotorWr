// MotorWr updater: conservatively parse Riot's public patch index and the
// structured labels of the existing editorial build provider.
// No source content is copied beyond short item/rune/spell/skill names.
export const OFFICIAL_PATCH_INDEX='https://wildrift.leagueoflegends.com/en-us/news/tags/patch-notes/';
export const EDITORIAL_GUIDE_ORIGIN='https://www.wildriftfire.com';

export function comparePatch(a,b){
 const parse=s=>{
  const m=String(s).match(/^(\d{1,2})\.(\d{1,2})([a-z]?)$/i);
  if(!m)throw Error('Invalid patch: '+s);
  return [Number(m[1]),Number(m[2]),m[3]?m[3].toLowerCase().charCodeAt(0)-96:0];
 };
 const x=parse(a),y=parse(b);
 for(let i=0;i<3;i++)if(x[i]!==y[i])return Math.sign(x[i]-y[i]);
 return 0;
}
export function parseOfficialPatchIndex(html){
 if(typeof html!=='string'||html.length<100||html.length>10_000_000)throw Error('Invalid Riot index response');
 const matches=[...html.matchAll(/Wild\s+Rift\s+Patch\s+Notes\s+(\d{1,2}\.\d{1,2}[a-z]?)/gi)].map(m=>m[1].toLowerCase());
 if(!matches.length)throw Error('Riot official patch title not found');
 matches.sort((a,b)=>comparePatch(b,a));
 const patch=matches[0];
 const [,major,minor,letter]=patch.match(/^(\d+)\.(\d+)([a-z]?)$/);
 const slug='wild-rift-patch-notes-'+major+'-'+minor+letter;
 // Page-path formats have varied historically. Confirm a candidate by GET before use.
 const variants=[slug,'wild-rift-patch-notes-'+major+minor+letter];
 const candidates=[...html.matchAll(/(?:https?:\/\/wildrift\.leagueoflegends\.com)?\/en-us\/news\/game-updates\/(wild-rift-patch-notes-[a-z0-9-]+)\/?/gi)].map(x=>x[1]);
 const match=candidates.find(v=>variants.includes(v));
 const suffix=match||slug;
 return {patch,url:'https://wildrift.leagueoflegends.com/en-us/news/game-updates/'+suffix+'/',source:OFFICIAL_PATCH_INDEX};
}
export function stripTags(html){
 return String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'')
  .replace(/<[^>]+>/g,' ')
  .replace(/&(?:amp|#38);/gi,'&').replace(/&(?:quot|#34);/gi,'"')
  .replace(/&(?:apos|#39|#039|#x27);/gi,"'").replace(/&nbsp;|&#160;/gi,' ')
  .replace(/\s+/g,' ').trim();
}
function paragraphs(html){
 return [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
  .map(m=>stripTags(m[1])).filter(Boolean);
}
function roleId(label){
 return {'solo':'baron','baron':'baron','top':'baron','jungle':'jungle',
  'mid':'mid','middle':'mid','dragon':'dragon','duo':'dragon','adc':'dragon','support':'support'}[String(label).toLowerCase()]||null;
}
function splitByH2(html){
 const m=[...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
 return m.map((entry,i)=>({
  title:stripTags(entry[1]),
  html:html.slice(entry.index+entry[0].length,i+1<m.length?m[i+1].index:html.length)
 }));
}
function alts(html){
 const matches=[...html.matchAll(/\balt\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)];
 return matches.map(m=>stripTags(m[1]||m[2]));
}
function validNames(a,count){
 return a.length===count && a.every(x=>typeof x==='string' && x.length>=2 && x.length<=90 &&
 !/[<>]/.test(x) && !/^(Final Build|Runes|Summoner Spells|Boots)$/i.test(x));
}
function readNamesAfterMarker(block, marker, quantity) {
 const match=new RegExp(marker,'i').exec(block);
 if(!match)throw Error('Missing '+marker+' marker in editorial guide');
 const remaining=block.slice(match.index+match[0].length);
 const plain=paragraphs(remaining).slice(0,quantity);
 const pictured=alts(remaining).slice(0,quantity);
 const entries=validNames(plain,quantity)?plain:pictured;
 if(!validNames(entries,quantity)){const clue={paragraphs:entries.slice(0,9),text:stripTags(remaining).slice(0,270),alts:[...remaining.matchAll(/alt=[\"']([^\"']{2,100})[\"']/gi)].slice(0,8).map(m=>m[1])};throw Error('Malformed '+marker+' section: '+JSON.stringify(clue));}
 return entries;
}
export function parseEditorialGuide(html,champion,expectedRoles){
 if(typeof html!=='string'||html.length<1000||html.length>5_000_000)throw Error('Invalid editorial guide body');
 if(!Array.isArray(expectedRoles)||!expectedRoles.length)throw Error('Roles must be provided');
 if(expectedRoles.some(x=>!['baron','jungle','mid','dragon','support'].includes(x)))throw Error('Unknown role');
 const h1=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(x=>stripTags(x[1]));
 if(!h1.some(x=>x.includes(champion)&&/Build Guide for Wild Rift/i.test(x)))throw Error('Champion identity mismatch');
 const guideTag=stripTags(html.slice(html.search(/Build Guide for Wild Rift/i),html.search(/Build Guide for Wild Rift/i)+3400));
 const patchMatch=guideTag.match(/\bPatch\s+(\d{1,2}\.\d{1,2}[a-z]?)\b/i);
 if(!patchMatch)throw Error('Patch tag missing from editorial guide');
 const patch=patchMatch[1].toLowerCase();
 const sectionList=splitByH2(html);
 const itemGroups=sectionList.filter(s=>/\'s Item Build$/i.test(s.title));
 const runeGroups=sectionList.filter(s=>/\'s Spells\s*&\s*Runes$/i.test(s.title));
 if(!itemGroups.length||itemGroups.length!==runeGroups.length)throw Error('Guide groups are missing/unbalanced');
 const beforeFirst=html.slice(html.search(/Build Guide for Wild Rift/i),html.indexOf('<h2',html.search(/Build Guide for Wild Rift/i)));
 const declaredRoles=[...stripTags(beforeFirst).matchAll(/\b(Solo|Baron|Top|Jungle|Mid|Middle|Dragon|Duo|ADC|Support)\s+Build\b/gi)]
  .map(m=>roleId(m[1]));
 const roles=(declaredRoles.length===itemGroups.length&&new Set(declaredRoles).size===declaredRoles.length)
  ?declaredRoles
  :itemGroups.length===1&&expectedRoles.length===1 ? expectedRoles : null;
 if(!roles)throw Error('Cannot reliably map editorial guide groups to roles');
 const parsed=[];
 for(let i=0;i<roles.length;i++){
  if(!expectedRoles.includes(roles[i]))continue;
  const items=readNamesAfterMarker(itemGroups[i].html,'Final\\s*Build',6);
  const block=runeGroups[i].html;
  const sum=/Summoner\s*Spells/i.exec(block),run=/\bRunes\b/i.exec(block);
  if(!sum||!run||run.index<=sum.index)throw Error('Summoner spells and runes not reliably found');
  const spellBlock=block.slice(sum.index+sum[0].length,run.index);
  const runeBlock=block.slice(run.index+run[0].length);
  const read=(piece,n)=>{
    const ps=paragraphs(piece).slice(0,n),images=alts(piece).slice(0,n);
    return validNames(ps,n)?ps:images;
  };
  const spells=read(spellBlock,2),runes=read(runeBlock,5);
  if(!validNames(spells,2)||!validNames(runes,5))throw Error('Bad spell/rune field count; '+JSON.stringify({spells,runes}).slice(0,220));
  parsed.push({role:roles[i],patch,finalItems:items,spells,runes});
 }
 if(!parsed.length)throw Error('No supported role sections found for '+champion);
 return parsed;
}
export function stableGuideFingerprint(p) {
 const src=JSON.stringify({patch:p.patch,finalItems:p.finalItems,runes:p.runes,spells:p.spells});
 // A stable readable fingerprint suitable for change detection; not cryptographic.
 let hash=2166136261;
 for(let i=0;i<src.length;i++){hash^=src.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16).padStart(8,'0');
}


// Only the names of sections changed by Riot are indexed automatically.
// Numeric balance descriptions and buff/nerf polarity require a separate review.
export function parseOfficialPatchSubjects(html,officialNames){
 if(typeof html!=='string'||html.length<200||!Array.isArray(officialNames))throw Error('Invalid patch article/roster');
 const cleanName=s=>stripTags(s).toLowerCase().replace(/[^a-z0-9]/g,'');
 const known=new Map(officialNames.map(x=>[cleanName(x),x]));
 const subject=(begin,end)=>{
  const opening=begin.exec(html);if(!opening)return '';
  const rest=html.slice(opening.index+opening[0].length);
  const m=rest.match(end);
  return m?rest.slice(0,m.index):rest.slice(0,25000);
 };
 const champBlock=subject(/CHAMPION\s+CHANGES/i,/<h2\b[^>]*>[\s\S]*?GAMEPLAY\s+CHANGES[\s\S]*?<\/h2>/i);
 const p=[...champBlock.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(x=>stripTags(x[1]));
 const champions=[...new Set(p.filter(x=>x===x.toUpperCase()&&known.has(cleanName(x))).map(x=>known.get(cleanName(x))))];
 const itemsBlock=subject(/<h2\b[^>]*>\s*Items\s*<\/h2>/i,/<h2\b/i);
 const runesBlock=subject(/<h2\b[^>]*>\s*Runes\s*<\/h2>/i,/<h2\b/i);
 const headings=s=>[...s.matchAll(/<h4\b[^>]*>([\s\S]*?)<\/h4>/gi)]
  .map(x=>stripTags(x[1])).filter(x=>x.length>=2&&x.length<=95);
 return {champions,items:[...new Set(headings(itemsBlock))],runes:[...new Set(headings(runesBlock))]};
}
