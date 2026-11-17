/* Pure simulation: no DOM, clocks, storage, or browser dependencies. */
(function(root,factory){if(typeof module==='object')module.exports=factory(require('./data.js'));else root.Starhaven=factory(root.StarhavenData);})(typeof globalThis!=='undefined'?globalThis:this,function(D){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class Game{
 constructor({mission=0,mode='campaign',companions=['pip'],petUpgrades=[],seed=12345,unlocked=0}={}){
  this.mission=D.missions[clamp(mission,0,20)];this.mode=mode;this.unlocked=Math.max(unlocked,this.mission.id);this.rng=seed>>>0||1;this.id=0;this.time=0;this.credits=mode==='sanctuary'?1200:this.mission.starting;this.hull=100;this.beacons=0;this.status='playing';this.creatures=[];this.food=[];this.drops=[];this.enemies=[];this.effects=[];this.events=[];this.upgrades={food:0,capacity:0,cannon:0};this.selectedFood='matter';this.cooldown=0;this.nextThreat=mode==='sanctuary'?Infinity:38;this.rescue=true;this.lost=0;this.earned=0;this.kills=0;this.companions=companions;this.petUpgrades=petUpgrades;this.petTimers={};this.shield=companions.includes('halo');this.flagshipSpawned=false;this.flagshipDefeated=false;
  this.addCreature('amoeba',360,250);this.addCreature('amoeba',530,330);
 }
 random(){this.rng=(Math.imul(this.rng,1664525)+1013904223)>>>0;return this.rng/4294967296;}
 event(message){this.events.push(message);if(this.events.length>8)this.events.shift();}
 addCreature(type,x=120+this.random()*700,y=120+this.random()*340){const c={id:++this.id,type,x,y,vx:(this.random()-.5)*12,vy:(this.random()-.5)*12,hunger:90,growth:0,production:0,wander:this.random()*6.28};this.creatures.push(c);return c;}
 stage(c){return c.growth>=8?2:c.growth>=3?1:0;}
 price(key){if(D.species[key])return Math.round(D.species[key].cost*(this.mode==='escalation'?1+this.time/240:1));if(key==='beacon')return Math.round(this.mission.beacon*(1+this.beacons*.4)*(this.mode==='escalation'?1+this.time/300:1));if(key==='repair')return 90;return {food:110,capacity:90,cannon:140}[key]*(1+this.upgrades[key]);}
 buy(key){if(this.status!=='playing')return false;const price=this.price(key);if(!Number.isFinite(price)||this.credits<price)return false;
  if(D.species[key]){if(this.unlocked<D.species[key].unlock||this.creatures.length>=40)return false;this.addCreature(key);}
  else if(key==='beacon'){if(this.mode==='sanctuary'||this.mode==='time'||this.beacons>=3)return false;this.beacons++;this.event(`Beacon component ${this.beacons}/3 installed`);}
  else if(key==='repair'){if(this.hull>=100)return false;this.hull=Math.min(100,this.hull+30);}
  else if(key in this.upgrades){if(this.upgrades[key]>=4)return false;this.upgrades[key]++;}else return false;
  this.credits-=price;this.checkWin();return true;
 }
 feed(x,y,free=false,type=this.selectedFood){if(this.status!=='playing'||this.food.length>=5+this.upgrades.capacity*4)return false;if(!['matter','plankton'].includes(type)||type==='plankton'&&this.unlocked<10)return false;const cost=type==='plankton'?6:2;if(!free&&this.credits<cost)return false;if(!free)this.credits-=cost;this.food.push({id:++this.id,type,x:clamp(x,35,925),y:clamp(y,45,565),life:22});return true;}
 drop(type,x,y,stage=0){this.drops.push({id:++this.id,type,x,y,life:type==='solar'||type==='plankton'?28:this.companions.includes('tether')?(this.petUpgrades.includes('tether')?45:30):15,value:Math.round(D.resources[type].value*(type==='mineral'?[1,2,4][stage]:1+stage*.2))});}
 collect(id){if(this.status!=='playing')return false;const i=this.drops.findIndex(d=>d.id===id&&d.value>0);if(i<0)return false;const d=this.drops.splice(i,1)[0];this.credits+=d.value;this.earned+=d.value;this.effects.push({x:d.x,y:d.y,text:`+${d.value}`,life:1,color:D.resources[d.type].color});return true;}
 gather(){for(const d of [...this.drops])this.collect(d.id);}
 shoot(id){if(this.status!=='playing'||this.cooldown>0)return false;const e=this.enemies.find(e=>e.id===id);if(!e)return false;this.cooldown=.2;this.hit(e,10+this.upgrades.cannon*7);return true;}
 hit(e,damage){e.hp-=damage;this.effects.push({x:e.x,y:e.y,text:'✦',life:.25,color:'#ffb6a3'});if(e.hp<=0){this.enemies=this.enemies.filter(x=>x!==e);this.kills++;if(e.type==='flagship')this.flagshipDefeated=true;this.drop('mineral',e.x,e.y,2);this.event(`${e.type==='flagship'?'Flagship':'Threat'} neutralized`);this.checkWin();}}
 damage(amount){if(this.shield){this.shield=false;this.event('Halo absorbed an impact');return;}this.hull=clamp(this.hull-amount,0,100);if(this.hull===0){this.status='lost';this.event('Hull integrity lost');}}
 spawn(type){type=type||(['parasite','pirate',...(this.mission.id>=10?['asteroid','leech']:[])][Math.floor(this.random()*(this.mission.id>=10?4:2))]);const hp=(type==='asteroid'?35:type==='flagship'?600:type==='leech'?60:45)*this.mission.difficulty;this.enemies.push({id:++this.id,type,x:60+this.random()*840,y:70,hp,maxHp:hp,attack:0,age:0});this.event(type==='flagship'?'PIRATE FLAGSHIP — defend the Ark!':`Incoming ${type} — hold to fire!`);}
 produce(c){const s=D.species[c.type];this.drop(s.output,c.x,c.y,this.stage(c));if(c.type==='amoeba'&&this.stage(c)>0)this.drop('solar',c.x+18,c.y+5);}
 checkWin(){if(this.status!=='playing')return;if(this.beacons>=3&&(this.mission.id!==20||this.flagshipDefeated)){this.status='won';this.event('Jump beacon online. Sanctuary secured.');}}
 update(dt){if(this.status!=='playing')return;dt=clamp(dt,0,.1);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.effects=this.effects.filter(e=>(e.life-=dt)>0);
  for(const f of this.food){f.y+=8*dt;f.life-=dt;}for(const d of this.drops){d.y+=5*dt;d.life-=dt;}this.food=this.food.filter(f=>f.life>0&&f.y<580);this.drops=this.drops.filter(d=>d.life>0&&d.y<585);
  for(const c of [...this.creatures]){const s=D.species[c.type];c.hunger-=dt*100/s.hunger*(this.mode==='sanctuary'?.25:1);const candidates=s.food==='matter'?this.food.filter(f=>f.type==='matter'):s.food==='plankton'?[...this.food.filter(f=>f.type==='plankton'),...this.drops.filter(d=>d.type==='plankton')]:this.drops.filter(d=>d.type===s.food);let target=candidates.reduce((a,b)=>!a||Math.hypot(b.x-c.x,b.y-c.y)<Math.hypot(a.x-c.x,a.y-c.y)?b:a,null);if(c.hunger>85)target=null;
   if(target){const dx=target.x-c.x,dy=target.y-c.y,dist=Math.hypot(dx,dy);c.vx+=(dx/(dist||1)*55-c.vx)*dt*2;c.vy+=(dy/(dist||1)*55-c.vy)*dt*2;if(dist<s.radius+8){c.hunger=clamp(c.hunger+42+this.upgrades.food*9,0,100);c.growth+=1+this.upgrades.food*.25;this.food=this.food.filter(f=>f!==target);this.drops=this.drops.filter(d=>d!==target);}}
   else{c.wander+=dt*.35;c.vx+=(Math.cos(c.wander+c.id)*12-c.vx)*dt;c.vy+=(Math.sin(c.wander*.7)*9-c.vy)*dt;}
   c.x=clamp(c.x+c.vx*dt,55,905);c.y=clamp(c.y+c.vy*dt,85,535);if(c.x<=55||c.x>=905)c.vx*=-1;if(c.y<=85||c.y>=535)c.vy*=-1;
   if(c.hunger>15){c.production+=dt*(1+this.stage(c)*.15);if(c.production>=s.interval){c.production=0;this.produce(c);}}if(c.hunger<=0&&this.mode!=='sanctuary'){this.creatures=this.creatures.filter(x=>x!==c);this.lost++;this.event(`${s.short} lost — keep food near hungry creatures`);}else if(this.mode==='sanctuary')c.hunger=Math.max(5,c.hunger);
  }
  if(!this.creatures.length){if(this.rescue){this.rescue=false;this.addCreature('amoeba');this.addCreature('amoeba');this.credits=Math.max(100,this.credits);this.event('Emergency capsule deployed: two amoebas and feeding funds.');}else{this.status='lost';this.event('The ecosystem was lost. Try again.');}}
  if(this.mode!=='sanctuary'){
   if(this.time>=this.nextThreat){this.spawn();if(this.mission.id%5===4)this.spawn('parasite');this.nextThreat=this.time+this.mission.threatEvery;}
   if(this.mission.id===20&&!this.flagshipSpawned&&this.time>65){this.spawn('flagship');this.flagshipSpawned=true;}
   for(const e of [...this.enemies]){e.age+=dt;e.attack+=dt;if(e.type==='asteroid'){e.y+=45*dt;if(e.y>=530){this.damage(18);this.enemies=this.enemies.filter(x=>x!==e);}}
    else{const target=this.creatures[0];if(target){e.x+=(target.x-e.x)*dt*.25;e.y+=(target.y-e.y)*dt*.25;}if(e.attack>= (e.type==='flagship'?3:6)){e.attack=0;this.damage(e.type==='flagship'?8:5);if(e.type==='pirate')this.credits=Math.max(0,this.credits-20);if(e.type==='parasite'&&target)target.hunger-=14;}}
   }
  }
  for(const pet of this.companions){this.petTimers[pet]=(this.petTimers[pet]||0)+dt;const intervals={pip:5,halo:12,zip:2,sol:4,mender:4,luma:8,echo:14};if(this.petTimers[pet]<(intervals[pet]||Infinity)*(this.petUpgrades.includes(pet)?.75:1))continue;this.petTimers[pet]=0;
   if(pet==='pip'){const d=this.drops.find(d=>d.value>0);if(d)this.collect(d.id);}if(pet==='halo')this.shield=true;if(pet==='zip'&&this.enemies.length)this.hit(this.enemies[0],8);if(pet==='sol')this.feed(100+this.random()*760,100+this.random()*320,true,'matter');if(pet==='mender'&&!this.enemies.length)this.hull=Math.min(100,this.hull+2);if(pet==='luma'&&this.creatures.length){const c=this.creatures[Math.floor(this.random()*this.creatures.length)];c.hunger=Math.min(100,c.hunger+20);c.growth++;}if(pet==='echo'&&this.creatures.length)this.produce(this.creatures[Math.floor(this.random()*this.creatures.length)]);
  }
  if(this.mode==='time'&&this.time>=300){this.status='won';this.event('Time run complete!');}if(this.enemies.length>12)this.enemies=this.enemies.slice(-12);if(this.drops.length>160)this.drops=this.drops.slice(-160);
 }
}
function defaultProfile(){return {version:1,completed:[],records:{},research:0,selected:['pip'],petUpgrades:[],settings:{sound:false,motion:true},sanctuary:null};}
function parseProfile(input){const p=typeof input==='string'?JSON.parse(input):input;if(!p||p.version!==1||!Array.isArray(p.completed)||p.completed.length>21||p.completed.some(n=>!Number.isInteger(n)||n<0||n>20)||!Number.isFinite(p.research)||p.research<0||p.research>1e9)throw Error('Invalid Starhaven save');const clean=defaultProfile();clean.completed=[...new Set(p.completed)].sort((a,b)=>a-b);clean.research=Math.floor(p.research);clean.selected=Array.isArray(p.selected)?[...new Set(p.selected)].filter(id=>D.companions.some(c=>c.id===id)).slice(0,3):['pip'];clean.petUpgrades=Array.isArray(p.petUpgrades)?[...new Set(p.petUpgrades)].filter(id=>D.companions.some(c=>c.id===id)).slice(0,8):[];clean.settings={sound:!!p.settings?.sound,motion:p.settings?.motion!==false};for(const [key,r] of Object.entries(p.records||{})){if(/^\d+$/.test(key)&&+key<21&&r&&Number.isFinite(r.time)&&r.time>=0&&Number.isFinite(r.hull)&&r.hull>=0&&r.hull<=100&&Number.isFinite(r.lost)&&r.lost>=0)clean.records[key]={time:r.time,hull:r.hull,lost:r.lost};}if(p.sanctuary&&Array.isArray(p.sanctuary.creatures)&&p.sanctuary.creatures.length<=40){clean.sanctuary={credits:clamp(Number(p.sanctuary.credits)||0,0,1e9),creatures:p.sanctuary.creatures.filter(c=>D.species[c.type]).map(c=>({type:c.type,growth:clamp(Number(c.growth)||0,0,100),x:clamp(Number(c.x)||480,55,905),y:clamp(Number(c.y)||300,85,535)}))};}return clean;}
function unlocked(p){for(let i=0;i<21;i++)if(!p.completed.includes(i))return i;return 20;}
function reward(p,g){if(g.status!=='won'||g.mode==='sanctuary')return 0;let value=20;if(g.mode==='campaign'){if(!p.completed.includes(g.mission.id)){p.completed.push(g.mission.id);value=100+g.mission.id*15;}const old=p.records[g.mission.id];if(!old||g.time<old.time)p.records[g.mission.id]={time:g.time,hull:Math.round(g.hull),lost:g.lost};}else value=Math.min(150,20+Math.floor(g.earned/100));p.research+=value;return value;}
return {Game,defaultProfile,parseProfile,unlocked,reward,clamp};
});
