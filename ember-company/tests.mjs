import assert from 'node:assert/strict';
import * as E from './engine.js';
import * as P from './persistence.js';
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
const fresh=()=>E.startBattle(E.createCampaign());
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
  const loaded=P.restoreCampaign(JSON.stringify(c));assert.ok(loaded);
  assert.equal(loaded.units[0].x,1);
  assert.equal(loaded.heroes[0].name,'Rhea');
});

test('malformed saves fail safely and never inject display strings', () => {
  for(const raw of [null,'null','[]','{}','{oops','x'.repeat(100001)])assert.equal(P.restoreCampaign(raw),null);
  const cases=[s=>s.heroes[0].hp=-1,s=>s.heroes[0].maxHp=0,
    s=>s.heroes[0].mp=1e13,s=>s.heroes[0].tier=7,
    s=>s.heroes[0].id=s.heroes[1].id,s=>s.heroes[0]=null,
    s=>s.battle=0.5,s=>s.potions=-1,s=>s.gold='100',s=>s.heroes[0].move=999];
  for(const mutate of cases){const s=P.campaignSave(fresh());mutate(s);assert.equal(P.restoreCampaign(JSON.stringify(s)),null);}
  const s=P.campaignSave(fresh());s.heroes[0].name='<img src=x onerror=alert(1)>';
  assert.equal(P.restoreCampaign(JSON.stringify(s)).heroes[0].name,'Rhea');
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
test('complete eight consecutive encounters using public gameplay actions',()=>{const c=fresh();for(let n=0;n<8;n++){let turns=0;while(c.mode==='battle'&&turns<1500){if(E.active(c).side==='enemy')E.enemyTurn(c);else player(c);turns++;}assert.equal(c.mode,'victory',`encounter ${n+1}: ${c.mode} after ${turns} actions`);console.log(`  Encounter ${n+1}: won in ${turns} actions, ${c.round} rounds`);E.enterCamp(c);E.campAction(c,'rest');for(const h of c.heroes){if(h.level>=3&&!h.promoted)E.campAction(c,'promote',h.id);E.campAction(c,'upgrade',h.id);}c.battle++;E.startBattle(c);}});
console.log(`\n${checks} checks passed.`);
