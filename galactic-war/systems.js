'use strict';
let scanUntil=0;
const systemsStart=start;
start=function(){if(systemsStart()===false)return false;config.environment=$('environment').value||'none';config.interception=$('interception').value||'off';config.routePolicy=$('routePolicy').value||'reserves';scanUntil=0;nodes.forEach(p=>p.lastShips=p.ships);return true};
const systemsSend=send;
send=function(a,b,fraction,owner){let result=systemsSend(a,b,fraction,owner);if(result){let f=fleets[fleets.length-1];f.duration/=1+(tech[owner]||0)*.1;if(config.environment==='wormholes'&&nodes[a].kind==='relay'&&nodes[b].kind==='relay')f.duration*=.3;}return result};
function fleetPosition(f){let a=f.origin||nodes[f.a],b=nodes[f.b];return {x:a.x+(b.x-a.x)*f.t,y:a.y+(b.y-a.y)*f.t}}
const systemsTick=tick;
tick=function(dt){
  if(ended)return;
  const productionBefore=nodes.map(p=>p.ships),savedReserves=routes.map(r=>r.reserve),oldClocks=routes.map(r=>r.clock);
  if(config.routePolicy==='production')routes.forEach(r=>r.reserve=Math.max(r.reserve||0,nodes[r.a].ships));
  if(config.routePolicy==='waves')routes.forEach(r=>{if((r.waveClock=(r.waveClock||0)+dt)<5)r.clock=-1;else{r.clock=1;r.waveClock=0}});
  systemsTick(dt);
  routes.forEach((r,i)=>{if(config.routePolicy==='production'&&savedReserves[i]!==undefined)r.reserve=savedReserves[i]});
  if(config.environment==='hazards')for(const f of fleets){let p=fleetPosition(f);if(Math.abs(p.x)<.13&&Math.abs(p.y)<.45){f.hazard=(f.hazard||0)+dt*.5;let loss=Math.floor(f.hazard);f.ships=Math.max(0,f.ships-loss);f.hazard-=loss}}
  fleets=fleets.filter(f=>f.ships>0);
  if(config.interception==='on'&&config.travel!=='instant'){
    for(let i=0;i<fleets.length;i++)for(let j=i+1;j<fleets.length;j++){let a=fleets[i],b=fleets[j];if(a.owner===b.owner||a.ships<=0||b.ships<=0)continue;let p=fleetPosition(a),q=fleetPosition(b);if(Math.hypot(p.x-q.x,p.y-q.y)<.045){let loss=Math.min(a.ships,b.ships);a.ships-=loss;b.ships-=loss}}
    fleets=fleets.filter(f=>f.ships>0);
  }
};
$('research').onclick=()=>{let p=nodes[selected];if(!p||p.owner!==0||p.ships<30){notice('Select a friendly planet with 30 ships.');return}if(tech[0]>=5){notice('Engine research complete.');return}p.ships-=30;tech[0]++;notice(`Engine technology ${tech[0]} / 5.`)};
$('scan').onclick=()=>{let p=nodes[selected];if(!p||p.owner!==0||p.ships<10){notice('Select a friendly planet with 10 ships.');return}p.ships-=10;nodes.forEach(p=>p.explored=true);notice('Galaxy chart updated.')};
$('redirect').onclick=()=>{let f=fleets[Number($('fleetSelect').value)],target=selected;if(!f||f.owner!==0||!nodes[target]){notice('Select your fleet and a destination.');return}let here=fleetPosition(f);if(config.movement==='network'){notice('Hyperlane fleets must finish their current journey.');return}if(config.movement==='range'&&Math.hypot(here.x-nodes[target].x,here.y-nodes[target].y)>.65){notice('Destination is out of range.');return}f.origin=here;f.b=target;f.t=0;f.duration=Math.max(.1,Math.hypot(here.x-nodes[target].x,here.y-nodes[target].y)*12);notice('Fleet redirected.')};
const systemsPanel=updatePanel;
updatePanel=function(){systemsPanel();let options=fleets.map((f,i)=>f.owner===0?`<option value="${i}">${f.ships} ships → P-${f.b+1}</option>`:'').join('');if($('fleetSelect').innerHTML!==options)$('fleetSelect').innerHTML=options};
// Preserve the actual departure point when redirecting in both rendering and saves.
const systemsPos=pos;
const systemsRender=render;
render=function(){systemsRender();if(!gl||config.environment!=='hazards')return;let a=pos({x:0,y:-.45}),b=pos({x:0,y:.45});draw([...a,...b],[.55,.28,.1],1,0,gl.LINES)};

const validatedRestore=restore;
restore=function(input){
  const data=JSON.parse(JSON.stringify(input));
  const finite=(n,min=0,max=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  if(!data||!data.config||!Array.isArray(data.nodes)||!finite(data.elapsed)||!finite(data.aiClock)||!Number.isInteger(data.selected)||data.selected< -1||data.selected>=data.nodes.length)throw Error('Invalid match header');
  const choices={production:['continuous','batch','queue'],deployment:['manual','flow','hybrid'],movement:['open','range','network'],objective:['capital','conquest','timed','survival'],economy:['ships','energy','local'],combat:['instant','attrition'],fog:['off','on','explored'],travel:['normal','fast','instant']};
  for(const [key,values] of Object.entries(choices))if(!values.includes(data.config[key]))throw Error('Invalid rule: '+key);
  if(!finite(data.config.capacity,1,10000))throw Error('Invalid capacity');
  for(const p of data.nodes){if(![0,1,2].includes(p.owner)||!finite(p.ships)||!Number.isInteger(p.ships)||!finite(p.rate,0,1000)||!finite(p.progress)||!finite(p.level,1,100)||!finite(p.x,-2,2)||!finite(p.y,-2,2)||typeof p.kind!=='string'||!['capital','colony','industrial','fortress','relay'].includes(p.kind))throw Error('Invalid planet');}
  if(!Array.isArray(data.energy)||!data.energy.every(n=>finite(n)))throw Error('Invalid energy');
  for(const f of data.fleets||[])if(!finite(f.duration,.001)||!finite(f.t,0,2)||!finite(f.ships,1)||![0,1].includes(f.owner)||f.origin&&(!finite(f.origin.x,-2,2)||!finite(f.origin.y,-2,2)))throw Error('Invalid fleet');
  for(const r of data.routes||[])if(!finite(r.clock,-10)||![0,1].includes(r.owner)||r.reserve!==undefined&&!finite(r.reserve))throw Error('Invalid route');
  validatedRestore(data);
};

const exactSend=send;
send=function(a,b,fraction,owner){const exact=Number($('exactCount').value);if(owner===0&&exact>0&&nodes[a]?.ships>0)fraction=Math.min(1,Math.floor(exact)/nodes[a].ships);return exactSend(a,b,fraction,owner)};
$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.().catch(()=>notice('Full screen is unavailable.'))};
const preferenceKeys=['production','deployment','movement','difficulty','objective','types','economy','fog','combat','travel','capacity','scenario','environment','interception','routePolicy','graphics','motion'];
$('favoriteSave').onclick=()=>{try{localStorage.setItem('galactic-war-preferences',JSON.stringify(Object.fromEntries(preferenceKeys.map(key=>[key,$(key).value]))));notice('Setup preferences saved.')}catch(e){notice('Device storage unavailable.')}};
$('favoriteLoad').onclick=()=>{try{const data=JSON.parse(localStorage.getItem('galactic-war-preferences'));if(!data)throw Error();for(const key of preferenceKeys)if(typeof data[key]==='string')$(key).value=data[key];notice('Preferences loaded. Start a new match to apply rules.')}catch(e){notice('No saved preferences found.')}};
const syncRestore=restore;
restore=function(data){syncRestore(data);for(const key of preferenceKeys)if(config[key]!==undefined)$(key).value=String(config[key])};
const systemsOrder=order;
order=function(a,b,drag){if(ended)return;if(config.deployment==='flow'||config.deployment==='hybrid'&&drag){let visited=new Set(),queue=[b];while(queue.length){let at=queue.shift();if(at===a){notice('This route would create a reinforcement loop.');return}if(visited.has(at))continue;visited.add(at);for(const r of routes)if(r.a===at&&r.owner===0)queue.push(r.b)}}return systemsOrder(a,b,drag)};
for(const key of ['upgrade','fortify','ability','queue','research','scan','redirect','groupSend','clearRoutes']){const handler=$(key).onclick;$(key).onclick=function(...args){if(ended){notice('Match complete. Retry or advance to the next level.');return}return handler.apply(this,args)}}
