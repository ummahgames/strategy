import { HEROES, createCampaign, startBattle, enterCamp } from './engine.js';

export const SAVE_KEY = 'ember-company-v1';
const integer = (value, min, max = Number.MAX_SAFE_INTEGER - 2) =>
  Number.isSafeInteger(value) && value >= min && value <= max;
const copy = value => JSON.parse(JSON.stringify(value));

// Persist company progression only. Restarting a field restores its starting
// supplies as well as its starting HP/MP; spending a tonic cannot lose it on reload.
export function campaignSave(campaign) {
  let c = campaign;
  if (c.mode === 'victory') {
    c = copy(c);
    enterCamp(c);
  }
  return {
    version: 2,
    battle: c.battle,
    gold: c.gold,
    potions: c.mode === 'camp' ? c.potions : c.startingPotions ?? c.potions,
    wins: c.wins,
    mode: c.mode === 'camp' ? 'camp' : 'battle',
    heroes: c.heroes.map(h => Object.fromEntries([
      'id', 'hp', 'mp', 'maxHp', 'maxMp', 'atk', 'def', 'speed', 'move',
      'range', 'level', 'xp', 'tier', 'promoted'
    ].map(key => [key, h[key]])))
  };
}

export function restoreCampaign(raw) {
  try {
    if (typeof raw !== 'string' || raw.length > 100_000) return null;
    const data = JSON.parse(raw);
    if (!data || ![1, 2].includes(data.version) || !integer(data.battle, 0) ||
        !integer(data.gold, 0) || !integer(data.potions, 0) ||
        !integer(data.wins ?? 0, 0) || !Array.isArray(data.heroes) ||
        data.heroes.length !== HEROES.length) return null;
    const ids = data.heroes.map(h => h?.id);
    if (new Set(ids).size !== HEROES.length ||
        !HEROES.every(h => ids.includes(h.id))) return null;
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
      return h;
    });
    const c = { ...defaults, heroes, battle: data.battle, gold: data.gold,
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

export function readCompany(storage) {
  try { return restoreCampaign(storage.getItem(SAVE_KEY)); }
  catch { return null; }
}

export function writeCompany(storage, campaign) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(campaignSave(campaign))); return true; }
  catch { return false; }
}
