import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'dist-v2');
fs.rmSync(dest,{recursive:true,force:true});
const paths=['index.html','app.mjs','core.mjs','styles.css','data/champions.json','sw.js','manifest.webmanifest','assets/icon.svg'];
for(const item of paths){const from=path.join(root,'v2',item);if(!fs.existsSync(from))throw Error('Missing '+item);const to=path.join(dest,item);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);}
fs.writeFileSync(path.join(dest,'_headers'),'/index.html\n  Cache-Control: no-cache\n/sw.js\n  Cache-Control: no-cache\n/data/champions.json\n  Cache-Control: no-cache\n');
console.log('Built '+paths.length+' MotorWr 2.0 beta assets in dist-v2');
