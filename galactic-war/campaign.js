'use strict';
// Versioned deterministic campaign. Level IDs remain decimal strings, never floats.
const Campaign = (() => {
  const difficulties = {easy:{reaction:60,reserve:12,commit:.4,maxOrders:1},medium:{reaction:12,reserve:15,commit:.6,maxOrders:1},hard:{reaction:2,reserve:12,commit:.75,maxOrders:3},expert:{reaction:.8,reserve:8,commit:.85,maxOrders:Infinity}};
  function level(value){if(!/^[1-9][0-9]*$/.test(String(value)))throw Error('Level must be a positive whole number.');return String(value)}
  function seed(value,salt=0){let n=2166136261;for(const ch of level(value)+':'+salt)n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n}
  function specification(value,difficulty){value=level(value);if(!difficulties[difficulty])throw Error('Unknown difficulty');let n=BigInt(value),phase=Number((n-1n)%12n),tier=Math.min(8,Number((n-1n)/12n>8n?8n:(n-1n)/12n));return {level:value,seed:seed(value),phase,tier,count:n===1n?6:n===2n?8:n===3n?10:n<8n?12:n<16n?18:18+6*(phase%2),strength:1+tier*.025}}
  function map(spec){let random=rand(spec.seed),out=[];out.push({x:-.78,y:0},{x:.78,y:0});let pairs=(spec.count-2)/2;for(let i=0;i<pairs;i++){let column=i%3,row=Math.floor(i/3),rows=Math.ceil(pairs/3);let x=.18+column*.24,y=rows===1?(i%2===0?.23:-.23):(row-(rows-1)/2)*.32+(column%2===0?.025:-.025);y+=(random()-.5)*.035;out.push({x:-x,y},{x,y:-y})}return out}
  return {level,seed,specification,map,difficulties};
})();
let campaignResult='', matchStats={launched:0,captured:0,upgrades:0}, tech=[0,0];
const originalStart=start;
start=function(){
  let level;
  try{level=Campaign.level($('levelNumber').value||'1')}catch(e){notice(e.message);return false}
  $('deployment').value=$('preset').value==='flow'?'flow':'manual';
  let difficulty=$('difficulty').value==='normal'?'medium':$('difficulty').value;
  if(!Campaign.difficulties[difficulty])difficulty='medium';
  const spec=Campaign.specification(level,difficulty);
  $('mapSize').value=String(spec.count);$('seed').value=String(spec.seed);
  originalStart();config.level=level;config.generatorVersion=3;config.difficulty=difficulty;config.aiRandomState=(spec.seed^0x91e10da5)>>>0;
  const positions=Campaign.map(spec);
  nodes.forEach((p,i)=>{p.x=positions[i].x;p.y=positions[i].y;p.links=[];p.explored=p.owner===0;p.cooldown=0;p.resource=30;
    if(i>=2&&i%2===1){let pair=nodes[i-1];p.kind=pair.kind;p.ships=pair.ships;p.rate=pair.rate}
  });
  // Rebuild graph after laying out mirrored starting opportunities.
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(Math.hypot(nodes[i].x-nodes[j].x,nodes[i].y-nodes[j].y)<=.65){nodes[i].links.push(j);nodes[j].links.push(i)}
  const seen=new Set([0]),queue=[0];while(queue.length)for(const j of nodes[queue.shift()].links)if(!seen.has(j)){seen.add(j);queue.push(j)}
  if(seen.size!==nodes.length)throw Error('Generated map is disconnected');
  campaignResult='';matchStats={launched:0,captured:0,upgrades:0};tech=[0,0];$('nextLevel').disabled=true;updatePanel();return true;
};
const originalSend=send;
send=function(a,b,fraction,owner){if(ended||!Number.isFinite(fraction)||fraction<=0||fraction>1)return false;let before=fleets.length,result=originalSend(a,b,fraction,owner);if(result&&fleets.length>before){let f=fleets[fleets.length-1];f.ships=Math.max(1,f.ships);if(owner===0)matchStats.launched+=f.ships;}return result};
const originalCombat=resolveCombat;
resolveCombat=function(index,owner,ships,shipClass){const old=nodes[index].owner;originalCombat(index,owner,ships,shipClass);if(old!==nodes[index].owner&&owner===0)matchStats.captured++};
const originalEnd=checkEnd;
checkEnd=function(){let was=ended;originalEnd();if(!was&&ended){campaignResult=$('message').textContent;let won=campaignResult.startsWith('Victory');$('nextLevel').disabled=!won;
  if(won){try{let key='galactic-war-campaign-'+config.difficulty;let old=localStorage.getItem(key)||'1';let next=(BigInt(config.level||'1')+1n).toString();if(BigInt(next)>BigInt(old))localStorage.setItem(key,next)}catch(e){/* Device storage can be disabled. */}}
  notice(campaignResult+` Ships launched: ${matchStats.launched}. Captures: ${matchStats.captured}.`,true);
}};
const originalPanel=updatePanel;
updatePanel=function(){originalPanel();if(config.level)$('score').textContent=`Level ${config.level} · ${config.difficulty} · `+$('score').textContent};
$('restartLevel').onclick=()=>{if(!config.level)return;const keep={...config};for(const [key,value] of Object.entries(keep))if($(key)&&'value' in $(key))$(key).value=String(value);$('levelNumber').value=keep.level;start()};
$('nextLevel').onclick=()=>{if(!ended||!campaignResult.startsWith('Victory'))return;let next=(BigInt(config.level)+1n).toString();$('levelNumber').value=next;start()};
const originalSnapshot=snapshot;
snapshot=function(){return {...originalSnapshot(),campaignResult,matchStats,tech}};
const originalRestore=restore;
restore=function(data){if(data.config?.level)Campaign.level(data.config.level);if(data.config?.difficulty&&!Campaign.difficulties[data.config.difficulty]&&data.config.difficulty!=='normal')throw Error('Unknown difficulty');originalRestore(data);campaignResult=typeof data.campaignResult==='string'?data.campaignResult:'';matchStats=data.matchStats||{launched:0,captured:0,upgrades:0};tech=data.tech||[0,0];$('levelNumber').value=config.level||'1';$('nextLevel').disabled=!(ended&&campaignResult.startsWith('Victory'))};

// Separate, reproducible decision styles keep Easy and Medium genuinely simple.
function aiRandom(){config.aiRandomState=(Math.imul(config.aiRandomState||1,1664525)+1013904223)>>>0;return config.aiRandomState/4294967296}
function simpleAI(difficulty,settings){
  let sources=nodes.map((p,i)=>({p,i})).filter(v=>v.p.owner===1&&v.p.ships>settings.reserve+3&&nodes.some((q,j)=>q.owner!==1&&canSend(v.i,j)));
  if(!sources.length)return;
  let source=sources[Math.floor(aiRandom()*sources.length)];
  let targets=nodes.map((p,i)=>({p,i,d:Math.hypot(p.x-source.p.x,p.y-source.p.y)})).filter(v=>v.p.owner!==1&&canSend(source.i,v.i));
  if(!targets.length)return;
  let target;
  if(difficulty==='easy'&&aiRandom()<.75)target=targets[Math.floor(aiRandom()*targets.length)];
  else {const estimate=v=>config.fog==='off'||config.fog==='on'&&v.p.owner===2||nodes.some(p=>p.owner===1&&Math.hypot(p.x-v.p.x,p.y-v.p.y)<.5)?v.p.ships:20;targets.sort((a,b)=>(estimate(a)+a.d*10)-(estimate(b)+b.d*10));target=targets[0]}
  // Medium checks whether its small fleet can beat what it can see; Easy can make mistakes.
  if(difficulty==='medium'&&config.fog==='off'&&Math.floor(source.p.ships*settings.commit)<=target.p.ships)return;
  // One fleet per decision, even in Flow Network, avoids an endlessly aggressive automatic route.
  send(source.i,target.i,settings.commit,1);
}
ai=function(){const settings=Campaign.difficulties[config.difficulty]||Campaign.difficulties.medium;
  if(config.difficulty==='easy'||config.difficulty==='medium'){simpleAI(config.difficulty,settings);return}
  let orders=0;for(let i=0;i<nodes.length;i++){const p=nodes[i];if(p.owner!==1||orders>=settings.maxOrders)continue;
    const danger=fleets.filter(f=>f.b===i&&f.owner===0).reduce((n,f)=>n+f.ships,0);
    if((config.progression!=='guided'||BigInt(config.level)>=7n)&&danger>p.ships&&p.ships>=15&&p.shield<=0&&config.difficulty!=='easy'){p.ships-=15;p.shield=20}
    if((config.progression!=='guided'||BigInt(config.level)>=3n)&&config.difficulty==='expert'&&p.ships>70&&p.level<4){p.ships-=20;p.rate+=.5;p.level++}
    if(p.ships<=settings.reserve+8)continue;
    let targets=nodes.map((q,j)=>({q,j,d:Math.hypot(p.x-q.x,p.y-q.y)})).filter(t=>t.q.owner!==1&&canSend(i,t.j));
    const visible=t=>config.fog==='off'||config.fog==='on'&&t.q.owner!==0||nodes.some(q=>q.owner===1&&Math.hypot(q.x-t.q.x,q.y-t.q.y)<.5);
    const estimate=t=>visible(t)?t.q.ships:20;
    targets.sort((a,b)=>(estimate(a)+a.d*12-a.q.rate*5)-(estimate(b)+b.d*12-b.q.rate*5));
    let t=targets[0];let amount=Math.floor(p.ships*settings.commit);
    if(t&&amount>estimate(t)+t.d*t.q.rate*8){if(config.deployment==='flow'||config.deployment==='hybrid'){let current=routes.find(r=>r.a===i&&r.owner===1);if(!current||current.b!==t.j){routes=routes.filter(r=>r.a!==i);p.flowProductionCheckpoint=p.produced||0;routes.push({a:i,b:t.j,owner:1,clock:0,reserve:settings.reserve});orders++}}else if(send(i,t.j,settings.commit,1))orders++}
    else if(config.difficulty!=='easy'){let front=nodes.map((q,j)=>({q,j})).filter(t=>t.q.owner===1&&t.j!==i&&canSend(i,t.j)).sort((a,b)=>Math.abs(a.q.x+.78)-Math.abs(b.q.x+.78))[0];if(front&&front.q.x<p.x&&send(i,front.j,.5,1))orders++}
  }
};
