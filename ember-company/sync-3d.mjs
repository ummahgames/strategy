// Local file synchronization only. This does not build, upload, or deploy anything.
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
const source=new URL('./',import.meta.url),target=new URL('../ember-company-3d/',source);
await mkdir(target,{recursive:true});
for(const name of ['AGENTS.md','engine.js','persistence.js','animations.js','characters.js','art.js','app.js','style.css','ui.css','world.css']){
  await writeFile(new URL(name,target),await readFile(new URL(name,source)));
}
await cp(new URL('assets/',source),new URL('assets/',target),{recursive:true});
let html=await readFile(new URL('index.html',source),'utf8');
html=html.replace('Saffron Vanguard · A tactical expedition','Saffron Vanguard 3D · A tactical expedition')
 .replace('SAFFRON VANGUARD<small>','SAFFRON VANGUARD 3D<small>').replace('TACTICS OF THE AMBER ROAD','THE AMBER ROAD IN 3D')
 .replace('<script defer src="engine.js">','<script defer src="view-config.js"></script><script defer src="engine.js">')
 .replace('<script defer src="app.js">','<script defer src="webgl.js"></script><script defer src="app.js">')
 .replace('<link rel="stylesheet" href="ui.css">','<link rel="stylesheet" href="ui.css"><link rel="stylesheet" href="webgl.css">')
 .replace('href="../ember-company-3d/index.html">3D version','href="../ember-company/index.html">Illustrated 2D version');
await writeFile(new URL('index.html',target),html);
await writeFile(new URL('view-config.js',target),"globalThis.EmberConfig=Object.freeze({storageKey:'ember-company-3d-v1'});\n");
console.log('Synchronized local campaign code into ember-company-3d.');
