const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const elements={};function el(id){return elements[id]??={value:({production:'continuous',deployment:'manual',movement:'network',difficulty:'normal',objective:'conquest',types:'special',economy:'ships',fog:'off',combat:'instant',travel:'normal',capacity:'200',mapSize:'24',amount:'50'})[id]||'',style:{},dataset:{},attributes:{},listeners:{},addEventListener(type,fn){this.listeners[type]=fn},setAttribute(key,value){this.attributes[key]=String(value)},getBoundingClientRect(){return {left:100,top:40}},setPointerCapture(){},clientWidth:1000,clientHeight:700,showModal(){this.open=true},close(){this.open=false},getContext(){return null}}}
const ctx={document:{getElementById:el,addEventListener(){},querySelector(){return null}},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},clearTimeout(){},localStorage:{},console,Math,Date,Set,Number,JSON};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),ctx);
function run(code){return vm.runInContext(code,ctx)}
run('start()');assert.equal(run('nodes.length'),24);assert.equal(run('(()=>{let s=new Set([0]), old=0;while(old!==s.size){old=s.size;for(const i of [...s])for(const j of nodes[i].links)s.add(j)}return s.size})()'),24);
run("config.movement='open'; nodes[0].ships=40; nodes[2].ships=5; send(0,2,.5,0)");assert.equal(run('nodes[0].ships'),20);assert.equal(run('fleets[0].ships'),20);run('tick(100)');assert.equal(run('nodes[2].owner'),0);
run("start(); config.movement='open'; nodes[2].kind='colony';nodes[2].ships=10;resolveCombat(2,0,15)");assert.equal(run('nodes[2].ships'),5);assert.equal(run('nodes[2].owner'),0);
run("start();config.combat='attrition';nodes[2].ships=2;battles.push({target:2,owner:0,ships:5,progress:0});tick(1)");assert.equal(run('nodes[2].owner'),0);
run('globalThis.saved=JSON.parse(JSON.stringify(snapshot()));restore(saved)');assert.equal(run('paused'),true);assert.throws(()=>run('restore({version:1,nodes:[]})'));
run("start();config.movement='open';config.production='queue';nodes[0].ships=10;nodes[0].queue=0;tick(2)");assert.equal(run('nodes[0].ships'),10);run('nodes[0].queue=10;tick(4)');assert.ok(run('nodes[0].ships')>10);assert.ok(run('nodes[0].queue')<10);
run("start();config.movement='open';nodes[0].ships=40;nodes[0].rate=0;routes=[{a:0,b:2,owner:0,clock:0,reserve:10},{a:0,b:3,owner:0,clock:0,reserve:10}];tick(1)");assert.equal(run('nodes[0].ships'),10);assert.deepEqual(Array.from(run('fleets.filter(f=>f.owner===0).map(f=>f.ships)')),[15,15]);
run("start();nodes[2].kind='fortress';nodes[2].ships=10;resolveCombat(2,0,10,'siege')");assert.equal(run('nodes[2].owner'),0);assert.ok(run('nodes[2].ships')<=10);
run("start();nodes[0].ships=50;selected=0;$('ability').onclick()");assert.equal(run('nodes[0].ships'),35);assert.equal(run('nodes[0].shield'),20);
run("start();config.objective='survival';elapsed=300;checkEnd()");assert.equal(run('ended'),false);run('nodes.forEach(p=>{if(p.owner===1)p.owner=0});checkEnd()');assert.equal(run('ended'),true);
run("start();config.movement='range';nodes[0].x=-.9;nodes[1].x=.9;nodes[0].y=nodes[1].y=0");assert.equal(run('canSend(0,1)'),false);
assert.throws(()=>run('restore({...snapshot(),battles:[{target:999,ships:1}]})'));
console.log('Galactic War simulation checks passed');

vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),ctx);
for(const difficulty of ['easy','medium','hard','expert'])for(let level=1;level<=120;level++){
 el('difficulty').value=difficulty;el('levelNumber').value=String(level);run('start()');
 assert.ok([6,8,10,12,18,24].includes(run('nodes.length')));
 assert.equal(run('config.level'),String(level));
 assert.equal(run('(()=>{let s=new Set([0]),q=[0];while(q.length)for(const j of nodes[q.shift()].links)if(!s.has(j)){s.add(j);q.push(j)}return s.size})()'),run('nodes.length'));
 assert.equal(run('nodes[2].ships'),run('nodes[3].ships'));
 for(let i=0;i<50;i++)run('tick(.05)');
 assert.equal(run('nodes.every(p=>Number.isFinite(p.ships)&&p.ships>=0)'),true);
}
for(const value of ['9007199254740993','999999999999999999999999999999999999999999999999999999999999']){
 el('levelNumber').value=value;run('start()');assert.equal(run('config.level'),value);let map=run('JSON.stringify(nodes)');run('start()');assert.equal(run('JSON.stringify(nodes)'),map);
}
run("ended=true;campaignResult='Victory!';config.level='9007199254740993';$('nextLevel').onclick()");assert.equal(run('config.level'),'9007199254740994');
run('globalThis.checkpoint=JSON.parse(JSON.stringify(snapshot()));restore(checkpoint)');assert.equal(run('config.level'),'9007199254740994');
console.log('480 generated levels across four difficulties, large level IDs, next-level and save checks passed');

vm.runInContext(fs.readFileSync(__dirname+'/systems.js','utf8'),ctx);
for(const difficulty of ['easy','medium','hard','expert'])for(const production of ['continuous','batch','queue'])for(const deployment of ['manual','flow'])for(const economy of ['ships','energy','local'])for(const combat of ['instant','attrition']){
 el('difficulty').value=difficulty;el('production').value=production;el('preset').value=deployment==='flow'?'flow':'classic';el('economy').value=economy;el('combat').value=combat;el('levelNumber').value='7';run('start()');
 run("config.interception='on';config.environment='hazards';config.routePolicy='waves';nodes[0].queue=100;config.movement='open';send(0,2,.5,0)");
 for(let i=0;i<100;i++)run('tick(.05)');
 assert.equal(run('nodes.every(p=>Number.isFinite(p.ships)&&p.ships>=0)'),true);
 run('restore(JSON.parse(JSON.stringify(snapshot())))');
}
assert.throws(()=>run('restore({...snapshot(),elapsed:-1})'));
assert.throws(()=>run("restore({...snapshot(),config:{...config,production:'corrupt'}})"));
console.log('144 rule-combination simulations and strict save checks passed');

const html=fs.readFileSync(__dirname+'/index.html','utf8');const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
for(const file of ['game.js','campaign.js','systems.js','playability.js','level-code.js'])for(const match of fs.readFileSync(__dirname+'/'+file,'utf8').matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),'Missing DOM element '+match[1]);
run("start();config.movement='open';config.travel='normal';$('fleetClass').value='fast';send(0,1,.25,0);globalThis.fastTime=fleets[0].duration;fleets=[];$('fleetClass').value='heavy';send(0,1,.25,0)");assert.ok(run('fleets[0].duration>fastTime'));
console.log('DOM wiring and fleet speed checks passed');
// Exercise rendering and all scripts with a WebGL API double, without a browser.
let drawCalls=0;const gpu=new Proxy({getShaderParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>({}),drawArrays:()=>drawCalls++,POINTS:0,LINES:1},{get:(o,k)=>k in o?o[k]:()=>{}});
const renderElements={};function renderEl(id){if(!renderElements[id])renderElements[id]={...el(id),listeners:{},attributes:{},dataset:{},clientWidth:1000,clientHeight:700,selectedOptions:[],getContext:()=>gpu};return renderElements[id]}
const graphicsContext={...ctx,document:{...ctx.document,getElementById:renderEl}};vm.createContext(graphicsContext);
for(const file of ['game.js','campaign.js','systems.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),graphicsContext);
vm.runInContext("$('levelNumber').value='4';$('difficulty').value='expert';start();config.movement='open';send(0,1,.5,0);render()",graphicsContext);assert.ok(drawCalls>0);
run("$('levelNumber').value='17';$('difficulty').value='medium';start();globalThis.retryMap=JSON.stringify(nodes);$('restartLevel').onclick()");assert.equal(run('JSON.stringify(nodes)'),run('retryMap'));
run("ended=true;campaignResult='Defeat';globalThis.beforeLevel=config.level;$('nextLevel').onclick()");assert.equal(run('config.level'),run('beforeLevel'));
console.log('Rendering code paths, retry reproducibility and defeat progression checks passed');

vm.runInContext(fs.readFileSync(__dirname+'/playability.js','utf8'),ctx);
el('preset').value='classic';el('progression').value='guided';el('levelNumber').value='1';run('start()');
assert.equal(run('nodes.length'),6);assert.equal(run("nodes.slice(2).every(p=>p.kind==='colony')"),true);
assert.equal(el('upgrade').hidden,true);assert.equal(el('research').hidden,true);
run('nodes[2].owner=0;activatePlanet(0);activatePlanet(2)');assert.equal(run('selected'),2);assert.equal(run('fleets.length'),0);
run('activatePlanet(2)');assert.equal(run('selected'),-1);
run('activatePlanet(0);activatePlanet(-1)');assert.equal(run('selected'),-1);
run('activatePlanet(0);targeting=true;activatePlanet(2)');assert.equal(run('fleets.length'),1);assert.equal(run('selected'),0);assert.equal(run('targeting'),false);
run('activatePlanet(2);activatePlanet(3)');assert.equal(run('selected'),2);assert.equal(run('fleets.length'),2);
run('activatePlanet(-1);activatePlanet(3)');assert.equal(run('selected'),3);assert.equal(run('fleets.length'),2);
for(const [level,kind] of [[3,'colony'],[4,'industrial'],[6,'fortress'],[8,'relay']]){el('levelNumber').value=String(level);run('start()');assert.equal(run('nodes[2].kind'),kind);assert.equal(el('upgrade').hidden,level<3)}
for(let level=1;level<=20;level++){el('levelNumber').value=String(level);run('start()');assert.equal(run("nodes.filter(p=>p.kind==='relay').length>0"),level>=8);assert.equal(run("nodes.filter(p=>p.kind==='fortress').length>0"),level>=6)}
run('restore(JSON.parse(JSON.stringify(snapshot())))');assert.equal(run('targeting'),false);
el('progression').value='custom';el('environment').value='hazards';run('start()');assert.equal(run('config.environment'),'hazards');assert.equal(el('research').hidden,false);
console.log('Selection, deselection, reinforcement targeting and guided unlock regressions passed');

for(const kind of ['capital','colony','industrial','fortress','relay']){let svg=run(`planetGlyph('${kind}')`);assert.ok(svg.includes('aria-label="'+kind+'"'));}
const glyphs=['capital','colony','industrial','fortress','relay'].map(k=>run(`planetGlyph('${k}')`));assert.equal(new Set(glyphs).size,5);
run("$('progression').value='guided';$('levelNumber').value='1';start();selected=0;globalThis.constBefore=nodes[0].ships");
run("$('upgrade').onclick()");assert.equal(run('nodes[0].ships'),run('constBefore'));
console.log('Planet visual identity and locked-action checks passed');

// Both presets must survive guided and custom starts, retries and legacy imports.
for(const progression of ['guided','custom'])for(const preset of ['classic','flow']){
 el('preset').value=preset;el('progression').value=progression;el('levelNumber').value='6';el('scenario').value='defense';run('start()');
 assert.equal(run('config.deployment'),preset==='flow'?'flow':'manual');assert.equal(run('config.objective'),'conquest');
 run("$('restartLevel').onclick()");assert.equal(run('config.deployment'),preset==='flow'?'flow':'manual');
 run('globalThis.oldSave=JSON.parse(JSON.stringify(snapshot()));oldSave.config.objective="survival";restore(oldSave)');assert.equal(run('config.objective'),'conquest');assert.equal(el('preset').value,preset);
}
assert.deepEqual(Array.from(run("Object.values(Campaign.difficulties).map(d=>d.reaction)")),[6,3.5,2,.8]);
// Existing flow routes retain their accumulated dispatch clock when the AI keeps its target.
run("$('preset').value='flow';$('progression').value='custom';$('difficulty').value='expert';$('levelNumber').value='1';start();nodes[1].ships=100;elapsed=30;ai();globalThis.aiRoute=routes.find(r=>r.a===1);aiRoute.clock=.8;ai()");assert.equal(run('routes.find(r=>r.a===1)===aiRoute'),true);assert.equal(run('aiRoute.clock'),.8);
console.log('Preset, conquest, difficulty and persistent AI route checks passed');
for(const [difficulty,before,after] of [['easy',5.9,6.1],['medium',3.4,3.6],['hard',1.9,2.1],['expert',.7,.9]]){
 el('preset').value='classic';el('progression').value='custom';el('difficulty').value=difficulty;el('levelNumber').value='1';el('scenario').value='skirmish';el('production').value='continuous';el('movement').value='open';run('start()');
 run("nodes.forEach(p=>{p.rate=0;if(p.owner===2)p.ships=200});nodes[1].ships=100;nodes[2].ships=0;elapsed=30;aiClock=0");
 for(let t=0;t<Math.floor(before*20);t++)run('tick(.05)');assert.equal(run('fleets.filter(f=>f.owner===1).length'),0,`${difficulty} acted early`);
 for(let t=Math.floor(before*20);t<Math.ceil(after*20);t++)run('tick(.05)');assert.ok(run('fleets.some(f=>f.owner===1)'),`${difficulty} did not act`);
}
console.log('AI decision timing simulated at all four difficulties');

// Exercise the installed pointer handlers, not just the order helper.
vm.runInContext(fs.readFileSync(__dirname+'/level-code.js','utf8'),ctx);
for(const progression of ['guided','custom']){
 el('preset').value='flow';el('progression').value=progression;el('levelNumber').value='1';el('difficulty').value='easy';el('movement').value='open';el('production').value='continuous';el('routePolicy').value='reserves';el('reserve').value='10';run('start()');
 const source=run('pos(nodes[0])'),target=run('pos(nodes[2])'),down={clientX:source[0]+100,clientY:source[1]+40,pointerId:7,button:0},up={clientX:target[0]+100,clientY:target[1]+40,pointerId:7,button:0};
 el('space').listeners.pointerdown(down);el('space').listeners.pointermove(up);assert.equal(el('dragLine').attributes.visibility,'visible');el('space').listeners.pointerup(up);
 assert.equal(el('dragLine').attributes.visibility,'hidden');assert.equal(run('routes.filter(r=>r.a===0&&r.b===2).length'),1);assert.equal(run('config.deployment'),'flow');
 for(let i=0;i<21;i++)run('tick(.05)');assert.ok(run('fleets.some(f=>f.a===0&&f.b===2&&f.owner===0)'));
 el('space').listeners.pointerdown(down);el('space').listeners.pointerup(up);assert.equal(run('routes.filter(r=>r.a===0&&r.b===2).length'),0);
}
// Production-only flow sends newly built ships but retains the pre-route garrison.
el('preset').value='flow';el('progression').value='custom';el('routePolicy').value='production';el('production').value='continuous';el('levelNumber').value='1';run('start();nodes[0].ships=40;nodes[0].rate=2;nodes[0].progress=0;order(0,2,true)');
for(let i=0;i<41;i++)run('tick(.05)');assert.ok(run('nodes[0].ships')>=40&&run('nodes[0].ships')<=41);assert.ok(run('fleets.filter(f=>f.owner===0).reduce((n,f)=>n+f.ships,0)')>=2);assert.ok(run('fleets.filter(f=>f.owner===0).reduce((n,f)=>n+f.ships,0)')<=5);
run('nodes[2].owner=0;order(2,0,true)');assert.equal(run('routes.some(r=>r.a===2&&r.b===0)'),false);
run('globalThis.flowCheckpoint=JSON.parse(JSON.stringify(snapshot()));restore(flowCheckpoint)');assert.equal(run('routes.some(r=>r.a===0&&r.b===2)'),true);
const code=run("LevelCode.encode('900719925474099312345','hard','flow','guided')");assert.equal(code,'GW1:900719925474099312345:hard:flow:guided');el('importLevelCode').value=code;el('applyLevelCode').onclick();assert.equal(el('levelNumber').value,'900719925474099312345');assert.equal(el('preset').value,'flow');assert.throws(()=>run("LevelCode.decode('GW1:0:hard:flow:guided')"));
assert.ok(!html.includes('id="saveButton"')&&!html.includes('id="loadButton"')&&!html.includes('id="exportButton"'));
console.log('Pointer-to-route, repeated dispatch, production-only, loop, restore and level-code checks passed');
// Route visualization contains a persistent directional arrow, including after capture.
vm.runInContext("$('preset').value='flow';$('difficulty').value='medium';$('levelNumber').value='1';start();config.movement='open';order(0,2,true);render()",graphicsContext);
assert.match(renderEl('routeOverlay').innerHTML,/class="route-line/);assert.match(renderEl('routeOverlay').innerHTML,/class="route-arrow/);
el('preset').value='flow';el('progression').value='guided';el('levelNumber').value='1';el('difficulty').value='easy';el('routePolicy').value='reserves';el('reserve').value='10';run('start();nodes[2].ships=1;order(0,2,true)');
for(let i=0;i<240;i++)run('tick(.05)');assert.equal(run('nodes[2].owner'),0);assert.equal(run('routes.some(r=>r.a===0&&r.b===2)'),true);assert.ok(run('nodes[2].ships')>1);
run('selected=0;$("clearRoutes").onclick()');assert.equal(run('routes.some(r=>r.a===0)'),false);
// Cancelled drags never issue a route and the preview is cleared.
run('start()');let src=run('pos(nodes[0])'),dst=run('pos(nodes[2])');el('space').listeners.pointerdown({clientX:src[0]+100,clientY:src[1]+40,pointerId:11,button:0});el('space').listeners.pointermove({clientX:dst[0]+100,clientY:dst[1]+40,pointerId:11});el('space').listeners.pointercancel({pointerId:11});assert.equal(el('dragLine').attributes.visibility,'hidden');assert.equal(run('routes.length'),0);
console.log('Route arrow rendering, capture/reinforcement and cancelled drag checks passed');
// Multiple routes share a production dispatch window, even when added at different times.
el('preset').value='flow';el('progression').value='custom';el('routePolicy').value='production';el('difficulty').value='easy';el('levelNumber').value='1';run('start();nodes[0].ships=40;nodes[0].rate=4;nodes[0].progress=0;order(0,2,true)');
for(let i=0;i<10;i++)run('tick(.05)');run('order(0,3,true)');for(let i=0;i<12;i++)run('tick(.05)');
let portions=Array.from(run('fleets.filter(f=>f.a===0).map(f=>f.ships)'));assert.equal(portions.length,2);assert.ok(Math.abs(portions[0]-portions[1])<=1);
// Unchanged route markup must not be replaced every animation frame.
let overlay=renderEl('routeOverlay'),markup=overlay.innerHTML,writes=0;Object.defineProperty(overlay,'innerHTML',{configurable:true,get(){return markup},set(v){writes++;markup=v}});vm.runInContext('render();render()',graphicsContext);assert.equal(writes,0);
el('importLevelCode').value='not a level code';el('applyLevelCode').onclick();assert.match(el('levelCodeFeedback').textContent,/Invalid level code/);
console.log('Split flow fairness, overlay caching and level-code feedback checks passed');
