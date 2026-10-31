(function(root){
'use strict';
const {HEROES,ITEMS,createCampaign,startBattle,enterCamp}=root.EmberEngine;

const SAVE_KEY = root.EmberConfig?.storageKey||'ember-company-v1';
const integer = (value, min, max = Number.MAX_SAFE_INTEGER - 2) =>
  Number.isSafeInteger(value) && value >= min && value <= max;
const copy = value => JSON.parse(JSON.stringify(value));

// Persist company progression only. Restarting a field restores its starting
// supplies as well as its starting HP/MP; spending a tonic cannot lose it on reload.
function campaignSave(campaign) {
  let c = campaign;
  if (c.mode === 'victory') {
    c = copy(c);
    enterCamp(c);
  }
  return {
    version: 3,
    battle: c.battle,
    gold: c.mode === 'camp' ? c.gold : c.startingGold ?? c.gold,
    potions: c.mode === 'camp' ? c.potions : c.startingPotions ?? c.potions,
    wins: c.wins,
    mode: c.mode === 'camp' ? 'camp' : 'battle',
    inventory: copy(c.mode === 'camp' ? c.inventory ?? [] : c.startingInventory ?? c.inventory ?? []),
    heroes: c.heroes.map(h => Object.fromEntries([
      'id', 'hp', 'mp', 'maxHp', 'maxMp', 'atk', 'def', 'speed', 'move',
      'range', 'level', 'xp', 'tier', 'promoted', 'unlocked', 'equippedWeapon', 'equippedRelic'
    ].map(key => [key, h[key]])))
  };
}

function restoreCampaign(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 100_000) return null;
    const data = JSON.parse(raw);
    if (!data || ![1, 2, 3].includes(data.version) || !integer(data.battle, 0) ||
        !integer(data.gold, 0) || !integer(data.potions, 0) ||
        !integer(data.wins ?? 0, 0) || !Array.isArray(data.heroes) ||
        data.heroes.length !== HEROES.length) return null;
    const ids = data.heroes.map(h => h?.id);
    if (new Set(ids).size !== HEROES.length ||
        !HEROES.every(h => ids.includes(h.id))) return null;
    const inventory=data.inventory??[];
    if(!Array.isArray(inventory)||inventory.length>64||inventory.some(item=>
      !item||typeof item.uid!=='string'||!/^[-a-zA-Z0-9]{1,72}$/.test(item.uid)||!['weapon','relic'].includes(ITEMS[item.type]?.kind))||
      new Set(inventory.map(item=>item.uid)).size!==inventory.length)return null;
    const defaults = createCampaign();
    const heroes = defaults.heroes.map(base => {
      const saved = data.heroes.find(h => h.id === base.id);
      const h = { ...base };
      const limits = {
        maxHp: [1, 1e12], maxMp: [0, 1e12], hp: [0, 1e12], mp: [0, 1e12],
        atk: [1, 1e12], def: [0, 1e12], speed: [1, 100], move: [1, 20],
        range: [1, 14], level: [1, 1e9], xp: [0, 44], tier: [0, 5]
      };
      for (const [key, [min, max]] of Object.entries(limits)) {
        const value = saved[key] ?? base[key];
        if (!integer(value, min, max)) throw new Error('Invalid company stat');
        h[key] = value;
      }
      if (h.hp > h.maxHp || h.mp > h.maxMp ||
          (saved.promoted !== undefined && typeof saved.promoted !== 'boolean'))
        throw new Error('Invalid vitals');
      h.promoted = saved.promoted ?? false;
      if(data.version===3&&typeof saved.unlocked!=='boolean')throw new Error('Invalid recruit state');
      h.unlocked=data.version<3?true:saved.unlocked;
      for(const [slot,kind] of [['equippedWeapon','weapon'],['equippedRelic','relic']]){
        const uid=saved[slot]??null;
        if(uid!==null&&!inventory.some(item=>item.uid===uid&&ITEMS[item.type].kind===kind))throw new Error('Invalid equipment');
        h[slot]=uid;
      }
      return h;
    });
    const equipped=heroes.flatMap(h=>[h.equippedWeapon,h.equippedRelic]).filter(Boolean);
    if(!heroes.some(h=>h.unlocked)||new Set(equipped).size!==equipped.length)return null;
    const c = { ...defaults, heroes, inventory:inventory.map(item=>({uid:item.uid,type:item.type})), battle: data.battle, gold: data.gold,
      potions: data.potions, wins: data.wins ?? 0 };
    // Migrate old full-state saves without applying camp recovery twice.
    if (data.mode === 'victory') { c.mode = 'victory'; enterCamp(c); }
    const atCamp = ['victory', 'camp'].includes(data.mode);
    for (const h of c.heroes) if (!h.hp) h.hp = Math.ceil(h.maxHp / 2);
    startBattle(c);
    if (atCamp) c.mode = 'camp';
    return c;
  } catch {
    return null;
  }
}

function readCompany(storage) {
  try { return restoreCampaign(storage.getItem(SAVE_KEY)); }
  catch { return null; }
}

function writeCompany(storage, campaign) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(campaignSave(campaign))); return true; }
  catch { return false; }
}

root.EmberPersistence=Object.freeze({SAVE_KEY,campaignSave,restoreCampaign,readCompany,writeCompany});
})(globalThis);
