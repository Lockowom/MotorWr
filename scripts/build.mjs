import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const names=['index.html','multi.html','manifest.webmanifest','sw.js','assets/icon.svg','src/core/multiChampion.js','src/data/champions.js','src/data/tacticalProfiles.js','src/data/officialRoster.js','src/data/patchNotes.js','src/data/buildReferences.js','src/data/autoMeta.json','src/core/metaPolicy.js','src/core/metaSync.js'];
fs.rmSync(dist,{recursive:true,force:true});
for(const name of names){const target=path.join(dist,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,name),target)}
fs.writeFileSync(path.join(dist,'_headers'),'/index.html\n  Cache-Control: no-cache\n/multi.html\n  Cache-Control: no-cache\n/src/data/autoMeta.json\n  Cache-Control: no-store\n/sw.js\n  Cache-Control: no-cache\n/manifest.webmanifest\n  Cache-Control: no-cache\n');
console.log('Built MotorWr PWA in dist/');
