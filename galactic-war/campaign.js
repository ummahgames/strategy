'use strict';
// Versioned deterministic campaign. Level IDs remain decimal strings, never floats.
const Campaign = (() => {
  const difficulties = {easy:{reaction:4,reserve:16,commit:.6},medium:{reaction:2.5,reserve:12,commit:.7},hard:{reaction:1.5,reserve:10,commit:.8},expert:{reaction:.8,reserve:8,commit:.85}};
  function level(value){if(!/^[1-9][0-9]*$/.test(String(value)))throw Error('Level must be a positive whole number.');return String(value)}
  function seed(value,salt=0){let n=2166136261;for(const ch of level(value)+':'+salt)n=Math.imul(n^ch.charCodeAt(0),16777619)>>>0;return n}
  function specification(value,difficulty){value=level(value);if(!difficulties[difficulty])throw Error('Unknown difficulty');let n=BigInt(value),phase=Number((n-1n)%12n),tier=Math.min(8,Number((n-1n)/12n>8n?8n:(n-1n)/12n));return {level:value,seed:seed(value),phase,tier,count:12+6*Math.min(2,Math.floor(phase/4)),strength:1+tier*.025}}
  function map(spec){let random=rand(spec.seed),out=[];out.push({x:-.78,y:0},{x:.78,y:0});let pairs=(spec.count-2)/2;for(let i=0;i<pairs;i++){let column=i%3,row=Math.floor(i/3),rows=Math.ceil(pairs/3);let x=.18+column*.24,y=(row-(rows-1)/2)*.32+(random()-.5)*.035;out.push({x:-x,y},{x,y:-y})}return out}
  return {level,seed,specification,map,difficulties};
})();
let campaignResult='', matchStats={launched:0,captured:0,upgrades:0}, tech=[0,0];
const originalStart=start;
start=function(){
  let level;
  try{level=Campaign.level($('levelNumber').value||'1')}catch(e){notice(e.message);return false}
  let difficulty=$('difficulty').value==='normal'?'medium':$('difficulty').value;
  if(!Campaign.difficulties[difficulty])difficulty='medium';
  const spec=Campaign.specification(level,difficulty);
  $('mapSize').value=String(spec.count);$('seed').value=String(spec.seed);
  originalStart();config.level=level;config.generatorVersion=1;config.difficulty=difficulty;
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

// Difficulty changes decisions rather than hidden production bonuses.
ai=function(){const settings=Campaign.difficulties[config.difficulty]||Campaign.difficulties.medium;
  for(let i=0;i<nodes.length;i++){const p=nodes[i];if(p.owner!==1)continue;
    const danger=fleets.filter(f=>f.b===i&&f.owner===0).reduce((n,f)=>n+f.ships,0);
    if(danger>p.ships&&p.ships>=15&&p.shield<=0&&config.difficulty!=='easy'){p.ships-=15;p.shield=20}
    if(config.difficulty==='expert'&&p.ships>70&&p.level<4){p.ships-=20;p.rate+=.5;p.level++}
    if(p.ships<=settings.reserve+8)continue;
    let targets=nodes.map((q,j)=>({q,j,d:Math.hypot(p.x-q.x,p.y-q.y)})).filter(t=>t.q.owner!==1&&canSend(i,t.j));
    const visible=t=>config.fog==='off'||config.fog==='on'&&t.q.owner!==0||nodes.some(q=>q.owner===1&&Math.hypot(q.x-t.q.x,q.y-t.q.y)<.5);
    const estimate=t=>visible(t)?t.q.ships:20;
    targets.sort((a,b)=>(estimate(a)+a.d*12-a.q.rate*5)-(estimate(b)+b.d*12-b.q.rate*5));
    let t=targets[0];let amount=Math.floor(p.ships*settings.commit);
    if(t&&amount>estimate(t)+t.d*t.q.rate*8){if(config.deployment==='flow'||config.deployment==='hybrid'){routes=routes.filter(r=>r.a!==i);routes.push({a:i,b:t.j,owner:1,clock:0,reserve:settings.reserve})}else send(i,t.j,settings.commit,1)}
    else if(config.difficulty!=='easy'){let front=nodes.map((q,j)=>({q,j})).filter(t=>t.q.owner===1&&t.j!==i&&canSend(i,t.j)).sort((a,b)=>Math.abs(a.q.x+.78)-Math.abs(b.q.x+.78))[0];if(front&&front.q.x<p.x)send(i,front.j,.5,1)}
  }
};
