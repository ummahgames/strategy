import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import './engine.js';
const E=globalThis.EmberEngine;
import './persistence.js';
const P=globalThis.EmberPersistence;
import './animations.js';
const A=globalThis.EmberAnimations;
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const fresh=()=>{const c=E.createCampaign();c.heroes.forEach(h=>h.unlocked=true);return E.startBattle(c);};
test('six distinct heroes, first actor and legal starts',()=>{const c=fresh();assert.equal(c.heroes.length,6);assert.equal(E.active(c).id,'finn');assert.equal(new Set(c.units.map(u=>u.x+','+u.y)).size,c.units.length);});
test('every map connects starting army to enemies without crossing blockers',()=>{for(let n=0;n<160;n++){const c=E.createCampaign();c.battle=n;E.startBattle(c);const unit={...c.units[0],move:1000};const reachable=E.reachable({...c,units:[unit]},unit);for(const v of c.units){assert.ok(E.TERRAIN[c.tiles[v.y][v.x]].cost<99,`walkable spawn ${n}`);assert.ok(reachable.has(v.x+','+v.y),`map ${n} reachable ${v.id}`);}}});
test('movement obeys costs, occupancy, and once-per-turn constraint',()=>{const c=fresh(),u=E.active(c);assert.equal(E.moveUnit(c,12,7),false);assert.equal(E.moveUnit(c,1,6),false);assert.equal(E.moveUnit(c,3,7),true);assert.equal(E.moveUnit(c,4,7),false);assert.equal(u.x,3);});
test('out-of-range attacks and insufficient MP do not spend turn',()=>{const c=fresh(),id=E.active(c).id;assert.equal(E.act(c,'attack','e0'),false);assert.equal(E.active(c).id,id);E.active(c).mp=0;assert.equal(E.act(c,'skill','e0'),false);assert.equal(E.active(c).id,id);});
test('armor, terrain, and guarding reduce damage with minimum floor',()=>{const c=fresh(),a=E.active(c),b=c.units.find(u=>u.side==='enemy');b.def=2;c.tiles[b.y][b.x]='g';const base=E.damage(c,a,b);c.tiles[b.y][b.x]='f';assert.equal(E.damage(c,a,b),base-2);c.guarding[b.id]=true;assert.equal(E.damage(c,a,b),Math.max(2,base-5));assert.equal(E.damage(c,a,b,0,true),a.atk);});
test('guard restores MP and persists through opponents turns',()=>{const c=fresh(),u=E.active(c);u.mp=0;E.act(c,'guard',u.id);assert.equal(u.mp,1);assert.equal(c.guarding[u.id],true);assert.notEqual(E.active(c).id,u.id);});
test('mend heals a friendly target and consumes MP',()=>{const c=fresh();c.turn=c.queue.indexOf('sana');const u=E.active(c),t=c.units.find(v=>v.id==='rhea');t.hp=5;const mp=u.mp;assert.equal(E.act(c,'skill',t.id),true);assert.equal(t.hp,20);assert.equal(u.mp,mp-3);});
test('fireburst damages a cross of enemies and leaves allies untouched',()=>{const c=fresh();c.turn=c.queue.indexOf('orin');const u=E.active(c);u.x=8;u.y=5;const enemies=c.units.filter(v=>v.side==='enemy');enemies[0].x=10;enemies[0].y=5;enemies[1].x=10;enemies[1].y=6;const before=enemies.slice(0,2).map(e=>e.hp),ally=c.units[0],hp=ally.hp;assert.ok(E.act(c,'skill',enemies[0].id));assert.ok(enemies[0].hp<before[0]);assert.ok(enemies[1].hp<before[1]);assert.equal(ally.hp,hp);});
test('victory awards once, camp revives, upgrades charge exact amount',()=>{const c=fresh();c.units.filter(v=>v.side==='enemy').forEach(v=>v.hp=0);c.units.find(v=>v.id==='rhea').hp=0;assert.ok(E.checkEnd(c));assert.equal(c.mode,'victory');assert.equal(c.gold,205);E.checkEnd(c);assert.equal(c.gold,205);assert.ok(E.enterCamp(c));assert.ok(c.heroes[0].hp>=c.heroes[0].maxHp/2);const atk=c.heroes[0].atk;assert.ok(E.campAction(c,'upgrade','rhea'));assert.equal(c.gold,160);assert.equal(c.heroes[0].atk,atk+2);assert.ok(E.campAction(c,'rest'));assert.ok(c.heroes.every(h=>h.hp===h.maxHp&&h.mp===h.maxMp));});
test('camp cannot overspend or bypass promotion requirements',()=>{const c=fresh();c.mode='camp';c.gold=1;assert.equal(E.campAction(c,'upgrade','rhea'),false);assert.equal(E.campAction(c,'rest'),false);c.gold=500;assert.equal(E.campAction(c,'promote','rhea'),false);c.heroes[0].level=3;assert.ok(E.campAction(c,'promote','rhea'));assert.equal(c.gold,400);assert.equal(E.campAction(c,'promote','rhea'),false);});
test('enemy AI progresses and only takes a single legal turn',()=>{const c=fresh();c.turn=c.queue.findIndex(id=>id.startsWith('e'));const u=E.active(c),before={x:u.x,y:u.y},legal=E.reachable(c,u);assert.ok(E.enemyTurn(c));assert.ok(legal.has(u.x+','+u.y));assert.notEqual(E.active(c).id,u.id);assert.ok(E.distance(before,u)<=u.move);});
test('cliffs and water remain impassable at any movement budget', () => {
  const c=fresh(),u=E.active(c);
  c.units=[u];u.x=1;u.y=4;u.move=1000;
  c.tiles=Array.from({length:E.H},()=>Array(E.W).fill('g'));
  for(let y=0;y<E.H;y++)c.tiles[y][4]=y%2?'m':'w';
  const reach=E.reachable(c,u);
  assert.ok(!reach.has('4,4'));
  assert.ok(!reach.has('5,4'));
});

test('invalid actions, dead actors, and noninteger movement do not mutate a turn', () => {
  const c=fresh(),u=E.active(c),enemy=c.units.find(v=>v.side==='enemy');
  enemy.x=u.x+1;enemy.y=u.y;
  const before=JSON.stringify(c);
  assert.equal(E.act(c,'unexpected',enemy.id),false);
  assert.equal(E.moveUnit(c,'2',4),false);
  assert.equal(E.moveUnit(c,NaN,4),false);
  assert.equal(JSON.stringify(c),before);
  u.hp=0;
  assert.equal(E.act(c,'guard',u.id),false);
  assert.equal(E.moveUnit(c,2,4),false);
});

test('a full-health Mend cannot spend mana or farm experience', () => {
  const c=fresh();c.turn=c.queue.indexOf('sana');
  const before=JSON.stringify(c);
  assert.equal(E.act(c,'skill','sana'),false);
  assert.equal(JSON.stringify(c),before);
});

test('spell and attack forecasts match the actual target HP change', () => {
  for(const id of ['rhea','lyra','orin','finn','sana']){
    const c=fresh();c.turn=c.queue.indexOf(id);const u=E.active(c);
    const t=c.units.find(v=>v.id===(id==='sana'?'rhea':'e0'));
    t.x=3;t.y=4;u.x=2;u.y=4;t.hp=id==='sana'?5:t.maxHp;
    if(id==='sana')u.tier=2;
    const predicted=E.previewEffect(c,u,t,'skill'),hp=t.hp;
    assert.ok(predicted);assert.ok(E.act(c,'skill',t.id));
    assert.equal(Math.abs(t.hp-hp),predicted.amount,id);
  }
  const c=fresh(),u=E.active(c),t=c.units.find(v=>v.id==='e0');
  t.x=13;t.y=0;
  assert.equal(E.previewEffect(c,u,t,'attack'),null);
});

test('initiative skips defeated units and each survivor acts once per round', () => {
  const c=fresh(),first=E.active(c).id,dead=c.units.find(v=>v.id===c.queue[1]);dead.hp=0;
  const seen=[];
  while(c.round===1){seen.push(E.active(c).id);E.finishTurn(c);}
  assert.equal(new Set(seen).size,seen.length);
  assert.ok(!seen.includes(dead.id));
  assert.equal(E.active(c).id,first);
});

test('guard expires at the start of its owners next turn', () => {
  const c=fresh(),u=E.active(c);E.act(c,'guard',u.id);
  assert.ok(c.guarding[u.id]);
  while(c.round===1)E.finishTurn(c);
  assert.equal(E.active(c).id,u.id);
  assert.equal(c.guarding[u.id],undefined);
});

test('enemy pathfinding takes a detour around a long wall', () => {
  const c=fresh(),hero=c.units[0],enemy=c.units.find(v=>v.id==='e0');
  hero.x=7;hero.y=4;hero.hp=hero.maxHp=1000;
  enemy.x=3;enemy.y=4;enemy.range=1;enemy.move=3;
  c.units=[enemy,hero];c.queue=[enemy.id,hero.id];c.turn=0;
  c.tiles=Array.from({length:E.H},()=>Array(E.W).fill('g'));
  for(let y=0;y<9;y++)c.tiles[y][4]='m';
  const distance=E.distance(hero,enemy);
  E.enemyTurn(c);
  assert.ok(E.distance(hero,enemy)>distance,'first move must go away from target');
  for(let i=0;i<15&&hero.hp===hero.maxHp;i++){
    if(E.active(c).side==='ally')E.act(c,'guard',hero.id);
    else E.enemyTurn(c);
  }
  assert.ok(hero.hp<hero.maxHp,'enemy must eventually reach and attack');
});

test('warlords remain stronger than their escorts in later expeditions', () => {
  for(let n=7;n<200;n+=8){
    const c=E.createCampaign();c.battle=n;E.startBattle(c);
    const [boss,...escorts]=c.enemies;
    assert.equal(boss.name,'The Ash Regent');
    for(const e of escorts){assert.ok(boss.hp>e.hp);assert.ok(boss.atk>e.atk);assert.ok(boss.def>e.def);}
  }
});

test('camp enforces maximum weapon tiers, revival, and exact supply costs', () => {
  const c=fresh();c.mode='camp';c.gold=10000;
  for(let i=0;i<5;i++)assert.ok(E.campAction(c,'upgrade','rhea'));
  const before=JSON.stringify(c);
  assert.equal(E.campAction(c,'upgrade','rhea'),false);
  assert.equal(JSON.stringify(c),before);
  const gold=c.gold,potions=c.potions;
  assert.ok(E.campAction(c,'tonic'));
  assert.equal(c.gold,gold-18);assert.equal(c.potions,potions+1);
});

test('resting a fully recovered company cannot waste gold', () => {
  const c=fresh();c.mode='camp';const before=c.gold;
  assert.equal(E.campAction(c,'rest'),false);assert.equal(c.gold,before);
});

test('company save preserves upgrades but discards tactical state and refunds field supplies', () => {
  const c=fresh(),initial=c.potions;c.mode='camp';
  E.campAction(c,'upgrade','rhea');c.heroes[0].level=3;c.gold=500;
  E.campAction(c,'promote','rhea');E.startBattle(c);
  const u=E.active(c);u.hp-=20;assert.ok(E.act(c,'potion',u.id));
  assert.equal(c.potions,initial-1);
  const save=P.campaignSave(c);
  assert.equal(save.potions,initial);
  for(const field of ['units','tiles','turn','queue','log'])assert.ok(!(field in save));
  const loaded=P.restoreCampaign(JSON.stringify(save));assert.ok(loaded);
  assert.equal(loaded.heroes[0].tier,1);assert.equal(loaded.heroes[0].promoted,true);
  assert.equal(loaded.potions,initial);assert.equal(loaded.round,1);
  assert.equal(E.active(loaded).id,'finn');
  assert.equal(JSON.stringify(P.campaignSave(loaded)),JSON.stringify(save));
});

test('victory reload applies free camp recovery exactly once', () => {
  const c=fresh();c.units.filter(v=>v.side==='enemy').forEach(v=>v.hp=0);
  c.units.find(v=>v.id==='sana').mp=0;c.units.find(v=>v.id==='rhea').hp=0;
  E.checkEnd(c);
  const save=P.campaignSave(c),loaded=P.restoreCampaign(JSON.stringify(save));
  assert.equal(loaded.mode,'camp');
  assert.equal(loaded.heroes.find(h=>h.id==='sana').mp,4);
  assert.ok(loaded.heroes[0].hp>=loaded.heroes[0].maxHp/2);
  const second=P.restoreCampaign(JSON.stringify(P.campaignSave(loaded)));
  assert.deepEqual(second.heroes,loaded.heroes);
});

test('legacy full-state saves migrate without loading stale unit coordinates', () => {
  const c=fresh();c.units[0].x=8;
  const legacyNames=['Rhea','Bram','Lyra','Orin','Sana','Finn'];
  c.heroes.forEach((h,i)=>h.name=legacyNames[i]);c.heroes[0].weapon='Dawnblade';
  const loaded=P.restoreCampaign(JSON.stringify(c));assert.ok(loaded);
  assert.equal(loaded.units[0].x,1);
  assert.equal(loaded.heroes[0].name,'Amira');
  assert.deepEqual(loaded.heroes.map(h=>h.name),['Amira','Kwame','Zuri','Arjun','Ayesha','Tariq']);
  assert.equal(loaded.heroes[0].weapon,'Dawn sabre');
  assert.equal(loaded.heroes[0].atk,c.heroes[0].atk);
});

test('malformed saves fail safely and never inject display strings', () => {
  for(const raw of [null,'null','[]','{}','{oops','x'.repeat(100001)])assert.equal(P.restoreCampaign(raw),null);
  const cases=[s=>s.heroes[0].hp=-1,s=>s.heroes[0].maxHp=0,
    s=>s.heroes[0].mp=1e13,s=>s.heroes[0].tier=7,
    s=>s.heroes[0].id=s.heroes[1].id,s=>s.heroes[0]=null,
    s=>s.battle=0.5,s=>s.potions=-1,s=>s.gold='100',s=>s.heroes[0].move=999];
  for(const mutate of cases){const s=P.campaignSave(fresh());mutate(s);assert.equal(P.restoreCampaign(JSON.stringify(s)),null);}
  const s=P.campaignSave(fresh());s.heroes[0].name='<img src=x onerror=alert(1)>';
  assert.equal(P.restoreCampaign(JSON.stringify(s)).heroes[0].name,'Amira');
  const dead=P.campaignSave(fresh());dead.heroes.forEach(h=>h.hp=0);
  assert.ok(E.alive(E.active(P.restoreCampaign(JSON.stringify(dead)))));
});

test('unavailable or full browser storage does not crash saving or loading', () => {
  const broken={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')}};
  assert.equal(P.readCompany(broken),null);assert.equal(P.writeCompany(broken,fresh()),false);
  assert.equal(P.readCompany(undefined),null);assert.equal(P.writeCompany(undefined,fresh()),false);
  let raw;const storage={getItem(){return raw},setItem(k,v){assert.equal(k,P.SAVE_KEY);raw=v;}};
  assert.ok(P.writeCompany(storage,fresh()));assert.ok(P.readCompany(storage));
});

test('large encounter seeds remain deterministic and keep random variation', () => {
  for(const seed of [1e7,1e9,Number.MAX_SAFE_INTEGER-100]){
    const a=E.seeded(seed),b=E.seeded(seed),values=[];
    for(let i=0;i<100;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);values.push(x);}
    assert.ok(new Set(values).size>95);
  }
});

test('independent flood fill validates 2000 procedural deployments and unique spawns', () => {
  for(let n=0;n<2000;n++){
    const c=E.createCampaign();c.battle=n;E.startBattle(c);
    const cells=new Set(['1,4']),queue=[[1,4]];
    while(queue.length){const [x,y]=queue.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const xx=x+dx,yy=y+dy,key=xx+','+yy;
      if(xx<0||yy<0||xx>=E.W||yy>=E.H||cells.has(key)||['m','w'].includes(c.tiles[yy][xx]))continue;
      cells.add(key);queue.push([xx,yy]);
    }}
    const positions=c.units.map(u=>u.x+','+u.y);
    assert.equal(new Set(positions).size,c.units.length,`overlap on ${n}`);
    for(const key of positions)assert.ok(cells.has(key),`disconnected deployment ${n}: ${key}`);
  }
});

// A deterministic player exercising the same public move/action API as the UI.
function player(c){const u=E.active(c),foes=c.units.filter(v=>v.side==='enemy'&&E.alive(v)),friends=c.units.filter(v=>v.side==='ally'&&E.alive(v));let choice;
for(const key of E.reachable(c,u).keys()){const [x,y]=key.split(',').map(Number),ghost={...u,x,y};for(const t of foes){const d=E.distance(ghost,t),can=d<=u.range;let score=(can?1000+E.damage(c,ghost,t)*3+(t.hp<=E.damage(c,ghost,t)?200:0):0)-d*18+E.TERRAIN[c.tiles[y][x]].def*3;if(!choice||score>choice.score)choice={x,y,t,score};}}
if(u.id==='sana'&&u.mp>=3){let best;for(const t of friends){if(t.maxHp-t.hp<10)continue;for(const key of E.reachable(c,u).keys()){const [x,y]=key.split(',').map(Number);if(E.distance({x,y},t)<=3&&(!best||t.hp/t.maxHp<best.t.hp/best.t.maxHp))best={x,y,t};}}if(best){E.moveUnit(c,best.x,best.y);E.act(c,'skill',best.t.id);return;}}
E.moveUnit(c,choice.x,choice.y);const target=foes.find(t=>E.validTarget(c,u,t,'skill'));if(target&&['orin','rhea','lyra','finn'].includes(u.id)){E.act(c,'skill',target.id);return;}const t=foes.filter(t=>E.validTarget(c,u,t,'attack')).sort((a,b)=>a.hp-b.hp)[0];if(t)E.act(c,'attack',t.id);else if(u.hp<u.maxHp-15&&c.potions)E.act(c,'potion',u.id);else E.act(c,'guard',u.id);
}
test('procedural fields are deterministic and vary across repeated biomes',()=>{for(let n=0;n<100;n++){assert.deepEqual(E.generateMap(n),E.generateMap(n));assert.notDeepEqual(E.generateMap(n),E.generateMap(n+8));}});
test('complete 24 consecutive encounters using public gameplay actions',()=>{const c=E.startBattle(E.createCampaign());for(let n=0;n<24;n++){let turns=0;while(c.mode==='battle'&&turns<1500){if(E.active(c).side==='enemy')E.enemyTurn(c);else player(c);turns++;}assert.equal(c.mode,'victory',`encounter ${n+1}: ${c.mode} after ${turns} actions`);console.log(`  Encounter ${n+1}: won in ${turns} actions, ${c.round} rounds`);E.enterCamp(c);E.campAction(c,'rest');for(const h of c.heroes){if(h.level>=3&&!h.promoted)E.campAction(c,'promote',h.id);E.campAction(c,'upgrade',h.id);}c.battle++;E.startBattle(c);}});
test('animated movement follows legal weighted paths without diagonal shortcuts',()=>{
 for(let n=0;n<40;n++){
  const c=E.createCampaign();c.battle=n;E.startBattle(c);const u=E.active(c);
  for(const key of E.reachable(c,u).keys()){
   const [x,y]=key.split(',').map(Number),path=E.movementPath(c,u,x,y);
   assert.deepEqual(path[0],{x:u.x,y:u.y});assert.deepEqual(path.at(-1),{x,y});
   let cost=0;for(let i=1;i<path.length;i++){
    assert.equal(E.distance(path[i-1],path[i]),1);assert.ok(E.TERRAIN[c.tiles[path[i].y][path[i].x]].cost<99);
    cost+=E.TERRAIN[c.tiles[path[i].y][path[i].x]].cost;
   }
   assert.ok(cost<=u.move);
   assert.deepEqual(A.sampleMovement(path,0),{x:u.x,y:u.y,bob:0});
   const end=A.sampleMovement(path,1);assert.equal(end.x,x);assert.equal(end.y,y);
  }
 }
});

test('animation interpolation stays on route and respects reduced motion',()=>{
 const path=[{x:0,y:0},{x:1,y:0},{x:1,y:1}];
 const mid=A.sampleMovement(path,.25);assert.equal(mid.x,.5);assert.equal(mid.y,0);
 const corner=A.sampleMovement(path,.5);assert.equal(corner.x,1);assert.equal(corner.y,0);
 const later=A.sampleMovement(path,.75);assert.equal(later.x,1);assert.equal(later.y,.5);
 assert.deepEqual(A.sampleMovement(path,.25,true),{x:0,y:0,bob:0});
});

test('animation clock pauses and clamps long background-frame gaps',()=>{
 assert.deepEqual(A.timelineStep(100,5000,1000,true),{elapsed:100,progress:.1,done:false});
 assert.equal(A.timelineStep(100,5000,1000).elapsed,150);
 assert.equal(A.timelineStep(990,20,1000).done,true);
 assert.ok(A.timing().step>A.timing('quick').step);
 assert.ok(A.timing().attack>=1000);
});

test('planning enemy animation does not move units or spend a turn',()=>{
 const c=fresh();c.turn=c.queue.findIndex(id=>id.startsWith('e'));
 const before=JSON.stringify(c),plan=E.planEnemyTurn(c);assert.ok(plan);
 assert.equal(JSON.stringify(c),before);
 const path=E.movementPath(c,E.active(c),plan.x,plan.y);assert.ok(path);
 assert.ok(E.resolveEnemyTurn(c,plan));assert.notEqual(JSON.stringify(c),before);
});

test('action animations distinguish weapons, magic, healing, and guard',()=>{
 const byId=id=>E.HEROES.find(h=>h.id===id);
 assert.equal(A.attackKind(byId('orin'),'skill'),'fire');
 assert.equal(A.attackKind(byId('lyra'),'attack'),'arrow');
 assert.equal(A.attackKind(byId('rhea'),'attack'),'slash');
 assert.equal(A.attackKind(byId('sana'),'skill'),'heal');
 assert.equal(A.attackKind(byId('bram'),'guard'),'guard');
});

test('runtime dependencies also load as classic scripts without an HTTP module loader',()=>{
 const sandbox={console};
 for(const name of ['engine.js','persistence.js','animations.js','characters.js','art.js']){
  runInNewContext(readFileSync(new URL(name,import.meta.url),'utf8'),sandbox,{filename:name});
 }
 assert.equal(typeof sandbox.EmberEngine.startBattle,'function');
 assert.equal(typeof sandbox.EmberArt.drawMap,'function');
 assert.equal(typeof sandbox.EmberCharacters.draw,'function');
 assert.equal(typeof sandbox.EmberPersistence.readCompany,'function');
 assert.equal(typeof sandbox.EmberAnimations.sampleMovement,'function');
 const html=readFileSync(new URL('index.html',import.meta.url),'utf8');
 assert.ok(!html.includes('id="portrait"'));
 assert.ok(!html.includes('type="module"'));
 const scripts=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(scripts,['engine.js','persistence.js','animations.js','characters.js','art.js','app.js']);
});

test('new expeditions start with two heroes and a gentle first encounter',()=>{
 const c=E.startBattle(E.createCampaign());
 assert.deepEqual(E.party(c).map(h=>h.id),['rhea','sana']);
 assert.equal(c.units.filter(u=>u.side==='ally').length,2);
 assert.equal(c.enemies.length,2);assert.equal(E.active(c).id,'rhea');
 assert.ok(c.enemies.every(u=>u.hp<=14&&u.atk<=5));
});

test('recruits join at milestones and catch up without duplicate recruitment',()=>{
 const c=E.createCampaign();c.heroes[0].level=5;c.heroes.find(h=>h.id==='sana').level=5;
 for(const [wins,id] of [[2,'lyra'],[4,'bram'],[6,'orin'],[8,'finn']]){
  c.mode='victory';c.wins=wins;assert.ok(E.enterCamp(c));
  const h=c.heroes.find(h=>h.id===id);assert.ok(h.unlocked);assert.equal(h.level,5);
  assert.equal(E.unlockHero(c,id),false);
 }
 assert.equal(E.party(c).length,6);
});

test('early hiring enforces availability and costs',()=>{
 const c=E.createCampaign();c.mode='camp';c.gold=80;
 assert.equal(E.campAction(c,'recruit','lyra'),false);
 c.wins=1;assert.ok(E.campAction(c,'recruit','lyra'));assert.equal(c.gold,0);
 assert.equal(E.campAction(c,'recruit','lyra'),false);
 assert.equal(E.campAction(c,'upgrade','finn'),false);
});

test('locked heroes do not receive battle XP or enter initiative',()=>{
 const c=E.startBattle(E.createCampaign());
 c.units.filter(u=>u.side==='enemy').forEach(u=>u.hp=0);E.checkEnd(c);
 assert.equal(c.heroes.find(h=>h.id==='finn').xp,0);
 assert.equal(c.heroes.find(h=>h.id==='finn').level,1);
 assert.ok(!c.queue.includes('finn'));
});

test('legacy saves retain the full roster; new saves preserve recruit flags',()=>{
 const modern=P.campaignSave(E.startBattle(E.createCampaign()));
 const loaded=P.restoreCampaign(JSON.stringify(modern));assert.equal(E.party(loaded).length,2);
 const legacy=JSON.parse(JSON.stringify(modern));legacy.version=2;
 legacy.heroes.forEach(h=>delete h.unlocked);
 assert.equal(E.party(P.restoreCampaign(JSON.stringify(legacy))).length,6);
});

test('the first enemy drops a deterministic pickup exactly once',()=>{
 const c=fresh(),u=E.active(c),t=c.units.find(v=>v.id==='e0');
 u.x=3;u.y=4;t.x=4;t.y=4;t.hp=1;
 assert.ok(E.act(c,'attack',t.id));assert.equal(c.loot.length,1);
 assert.equal(c.loot[0].type,'herb');assert.equal(c.loot[0].x,4);
 E.dropLoot(c,t);assert.equal(c.loot.length,1);
});

test('battle pickups apply once and temporary buffs stay out of hero saves',()=>{
 for(const type of ['herb','ether','fury','ward','tonic','embersteel']){
  const c=fresh(),u=E.active(c),hp=u.hp,mp=u.mp,potions=c.potions;
  u.hp=5;u.mp=0;c.loot=[{uid:'test-drop',type,x:3,y:7}];
  assert.ok(E.moveUnit(c,3,7));assert.equal(c.loot.length,0);assert.equal(c.pickupRevision,1);
  if(type==='herb')assert.equal(u.hp,17);
  if(type==='ether')assert.equal(u.mp,6);
  if(type==='fury')assert.equal(u.tempAtk,3);
  if(type==='ward')assert.equal(u.tempDef,2);
  if(type==='tonic')assert.equal(c.potions,potions+1);
  if(type==='embersteel')assert.equal(c.inventory[0].type,'embersteel');
  E.collectLoot(c,u);assert.equal(c.pickupRevision,1);
  const save=P.campaignSave(c);assert.equal(save.inventory.length,0);
  assert.equal(save.potions,potions);
  assert.ok(!('tempAtk' in save.heroes[0]));
 }
});

test('rare equipment is recovered after victory and common supplies are salvaged',()=>{
 const c=fresh();c.loot=[{uid:'rare',type:'starforged',x:8,y:8},{uid:'common',type:'ether',x:8,y:7}];
 c.units.filter(u=>u.side==='enemy').forEach(u=>u.hp=0);E.checkEnd(c);
 assert.equal(c.inventory[0].uid,'rare');assert.equal(c.salvageGold,8);
 assert.equal(c.gold,120+c.reward+8);assert.equal(c.loot.length,0);
 const loaded=P.restoreCampaign(JSON.stringify(P.campaignSave(c)));assert.equal(loaded.inventory[0].type,'starforged');
});

test('equipment bonuses are applied once and cannot be shared or equipped mid-battle',()=>{
 const c=fresh();c.mode='camp';c.inventory=[{uid:'weapon-a',type:'starforged'},{uid:'relic-a',type:'ironward'}];
 assert.ok(E.equipItem(c,'rhea','weapon-a','equippedWeapon'));
 assert.ok(E.equipItem(c,'rhea','relic-a','equippedRelic'));
 assert.equal(E.equipItem(c,'sana','weapon-a','equippedWeapon'),false);
 const base=c.heroes[0].atk,def=c.heroes[0].def;
 E.startBattle(c);assert.equal(c.units.find(u=>u.id==='rhea').atk,base+5);assert.equal(c.units.find(u=>u.id==='rhea').def,def+4);
 E.startBattle(c);assert.equal(c.units.find(u=>u.id==='rhea').atk,base+5);
 assert.equal(E.equipItem(c,'rhea','','equippedWeapon'),false);
 const loaded=P.restoreCampaign(JSON.stringify(P.campaignSave(c)));assert.ok(loaded);assert.equal(loaded.heroes[0].equippedWeapon,'weapon-a');
});

test('equipped items cannot be sold and duplicate ownership is rejected on load',()=>{
 const c=fresh();c.mode='camp';c.inventory=[{uid:'weapon-a',type:'embersteel'}];
 E.equipItem(c,'rhea','weapon-a','equippedWeapon');assert.equal(E.sellItem(c,'weapon-a'),false);
 const save=P.campaignSave(c);save.heroes.find(h=>h.id==='sana').equippedWeapon='weapon-a';
 assert.equal(P.restoreCampaign(JSON.stringify(save)),null);
 E.equipItem(c,'rhea','','equippedWeapon');const gold=c.gold;
 assert.ok(E.sellItem(c,'weapon-a'));assert.equal(c.gold,gold+35);assert.equal(c.inventory.length,0);
});

test('enemy stats and numbers grow with later encounter levels',()=>{
 const a=E.startBattle(E.createCampaign()),b=E.createCampaign();b.battle=20;E.startBattle(b);
 assert.ok(b.enemies.length>a.enemies.length);
 assert.ok(b.enemies[0].atk>a.enemies[0].atk);assert.ok(b.enemies[0].hp>a.enemies[0].hp);
 assert.equal(b.enemies[0].level,21);
});

test('full-armory salvage cannot be farmed by restarting a battle',()=>{
 const c=fresh();c.inventory=Array.from({length:64},(_,i)=>({uid:'bag-'+i,type:'embersteel'}));
 E.startBattle(c);const gold=c.gold;
 c.loot=[{uid:'overflow-drop',type:'starforged',x:3,y:7}];
 assert.ok(E.moveUnit(c,3,7));assert.equal(c.gold,gold+40);assert.equal(c.inventory.length,64);
 const save=P.campaignSave(c);assert.equal(save.gold,gold);assert.equal(save.inventory.length,64);
 const loaded=P.restoreCampaign(JSON.stringify(save));assert.equal(loaded.gold,gold);
});

console.log(`\n${checks} checks passed.`);
