(function(root){
'use strict';
const E=root.EmberEngine;
const {sprite,drawMap,drawCamp}=root.EmberArt;
const {readCompany,writeCompany}=root.EmberPersistence;
const {timing,sampleMovement,attackKind,timelineStep}=root.EmberAnimations;
const $=id=>document.getElementById(id);
let storage;try{storage=window.localStorage;}catch{}
let battleCheckpoint,sceneId=0,pendingAnimation;
let pace='deliberate';try{pace=storage?.getItem('ember-company-pace')||pace;}catch{}
if(!['deliberate','standard','quick'].includes(pace))pace='deliberate';
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const timings=()=>timing(pace);
let c,ui={action:'move',grid:true,hover:null,origin:null,cursor:{x:1,y:7}},busy=false,enemyTimer,toastTimer,audioCtx,sound=false;
c=readCompany(storage)||E.startBattle(E.createCampaign());checkpoint();
const ctx=$('board').getContext('2d');ctx.imageSmoothingEnabled=false;
function save(){$('save-state').textContent=writeCompany(storage,c)?'COMPANY SAVED LOCALLY':'SAVING UNAVAILABLE · SESSION ONLY';}
function checkpoint(){if(c.mode==='battle')battleCheckpoint=JSON.parse(JSON.stringify(c));}
function tone(kind='select'){if(!sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(kind==='hit'?190:kind==='win'?660:440,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='hit'?80:880,audioCtx.currentTime+.1);g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.16);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.17);}catch{}}
function toast(s){$('notice').textContent=s;$('notice').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('notice').classList.remove('show');$('notice').textContent='';},2600);}
function iconCanvas(u,size=48){const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;sprite(g,u,0,0,size/16);return cv;}
function bars(h){return `<div class="vitals"><div><span>HP</span><div class="meter"><i style="width:${h.hp/h.maxHp*100}%"></i></div><b>${h.hp} / ${h.maxHp}</b></div><div><span>MP</span><div class="meter mana"><i style="width:${h.maxMp?h.mp/h.maxMp*100:0}%"></i></div><b>${h.mp} / ${h.maxMp}</b></div></div>`;}
function render(){const spec=E.MAPS[c.battle%8],u=ui.actorId?c.units.find(v=>v.id===ui.actorId):E.active(c),allies=c.units.filter(v=>v.side==='ally'&&E.alive(v)),enemies=c.units.filter(v=>v.side==='enemy'&&E.alive(v));$('region').textContent=spec.region+(c.battle>=8?' · EXPEDITION '+(Math.floor(c.battle/8)+1):'');$('map-name').textContent=spec.name;$('map-description').textContent=spec.desc;$('encounter').innerHTML=String(c.battle+1).padStart(2,'0')+' <i>/ ∞</i>';$('gold').innerHTML=c.gold+' <i>G</i>';$('potions').innerHTML=String(c.potions).padStart(2,'0')+' <i>tonics</i>';$('round').textContent='ROUND '+String(c.round).padStart(2,'0');$('turn-label').textContent=ui.animating?'ACTION IN PROGRESS':c.mode==='battle'?(u?.side==='ally'?'YOUR TURN':'ENEMY TURN'):c.mode.toUpperCase();$('remaining').textContent=`${allies.length} allies · ${enemies.length} enemies`;$('map-badge').textContent=spec.region+' · FIELD '+String(c.battle+1).padStart(3,'0');$('objective').textContent=c.battle%8===7?'DEFEAT THE WARLORD & GUARD':'DEFEAT ALL ENEMIES';
$('queue').replaceChildren();const ids=(ui.animating&&ui.queue?ui.queue:[...c.queue.slice(c.turn),...E.order(c)]).filter(id=>E.alive(c.units.find(v=>v.id===id))).slice(0,12);ids.forEach((id,i)=>{const v=c.units.find(v=>v.id===id),el=document.createElement('div');el.className='queue-chip '+(v.side==='enemy'?'enemy ':'')+(!i?'current':'');el.title=`${v.name} · ${v.side} · speed ${v.speed}`;el.append(iconCanvas(v));const n=document.createElement('small');n.textContent=i+1;el.append(n);$('queue').append(el);});
if(u){$('portrait').getContext('2d').clearRect(0,0,80,80);sprite($('portrait').getContext('2d'),u,0,0,5);$('unit-name').textContent=u.name;$('unit-role').textContent=`${u.role} · Level ${u.level}`;$('unit-number').textContent=u.side==='ally'?String(c.heroes.findIndex(h=>h.id===u.id)+1).padStart(2,'0')+' / 06':'HOSTILE';$('team-badge').textContent=u.side==='ally'?'ALLY':'FOE';$('hp-bar').style.width=u.hp/u.maxHp*100+'%';$('mp-bar').style.width=(u.maxMp?u.mp/u.maxMp*100:0)+'%';$('hp-value').textContent=`${u.hp} / ${u.maxHp}`;$('mp-value').textContent=`${u.mp} / ${u.maxMp}`;$('attributes').innerHTML=[['ATK',u.atk],['DEF',u.def],['MOV',u.move],['RNG',u.range]].map(([k,v])=>`<div><small>${k}</small><b>${v}</b></div>`).join('');$('weapon').textContent=(u.weapon||u.name+' arms')+(u.tier?' +'+u.tier:'');$('move-label').textContent=c.moved?'Movement used':'Move, then act';
const can=c.mode==='battle'&&u.side==='ally'&&!busy;$('commands').innerHTML=[['move','↟','Move',c.moved?'Already moved':u.move+' movement'],['attack','⚔','Attack','Range '+u.range],['skill','✧',u.skill||'Skill',(u.cost||0)+' MP'],['guard','◈','Guard','+3 DEF · +1 MP'],['potion','♜','Tonic',c.potions+' left · +22 HP'],['undo','↶','Undo move','Before acting']].map(([a,icon,label,sub])=>`<button class="command ${ui.action===a?'selected':''}" data-action="${a}" ${!can||(a==='move'&&c.moved)||(a==='undo'&&!ui.origin)||(a==='skill'&&u.mp<u.cost)||(a==='potion'&&(!c.potions||u.hp===u.maxHp))?'disabled':''}><span>${icon}</span><div><b>${label}</b><small>${sub}</small></div></button>`).join('');$('commands').querySelectorAll('button').forEach(b=>b.onclick=()=>command(b.dataset.action));$('action-hint').textContent=!can?(ui.animating?(ui.animationLabel||'Action in progress…'):c.mode==='battle'?'The enemy is considering its next move…':'The encounter has ended.'):ui.action==='skill'?(u.id==='sana'?`Restore ${E.healingPower(u)} HP to an ally. Range 3.`:u.desc):ui.action==='attack'?'Select a highlighted enemy. An attack ends this turn.':c.moved?'Choose an attack, skill, tonic, or guard to end your turn.':'Select a blue tile to move. You can also act without moving.';}
$('log').replaceChildren(...c.log.slice(0,5).map(s=>{const p=document.createElement('p');p.textContent=s;return p;}));$('company').replaceChildren(...c.heroes.map(h=>{const v=c.units.find(v=>v.id===h.id)||h,el=document.createElement('button');el.className='hero-card '+(u?.id===h.id?'active ':'')+(!v.hp?'fallen':'');el.title=`Inspect ${h.name}`;el.append(iconCanvas(v));const div=document.createElement('div');div.innerHTML=`<b>${h.name}</b><small>${h.role}</small><div class="meter"><i style="width:${v.hp/v.maxHp*100}%"></i></div>`;el.append(div);const level=document.createElement('span');level.className='level';level.textContent='LV '+h.level;el.append(level);el.onclick=()=>inspect(v);return el;}));$('restart').disabled=Boolean(ui.animating);$('new-game').disabled=Boolean(ui.animating);save();updateTileInfo();draw();}
function draw(time=performance.now()){drawMap(ctx,c,ui,time);}
function command(a){const u=E.active(c);if(busy||u?.side!=='ally'||c.mode!=='battle')return;if(a==='undo'){if(ui.origin){u.x=ui.origin.x;u.y=ui.origin.y;c.moved=false;ui.origin=null;ui.action='move';ui.cursor={x:u.x,y:u.y};ui.hover={...ui.cursor};render();toast('Movement undone.');}return;}if(['guard','potion'].includes(a)){perform(a,u.id);return;}ui.action=a;tone();if(a==='skill'&&u.id==='bram'){toast('Select Bram to rally nearby allies.');}render();$('board').focus({preventScroll:true});}
function showChanges(before){ui.effects=c.units.filter(v=>v.hp!==before.get(v.id)).map(v=>({x:v.x,y:v.y,value:v.hp-before.get(v.id),until:performance.now()+1200}));if(ui.effects.length)toast(c.units.filter(v=>v.hp!==before.get(v.id)).map(v=>`${v.name} ${v.hp>before.get(v.id)?'+':''}${v.hp-before.get(v.id)} HP`).join(' · '));}
function cancelAnimations(){
 sceneId++;clearTimeout(enemyTimer);
 if(pendingAnimation){pendingAnimation.resolve(false);pendingAnimation=null;}
 ui.animating=false;ui.actorId=null;ui.motion=null;ui.strike=null;ui.queue=null;
}
function animateFor(duration,update=()=>{}){
 return new Promise(resolve=>{
  pendingAnimation={duration,elapsed:0,update,resolve,scene:sceneId};update(0);draw();
 });
}
function beginAction(u,label){
 busy=true;ui.animating=true;ui.actorId=u.id;ui.animationLabel=label;
 ui.queue=[...c.queue.slice(c.turn),...E.order(c)];ui.hover=null;render();toast(label);
}
function endAction(){
 ui.animating=false;ui.actorId=null;ui.queue=null;ui.motion=null;ui.strike=null;
}
async function playMovement(u,path){
 if(!path||path.length<2)return true;
 ui.motion={id:u.id,position:sampleMovement(path,0,reducedMotion)};
 const ok=await animateFor((path.length-1)*timings().step,progress=>{
  ui.motion.position=sampleMovement(path,progress,reducedMotion);
 });
 ui.motion=null;return ok;
}
async function playAction(u,t,action,commit){
 const epoch=sceneId,kind=attackKind(u,action);
 ui.strike={kind,actor:{...u},target:{...(t||u)},progress:0,reduced:reducedMotion};
 let applied=false,accepted=true;
 const ok=await animateFor(timings().attack,progress=>{
  if(!ui.strike)return;
  ui.strike.progress=progress;
  if(progress>=0.55&&!applied){
   applied=true;const before=new Map(c.units.map(v=>[v.id,v.hp]));
   accepted=commit();tone(kind==='heal'||kind==='rally'||kind==='guard'?'select':'hit');
   showChanges(before);render();
  }
 });
 if(!ok||epoch!==sceneId)return false;
 ui.strike=null;
 if(!accepted)return false;
 return animateFor(timings().recovery);
}
async function perform(action,id){
 if(busy||c.mode!=='battle')return;
 const u=E.active(c),t=c.units.find(v=>v.id===id);
 if(!u||u.side!=='ally')return;
 if(['attack','skill'].includes(action)&&!E.validTarget(c,u,t,action)){
  toast('Choose a highlighted target within range.');return;
 }
 if(action==='potion'&&(!c.potions||u.hp===u.maxHp))return;
 const epoch=sceneId,label=action==='attack'?'attacks':action==='skill'?`uses ${u.skill}`:action==='guard'?'takes a guarded stance':'drinks a tonic';
 beginAction(u,`${u.name} ${label}…`);
 await playAction(u,t,action,()=>E.act(c,action,id));
 if(epoch!==sceneId)return;
 ui.action='move';ui.origin=null;endAction();render();advance();
}
async function movePlayer(u,x,y){
 const path=E.movementPath(c,u,x,y);if(!path){toast('That tile is blocked or too far away.');return;}
 const origin={x:u.x,y:u.y},epoch=sceneId;
 beginAction(u,`${u.name} moves…`);
 const ok=await playMovement(u,path);if(!ok||epoch!==sceneId)return;
 E.moveUnit(c,x,y);ui.origin=origin;ui.action='attack';endAction();busy=false;
 render();tone();toast('Position set. Attack, use a skill, or guard.');
}
function selectTile(x,y){if(busy||c.mode!=='battle')return;const u=E.active(c);if(u?.side!=='ally')return;ui.cursor={x,y};const t=E.unitAt(c,x,y);if(['attack','skill'].includes(ui.action)){if(t)perform(ui.action,t.id);else toast('Choose a highlighted unit.');return;}if(t?.side==='enemy'){if(E.validTarget(c,u,t,'attack')){ui.action='attack';render();toast(`${t.name}: ${E.damage(c,u,t)} damage. Select again to attack.`);}else{toast(`${t.name} · ${t.hp} HP · outside attack range`);}return;}if(t&&t.id!==u.id){toast(`${t.name} · ${t.hp}/${t.maxHp} HP · acts in initiative order`);return;}if(!c.moved){movePlayer(u,x,y);}else toast('Movement already used. Choose a command, or undo your move.');}
async function runEnemyTurn(){
 if(c.mode!=='battle'||E.active(c)?.side!=='enemy'){advance();return;}
 if($('modal').open||document.hidden){enemyTimer=setTimeout(runEnemyTurn,250);return;}
 const u=E.active(c),plan=E.planEnemyTurn(c),epoch=sceneId;
 beginAction(u,`${u.name} prepares to act…`);
 if(plan){
  const path=E.movementPath(c,u,plan.x,plan.y);
  if(!await playMovement(u,path)||epoch!==sceneId)return;
  u.x=plan.x;u.y=plan.y;render();
 }
 const t=plan&&c.units.find(v=>v.id===plan.targetId);
 if(t&&E.distance(u,t)<=u.range){
  ui.animationLabel=`${u.name} attacks ${t.name}…`;toast(ui.animationLabel);
  await playAction(u,t,'attack',()=>E.resolveEnemyTurn(c,plan));
 }else{
  E.resolveEnemyTurn(c,plan);render();await animateFor(timings().recovery);
 }
 if(epoch!==sceneId)return;
 ui.origin=null;ui.action='move';endAction();render();advance();
}
function advance(){
 clearTimeout(enemyTimer);
 if(c.mode!=='battle'){busy=false;showState();return;}
 const u=E.active(c);ui.cursor={x:u.x,y:u.y};ui.hover=null;
 busy=u.side==='enemy';render();
 if(busy)enemyTimer=setTimeout(runEnemyTurn,timings().think);
}
function showModal(html,closable=false){$('modal-content').innerHTML=html;const d=$('modal');d.dataset.closable=closable?'yes':'no';if(!d.open)d.showModal();}
function closeModal(){if($('modal').open)$('modal').close();}
function showState(){if(c.mode==='victory'){tone('win');showModal(`<div class="modal-inner outcome"><div class="eyebrow">ENCOUNTER ${String(c.battle+1).padStart(2,'0')} COMPLETE</div><h2>The field is yours.</h2><p>The company gathers its supplies. Rest, sharpen your weapons, and prepare for the road ahead.</p><div class="reward"><div><b>+${c.reward} G</b><small>BATTLE REWARD</small></div><div><b>${c.heroes.filter(h=>h.level>1).length}</b><small>VETERAN HEROES</small></div></div><p>All heroes recover to at least half health at camp, including fallen allies. Each recovers 4 MP.</p><div class="modal-buttons"><button class="primary" id="to-camp">Make camp →</button></div></div>`);$('to-camp').onclick=()=>{E.enterCamp(c);save();renderCamp();render();};}else if(c.mode==='defeat'){showModal(`<div class="modal-inner outcome"><div class="eyebrow">THE COMPANY RETREATS</div><h2>A battle lost. A lesson learned.</h2><p>Retry with your equipment and supplies from the start of this encounter. Keep your healer safe, use woods for cover, and guard when you cannot reach a target.</p><div class="modal-buttons"><button class="primary" id="retry">Regroup & retry →</button></div></div>`);$('retry').onclick=retry;}else if(c.mode==='camp')renderCamp();}
function renderCamp(){showModal(`<div class="modal-inner"><div class="camp-top"><div><div class="eyebrow">BETWEEN BATTLES</div><h2>A moment by the fire.</h2></div><strong>${c.gold} G</strong></div><p>No detours. Tend to your company, invest in its strength, then march to <b>${E.MAPS[(c.battle+1)%8].name}</b>.</p><canvas class="camp-scene" id="camp-scene" width="640" height="160" aria-label="The company resting at a pixel-art campfire under the stars"></canvas><div class="camp-supplies"><p><b>Company supplies</b><br>${c.potions} tonics · fallen allies have returned</p><button class="secondary" id="rest" ${c.gold<35||c.heroes.every(h=>h.hp===h.maxHp&&h.mp===h.maxMp)?'disabled':''}>Rest all · 35 G</button><button class="secondary" id="buy-tonic" ${c.gold<18?'disabled':''}>Buy tonic · 18 G</button></div><div class="camp-grid" id="camp-grid"></div><div class="modal-buttons"><button class="primary" id="march">March to encounter ${c.battle+2} →</button><button class="secondary" id="camp-guide">Field guide</button></div><p style="font-size:10px">Rest restores all HP & MP. Upgrades add +2 attack (maximum +5). Promotion unlocks at level 3: +3 ATK, +2 DEF, +8 HP, +3 MP.</p></div>`);
drawCamp($('camp-scene').getContext('2d'),c.heroes);
for(const h of c.heroes){const el=document.createElement('div');el.className='camp-card';el.innerHTML=`<div class="camp-character"><div class="camp-portrait"></div><div><h3>${h.name}${h.promoted?' ✦':''}</h3><p>${h.role} · Level ${h.level}</p></div></div>${bars(h)}<div class="xp">${h.weapon}${h.tier?' +'+h.tier:''} · ${h.xp} / 45 XP</div><div class="modal-buttons"><button class="secondary" data-camp="upgrade" ${h.tier>=5||c.gold<45+h.tier*30?'disabled':''}>${h.tier>=5?'Weapon mastered':'Upgrade · '+(45+h.tier*30)+' G'}</button><button class="secondary" data-camp="promote" ${h.level<3||h.promoted||c.gold<100?'disabled':''}>${h.promoted?'Promoted':h.level<3?'Promote at Lv 3':'Promote · 100 G'}</button></div>`;el.querySelector('.camp-portrait').append(iconCanvas(h));el.querySelectorAll('[data-camp]').forEach(b=>b.onclick=()=>{E.campAction(c,b.dataset.camp,h.id);tone();save();render();renderCamp();});$('camp-grid').append(el);}
$('rest').onclick=()=>{E.campAction(c,'rest');save();render();renderCamp();};$('buy-tonic').onclick=()=>{E.campAction(c,'tonic');save();render();renderCamp();};$('march').onclick=()=>{cancelAnimations();c.battle++;E.startBattle(c);ui.origin=null;ui.effects=[];ui.action='move';closeModal();checkpoint();render();advance();};$('camp-guide').onclick=()=>help(true);}
function inspect(v){showModal(`<div class="modal-inner"><div class="eyebrow">COMPANY DOSSIER</div><h2>${v.name} · ${v.role}</h2><div id="inspect-art"></div>${bars(v)}<p>Level ${v.level} · Attack ${v.atk} · Defense ${v.def} · Speed ${v.speed} · Move ${v.move} · Range ${v.range}</p><p><b>${v.skill}</b> · ${v.cost} MP<br>${v.id==='sana'?`Restore ${E.healingPower(v)} HP to an ally. Range 3.`:v.desc}</p><p>Weapon: ${v.weapon}${v.tier?' +'+v.tier:''}. ${v.promoted?'Promoted hero.':'Promotion unlocks at level 3 in camp.'}</p><div class="modal-buttons"><button class="primary" id="close-inspect">Return to field</button></div></div>`,true);$('inspect-art').append(iconCanvas(v,80));$('close-inspect').onclick=closeModal;}
function help(fromCamp=false){showModal(`<div class="modal-inner"><div class="eyebrow">THE COMPANY'S FIELD GUIDE</div><h2>A little planning goes a long way.</h2><div class="guide-grid"><div><h3>01 · Follow the initiative</h3><p>Allies and enemies take individual turns in speed order. The outlined unit acts now. Each unit acts once per round.</p></div><div><h3>02 · Move, then act</h3><p>Select a blue tile to move. Choose Attack or a skill, then a highlighted target. You may act without moving. Undo movement before committing an action.</p></div><div><h3>03 · Know your six</h3><p>Rhea cleaves clustered enemies. Bram rallies nearby allies. Lyra fires at range. Orin casts area fire. Sana heals. Finn moves quickly and bypasses armor.</p></div><div><h3>04 · Use the ground</h3><p>Woods and high ground cost 2 movement and grant +2 defense. Cliffs and deep water block movement. Bridges are safe crossings. Units block movement.</p></div><div><h3>05 · Recover and prepare</h3><p>Guard grants +3 armor until your next turn and restores 1 MP. Tonics restore 22 HP. At camp, rest restores everyone; fallen heroes recover to half health for free.</p></div><div><h3>06 · Keep marching</h3><p>Defeat every enemy to earn gold and XP. Buy weapon upgrades, promote level 3 heroes, and enter the next map. New terrain and formations are generated for every encounter across eight biomes, with stronger enemies as you progress.</p></div></div><p><b>Keyboard:</b> arrows move the tile cursor; Enter selects. M move, A attack, S skill, G guard, P tonic, U undo. Escape cancels targeting. Mouse and touch are supported.</p><p style="font-size:10px">Company stats, equipment, gold, supplies, and encounter number save automatically. Reloading restarts the encounter; exact tile positions are not saved. Sound is optional. No accounts, downloads, or network connection are needed for gameplay.</p><div class="modal-buttons"><button class="primary" id="close-help">${fromCamp?'Return to camp':'Back to the expedition'} →</button></div></div>`,!fromCamp);$('close-help').onclick=()=>fromCamp?renderCamp():closeModal();}
function retry(){cancelAnimations();if(battleCheckpoint&&battleCheckpoint.battle===c.battle)c=JSON.parse(JSON.stringify(battleCheckpoint));else E.startBattle(c);busy=false;ui.origin=null;ui.effects=[];ui.action='move';ui.cursor={x:E.active(c).x,y:E.active(c).y};closeModal();render();advance();}
$('pace').value=pace;$('pace').onchange=e=>{pace=e.target.value;try{storage?.setItem('ember-company-pace',pace);}catch{}};
$('help').onclick=()=>help(c.mode==='camp');$('grid').onchange=e=>{ui.grid=e.target.checked;draw();};$('sound').onclick=()=>{sound=!sound;$('sound').style.color=sound?'#e7c77c':'';$('sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');tone();toast(sound?'Sound enabled':'Sound muted');};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Fullscreen is unavailable in this browser.');}};
$('restart').onclick=()=>{showModal(`<div class="modal-inner"><div class="eyebrow">REGROUP</div><h2>Restart this encounter?</h2><p>Your company returns to its state at the beginning of this battle.</p><div class="modal-buttons"><button class="primary" id="confirm-retry">Restart encounter</button><button class="secondary" id="cancel-retry">Keep fighting</button></div></div>`,true);$('confirm-retry').onclick=retry;$('cancel-retry').onclick=closeModal;};
$('new-game').onclick=()=>{showModal(`<div class="modal-inner"><div class="eyebrow">A FRESH START</div><h2>Begin a new expedition?</h2><p>This replaces your saved company and returns to the first encounter.</p><div class="modal-buttons"><button class="primary" id="confirm-new">New expedition</button><button class="secondary" id="cancel-new">Keep my company</button></div></div>`,true);$('confirm-new').onclick=()=>{cancelAnimations();c=E.startBattle(E.createCampaign());busy=false;ui.origin=null;ui.action='move';checkpoint();closeModal();render();advance();};$('cancel-new').onclick=closeModal;};
$('modal').addEventListener('cancel',e=>{if($('modal').dataset.closable!=='yes')e.preventDefault();});
function tile(e){const r=$('board').getBoundingClientRect();return {x:Math.max(0,Math.min(13,Math.floor((e.clientX-r.left)/r.width*14))),y:Math.max(0,Math.min(9,Math.floor((e.clientY-r.top)/r.height*10)))};}
function updateTileInfo(){
 const {x,y}=ui.hover||ui.cursor,t=E.unitAt(c,x,y),u=E.active(c),terrain=E.TERRAIN[c.tiles[y][x]];
 if(t){const action=ui.action==='skill'?'skill':'attack',effect=u?.side==='ally'?E.previewEffect(c,u,t,action):null;
 $('tile-info').textContent=`${t.name} · ${t.hp}/${t.maxHp} HP · ${terrain.name}`+(effect?` · ${effect.kind==='damage'?'Damage':effect.kind==='heal'?'Healing':'Rally'}: ${effect.amount}`:'');
 }else $('tile-info').textContent=`${terrain.name} · Movement ${terrain.cost>=99?'blocked':terrain.cost} · Defense +${terrain.def}`;
}
$('board').addEventListener('pointermove',e=>{ui.hover=tile(e);updateTileInfo();draw();});
$('board').addEventListener('pointerleave',()=>{ui.hover=null;updateTileInfo();draw();});$('board').addEventListener('click',e=>{const {x,y}=tile(e);selectTile(x,y);});
document.addEventListener('keydown',e=>{if(busy&&e.key!=='Tab')return;if((e.repeat&&!e.key.startsWith('Arrow'))||e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||$('modal').open||e.target.matches('input,textarea,select,[contenteditable="true"]'))return;if(e.target.closest('button,a')&&['Enter',' '].includes(e.key))return;const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(dirs[e.key]){e.preventDefault();ui.cursor.x=Math.max(0,Math.min(13,ui.cursor.x+dirs[e.key][0]));ui.cursor.y=Math.max(0,Math.min(9,ui.cursor.y+dirs[e.key][1]));ui.hover={...ui.cursor};updateTileInfo();draw();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();selectTile(ui.cursor.x,ui.cursor.y);}else if(e.key==='Escape'){ui.action='move';render();}else{const a={m:'move',a:'attack',s:'skill',g:'guard',p:'potion',u:'undo'}[e.key.toLowerCase()];if(a)command(a);}});
// One visual clock pauses animations in dialogs and hidden tabs. State changes
// happen once, at impact, and input remains locked until the action settles.
let lastPaint=0,lastFrame;
function animate(time){
 const delta=lastFrame===undefined?0:time-lastFrame;lastFrame=time;
 const animation=pendingAnimation;
 if(animation){
  const step=timelineStep(animation.elapsed,delta,animation.duration,$('modal').open||document.hidden);
  animation.elapsed=step.elapsed;animation.update(step.progress);
  if(step.done&&pendingAnimation===animation){pendingAnimation=null;animation.resolve(true);}
 }
 if(!document.hidden&&(animation||time-lastPaint>180)){draw(time);lastPaint=time;}
 requestAnimationFrame(animate);
}
render();showState();advance();requestAnimationFrame(animate);
if(c.mode==='battle'&&c.round===1)toast('Finn acts first. Select a blue tile, then choose a command.');

})(globalThis);
