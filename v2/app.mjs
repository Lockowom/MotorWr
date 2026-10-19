import {analyze,validateDraft,guideText,ROLES,ROLE_HINTS,roleHints,normalize,VERSION} from './core.mjs';
const $=q=>document.querySelector(q);
const byId=id=>document.getElementById(id);
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='motorwr-v2-beta-state';
const OTHER_ROLES=ROLES.map(([id])=>id);
const LABELS=Object.fromEntries(ROLES);
const ICONS={top:'⚔',jg:'🌿',mid:'✦',adc:'◎',sup:'⬡'};
let roster=[],byName=new Map(),mode='draft',pick=null,lastResult=null,latestText='';
const defaults=()=>({role:'top',own:'',enemies:{top:'',jg:'',mid:'',adc:'',sup:''},allies:{},focus:'macro',threat:'',history:[]});
function loadState(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object'&&OTHER_ROLES.includes(x.role))return {...defaults(),...x,enemies:{...defaults().enemies,...x.enemies},allies:{...x.allies},history:Array.isArray(x.history)?x.history.slice(0,20):[]};}catch{}return defaults();}
let state=loadState();
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function toast(s){const x=byId('toast');x.textContent=s;x.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('show'),3300);}
function avatar(name){if(!name)return '<span class="portrait placeholder">?</span>';const n=escapeHtml(name),asset=champUrl(name);
 return '<span class="portrait">'+escapeHtml(name.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())+'<img loading="lazy" src="'+escapeHtml(asset)+'" alt="" onerror="this.remove()"></span>';}
const imgAlias={"Aurelion Sol":"AurelionSol","Cho'Gath":"Chogath","Dr. Mundo":"DrMundo","Jarvan IV":"JarvanIV","Kai'Sa":"Kaisa","Kha'Zix":"Khazix","Kog'Maw":"KogMaw","K'Santé":"KSante","LeBlanc":"Leblanc","Lee Sin":"LeeSin","Master Yi":"MasterYi","Miss Fortune":"MissFortune","Nunu y Willump":"Nunu","Renata Glasc":"Renata","Tahm Kench":"TahmKench","Twisted Fate":"TwistedFate","Vel'Koz":"Velkoz","Wukong":"MonkeyKing"};
function champUrl(name){return 'https://ddragon.leagueoflegends.com/cdn/16.18.1/img/champion/'+encodeURIComponent(imgAlias[name]||name.replace(/[^a-zA-Z0-9]/g,''))+'.png';}
function nameOrChoose(name){return escapeHtml(name||'Seleccionar');}
function buttonPick(key,role,label,name,own=false){
 const hint=own?'<em>Tu campeón principal</em>':'';
 return '<button type="button" class="'+(own?'champ-choice own-choice':'slot')+'" data-pick="'+escapeHtml(key)+'">'+avatar(name)+'<span><small>'+escapeHtml(label)+'</small><strong>'+nameOrChoose(name)+'</strong>'+hint+'</span><b>›</b></button>';
}
function switchTab(next){mode=next;for(const v of ['draft','result','history']){byId(v+'View').hidden=v!==next;const btn=$('[data-tab="'+v+'"]');btn.classList.toggle('on',v===next);}if(next==='history')renderHistory();window.scrollTo({top:0,behavior:'smooth'});}
function render(){
 byId('roles').innerHTML=ROLES.map(([id,label])=>'<button type="button" data-role="'+id+'" class="'+(id===state.role?'active':'')+'"><span class="role-icon">'+ICONS[id]+'</span>'+escapeHtml(label)+'</button>').join('');
 const rolesUsed=roleHints(state.own);
 byId('roleInfo').textContent=state.own&&!rolesUsed.includes(state.role)?'Selección fuera de los roles recomendados. Puedes continuar; MotorWr no forzará una build desconocida.':'Elige tu campeón. La interfaz mostrará la cobertura de datos disponibles.';
 const ownButton=byId('draftView').querySelector('[data-pick="own"]');
 if(ownButton)ownButton.outerHTML=buttonPick('own',state.role,'TU CAMPEÓN',state.own,true);
 byId('enemies').innerHTML=ROLES.map(([id,label])=>buttonPick('e:'+id,id,label.toUpperCase(),state.enemies[id])).join('');
 byId('allies').innerHTML=ROLES.filter(([id])=>id!==state.role).map(([id,label])=>buttonPick('a:'+id,id,label.toUpperCase(),state.allies[id])).join('');
 byId('focus').value=state.focus||'macro';
 const danger=byId('threat');
 danger.innerHTML='<option value="">Partida igualada</option>'+ROLES.filter(([id])=>state.enemies[id]).map(([id])=>'<option value="'+escapeHtml(state.enemies[id])+'">'+escapeHtml(state.enemies[id])+' · '+LABELS[id]+'</option>').join('');
 danger.value=ROLES.some(([id])=>state.enemies[id]===state.threat)?state.threat:'';
 }
function openPicker(key){
 pick=key;
 const role=key==='own'?state.role:key.split(':')[1];
 const prefix=key==='own'?'TU CAMPEÓN':key.startsWith('e:')?'RIVAL':'ALIADO';
 byId('pickRole').textContent=prefix+' · '+LABELS[role];
 byId('search').value='';
 byId('roleOnly').checked=false;
 renderPicker();
 byId('picker').showModal();
 setTimeout(()=>byId('search').focus(),40);
}
function renderPicker(){
 const q=normalize(byId('search').value);
 const only=byId('roleOnly').checked;
 const role=pick==='own'?state.role:pick?.split(':')[1];
 let xs=roster.filter(c=>normalize(c.name).includes(q)&&( !only||ROLE_HINTS[role]?.includes(c.name)));
 xs=xs.sort((a,b)=>{const x=Number(ROLE_HINTS[role]?.includes(b.name))-Number(ROLE_HINTS[role]?.includes(a.name));return x||a.name.localeCompare(b.name,'es');});
 byId('champList').innerHTML=xs.slice(0,200).map(c=>'<button type="button" class="champ-option" data-select="'+escapeHtml(encodeURIComponent(c.name))+'">'+avatar(c.name)+'<span>'+escapeHtml(c.name)+'</span></button>').join('')||'<p class="micro">Sin coincidencias</p>';
}
function assign(name){
 if(!byName.has(name))return;
 if(pick==='own')state.own=name;
 else if(pick?.startsWith('e:'))state.enemies[pick.slice(2)]=name;
 else if(pick?.startsWith('a:'))state.allies[pick.slice(2)]=name;
 state.threat='';
 persist();render();byId('picker').close();
}
function metric(n,label){return '<div class="metric"><strong>'+escapeHtml(n)+'</strong><small>'+escapeHtml(label)+'</small></div>';}
function blockTitle(text){return '<div class="small-label">'+escapeHtml(text)+'</div>';}
function riskClass(str){return str==='ALTO'?'warn':str==='BAJO'?'good':'';}
function renderResult(p){
 let focusMessage=state.focus==='split'?'Presión lateral: empuja con visión y obliga a responder. Evalúa objetivos antes de extenderte.':state.focus==='team'?'Peleas grupales: guarda control o movilidad para objetivos prioritarios, sin iniciar a ciegas.':'Macrojuego: oleadas, visión y objetivo neutral deben estar alineados antes de rotar.';
 const h='<section class="card"><div class="small-label">LECTURA RÁPIDA · '+escapeHtml(p.coverage)+'</div><h2>'+escapeHtml(p.own)+' <span style="color:#8ab7b9">vs</span> '+escapeHtml(p.rival)+'</h2><div class="tags"><span class="tag '+riskClass(p.laneRisk)+'">LÍNEA '+escapeHtml(p.laneRisk)+'</span><span class="tag '+riskClass(p.teamRisk)+'">PELEA '+escapeHtml(p.teamRisk)+'</span><span class="tag">CC '+escapeHtml(p.cc)+'</span></div><div class="metrics">'+metric(p.enemy.AP,'AP')+metric(p.enemy.AD,'AD')+metric(p.enemy.MIX,'Mixto')+'</div><p>CC calculado: '+p.enemy.cc+' · Daño verdadero: '+p.enemy.true+' · Curación: '+p.enemy.heal+' · Escudos: '+p.enemy.shield+'</p></section>';
 let purchase=p.profile?'<div class="card">'+blockTitle('BUILD INDIVIDUAL · REFERENCIA EDITORIAL')+'<h3>Orden orientativo</h3><div class="build-row"><div class="build-item"><b>B</b>'+escapeHtml(p.boots)+'</div>'+p.items.map((it,i)=>'<div class="build-item"><b>'+(i+1)+'</b>'+escapeHtml(it)+'</div>').join('')+'</div><h4>Runas</h4><p>'+p.profile.runes.map(escapeHtml).join(' · ')+'</p><h4>Hechizos</h4><p>'+escapeHtml(p.profile.spells)+'</p><div class="src">Fuente y procedencia: '+escapeHtml(p.profile.source)+' <a href="'+escapeHtml(p.profile.url)+'" target="_blank" rel="noopener noreferrer">Ver fuente ↗</a></div></div>':
 '<div class="card warning"><h3>Build individual pendiente de validar</h3><p>Para '+escapeHtml(p.own)+' no tenemos una combinación de objetos y runas revisada específicamente en este parche. Mostramos un análisis táctico sin inventar una build.</p></div>';
 let tips='<section class="card"><h3>Estrategia contextual</h3><p><b>Rival directo:</b> '+escapeHtml(p.laneNote)+'</p><p><b>Plan de juego:</b> '+escapeHtml(focusMessage)+'</p><ol>'+p.lines.map(t=>'<li>'+escapeHtml(t)+'</li>').join('')+'</ol><p><b>Fase tardía:</b> '+escapeHtml(p.lateNote)+'</p></section>';
 let alerts='<section class="card"><h3>Ajustes del draft</h3><ul>'+p.notes.map(s=>'<li>'+escapeHtml(s)+'</li>').join('')+'</ul></section>';
 let others='<details class="card"><summary><b>Composición completa y cobertura</b></summary><h4>Lectura de sinergias</h4><div class="metrics">'+metric(p.friendly.AP,'Aliados AP')+metric(p.friendly.AD,'Aliados AD')+metric(p.friendly.MIX,'Aliados mixtos')+'</div><ul>'+p.teamNotes.map(s=>'<li>'+escapeHtml(s)+'</li>').join('')+'</ul><div class="columns"><div><h4>Enemigos</h4>'+p.opponents.map(c=>'<p>'+escapeHtml(LABELS[c.role]+': '+c.name)+'</p>').join('')+'</div><div><h4>Aliados opcionales</h4>'+(p.allies.length?p.allies.map(c=>'<p>'+escapeHtml(c.name)+'</p>').join(''):'<p>Sin aliados seleccionados.</p>')+'</div></div><p class="pathnote">Taxonomía del daño y control: heurística editorial de MotorWr; no indica daño real medido ni winrates.</p></details>';
 let buttons='<div class="pill-actions"><button id="copyResult">Copiar guía</button><button id="saveResult">Guardar draft</button><button id="editDraft">Editar selección</button></div>';
 byId('output').innerHTML=h+purchase+tips+alerts+others+buttons;
 latestText=guideText(p);
 byId('generatedTime').textContent='Versión '+VERSION;
 byId('copyResult').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(latestText);toast('Guía copiada');}catch{toast('Copia no disponible en este navegador');}});
 byId('saveResult').addEventListener('click',()=>{state.history.unshift({savedAt:new Date().toISOString(),draft:structuredClone({role:state.role,own:state.own,enemies:state.enemies,allies:state.allies,focus:state.focus,threat:state.threat}),summary:p.own+' · '+LABELS[p.role]+' vs '+p.rival});state.history=state.history.slice(0,20);persist();toast('Draft guardado en este dispositivo');});
 byId('editDraft').addEventListener('click',()=>switchTab('draft'));
}
function renderHistory(){
 byId('historyList').innerHTML=state.history.length?state.history.map((h,i)=>'<button type="button" class="history-item" data-load="'+i+'"><strong>'+escapeHtml(h.summary||'Draft')+'</strong><small>'+escapeHtml(new Date(h.savedAt).toLocaleString('es-CL'))+' · Abrir configuración</small></button>').join('')+'<div class="button-row"><button id="clearHistory" class="ghost">Borrar historial</button></div>':'<div class="empty">Aún no guardas drafts. Los futuros análisis se guardan solo cuando pulses «Guardar draft».</div>';
}
function generate(){
 try{
   const draft={role:state.role,own:state.own,enemies:{...state.enemies},allies:{...state.allies}};
   const p=analyze(draft,roster,{threat:state.threat,focus:state.focus});
   lastResult=p;renderResult(p);switchTab('result');
 }catch(e){toast(e.message||'Revisa la selección de campeones');}
}
function clickHandler(e){
 const b=e.target.closest('button');
 if(!b)return;
 if(b.dataset.tab){switchTab(b.dataset.tab);return;}
 if(b.dataset.role){const role=b.dataset.role;state.role=role;delete state.allies[role];persist();render();return;}
 if(b.dataset.pick){openPicker(b.dataset.pick);return;}
 if(b.dataset.select){assign(decodeURIComponent(b.dataset.select));return;}
 if(b.dataset.load!==undefined){const item=state.history[Number(b.dataset.load)];if(item){state={...state,...item.draft,enemies:{...defaults().enemies,...item.draft.enemies}};persist();render();switchTab('draft');}return;}
 if(b.id==='clearHistory'){if(confirm('¿Borrar el historial local?')){state.history=[];persist();renderHistory();}return;}
}
async function start(){
 try{
   const response=await fetch('./data/champions.json',{cache:'no-store'});if(!response.ok)throw Error('No se pudo cargar el catálogo');
   const data=await response.json();roster=data.champions;byName=new Map(roster.map(c=>[c.name,c]));
   if(!Array.isArray(roster)||roster.length<130)throw Error('Catálogo incompleto');
   state.own=byName.has(state.own)?state.own:'';
   for(const role of OTHER_ROLES){if(!byName.has(state.enemies[role]))state.enemies[role]='';if(!byName.has(state.allies[role]))delete state.allies[role];}
   render();
   document.addEventListener('click',clickHandler);
   byId('search').addEventListener('input',renderPicker);
   byId('roleOnly').addEventListener('change',renderPicker);
   byId('closePicker').addEventListener('click',()=>byId('picker').close());
   byId('picker').addEventListener('click',e=>{if(e.target===byId('picker'))byId('picker').close();});
   byId('focus').addEventListener('change',e=>{state.focus=e.target.value;persist();});
   byId('threat').addEventListener('change',e=>{state.threat=e.target.value;persist();});
   byId('generate').addEventListener('click',generate);
   byId('clear').addEventListener('click',()=>{const history=state.history;state={...defaults(),history};persist();render();toast('Composición limpia');});
   byId('example').addEventListener('click',()=>{state.role='top';state.own='Camille';state.enemies={top:'Gwen',jg:'Viego',mid:'Brand',adc:'Lucian',sup:'Lux'};state.allies={};state.focus='split';state.threat='';persist();render();toast('Ejemplo cargado: Camille vs Gwen');});
   for(const button of document.querySelectorAll('[data-tab]'))button.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const list=[...document.querySelectorAll('[data-tab]')];list[(list.indexOf(button)+(e.key==='ArrowRight'?1:2))%3].focus();}});
   if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
 }catch(err){byId('draftView').innerHTML='<div class="card warning"><h2>La app no pudo iniciar</h2><p>'+escapeHtml(err.message)+'</p><button onclick="location.reload()">Reintentar</button></div>';}
}
start();
