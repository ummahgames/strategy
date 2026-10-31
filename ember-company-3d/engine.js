(function(root){
'use strict';
// Pure combat rules shared by the browser and the headless checks.
const W=14,H=10;
const TERRAIN={g:{name:'Grassland',cost:1,def:0},f:{name:'Grove',cost:2,def:2},r:{name:'Stone',cost:1,def:0},w:{name:'Deep water',cost:99,def:0},b:{name:'Bridge',cost:1,def:0},m:{name:'Cliff',cost:99,def:0},s:{name:'Sand',cost:1,def:0},h:{name:'High ground',cost:2,def:2},a:{name:'Courtyard tile',cost:1,def:0}};
const HEROES=[
{id:'rhea',name:'Amira',role:'Vanguard',weapon:'Dawn sabre',sprite:'sword',color:'#436eab',hp:34,mp:6,atk:10,def:4,speed:10,move:4,range:1,skill:'Cleave',desc:'Strike a foe and enemies beside it.',cost:3},
{id:'bram',name:'Kwame',role:'Sentinel',weapon:'Bronze warhammer',sprite:'tank',color:'#b0804d',hp:42,mp:6,atk:10,def:6,speed:6,move:3,range:1,skill:'Rally',desc:'Restore 8 HP to nearby allies and guard yourself.',cost:3},
{id:'lyra',name:'Zuri',role:'Ranger',weapon:'Acacia bow',sprite:'bow',color:'#63885b',hp:27,mp:8,atk:10,def:2,speed:12,move:4,range:3,skill:'Piercing shot',desc:'A powerful shot that ignores armor. Range 4.',cost:3},
{id:'orin',name:'Arjun',role:'Arcanist',weapon:'Emberwood staff',sprite:'mage',color:'#a371ae',hp:25,mp:16,atk:8,def:2,speed:8,move:4,range:2,skill:'Fireburst',desc:'Blast a target and adjacent enemies. Range 3.',cost:4},
{id:'sana',name:'Ayesha',role:'Mender',weapon:'Neemwood staff',sprite:'healer',color:'#d8b45f',hp:28,mp:16,atk:7,def:3,speed:9,move:4,range:2,skill:'Mend',desc:'Restore 15 HP to an ally. Range 3.',cost:3},
{id:'finn',name:'Tariq',role:'Wayfarer',weapon:'Twin curved daggers',sprite:'rogue',color:'#4b9990',hp:29,mp:9,atk:9,def:3,speed:14,move:5,range:1,skill:'Shadowstep',desc:'An armor-piercing dagger strike. Range 2.',cost:3}
];
const RECRUITS=Object.freeze([
 {id:'lyra',joinsAfter:2,earlyAfter:1,cost:80},
 {id:'bram',joinsAfter:4,earlyAfter:2,cost:120},
 {id:'orin',joinsAfter:6,earlyAfter:3,cost:160},
 {id:'finn',joinsAfter:8,earlyAfter:4,cost:200}
]);
const ITEMS=Object.freeze({
 herb:{name:'Neem salve',kind:'powerup',color:'#a6d78a',desc:'Restore 12 HP immediately.'},
 ether:{name:'Lapis shard',kind:'powerup',color:'#83b8e0',desc:'Restore 6 MP immediately.'},
 fury:{name:'Sun ember',kind:'powerup',color:'#eead68',desc:'+3 attack for this encounter.'},
 ward:{name:'Brass ward',kind:'powerup',color:'#a8d8d1',desc:'+2 defense for this encounter.'},
 tonic:{name:'Caravan tonic',kind:'supply',color:'#d7be78',desc:'Add a healing tonic to caravan stores.'},
 embersteel:{name:'Damascene armament',kind:'weapon',rarity:'Rare',color:'#f2b371',atk:3,desc:'A special weapon fitting: +3 attack.'},
 starforged:{name:'Moonsteel armament',kind:'weapon',rarity:'Epic',color:'#c0b0ec',atk:5,def:1,desc:'An enchanted weapon fitting: +5 attack, +1 defense.'},
 farshot:{name:'Falcon-eye charm',kind:'relic',rarity:'Rare',color:'#9dcdbb',range:1,desc:'+1 normal attack range. Does not change skill range.'},
 ironward:{name:'Brass guardian crest',kind:'relic',rarity:'Rare',color:'#e1cf8b',def:3,desc:'+3 defense while equipped.'}
});
const party=c=>c.heroes.filter(h=>h.unlocked);
function unlockHero(c,id){
 const h=c.heroes.find(h=>h.id===id);if(!h||h.unlocked)return false;
 const members=party(c),level=Math.max(1,Math.floor(members.reduce((n,h)=>n+h.level,0)/Math.max(1,members.length)));
 while(h.level<level){h.level++;h.maxHp+=3;h.atk++;if(h.level%2===0){h.def++;h.maxMp++;}}
 h.hp=h.maxHp;h.mp=h.maxMp;h.unlocked=true;return true;
}
function equipment(c,h){return ['equippedWeapon','equippedRelic'].map(slot=>(c.inventory||[]).find(item=>item.uid===h[slot])).filter(Boolean).map(item=>ITEMS[item.type]);}
function battleHero(c,h){const u={...h};for(const item of equipment(c,h))for(const stat of ['atk','def','range'])u[stat]+=(item[stat]||0);return u;}
function equipItem(c,heroId,uid,slot){
 const h=c.heroes.find(h=>h.id===heroId);
 if(c.mode!=='camp'||!h?.unlocked||!['equippedWeapon','equippedRelic'].includes(slot))return false;
 if(!uid){h[slot]=null;return true;}
 const item=(c.inventory||[]).find(item=>item.uid===uid),kind=slot==='equippedWeapon'?'weapon':'relic';
 if(!item||ITEMS[item.type]?.kind!==kind||c.heroes.some(v=>v.id!==heroId&&(v.equippedWeapon===uid||v.equippedRelic===uid)))return false;
 h[slot]=uid;return true;
}
function sellItem(c,uid){
 if(c.mode!=='camp'||c.heroes.some(h=>h.equippedWeapon===uid||h.equippedRelic===uid))return false;
 const index=c.inventory.findIndex(item=>item.uid===uid);if(index<0)return false;
 c.inventory.splice(index,1);c.gold+=35;return true;
}
function storeItem(c,drop){
 if(c.inventory.some(item=>item.uid===drop.uid))return false;
 if(c.inventory.length>=64){c.gold+=40;addLog(c,'The full armory salvages a spare item for 40 G.');return false;}
 c.inventory.push({uid:drop.uid,type:drop.type});return true;
}
function dropLoot(c,v){
 if(v.side!=='enemy'||v.dropped)return;v.dropped=true;
 const index=Number(v.id.slice(1))||0,rng=seeded(c.battle*1009+index*97+43);
 const guaranteed=c.battle===0&&index===0,rare=(c.battle%4===3&&index===0)||v.name==='The Ash Regent';
 if(!guaranteed&&!rare&&rng()>.3)return;
 const common=['herb','ether','fury','ward','tonic'],special=['embersteel','ironward','farshot','starforged'];
 const type=guaranteed?'herb':rare||rng()<.15?special[Math.floor(rng()*special.length)]:common[Math.floor(rng()*common.length)];
 c.loot.push({uid:`drop-${c.battle}-${v.id}`,type,x:v.x,y:v.y});
 addLog(c,`${v.name} dropped ${ITEMS[type].name}.`);
}
function lootAt(c,x,y){return (c.loot||[]).find(item=>item.x===x&&item.y===y);}
function collectLoot(c,u){
 const found=c.loot.filter(item=>item.x===u.x&&item.y===u.y);c.lastPickup=null;
 for(const drop of found){
  if(drop.type==='herb')u.hp=Math.min(u.maxHp,u.hp+12);
  else if(drop.type==='ether')u.mp=Math.min(u.maxMp,u.mp+6);
  else if(drop.type==='fury')u.tempAtk=(u.tempAtk||0)+3;
  else if(drop.type==='ward')u.tempDef=(u.tempDef||0)+2;
  else if(drop.type==='tonic')c.potions++;
  else storeItem(c,drop);
  addLog(c,`${u.name} collected ${ITEMS[drop.type].name}.`);
 }
 if(found.length){c.loot=c.loot.filter(item=>!found.includes(item));c.pickupRevision++;c.lastPickup=found.map(d=>ITEMS[d.type].name).join(', ');}
 return found;
}
const MAPS=[
{name:'Tamarind Ford',region:'THE AMBER ROAD',type:'river',desc:'Cross the tamarind-lined river on the Amber Road. Keep your mender behind the front line.',ground:'g'},
{name:'Acacia Grove',region:'THE SAVANNAH MARCH',type:'forest',desc:'Flat-crowned acacias shelter the savannah road. Woods cost 2 movement and grant +2 defense.',ground:'g'},
{name:'The Saffron Court',region:'THE OLD CARAVANSERAI',type:'ruins',desc:'Weathered caravanserai walls divide the saffron courtyard. Hold the narrow approaches.',ground:'a'},
{name:'Copper Dunes',region:'THE SUNWARD REACH',type:'desert',desc:'Copper sands and red-rock outcrops. Protect your flanks from swift reavers.',ground:'s'},
{name:'Cedar Gate',region:'THE CEDAR HIGHLANDS',type:'pass',desc:'Cedar slopes frame a narrow highland pass. Let your sentinel lead the advance.',ground:'h'},
{name:'Monsoon Steps',region:'THE JADE DELTA',type:'islands',desc:'Monsoon waters divide the jade delta. Two crossings offer different approaches; divide carefully.',ground:'g'},
{name:'Baobab Watch',region:'THE RED EARTH FRONTIER',type:'grove',desc:'Baobabs rise over red earth. Enemy archers hold the groves; close the distance under cover.',ground:'g'},
{name:'The Brass Citadel',region:'THE BRASS FRONTIER',type:'fort',desc:'Break the citadel guard beneath its brass battlements. The Ash Regent commands the far side.',ground:'a'}
];
function createCampaign(){return {version:3,battle:0,gold:120,potions:3,wins:0,inventory:[],heroes:HEROES.map(h=>({...h,maxHp:h.hp,maxMp:h.mp,level:1,xp:0,tier:0,promoted:false,unlocked:['rhea','sana'].includes(h.id),equippedWeapon:null,equippedRelic:null})),mode:'battle',log:[],round:1};}
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const alive=u=>Boolean(u && u.hp>0);
function seeded(seed){let t=2166136261;for(const char of String(seed))t=Math.imul(t^char.charCodeAt(0),16777619)>>>0;return ()=>{t=(t+0x6D2B79F5)>>>0;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return ((z^z>>>14)>>>0)/4294967296;};}
function generateMap(n){
const spec=MAPS[n%MAPS.length],rng=seeded(n+381),tiles=Array.from({length:H},()=>Array(W).fill(spec.ground));
const put=(x,y,t)=>{if(x>=0&&x<W&&y>=0&&y<H)tiles[y][x]=t;};
const crossing=3+Math.floor(rng()*4),riverX=5+Math.floor(rng()*3),gap=3+Math.floor(rng()*4);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const r=rng();
 if(spec.type==='river'){const bend=riverX+(y<3?-1:y>7?1:0);if(x===bend||x===bend+1)put(x,y,y===crossing||y===crossing+1?'b':'w');else if(Math.abs(x-bend)<3&&r<.3)put(x,y,'s');else if(r<.14)put(x,y,'f');}
 if(spec.type==='forest'&&x>2&&x<12&&r<.42)put(x,y,'f');
 if(spec.type==='ruins'){if(x>2&&x<12&&r<.22)put(x,y,'m');else if(r<.13)put(x,y,'f');}
 if(spec.type==='desert'){if(x>2&&x<12&&r<.14)put(x,y,'m');else if(r<.35)put(x,y,'h');}
 if(spec.type==='pass'){if(x>2&&x<12&&(y<gap-1||y>gap+1)&&r<.84)put(x,y,'m');else if(r<.12)put(x,y,'f');}
 if(spec.type==='islands'){if([4,5,9].includes(x))put(x,y,[crossing,Math.max(1,crossing-3)].includes(y)?'b':'w');else if(r<.19)put(x,y,'f');}
 if(spec.type==='grove'){if(x>2&&x<12&&r<.48)put(x,y,'f');else if(r<.08)put(x,y,'h');}
 if(spec.type==='fort'){if([7,10].includes(x)&&y!==gap&&y!==gap+1)put(x,y,'m');else if(r<.12)put(x,y,'f');}
}
// Carve a guaranteed east-west route, preserving bridges across water.
let routeY=crossing;
for(let x=0;x<W;x++){
 if(x>1&&x<12&&rng()<.28){const next=Math.max(2,Math.min(7,routeY+(rng()<.5?-1:1)));put(x,routeY,tiles[routeY][x]==='w'?'b':'r');routeY=next;}
 put(x,routeY,['w','b'].includes(tiles[routeY][x])?'b':'r');
}
for(let y=0;y<H;y++){put(1,y,spec.ground);put(12,y,spec.ground);}
return tiles;
}
function startBattle(c){c.mode='battle';c.startingGold=c.gold;c.startingPotions=c.potions;c.inventory??=[];c.startingInventory=JSON.parse(JSON.stringify(c.inventory));c.loot=[];c.pickupRevision=0;c.lastPickup=null;c.tiles=generateMap(c.battle);c.round=1;c.selected=null;c.moved=false;c.guarding={};c.log=[];const ys=[4,5,3,6,2,7];c.units=party(c).map((h,i)=>({...battleHero(c,h),side:'ally',x:1,y:ys[i]}));const n=c.battle,cycle=Math.floor(n/8),count=Math.min(2+Math.floor((n+1)/2),10);c.enemies=[];
for(let i=0;i<count;i++){const type=n<2?(i%2):((i+n)%4),scale=Math.floor(n*.65);const kinds=[['Dune Reaver','sword',1,4],['Acacia Archer','bow',3,3],['Cinder Adept','mage',2,3],['Brass Guardian','tank',1,3]];const [name,sprite,range,move]=kinds[type];const rotation=(n*3)%8;let x=(n===0?9:n===1?11:12)-Math.floor(i/8),y=n===0?4+i:1+(i+rotation)%8;for(let xx=x;xx<=12;xx++)if(TERRAIN[c.tiles[y][xx]].cost>=99)c.tiles[y][xx]=MAPS[n%8].ground;if(TERRAIN[c.tiles[y][x]].cost>=99)c.tiles[y][x]=MAPS[n%8].ground;c.enemies.push({id:'e'+i,name,role:'Enemy',sprite,color:'#bd5c53',side:'enemy',x,y,hp:(n<2?14:18)+scale*2+cycle*3+(type===3?9:0),maxHp:(n<2?14:18)+scale*2+cycle*3+(type===3?9:0),mp:0,maxMp:0,atk:(n<2?5:7)+scale,def:type===3?5+Math.floor(scale/2):(n<2?1:2)+Math.floor(scale/3),speed:7+(i%4),range,move,level:n+1});}
if(n%8===7){const boss=c.enemies[0];Object.assign(boss,{name:'The Ash Regent',sprite:'tank',hp:boss.maxHp+30+cycle*2,maxHp:boss.maxHp+30+cycle*2,atk:boss.atk+5,def:boss.def+3});}
c.units.push(...c.enemies);c.queue=order(c);c.turn=0;addLog(c,MAPS[n%8].desc);return c;}
function order(c){return c.units.filter(alive).sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id)).map(u=>u.id);}
function active(c){return c.units?.find(u=>u.id===c.queue[c.turn]);}
function unitAt(c,x,y){return c.units.find(u=>alive(u)&&u.x===x&&u.y===y);}
function reachable(c,u){const costs=new Map([[u.x+','+u.y,0]]),pending=[{x:u.x,y:u.y,cost:0}];while(pending.length){pending.sort((a,b)=>a.cost-b.cost);const p=pending.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x>=W||y>=H)continue;const occupant=unitAt(c,x,y);if(occupant&&occupant.id!==u.id)continue;const terrain=TERRAIN[c.tiles[y][x]];if(terrain.cost>=99)continue;const cost=p.cost+terrain.cost,key=x+','+y;if(cost<=u.move&&(!costs.has(key)||cost<costs.get(key))){costs.set(key,cost);pending.push({x,y,cost});}}}return costs;}
// Reconstruct an actual legal route for tile-by-tile presentation.
function movementPath(c,u,x,y){
 const costs=reachable(c,u),key=x+','+y;
 if(!costs.has(key))return null;
 const path=[{x,y}];let current={x,y};
 while(current.x!==u.x||current.y!==u.y){
  const cost=costs.get(current.x+','+current.y),step=TERRAIN[c.tiles[current.y][current.x]].cost;
  const previous=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:current.x+dx,y:current.y+dy}))
   .find(p=>costs.get(p.x+','+p.y)===cost-step);
  if(!previous)return null;
  path.unshift(previous);current=previous;
 }
 return path;
}
function moveUnit(c,x,y){const u=active(c);if(c.mode!=='battle'||!alive(u)||c.moved||u.side!=='ally'||!Number.isInteger(x)||!Number.isInteger(y))return false;const cells=reachable(c,u);if(!cells.has(x+','+y))return false;u.x=x;u.y=y;c.moved=true;collectLoot(c,u);return true;}
function damage(c,a,b,power=0,ignore=false){const armor=ignore?0:b.def+(b.tempDef||0)+TERRAIN[c.tiles[b.y][b.x]].def+(c.guarding[b.id]?3:0);return Math.max(2,a.atk+(a.tempAtk||0)+power-armor);}
function addLog(c,s){c.log.unshift(s);c.log=c.log.slice(0,25);}
function hit(c,a,b,power=0,ignore=false){const d=damage(c,a,b,power,ignore);b.hp=Math.max(0,b.hp-d);addLog(c,`${a.name} hits ${b.name} for ${d}${!b.hp?' · defeated':''}.`);if(a.side==='ally'){a.xp+=!b.hp?18:7;}if(!b.hp)dropLoot(c,b);return d;}
const skillRange=u=>({rhea:1,bram:0,lyra:4,orin:3,sana:3,finn:2}[u?.id]);
const healingPower=u=>15+(u.tier||0)*3;
function validTarget(c,u,t,action){
 if(!alive(u)||!alive(t)||!['attack','skill'].includes(action))return false;
 const d=distance(u,t);
 if(action==='attack')return t.side!==u.side&&d<=u.range;
 const range=skillRange(u);
 if(u.side!=='ally'||range===undefined||u.mp<u.cost)return false;
 if(u.id==='bram')return t.id===u.id;
 if(u.id==='sana')return t.side===u.side&&t.hp<t.maxHp&&d<=range;
 return t.side!==u.side&&d<=range;
}
// Target feedback and actual resolution share the same values.
function previewEffect(c,u,t,action='attack'){
 if(!validTarget(c,u,t,action))return null;
 if(action==='attack')return {kind:'damage',amount:Math.min(t.hp,damage(c,u,t))};
 if(u.id==='sana')return {kind:'heal',amount:Math.min(t.maxHp-t.hp,healingPower(u))};
 if(u.id==='bram')return {kind:'rally',amount:8};
 const power=u.id==='orin'?7:u.id==='rhea'?3:5;
 return {kind:'damage',amount:Math.min(t.hp,damage(c,u,t,power,u.id!=='rhea'))};
}
function act(c,action,targetId){const u=active(c);if(c.mode!=='battle'||!alive(u)||u.side!=='ally'||!['attack','skill','guard','potion'].includes(action))return false;const t=c.units.find(v=>v.id===targetId);
if(action==='guard'){c.guarding[u.id]=true;u.mp=Math.min(u.maxMp,u.mp+1);addLog(c,`${u.name} guards (+3 armor) and recovers 1 MP.`);}
else if(action==='potion'){if(c.potions<1||u.hp===u.maxHp)return false;c.potions--;u.hp=Math.min(u.maxHp,u.hp+22);addLog(c,`${u.name} drinks a tonic (+22 HP).`);}
else {if(!validTarget(c,u,t,action))return false;if(action==='attack')hit(c,u,t);else{u.mp-=u.cost;if(u.id==='sana'){t.hp=Math.min(t.maxHp,t.hp+healingPower(u));u.xp+=10;addLog(c,`${u.name} mends ${t.name}.`);}else if(u.id==='bram'){for(const v of c.units.filter(v=>v.side==='ally'&&alive(v)&&distance(u,v)<=2))v.hp=Math.min(v.maxHp,v.hp+8);c.guarding[u.id]=true;u.xp+=10;addLog(c,`${u.name} rallies nearby allies (+8 HP).`);}else if(['orin','rhea'].includes(u.id)){const targets=c.units.filter(v=>v.side==='enemy'&&alive(v)&&distance(v,t)<=1);for(const v of targets)hit(c,u,v,u.id==='orin'?7:3,u.id==='orin');}else hit(c,u,t,5,true);}}
finishTurn(c);return true;}
function finishTurn(c){if(checkEnd(c))return;c.turn++;while(c.turn<c.queue.length&&!alive(c.units.find(u=>u.id===c.queue[c.turn])))c.turn++;if(c.turn>=c.queue.length){c.round++;c.queue=order(c);c.turn=0;}c.moved=false;const u=active(c);delete c.guarding[u.id];}
function checkEnd(c){if(c.mode!=='battle')return true;if(!c.units.some(u=>u.side==='ally'&&alive(u))){c.mode='defeat';addLog(c,'The company has fallen. Regroup and try again.');return true;}if(!c.units.some(u=>u.side==='enemy'&&alive(u))){c.mode='victory';c.reward=85+c.battle*18;c.gold+=c.reward;c.wins++;c.recoveredLoot=[];c.salvageGold=0;for(const drop of c.loot){const item=ITEMS[drop.type];if(['weapon','relic'].includes(item.kind)){if(storeItem(c,drop))c.recoveredLoot.push(item.name);}else{c.gold+=8;c.salvageGold+=8;}}c.loot=[];for(const h of party(c)){const u=c.units.find(u=>u.id===h.id);h.hp=u.hp;h.mp=u.mp;h.xp=u.xp+22;while(h.xp>=45){h.xp-=45;h.level++;h.maxHp+=3;h.hp=Math.min(h.maxHp,h.hp+3);h.atk++;if(h.level%2===0){h.def++;h.maxMp++;}}}return true;}return false;}
// Reverse weighted paths to every legal attack position around a target.
// Unlike straight-line distance, these guide units around walls and river bends.
function approachCosts(c,u,target){
 const costs=new Map(),pending=[];
 const open=(x,y)=>{
  if(x<0||y<0||x>=W||y>=H||TERRAIN[c.tiles[y][x]].cost>=99)return false;
  const v=unitAt(c,x,y);return !v||v.id===u.id;
 };
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  if(open(x,y)&&distance({x,y},target)<=u.range){costs.set(x+','+y,0);pending.push({x,y,cost:0});}
 }
 while(pending.length){
  pending.sort((a,b)=>a.cost-b.cost);const p=pending.shift();
  if(p.cost!==costs.get(p.x+','+p.y))continue;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=p.x+dx,y=p.y+dy;if(!open(x,y))continue;
   const cost=p.cost+TERRAIN[c.tiles[p.y][p.x]].cost,key=x+','+y;
   if(!costs.has(key)||cost<costs.get(key)){costs.set(key,cost);pending.push({x,y,cost});}
  }
 }
 return costs;
}
function planEnemyTurn(c){
 const u=active(c);
 if(c.mode!=='battle'||!alive(u)||u.side!=='enemy')return null;
 const targets=c.units.filter(v=>v.side==='ally'&&alive(v));
 const reach=reachable(c,u),routes=targets.map(t=>approachCosts(c,u,t));let choice;
 for(const [key,moveCost] of reach){
  const [x,y]=key.split(',').map(Number);
  targets.forEach((t,i)=>{
   const d=distance({x,y},t),canAttack=d<=u.range,path=routes[i].get(key);
   if(!canAttack&&path===undefined)return;
   const score=canAttack?10000+damage(c,u,t)*3+(t.hp<=damage(c,u,t)?100:0)-moveCost:
    -path*20-moveCost*.1+TERRAIN[c.tiles[y][x]].def*.01;
   if(!choice||score>choice.score)choice={x,y,t,score};
  });
 }
 return choice?{actorId:u.id,x:choice.x,y:choice.y,targetId:choice.t.id}:null;
}
function resolveEnemyTurn(c,plan){
 const u=active(c);
 if(c.mode!=='battle'||!alive(u)||u.side!=='enemy')return false;
 if(checkEnd(c))return false;
 const t=plan&&c.units.find(v=>v.id===plan.targetId);
 if(plan&&(plan.actorId!==u.id||!reachable(c,u).has(plan.x+','+plan.y)))return false;
 if(plan){u.x=plan.x;u.y=plan.y;}
 if(alive(t)&&distance(u,t)<=u.range)hit(c,u,t);
 else addLog(c,`${u.name} ${plan?'advances':'holds position'}.`);
 finishTurn(c);return true;
}
function enemyTurn(c){return resolveEnemyTurn(c,planEnemyTurn(c));}
function enterCamp(c){if(c.mode!=='victory')return false;c.mode='camp';c.newRecruits=[];for(const r of RECRUITS)if(c.wins>=r.joinsAfter&&unlockHero(c,r.id))c.newRecruits.push(HEROES.find(h=>h.id===r.id).name);for(const h of party(c)){h.hp=Math.max(h.hp,Math.ceil(h.maxHp*.5));h.mp=Math.min(h.maxMp,h.mp+4);}return true;}
function campAction(c,action,id){if(c.mode!=='camp')return false;const h=c.heroes.find(h=>h.id===id);let cost=0;if(action==='rest'){cost=35;if(c.gold<cost||party(c).every(h=>h.hp===h.maxHp&&h.mp===h.maxMp))return false;for(const h of party(c)){h.hp=h.maxHp;h.mp=h.maxMp;}}
else if(action==='tonic'){cost=18;if(c.gold<cost)return false;c.potions++;}
else if(action==='recruit'){const r=RECRUITS.find(r=>r.id===id);if(!r||!h||h.unlocked||c.wins<r.earlyAfter||c.gold<r.cost)return false;cost=r.cost;unlockHero(c,id);}
else if(action==='upgrade'){if(!h?.unlocked||h.tier>=5)return false;cost=45+h.tier*30;if(c.gold<cost)return false;h.tier++;h.atk+=2;}
else if(action==='promote'){cost=100;if(!h?.unlocked||h.level<3||h.promoted||c.gold<cost)return false;h.promoted=true;h.atk+=3;h.def+=2;h.maxHp+=8;h.hp=Math.min(h.maxHp,h.hp+8);h.maxMp+=3;h.mp+=3;}
else return false;c.gold-=cost;return true;}

root.EmberEngine=Object.freeze({W,H,TERRAIN,HEROES,RECRUITS,ITEMS,party,unlockHero,equipment,battleHero,equipItem,sellItem,dropLoot,lootAt,collectLoot,MAPS,createCampaign,distance,alive,seeded,generateMap,startBattle,order,active,unitAt,reachable,movementPath,moveUnit,damage,addLog,skillRange,healingPower,validTarget,previewEffect,act,finishTurn,checkEnd,approachCosts,planEnemyTurn,resolveEnemyTurn,enemyTurn,enterCamp,campAction});
})(globalThis);
