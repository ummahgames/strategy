// Pure combat rules shared by the browser and the headless checks.
export const W=14,H=10;
export const TERRAIN={g:{name:'Meadow',cost:1,def:0},f:{name:'Woods',cost:2,def:2},r:{name:'Stone',cost:1,def:0},w:{name:'Deep water',cost:99,def:0},b:{name:'Bridge',cost:1,def:0},m:{name:'Cliff',cost:99,def:0},s:{name:'Sand',cost:1,def:0},h:{name:'High ground',cost:2,def:2},a:{name:'Ancient floor',cost:1,def:0}};
export const HEROES=[
{id:'rhea',name:'Rhea',role:'Vanguard',weapon:'Dawnblade',sprite:'sword',color:'#436eab',hp:34,mp:6,atk:10,def:4,speed:10,move:4,range:1,skill:'Cleave',desc:'Strike a foe and enemies beside it.',cost:3},
{id:'bram',name:'Bram',role:'Sentinel',weapon:'Iron maul',sprite:'tank',color:'#b0804d',hp:42,mp:6,atk:10,def:6,speed:6,move:3,range:1,skill:'Rally',desc:'Restore 8 HP to nearby allies and guard yourself.',cost:3},
{id:'lyra',name:'Lyra',role:'Ranger',weapon:'Ashwood bow',sprite:'bow',color:'#63885b',hp:27,mp:8,atk:10,def:2,speed:12,move:4,range:3,skill:'Piercing shot',desc:'A powerful shot that ignores armor. Range 4.',cost:3},
{id:'orin',name:'Orin',role:'Arcanist',weapon:'Ember staff',sprite:'mage',color:'#a371ae',hp:25,mp:16,atk:8,def:2,speed:8,move:4,range:2,skill:'Fireburst',desc:'Blast a target and adjacent enemies. Range 3.',cost:4},
{id:'sana',name:'Sana',role:'Mender',weapon:'Willow staff',sprite:'healer',color:'#d8b45f',hp:28,mp:16,atk:7,def:3,speed:9,move:4,range:2,skill:'Mend',desc:'Restore 15 HP to an ally. Range 3.',cost:3},
{id:'finn',name:'Finn',role:'Wayfarer',weapon:'Twin daggers',sprite:'rogue',color:'#4b9990',hp:29,mp:9,atk:9,def:3,speed:14,move:5,range:1,skill:'Shadowstep',desc:'An armor-piercing dagger strike. Range 2.',cost:3}
];
export const MAPS=[
{name:'The Bracken Crossing',region:'THE GREEN MARCH',type:'river',desc:'Cross the old bridge. Keep your mender behind the front line.',ground:'g'},
{name:'Whisperwood',region:'THE GREEN MARCH',type:'forest',desc:'Woods slow movement, but grant +2 armor. Use the clearings.',ground:'g'},
{name:'The Sunken Court',region:'THE OLD KINGDOM',type:'ruins',desc:'Broken walls divide the courtyard. Hold the narrow approaches.',ground:'a'},
{name:'Amber Dunes',region:'THE SOUTHERN REACH',type:'desert',desc:'An open battlefield. Protect your flanks from swift raiders.',ground:'s'},
{name:'Splitstone Pass',region:'THE HIGH COUNTRY',type:'pass',desc:'The pass is narrow. Let your sentinel lead the advance.',ground:'h'},
{name:'Twinwater Ford',region:'THE RIVERLANDS',type:'islands',desc:'Two crossings offer different approaches. Divide carefully.',ground:'g'},
{name:'Briarwatch',region:'THE BORDERLAND',type:'grove',desc:'Enemy archers hold the groves. Close the distance under cover.',ground:'g'},
{name:'The Ember Gate',region:'THE ASHEN FRONTIER',type:'fort',desc:'Break the gate guard. A warlord commands the far side.',ground:'a'}
];
export function createCampaign(){return {version:1,battle:0,gold:120,potions:3,wins:0,heroes:HEROES.map(h=>({...h,maxHp:h.hp,maxMp:h.mp,level:1,xp:0,tier:0,promoted:false})),mode:'battle',log:[],round:1};}
export const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const alive=u=>Boolean(u && u.hp>0);
export function seeded(seed){let t=2166136261;for(const char of String(seed))t=Math.imul(t^char.charCodeAt(0),16777619)>>>0;return ()=>{t=(t+0x6D2B79F5)>>>0;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return ((z^z>>>14)>>>0)/4294967296;};}
export function generateMap(n){
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
export function startBattle(c){c.mode='battle';c.startingPotions=c.potions;c.tiles=generateMap(c.battle);c.round=1;c.selected=null;c.moved=false;c.guarding={};c.log=[];const ys=[4,5,3,6,2,7];c.units=c.heroes.map((h,i)=>({...h,side:'ally',x:1,y:ys[i]}));const n=c.battle,cycle=Math.floor(n/8),count=Math.min(5+Math.floor(n/2),10);c.enemies=[];
for(let i=0;i<count;i++){const type=(i+n)%4,scale=Math.floor(n*.7);const kinds=[['Raider','sword',1,4],['Bowman','bow',3,3],['Hexer','mage',2,3],['Bulwark','tank',1,3]];const [name,sprite,range,move]=kinds[type];const rotation=(n*3)%8;let x=12-Math.floor(i/8),y=1+(i+rotation)%8;if(TERRAIN[c.tiles[y][x]].cost>=99)c.tiles[y][x]=MAPS[n%8].ground;c.enemies.push({id:'e'+i,name,role:'Enemy',sprite,color:'#bd5c53',side:'enemy',x,y,hp:18+scale*2+cycle*3+(type===3?9:0),maxHp:18+scale*2+cycle*3+(type===3?9:0),mp:0,maxMp:0,atk:7+scale,def:type===3?5+Math.floor(scale/2):2+Math.floor(scale/3),speed:7+(i%4),range,move,level:n+1});}
if(n%8===7){const boss=c.enemies[0];Object.assign(boss,{name:'Ash Warlord',sprite:'tank',hp:boss.maxHp+30+cycle*2,maxHp:boss.maxHp+30+cycle*2,atk:boss.atk+5,def:boss.def+3});}
c.units.push(...c.enemies);c.queue=order(c);c.turn=0;addLog(c,MAPS[n%8].desc);return c;}
export function order(c){return c.units.filter(alive).sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id)).map(u=>u.id);}
export function active(c){return c.units?.find(u=>u.id===c.queue[c.turn]);}
export function unitAt(c,x,y){return c.units.find(u=>alive(u)&&u.x===x&&u.y===y);}
export function reachable(c,u){const costs=new Map([[u.x+','+u.y,0]]),pending=[{x:u.x,y:u.y,cost:0}];while(pending.length){pending.sort((a,b)=>a.cost-b.cost);const p=pending.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy;if(x<0||y<0||x>=W||y>=H)continue;const occupant=unitAt(c,x,y);if(occupant&&occupant.id!==u.id)continue;const terrain=TERRAIN[c.tiles[y][x]];if(terrain.cost>=99)continue;const cost=p.cost+terrain.cost,key=x+','+y;if(cost<=u.move&&(!costs.has(key)||cost<costs.get(key))){costs.set(key,cost);pending.push({x,y,cost});}}}return costs;}
export function moveUnit(c,x,y){const u=active(c);if(c.mode!=='battle'||!alive(u)||c.moved||u.side!=='ally'||!Number.isInteger(x)||!Number.isInteger(y))return false;const cells=reachable(c,u);if(!cells.has(x+','+y))return false;u.x=x;u.y=y;c.moved=true;return true;}
export function damage(c,a,b,power=0,ignore=false){const armor=ignore?0:b.def+TERRAIN[c.tiles[b.y][b.x]].def+(c.guarding[b.id]?3:0);return Math.max(2,a.atk+power-armor);}
export function addLog(c,s){c.log.unshift(s);c.log=c.log.slice(0,25);}
function hit(c,a,b,power=0,ignore=false){const d=damage(c,a,b,power,ignore);b.hp=Math.max(0,b.hp-d);addLog(c,`${a.name} hits ${b.name} for ${d}${!b.hp?' · defeated':''}.`);if(a.side==='ally'){a.xp+=!b.hp?18:7;}return d;}
export const skillRange=u=>({rhea:1,bram:0,lyra:4,orin:3,sana:3,finn:2}[u?.id]);
export const healingPower=u=>15+(u.tier||0)*3;
export function validTarget(c,u,t,action){
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
export function previewEffect(c,u,t,action='attack'){
 if(!validTarget(c,u,t,action))return null;
 if(action==='attack')return {kind:'damage',amount:Math.min(t.hp,damage(c,u,t))};
 if(u.id==='sana')return {kind:'heal',amount:Math.min(t.maxHp-t.hp,healingPower(u))};
 if(u.id==='bram')return {kind:'rally',amount:8};
 const power=u.id==='orin'?7:u.id==='rhea'?3:5;
 return {kind:'damage',amount:Math.min(t.hp,damage(c,u,t,power,u.id!=='rhea'))};
}
export function act(c,action,targetId){const u=active(c);if(c.mode!=='battle'||!alive(u)||u.side!=='ally'||!['attack','skill','guard','potion'].includes(action))return false;const t=c.units.find(v=>v.id===targetId);
if(action==='guard'){c.guarding[u.id]=true;u.mp=Math.min(u.maxMp,u.mp+1);addLog(c,`${u.name} guards (+3 armor) and recovers 1 MP.`);}
else if(action==='potion'){if(c.potions<1||u.hp===u.maxHp)return false;c.potions--;u.hp=Math.min(u.maxHp,u.hp+22);addLog(c,`${u.name} drinks a tonic (+22 HP).`);}
else {if(!validTarget(c,u,t,action))return false;if(action==='attack')hit(c,u,t);else{u.mp-=u.cost;if(u.id==='sana'){t.hp=Math.min(t.maxHp,t.hp+healingPower(u));u.xp+=10;addLog(c,`${u.name} mends ${t.name}.`);}else if(u.id==='bram'){for(const v of c.units.filter(v=>v.side==='ally'&&alive(v)&&distance(u,v)<=2))v.hp=Math.min(v.maxHp,v.hp+8);c.guarding[u.id]=true;u.xp+=10;addLog(c,'Bram rallies nearby allies (+8 HP).');}else if(['orin','rhea'].includes(u.id)){const targets=c.units.filter(v=>v.side==='enemy'&&alive(v)&&distance(v,t)<=1);for(const v of targets)hit(c,u,v,u.id==='orin'?7:3,u.id==='orin');}else hit(c,u,t,5,true);}}
finishTurn(c);return true;}
export function finishTurn(c){if(checkEnd(c))return;c.turn++;while(c.turn<c.queue.length&&!alive(c.units.find(u=>u.id===c.queue[c.turn])))c.turn++;if(c.turn>=c.queue.length){c.round++;c.queue=order(c);c.turn=0;}c.moved=false;const u=active(c);delete c.guarding[u.id];}
export function checkEnd(c){if(c.mode!=='battle')return true;if(!c.units.some(u=>u.side==='ally'&&alive(u))){c.mode='defeat';addLog(c,'The company has fallen. Regroup and try again.');return true;}if(!c.units.some(u=>u.side==='enemy'&&alive(u))){c.mode='victory';c.reward=85+c.battle*18;c.gold+=c.reward;c.wins++;for(const h of c.heroes){const u=c.units.find(u=>u.id===h.id);h.hp=u.hp;h.mp=u.mp;h.xp=u.xp+22;while(h.xp>=45){h.xp-=45;h.level++;h.maxHp+=3;h.hp=Math.min(h.maxHp,h.hp+3);h.atk++;if(h.level%2===0){h.def++;h.maxMp++;}}}return true;}return false;}
// Reverse weighted paths to every legal attack position around a target.
// Unlike straight-line distance, these guide units around walls and river bends.
export function approachCosts(c,u,target){
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
export function enemyTurn(c){
 const u=active(c);
 if(c.mode!=='battle'||!alive(u)||u.side!=='enemy')return false;
 if(checkEnd(c))return false;
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
 if(choice){u.x=choice.x;u.y=choice.y;}
 if(choice&&distance(u,choice.t)<=u.range)hit(c,u,choice.t);
 else addLog(c,`${u.name} ${choice?'advances':'holds position'}.`);
 finishTurn(c);return true;
}
export function enterCamp(c){if(c.mode!=='victory')return false;c.mode='camp';for(const h of c.heroes){h.hp=Math.max(h.hp,Math.ceil(h.maxHp*.5));h.mp=Math.min(h.maxMp,h.mp+4);}return true;}
export function campAction(c,action,id){if(c.mode!=='camp')return false;const h=c.heroes.find(h=>h.id===id);let cost=0;if(action==='rest'){cost=35;if(c.gold<cost||c.heroes.every(h=>h.hp===h.maxHp&&h.mp===h.maxMp))return false;for(const h of c.heroes){h.hp=h.maxHp;h.mp=h.maxMp;}}
else if(action==='tonic'){cost=18;if(c.gold<cost)return false;c.potions++;}
else if(action==='upgrade'){if(!h||h.tier>=5)return false;cost=45+h.tier*30;if(c.gold<cost)return false;h.tier++;h.atk+=2;}
else if(action==='promote'){cost=100;if(!h||h.level<3||h.promoted||c.gold<cost)return false;h.promoted=true;h.atk+=3;h.def+=2;h.maxHp+=8;h.hp=Math.min(h.maxHp,h.hp+8);h.maxMp+=3;h.mp+=3;}
else return false;c.gold-=cost;return true;}
