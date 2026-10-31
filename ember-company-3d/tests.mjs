import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import './view-config.js';
import './engine.js';
import './persistence.js';
import './webgl.js';
const E=globalThis.EmberEngine,P=globalThis.EmberPersistence,G=globalThis.EmberWebGL;
let passed=0;function test(name,run){run();passed++;console.log('PASS '+name);}
test('3D game has an independent save slot and a two-hero opening',()=>{
 assert.equal(P.SAVE_KEY,'ember-company-3d-v1');
 const c=E.startBattle(E.createCampaign());assert.equal(E.party(c).length,2);assert.equal(c.enemies.length,2);
});
test('all camera angles project finite coordinates and keep the origin centered',()=>{
 for(let i=0;i<8;i++){
  const matrix=G.cameraMatrix(i*Math.PI/4,1,1.4),origin=G.projectPoint(matrix,[0,0,0]);
  assert.ok(Math.abs(origin.x-448)<.01);assert.ok(Math.abs(origin.y-320)<.01);
  for(const p of [[-6.5,0,-4.5],[6.5,0,4.5],[0,1.5,0]]){
   const result=G.projectPoint(matrix,p);assert.ok(Object.values(result).every(Number.isFinite));
  }
 }
});
test('projected tile centers are inside their picking polygons after rotation and zoom',()=>{
 for(let angle=0;angle<8;angle++)for(const zoom of [.7,1,1.35]){
  const matrix=G.cameraMatrix(angle*Math.PI/4,zoom);
  for(let y=0;y<10;y++)for(let x=0;x<14;x++){
   const center=G.projectPoint(matrix,[x-6.5,.06,y-4.5]);
   const polygon=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([dx,dz])=>G.projectPoint(matrix,[x-6.5+dx,.06,y-4.5+dz]));
   assert.ok(G.contains(polygon,center));
  }
 }
});
test('shared campaign rules and UI source match the illustrated edition',()=>{
 for(const name of ['engine.js','persistence.js','animations.js','characters.js','art.js','app.js','style.css','ui.css','world.css']){
  assert.equal(readFileSync(new URL(name,import.meta.url),'utf8'),readFileSync(new URL('../ember-company/'+name,import.meta.url),'utf8'),name);
 }
});
test('all local runtime scripts and styles exist in dependency order',()=>{
 const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
 const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(scripts[0],'view-config.js');assert.equal(scripts.at(-2),'webgl.js');assert.equal(scripts.at(-1),'app.js');
 for(const name of scripts)assert.ok(readFileSync(new URL(name,import.meta.url)).length);
 assert.ok(html.includes('href="webgl.css"'));
 assert.ok(!html.includes('https://cdn'));
});
test('every biome produces finite, bounded WebGL geometry and reuses cached models',()=>{
 let currentBuffer,draws=0,uploads=0;
 const counts=new Map(),buttons=Array.from({length:4},()=>({}));
 const ink=new Proxy({},{get:()=>()=>{}});
 const gl=new Proxy({
  FRAMEBUFFER_COMPLETE:36053,
  createBuffer:()=>({}),createProgram:()=>({}),createShader:()=>({}),createTexture:()=>({}),createFramebuffer:()=>({}),createRenderbuffer:()=>({}),
  getShaderParameter:()=>true,getProgramParameter:()=>true,checkFramebufferStatus:()=>36053,
  getAttribLocation:(p,name)=>['aPosition','aColor','aNormal'].indexOf(name),getUniformLocation:()=>({}),
  bindBuffer:(target,buffer)=>{currentBuffer=buffer;},
  bufferData:(target,data)=>{assert.equal(data.length%9,0);for(const value of data)assert.ok(Number.isFinite(value));counts.set(currentBuffer,data.length/9);uploads++;},
  uniformMatrix4fv:(location,transpose,matrix)=>{assert.equal(matrix.length,16);assert.ok([...matrix].every(Number.isFinite));},
  drawArrays:(mode,first,count)=>{assert.ok(count>0&&count<=counts.get(currentBuffer));draws++;}
 },{get:(target,key)=>key in target?target[key]:typeof key==='string'&&key===key.toUpperCase()?1:()=>{}});
 const previousDocument=globalThis.document;
 globalThis.document={createElement:type=>type==='canvas'?{getContext:()=>ink,setAttribute(){}}:{querySelectorAll:()=>buttons}};
 try{
  const canvas={width:896,height:640,style:{},parentElement:{append(){}},getContext:()=>gl,addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:896,height:640})};
  const renderer=G.create(canvas);
  for(let n=0;n<8;n++){
   const c=E.createCampaign();c.heroes.forEach(h=>h.unlocked=true);c.battle=n;E.startBattle(c);
   renderer.draw(c,{action:'move',grid:true},1000);
   const before=uploads;renderer.draw(c,{action:'move',grid:false},1200);
   assert.equal(uploads-before,1,'idle redraw only uploads the changing highlights, not terrain or character models');
   const projected=G.projectPoint(G.cameraMatrix(),[0,.06,0]);
   assert.ok(renderer.pick(projected.x,projected.y));
  }
  assert.ok(draws>100);
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});
test('illustrated camp asset is local and identical in both editions',()=>{
 const asset=readFileSync(new URL('assets/caravan-camp.png',import.meta.url));
 assert.ok(asset.length>1000);assert.deepEqual(asset.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
 assert.deepEqual(asset,readFileSync(new URL('../ember-company/assets/caravan-camp.png',import.meta.url)));
});
test('unavailable WebGL returns control to the illustrated renderer with an explanation',()=>{
 const previousDocument=globalThis.document,notes=[];
 globalThis.document={createElement:()=>({})};
 try{
  assert.equal(G.create({getContext:()=>null,parentElement:{append:note=>notes.push(note)}}),null);
  assert.match(notes[0].textContent,/illustrated 2D/);
 }finally{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});
console.log(`\n${passed} WebGL edition checks passed.`);
