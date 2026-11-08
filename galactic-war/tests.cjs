const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const elements={};function el(id){return elements[id]??={value:({production:'continuous',deployment:'manual',movement:'network',difficulty:'normal',objective:'conquest',types:'special',economy:'ships',fog:'off',combat:'instant',travel:'normal',capacity:'200',mapSize:'24',amount:'50'})[id]||'',style:{},addEventListener(){},showModal(){this.open=true},close(){this.open=false},getContext(){return null}}}
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
run("start();config.objective='survival';elapsed=300;checkEnd()");assert.equal(run('ended'),true);
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
for(const difficulty of ['easy','medium','hard','expert'])for(const production of ['continuous','batch','queue'])for(const deployment of ['manual','flow','hybrid'])for(const economy of ['ships','energy','local'])for(const combat of ['instant','attrition']){
 el('difficulty').value=difficulty;el('production').value=production;el('deployment').value=deployment;el('economy').value=economy;el('combat').value=combat;el('levelNumber').value='7';run('start()');
 run("config.interception='on';config.environment='hazards';config.routePolicy='waves';nodes[0].queue=100;config.movement='open';send(0,2,.5,0)");
 for(let i=0;i<100;i++)run('tick(.05)');
 assert.equal(run('nodes.every(p=>Number.isFinite(p.ships)&&p.ships>=0)'),true);
 run('restore(JSON.parse(JSON.stringify(snapshot())))');
}
assert.throws(()=>run('restore({...snapshot(),elapsed:-1})'));
assert.throws(()=>run("restore({...snapshot(),config:{...config,production:'corrupt'}})"));
console.log('216 rule-combination simulations and strict save checks passed');

const html=fs.readFileSync(__dirname+'/index.html','utf8');const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
for(const file of ['game.js','campaign.js','systems.js','playability.js'])for(const match of fs.readFileSync(__dirname+'/'+file,'utf8').matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),'Missing DOM element '+match[1]);
run("start();config.movement='open';config.travel='normal';$('fleetClass').value='fast';send(0,1,.25,0);globalThis.fastTime=fleets[0].duration;fleets=[];$('fleetClass').value='heavy';send(0,1,.25,0)");assert.ok(run('fleets[0].duration>fastTime'));
console.log('DOM wiring and fleet speed checks passed');
// Exercise rendering and all scripts with a WebGL API double, without a browser.
let drawCalls=0;const gpu=new Proxy({getShaderParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>({}),drawArrays:()=>drawCalls++,POINTS:0,LINES:1},{get:(o,k)=>k in o?o[k]:()=>{}});
const renderElements={};function renderEl(id){if(!renderElements[id])renderElements[id]={...el(id),clientWidth:1000,clientHeight:700,selectedOptions:[],getContext:()=>gpu};return renderElements[id]}
const graphicsContext={...ctx,document:{...ctx.document,getElementById:renderEl}};vm.createContext(graphicsContext);
for(const file of ['game.js','campaign.js','systems.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),graphicsContext);
vm.runInContext("$('levelNumber').value='4';$('difficulty').value='expert';start();config.movement='open';send(0,1,.5,0);render()",graphicsContext);assert.ok(drawCalls>0);
run("$('levelNumber').value='17';$('difficulty').value='medium';start();globalThis.retryMap=JSON.stringify(nodes);$('restartLevel').onclick()");assert.equal(run('JSON.stringify(nodes)'),run('retryMap'));
run("ended=true;campaignResult='Defeat';globalThis.beforeLevel=config.level;$('nextLevel').onclick()");assert.equal(run('config.level'),run('beforeLevel'));
console.log('Rendering code paths, retry reproducibility and defeat progression checks passed');

vm.runInContext(fs.readFileSync(__dirname+'/playability.js','utf8'),ctx);
el('progression').value='guided';el('levelNumber').value='1';run('start()');
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
