'use strict';
const Lessons=[
  [1,'Launch and capture','Select your blue planet. Drag to a neutral planet to send half your ships. Click empty space or press Escape to cancel selection.'],
  [2,'Reinforce and switch','Click a friendly planet to switch sources. To reinforce another friendly planet, drag to it or turn on target mode, then tap it.'],
  [3,'Invest in production','Production upgrades cost ships. Keep a defending garrison before you invest.'],
  [4,'Industrial planets','The hexagonal planet produces ships faster, but has ordinary defenses.'],
  [5,'Automate reinforcements','Persistent routes send ships above your reserve. Try Flow Network in match setup when ready.'],
  [6,'Fortress planets','The square bastions mark a fortress: slower production, stronger defenders. Fortifications and siege fleets are now available.'],
  [7,'Shield timing','A shield briefly improves defense. It costs ships, so use it when an attack is approaching.'],
  [8,'Relay planets','The orbital-ring symbol marks a relay. Relay-to-relay wormholes are available in custom matches.'],
  [9,'Faster fleets','Interceptors travel faster; heavy ships attack harder. Engine research increases fleet speed.'],
  [10,'Explore other rules','All command tools are available. Custom setup lets you experiment with queues, fog, supply, hazards and interception.']
];
function lessonFor(level){let n=BigInt(level||'1');return Lessons.filter(l=>BigInt(l[0])<=n).at(-1)}
const playableStart=start;
start=function(){let result=playableStart();if(result===false)return false;pointer=null;clearDragPreview();targeting=false;config.progression=$('progression').value||'guided';if(config.progression==='guided'){
  const n=BigInt(config.level),allowed=n<4n?['colony']:n<6n?['colony','industrial']:n<8n?['colony','industrial','fortress']:['colony','industrial','fortress','relay'];
  // Deterministic pair assignment guarantees the new type appears in its introduction.
  for(let i=2;i<nodes.length;i+=2){let kind=allowed[((i-2)/2)%allowed.length];if(i===2)kind=allowed.at(-1);nodes[i].kind=nodes[i+1].kind=kind}
  config.scenario='skirmish';config.objective='conquest';config.production='continuous';config.movement='open';config.economy='ships';config.fog='off';config.combat='instant';config.environment='none';config.interception='off';config.travel='normal';config.routePolicy='reserves';config.deployment=$('preset').value==='flow'?'flow':'manual';
  // Scenario modifications from custom setup must not leak into a guided level.
  nodes.forEach(p=>{if(p.capital){p.ships=40;p.rate=1.5}else p.rate=1});
  $('fleetClass').value='basic';$('exactCount').value='0';$('amount').value='50';$('amountLabel').textContent='50%';
}applyLearningUI();updatePanel();return true};
function applyLearningUI(){let guided=config.progression==='guided',n=BigInt(config.level||'1');const unlocks={upgrade:3,clearRoutes:5,fortify:6,ability:7,research:9,scan:10,queue:10,redirect:10,groupSend:10};
  for(const [id,level] of Object.entries(unlocks)){$(id).hidden=guided&&n<BigInt(level)}
  for(const [id,level] of [['fleetClass',6],['exactCount',3],['reserve',5],['groupSources',10],['fleetSelect',10]]){const element=$(id);element.disabled=guided&&n<BigInt(level);if(element.parentElement)element.parentElement.hidden=guided&&n<BigInt(level)}
  // Guided rules do not use route, queue, scan or redirection tools.
  if(guided){for(const id of ['queue','scan','redirect'])$(id).hidden=true; $('clearRoutes').hidden=config.deployment!=='flow'; if($('reserve').parentElement)$('reserve').parentElement.hidden=config.deployment!=='flow'; $('reserve').disabled=config.deployment!=='flow'}
  const lesson=lessonFor(config.level);$('lesson').textContent=guided?(config.deployment==='flow'&&n<=2n?'Flow Network — Drag from a blue planet to a destination to draw a persistent arrow. Ships above the reserve launch automatically. Drag along the same route again to remove it.':`${lesson[1]} — ${lesson[2]}`):'Custom match: all mechanics enabled.';
  const available=[...new Set(nodes.map(p=>p.kind))];$('typeLegend').innerHTML=available.map(kind=>`<span class="legend-item">${planetGlyph(kind)}<span>${kind}</span></span>`).join('');
}
$('deselect').onclick=()=>activatePlanet(-1);
$('targetMode').onclick=()=>{if(selected<0||nodes[selected]?.owner!==0){notice('Select a friendly source first.');return}targeting=!targeting;updatePanel()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))activatePlanet(-1)});
const learningPanel=updatePanel;
updatePanel=function(){learningPanel();$('targetMode').textContent=targeting?'Target mode on · tap destination':'Choose reinforcement target';$('targetMode').disabled=selected<0||nodes[selected]?.owner!==0||ended;$('deselect').disabled=selected<0;};
const learningRestore=restore;
restore=function(data){learningRestore(data);targeting=false;$('progression').value=config.progression||'custom';applyLearningUI();updatePanel()};
// Hidden buttons are also guarded so keyboard/programmatic actions obey lesson unlocks.
for(const [id,level] of Object.entries({upgrade:3,fortify:6,ability:7,research:9,scan:10,queue:10,redirect:10,groupSend:10})){const action=$(id).onclick;$(id).onclick=function(...args){if(config.progression==='guided'&&BigInt(config.level)<BigInt(level)){notice(`Introduced at level ${level}.`);return}return action.apply(this,args)}}

const learningAI=ai;
ai=function(){if(config.progression==='guided'){const level=BigInt(config.level);if(level<=3n){let base=level===1n?15:level===2n?10:5;let extra=config.difficulty==='easy'?10:config.difficulty==='medium'?5:config.difficulty==='hard'?2:0;if(elapsed<base+extra)return}}return learningAI()};
