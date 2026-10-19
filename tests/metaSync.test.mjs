import assert from 'node:assert/strict';
import fs from 'node:fs';
import {comparePatch,parseOfficialPatchIndex,parseEditorialGuide,stableGuideFingerprint} from '../src/core/metaSync.js';
import {resolveBuildReference,validateAutoMeta,patchDisplayStatus} from '../src/core/metaPolicy.js';
const initial=JSON.parse(fs.readFileSync(new URL('../src/data/autoMeta.json',import.meta.url)));
validateAutoMeta(initial);
assert.equal(initial.patch,'7.3b');
assert(comparePatch('7.4','7.3b')>0);
assert(comparePatch('7.10','7.9')>0);
assert(comparePatch('7.3b','7.3a')>0);
assert(comparePatch('7.3b','7.3b')===0);
assert.throws(()=>comparePatch('13.7.2','7.3b'));
const index='<main><h2>Wild Rift Patch Notes 7.3c</h2><h2>Wild Rift Patch Notes 7.3b</h2><a href="/en-us/news/game-updates/wild-rift-patch-notes-7-3c/">Read</a></main>'.padEnd(200,'.');
assert.equal(parseOfficialPatchIndex(index).patch,'7.3c');
assert(parseOfficialPatchIndex(index).url.endsWith('7-3c/'));
assert.throws(()=>parseOfficialPatchIndex('<main>Something unrelated</main>'.padEnd(150,'.')));
const buildSection=(champ,boots,extra,spells=['Flash','Ignite'],runes=['Conqueror','Brutal','Cut Down','Legend: Alacrity','Bone Plating'])=>
 '<h2>'+champ+"'s Item Build</h2>Starting Item<p>Long Sword</p>Boots<p>"+boots+"</p>Final Build"+
 [boots,...extra].map(x=>'<p>'+x+'</p>').join('')+
 '<h2>'+champ+"'s Spells &amp; Runes</h2><p>Summoner Spells</p>"+
 spells.map(x=>'<p>'+x+'</p>').join('')+'<p>Runes</p>'+runes.map(x=>'<p>'+x+'</p>').join('');
const sample='<h1>Camille Build Guide for Wild Rift</h1><p>Patch 7.3b</p><p>Solo Build A Jungle Build A</p>'+
 buildSection('Camille','Plated Steelcaps',['Trinity Force','Hullbreaker','Eclipse',"Death's Dance",'Spear of Shojin'])+
 buildSection('Camille','Gluttonous Greaves',['Trinity Force','Eclipse',"Death's Dance",'Guardian Angel','Spear of Shojin'],['Flash','Smite'])+
 '<h2>How to play Camille</h2>'+''.padEnd(1500,'.');
const p=parseEditorialGuide(sample,'Camille',['baron','jungle']);
assert.equal(p.length,2);
assert.deepEqual(p.map(x=>x.role),['baron','jungle']);
assert.equal(p[0].finalItems.length,6);
assert.equal(p[1].spells[1],'Smite');
assert.equal(p[0].runes.length,5);
assert.equal(p[0].patch,'7.3b');
assert.throws(()=>parseEditorialGuide(sample,'Yasuo',['baron']));
assert.throws(()=>parseEditorialGuide(sample.replace('<p>Runes</p>','<p>No rune heading</p>'),'Camille',['baron','jungle']));
const fp=stableGuideFingerprint(p[0]);
assert.equal(fp,stableGuideFingerprint({...p[0],checkedAt:'2088-01-01'}));
assert.notEqual(fp,stableGuideFingerprint({...p[0],runes:['Aery',...p[0].runes.slice(1)]}));
const oldRef=resolveBuildReference('Camille','baron',initial);
assert.equal(oldRef.status,'referenced');
assert.equal(oldRef.automated,false);
const newMeta={...initial,patch:'7.3c',patchUrl:'https://wildrift.leagueoflegends.com/en-us/news/game-updates/wild-rift-patch-notes-7-3c/',guides:[]};
assert.equal(resolveBuildReference('Camille','baron',newMeta).status,'stale');
assert.equal(patchDisplayStatus(newMeta,'7.3b'),'awaiting_review');
const snapshot={champion:'Camille',role:'baron',patch:'7.3c',checkedAt:'2026-11-01',source:{publisher:'WildRiftFire',type:'third_party_editorial',url:'https://www.wildriftfire.com/guide/camille'},finalItems:p[0].finalItems,runes:p[0].runes,spells:p[0].spells,skillPriority:[],skillPriorityStatus:'pending_review'};
assert.equal(resolveBuildReference('Camille','baron',{...newMeta,guides:[snapshot]}).status,'referenced');
assert.equal(resolveBuildReference('Camille','jungle',{...newMeta,guides:[snapshot]}).status,'stale');
assert.throws(()=>validateAutoMeta({...newMeta,guides:[snapshot,snapshot]}));
assert.throws(()=>validateAutoMeta({...newMeta,guides:[{...snapshot,source:{...snapshot.source,url:'https://evil.test/guide'}}]}));
assert.throws(()=>validateAutoMeta({...newMeta,patchUrl:'https://evil.test'}));
console.log('PASS: live meta parsers, stale gates, source trust, role mapping and change fingerprints');
