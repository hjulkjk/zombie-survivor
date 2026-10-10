// ============================================================
//   ZOMBIE SURVIVOR — GAME.JS
// ============================================================

// ================= СОХРАНЕНИЕ =================
const save = {
  coins: 0,
  crystals: 0,
  playerName: 'Бобёр',
  playerAvatar: '🦫',
  record: { kills:0, level:1, time:0, round:1 },
  totalKills: 0, totalTime: 0, totalEarned: 0, bossesKilled: 0,
  owned: [],
  character: 'survivor',
  characters: ['survivor'],
  charSkins: ['default'],
  activeCharSkin: 'default',
  weaponSkins: ['knife_default'],
  activeWeaponSkin: 'knife_default',
  ownedUlts: ['blackhole'],
  activeUlt: 'blackhole',
  ownedSkills: [],
  activeSkill: null,
  ownedPets: [],
  activePet: null,
  talPoints: 0,
  talents: {},
  promoUsed: [],
  dailyDate: '',
  dailyStreak: 0,
  dailyLastClaim: '',
  dailyKills: 0,
  dailyBosses: 0,
  dailyRound: 1,
  weeklyDate: '',
  weeklyKills: 0,
  weeklyBosses: 0,
  claimedDaily: [],
  claimedWeekly: [],
  claimedAchievements: [],
  caseCount: 0,
  napoleonUnlocked: false,
  totalBossesAllTime: 0,
  records: {
    kills: [],
    time: [],
    round: []
  }
};
try {
  const s = JSON.parse(localStorage.getItem('zs_save') || '{}');
  if (s && typeof s === 'object') {
    Object.assign(save, s);
    if (s.record) Object.assign(save.record, s.record);
    ['owned','characters','charSkins','weaponSkins','ownedUlts','ownedSkills','ownedPets','promoUsed','claimedDaily','claimedWeekly','claimedAchievements'].forEach(k => {
      if (!Array.isArray(save[k])) save[k] = [];
    });
    if (!save.records || typeof save.records !== 'object') save.records = { kills:[], time:[], round:[] };
    ['kills','time','round'].forEach(k => { if (!Array.isArray(save.records[k])) save.records[k] = []; });
    if (save.characters.length === 0) save.characters = ['survivor'];
    if (save.charSkins.length === 0) save.charSkins = ['default'];
    if (save.weaponSkins.length === 0) save.weaponSkins = ['knife_default'];
    if (save.ownedUlts.length === 0) save.ownedUlts = ['blackhole'];
    if (!save.talents || typeof save.talents !== 'object') save.talents = {};
  }
} catch(e){}
function saveAll(){ try { localStorage.setItem('zs_save', JSON.stringify(save)); } catch(e){} }

// ================= НАСТРОЙКИ =================
const settings = {
  volume: 70,
  gfx: 'high',
  difficulty: 'normal',
  showFps: true,
  screenFx: true,
  res: 'auto',
  blood: true,
  grid: false,
  weather: 'fog',
  bg: 'zombie',
  season: 'none',
  animSpeed: 'normal',
  autosave: 60,
  showDamage: true,
  autoAttack: true
};
try { Object.assign(settings, JSON.parse(localStorage.getItem('zs_settings')||'{}')); } catch(e){}
function saveSettings(){ try { localStorage.setItem('zs_settings', JSON.stringify(settings)); } catch(e){} }

let autosaveTimer = 0;

// ================= ЗВУК =================
let audioCtx = null;
function initAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  }
}
function playSound(freq, dur, type, vol){
  type = type || 'square'; vol = vol || 0.15;
  if (!audioCtx || settings.volume === 0) return;
  try {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol * (settings.volume/100);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch(e){}
}
const sfx = {
  hit:     () => playSound(180, 0.07, 'square', 0.06),
  damage:  () => playSound(90, 0.15, 'sawtooth', 0.15),
  pickup:  () => playSound(880, 0.05, 'sine', 0.08),
  chest:   () => { playSound(660,0.08,'sine',0.15); setTimeout(()=>playSound(880,0.08,'sine',0.15),60); setTimeout(()=>playSound(1180,0.15,'sine',0.15),120); },
  levelup: () => { playSound(523,0.1,'sine',0.2); setTimeout(()=>playSound(659,0.1,'sine',0.2),80); setTimeout(()=>playSound(784,0.2,'sine',0.2),160); },
  death:   () => { playSound(200,0.4,'sawtooth',0.25); setTimeout(()=>playSound(100,0.6,'sawtooth',0.2),200); },
  click:   () => playSound(600, 0.04, 'square', 0.1),
  buff:    () => { playSound(880,0.1,'triangle',0.2); setTimeout(()=>playSound(1320,0.2,'triangle',0.2),100); },
  coin:    () => playSound(1400, 0.06, 'sine', 0.15),
  crystal: () => { playSound(1800,0.08,'sine',0.2); setTimeout(()=>playSound(2400,0.1,'sine',0.15),60); },
  revive:  () => { playSound(440,0.15,'sine',0.25); setTimeout(()=>playSound(660,0.15,'sine',0.25),100); setTimeout(()=>playSound(880,0.3,'sine',0.25),200); },
  ach:     () => { playSound(1046,0.1,'triangle',0.2); setTimeout(()=>playSound(1318,0.15,'triangle',0.2),100); setTimeout(()=>playSound(1568,0.25,'triangle',0.2),200); },
  roundClear: () => { [523,659,784,1046].forEach((f,i)=>setTimeout(()=>playSound(f,0.2,'triangle',0.22), i*120)); },
  bossSpawn:  () => { playSound(80,0.6,'sawtooth',0.3); setTimeout(()=>playSound(60,0.9,'sawtooth',0.25),300); },
  thunder:    () => { playSound(50,1.0,'sawtooth',0.35); setTimeout(()=>playSound(30,1.5,'sawtooth',0.25),100); },
  meteor:     () => { playSound(120,0.8,'sawtooth',0.3); },
  ult:        () => { playSound(200,0.3,'sawtooth',0.25); setTimeout(()=>playSound(400,0.3,'sawtooth',0.25),150); setTimeout(()=>playSound(800,0.5,'sawtooth',0.25),300); },
  skill:      () => { playSound(700,0.1,'triangle',0.2); setTimeout(()=>playSound(1100,0.15,'triangle',0.2),80); },
  caseOpen:   () => { playSound(400,0.05,'square',0.15); }
};

// ================= ПРОМОКОДЫ =================
const PROMO_CODES = {
  'start': { coins: 1000, label: '+1000 монет' },
  'admin': { coins: 1000000, label: '+1 000 000 монет' },
  'bobr':  { coins: 5000, crystals: 50, label: '+5000 монет и +50 кристаллов' },
  'napoleon': { crystals: 100, label: '+100 кристаллов' }
};
function applyPromo(){
  const input = document.getElementById('promoInput');
  const res = document.getElementById('promoResult');
  if (!input || !res) return;
  const code = input.value.trim().toLowerCase();
  if (!code){ res.textContent = 'Введи промокод'; res.className = 'promo-result error'; return; }
  if (save.promoUsed.indexOf(code) >= 0){
    res.textContent = '❌ Этот промокод уже использован';
    res.className = 'promo-result error'; return;
  }
  const promo = PROMO_CODES[code];
  if (!promo){
    res.textContent = '❌ Неверный промокод';
    res.className = 'promo-result error'; return;
  }
  if (promo.coins) save.coins += promo.coins;
  if (promo.crystals) save.crystals += promo.crystals;
  save.promoUsed.push(code);
  saveAll();
  sfx.crystal();
  res.textContent = '✅ Активирован! ' + promo.label;
  res.className = 'promo-result success';
  input.value = '';
  if (typeof updateMenuInfo === 'function') updateMenuInfo();
}

// ================= ПЕРСОНАЖИ =================
const CHARACTERS = [
  { id:'survivor', icon:'👤', name:'Выживший', desc:'Без бонусов', price:0, color:'#5dade2', apply:()=>{} },
  { id:'soldier', icon:'🎖', name:'Солдат', desc:'+20% урон ножей', price:800, color:'#4a6a3a', apply:()=>{ knives.damage *= 1.2; } },
  { id:'ninja', icon:'🥷', name:'Ниндзя', desc:'+25% скорость и +10% вращение', price:1200, color:'#2a2a2a', apply:()=>{ player.speed *= 1.25; knives.rotSpeed *= 1.1; } },
  { id:'medic', icon:'⚕', name:'Медик', desc:'+80 HP и x2 регена', price:1500, color:'#f0f0f0', apply:()=>{ player.maxHp += 80; player.hp = player.maxHp; player.regen *= 2; } },
  { id:'pirate', icon:'🏴‍☠️', name:'Пират', desc:'+50% монет, +1 нож', price:2200, color:'#8b1a1a', apply:()=>{ knives.count += 1; player.coinBonus = 0.5; } },
  { id:'robot', icon:'🤖', name:'Робот', desc:'+2 ножа, +30% дальность', price:3000, color:'#a0a0a0', apply:()=>{ knives.count += 2; knives.distance *= 1.3; } },
  { id:'king', icon:'👑', name:'Король', desc:'+10% ко всему', price:5000, color:'#d4a017', apply:()=>{
    player.speed *= 1.1;
    player.maxHp = Math.floor(player.maxHp * 1.1); player.hp = player.maxHp;
    knives.damage *= 1.1;
    knives.rotSpeed *= 1.1;
    player.regen *= 1.1;
  }},
  { id:'napoleon', icon:'🎩', name:'Наполеон', desc:'+50% урон, +25% HP', price:0, color:'#2a3a6a', secret:true, apply:()=>{
    knives.damage *= 1.5;
    player.maxHp = Math.floor(player.maxHp * 1.25); player.hp = player.maxHp;
  }}
];
function getActiveCharacter(){ return CHARACTERS.find(c => c.id === save.character) || CHARACTERS[0]; }

// ================= СКИНЫ ГЕРОЯ =================
const CHAR_SKINS = [
  { id:'default', icon:'👤', name:'Обычный', desc:'Стандартный вид', rarity:'common' },
  { id:'napoleon', icon:'🎩', name:'Наполеон', desc:'За 3 боссов', rarity:'legendary', secret:true },
  { id:'gold', icon:'✨', name:'Золотой', desc:'Золотая аура', rarity:'epic', dropOnly:true },
  { id:'shadow', icon:'🌑', name:'Тень', desc:'Тёмный силуэт', rarity:'rare', dropOnly:true },
  { id:'cowboy', icon:'🤠', name:'Ковбой', desc:'Шляпа и сапоги', rarity:'legendary', dropOnly:true },
  { id:'cosmo', icon:'👨‍🚀', name:'Космонавт', desc:'Скафандр', rarity:'epic', dropOnly:true },
  { id:'dragon', icon:'🐉', name:'Дракон', desc:'Чешуя дракона', rarity:'mythic', dropOnly:true }
];

// ================= СКИНЫ ОРУЖИЯ =================
const WEAPON_SKINS = [
  { id:'knife_default', icon:'🔪', name:'Обычный нож', desc:'Стандартный', rarity:'common' },
  { id:'knife_gold', icon:'🗡', name:'Золотой клинок', desc:'Золотой нож', rarity:'rare', dropOnly:true },
  { id:'knife_diamond', icon:'💎', name:'Алмазный', desc:'Сверкающий', rarity:'epic', dropOnly:true },
  { id:'knife_fire', icon:'🔥', name:'Огненный', desc:'Пылающий', rarity:'epic', dropOnly:true },
  { id:'knife_ice', icon:'❄', name:'Ледяной', desc:'Замораживает', rarity:'epic', dropOnly:true },
  { id:'knife_blood', icon:'🩸', name:'Кровавый', desc:'Пьёт кровь', rarity:'epic', dropOnly:true },
  { id:'knife_void', icon:'🌌', name:'Пустотный', desc:'Тёмная материя', rarity:'legendary', dropOnly:true },
  { id:'knife_rainbow', icon:'🌈', name:'Радужный', desc:'Всеми цветами', rarity:'legendary', dropOnly:true },
  { id:'knife_mythic', icon:'👑', name:'Мифический', desc:'Свет легенд', rarity:'mythic', dropOnly:true }
];

// ================= УЛЬТЫ =================
const ULTS = [
  { id:'blackhole', icon:'🕳', name:'Чёрная дыра', desc:'Затягивает всех зомби в радиусе 260', price:2000, priceCrystals:0 },
  { id:'orbital', icon:'☄', name:'Орбитальная пушка', desc:'Уничтожает всех зомби в радиусе 180', price:3000, priceCrystals:0 },
  { id:'lightning', icon:'⚡', name:'Молния', desc:'Бьёт всех врагов на экране', price:0, priceCrystals:20 },
  { id:'earthquake', icon:'🌋', name:'Землетрясение', desc:'Отбрасывает всех врагов', price:0, priceCrystals:25 },
  { id:'wolf', icon:'🐺', name:'Призыв волка', desc:'Волк сражается за тебя 20 сек', price:0, priceCrystals:30 },
  { id:'clones', icon:'👥', name:'Клонирование', desc:'2 копии игрока на 10 сек', price:0, priceCrystals:40 }
];

// ================= НАВЫКИ (E) =================
const SKILLS = [
  { id:'throw_knife', icon:'🔪', name:'Метательный нож', desc:'Метает нож в сторону курсора', price:600, priceCrystals:0 },
  { id:'freeze', icon:'❄', name:'Заморозка', desc:'Замораживает зомби вокруг', price:900, priceCrystals:0 },
  { id:'heal', icon:'❤', name:'Исцеление', desc:'+50 HP', price:700, priceCrystals:0 },
  { id:'teleport', icon:'✨', name:'Телепорт', desc:'Прыжок к курсору', price:0, priceCrystals:15 },
  { id:'shield', icon:'🛡', name:'Щит', desc:'Неуязвимость 3 сек', price:0, priceCrystals:20 },
  { id:'fireball', icon:'🔥', name:'Огненный шар', desc:'Взрыв огня в курсор', price:0, priceCrystals:25 },
  { id:'speed_boost', icon:'💨', name:'Ускорение', desc:'x2 скорость на 5 сек', price:0, priceCrystals:15 }
];
function getActiveSkill(){ return SKILLS.find(s => s.id === save.activeSkill) || null; }
function getActiveUlt(){ return ULTS.find(u => u.id === save.activeUlt) || ULTS[0]; }

// ================= ПИТОМЦЫ =================
const PETS = [
  { id:'dog', icon:'🐕', name:'Собака', desc:'Атакует ближайших зомби', price:5000, priceCrystals:0 },
  { id:'dragon', icon:'🐲', name:'Дракончик', desc:'Стреляет огнём', price:0, priceCrystals:20 },
  { id:'ghost', icon:'👻', name:'Призрак', desc:'Пугает зомби (замедляет)', price:0, priceCrystals:35 }
];

// ================= МАГАЗИН — ПРЕДМЕТЫ =================
const SHOP_ITEMS = [
  { id:'knife_start',    icon:'🔪', name:'Доп. нож',        desc:'Начинать с 3 ножей',           price: 200 },
  { id:'damage_start',   icon:'⚔',  name:'Заточенные клинки', desc:'+20% урона ножей',           price: 250 },
  { id:'speed_start',    icon:'⚡', name:'Быстрые ноги',     desc:'+12% к скорости',            price: 300 },
  { id:'hp_start',       icon:'❤', name:'Крепкое тело',    desc:'+40 макс. HP',                price: 400 },
  { id:'level_start',    icon:'⭐', name:'Опытный',         desc:'Старт с 3 уровня',            price: 500 },
  { id:'magnet_start',   icon:'🧲', name:'Магнит',          desc:'+50% радиус подбора',         price: 350 },
  { id:'regen_start',    icon:'💚', name:'Регенерация',     desc:'+0.5 HP/сек',                 price: 450 },
  { id:'crit_start',     icon:'💥', name:'Критический удар', desc:'+10% шанс крита',            price: 600 },
  { id:'stamina_start',  icon:'🏃', name:'Стайер',          desc:'+50 макс. выносливости',      price: 380 },
  { id:'coin_start',     icon:'💰', name:'Делец',           desc:'+30% монет',                  price: 700 }
];

// ================= ЖИЗНИ =================
const LIVES_UPGRADES = [
  { level:1, price:500,  desc:'+1 жизнь в начале' },
  { level:2, price:1500, desc:'Ещё +1 жизнь' },
  { level:3, price:3500, desc:'Максимум: 4 жизни' }
];

// ================= КЕЙСЫ =================
const CASES = [
  { id:'case_common', icon:'📦', name:'Обычный кейс',    desc:'Скин оружия (редкий)', price:500,
    pool:['knife_gold','knife_fire','shadow'] },
  { id:'case_rare',   icon:'🎁', name:'Редкий кейс',     desc:'Редкие скины',         price:1500,
    pool:['knife_gold','knife_diamond','knife_fire','knife_ice','knife_blood','shadow','cowboy','cosmo'] },
  { id:'case_epic',   icon:'💎', name:'Эпический кейс',  desc:'Эпик/легенда/мифик',   price:4000,
    pool:['knife_diamond','knife_void','knife_rainbow','knife_mythic','gold','dragon','cosmo','cowboy'] }
];

// ================= КВЕСТЫ =================
const DAILY_QUESTS = [
  { id:'daily_kill_50',  name:'Убить 50 зомби', desc:'Сегодня', reward:300, target:50, key:'dailyKills' },
  { id:'daily_boss_1',   name:'Убить 1 босса',  desc:'Сегодня', reward:500, target:1,  key:'dailyBosses' },
  { id:'daily_round_3',  name:'Дойти до 3 раунда', desc:'Сегодня', reward:400, target:3, key:'dailyRound' }
];
const WEEKLY_QUESTS = [
  { id:'weekly_kill_500', name:'Убить 500 зомби', desc:'За неделю', reward:3000, target:500, key:'weeklyKills' },
  { id:'weekly_boss_5',   name:'Убить 5 боссов',  desc:'За неделю', reward:4000, target:5,   key:'weeklyBosses' },
  { id:'weekly_boss_3_napoleon', name:'Убить 3 боссов', desc:'Награда: скин Наполеона', reward:0, target:3, key:'weeklyBosses', skin:'napoleon' }
];

// ================= ДОСТИЖЕНИЯ =================
const ACHIEVEMENTS = [
  { id:'kill_100',   icon:'💀', name:'Первая сотня',      desc:'Убить 100 зомби',      target:100,    stat:'totalKills', reward:200 },
  { id:'kill_500',   icon:'💀', name:'Мясник',            desc:'Убить 500 зомби',      target:500,    stat:'totalKills', reward:500 },
  { id:'kill_1000',  icon:'💀', name:'Легенда улиц',      desc:'Убить 1000 зомби',     target:1000,   stat:'totalKills', reward:1000 },
  { id:'kill_5000',  icon:'☠',  name:'Истребитель',        desc:'Убить 5000 зомби',     target:5000,   stat:'totalKills', reward:3000 },
  { id:'kill_10000', icon:'☠',  name:'Бог смерти',         desc:'Убить 10000 зомби',    target:10000,  stat:'totalKills', reward:10000 },
  { id:'boss_1',     icon:'👹', name:'Первый босс',        desc:'Убить 1 босса',        target:1,      stat:'bossesKilled', reward:300 },
  { id:'boss_5',     icon:'👹', name:'Охотник на боссов',  desc:'Убить 5 боссов',       target:5,      stat:'bossesKilled', reward:1000 },
  { id:'boss_10',    icon:'👺', name:'Гроза боссов',       desc:'Убить 10 боссов',      target:10,     stat:'bossesKilled', reward:2500 },
  { id:'boss_25',    icon:'👺', name:'Убийца королей',     desc:'Убить 25 боссов',      target:25,     stat:'bossesKilled', reward:6000 },
  { id:'boss_50',    icon:'👑', name:'Богоубийца',         desc:'Убить 50 боссов',      target:50,     stat:'bossesKilled', reward:15000 },
  { id:'round_3',    icon:'🎯', name:'Выживший',           desc:'Дойти до 3 раунда',    target:3,      stat:'bestRound', reward:300 },
  { id:'round_5',    icon:'🎯', name:'Ветеран',            desc:'Дойти до 5 раунда',    target:5,      stat:'bestRound', reward:700 },
  { id:'round_10',   icon:'⭐', name:'Мастер',              desc:'Дойти до 10 раунда',   target:10,     stat:'bestRound', reward:2000 },
  { id:'round_20',   icon:'🌟', name:'Чемпион',            desc:'Дойти до 20 раунда',   target:20,     stat:'bestRound', reward:5000 },
  { id:'money_10k',  icon:'💰', name:'Копилка',            desc:'Заработать 10000 монет', target:10000, stat:'totalEarned', reward:1000 },
  { id:'money_100k', icon:'💰', name:'Богач',              desc:'Заработать 100000 монет', target:100000, stat:'totalEarned', reward:5000 },
  { id:'money_1m',   icon:'💎', name:'Миллионер',          desc:'Заработать 1000000 монет', target:1000000, stat:'totalEarned', reward:20000 },
  { id:'time_5min',  icon:'⏱', name:'Терпеливый',          desc:'Прожить 5 минут',      target:300,    stat:'bestTime', reward:500 },
  { id:'time_15min', icon:'⏱', name:'Долгожитель',         desc:'Прожить 15 минут',     target:900,    stat:'bestTime', reward:1500 },
  { id:'time_30min', icon:'⏰', name:'Бессмертный',         desc:'Прожить 30 минут',     target:1800,   stat:'bestTime', reward:5000 },
  { id:'cases_10',   icon:'📦', name:'Коллекционер',       desc:'Открыть 10 кейсов',    target:10,     stat:'caseCount', reward:1000 },
  { id:'cases_50',   icon:'📦', name:'Открывашка',         desc:'Открыть 50 кейсов',    target:50,     stat:'caseCount', reward:4000 },
  { id:'first_blood',icon:'🩸', name:'Первая кровь',       desc:'Убить зомби за 5 сек', target:1,      stat:'firstBlood', reward:200 },
  { id:'no_hit',     icon:'🛡', name:'Неуязвимый',         desc:'Пройти раунд без урона', target:1,    stat:'noHitRound', reward:1000 },
  { id:'speed_run',  icon:'⚡', name:'Скороход',            desc:'Раунд за 30 сек',      target:1,      stat:'speedRun', reward:800 },
  { id:'bobr_master',icon:'🦫', name:'Бобёр-мастер',        desc:'Использовать промокод BOBR', target:1, stat:'usedBobr', reward:1000 },
  { id:'collector',  icon:'🎨', name:'Коллекционер',       desc:'Открыть 5 скинов',     target:5,      stat:'skinsCount', reward:2000 },
  { id:'knife_master',icon:'🔪', name:'Мастер ножей',       desc:'3+ ножа на 5 уровне',  target:1,      stat:'knifeMaster', reward:800 },
  { id:'crystal_50', icon:'💎', name:'Кристальный',         desc:'Собрать 50 кристаллов', target:50,    stat:'crystalsTotal', reward:2000 },
  { id:'daily_3',    icon:'🎁', name:'Календарь',          desc:'Открыть 3 дня подряд', target:3,      stat:'dailyStreak', reward:1500 }
];

// ================= ТАЛАНТЫ =================
const TALENTS = [
  { id:'t_hp',       icon:'❤', name:'Живучесть',    desc:'+20 макс HP за уровень',    maxLvl:5 },
  { id:'t_damage',   icon:'⚔', name:'Сила',         desc:'+10% урон за уровень',       maxLvl:5 },
  { id:'t_speed',    icon:'⚡', name:'Скорость',     desc:'+5% скорость за уровень',    maxLvl:5 },
  { id:'t_regen',    icon:'💚', name:'Восстановление', desc:'+0.3 HP/сек за уровень',   maxLvl:5 },
  { id:'t_crit',     icon:'💥', name:'Критический',  desc:'+3% шанс крита за уровень',  maxLvl:5 },
  { id:'t_lifesteal',icon:'🩸', name:'Вампиризм',    desc:'+1 HP за убийство за уровень', maxLvl:3 },
  { id:'t_knife',    icon:'🔪', name:'Доп. нож',     desc:'+1 нож (макс 2)',            maxLvl:2 },
  { id:'t_coin',     icon:'💰', name:'Делец',        desc:'+10% монет за уровень',      maxLvl:5 },
  { id:'t_xp',       icon:'💎', name:'Мудрец',       desc:'+10% опыт за уровень',       maxLvl:5 },
  { id:'t_range',    icon:'📏', name:'Дальнобойность', desc:'+10% дальность ножей',     maxLvl:5 },
  { id:'t_rot',      icon:'🔄', name:'Обороты',      desc:'+10% скорость вращения',     maxLvl:5 },
  { id:'t_magnet',   icon:'🧲', name:'Магнит',       desc:'+20% радиус подбора',        maxLvl:3 }
];
function getTalentLvl(id){ return save.talents[id] || 0; }
function talentCost(id){ return getTalentLvl(id) + 1; }
function canBuyTalent(id){
  const t = TALENTS.find(x => x.id === id);
  if (!t) return false;
  if (getTalentLvl(id) >= t.maxLvl) return false;
  return save.talPoints >= talentCost(id);
}
function buyTalent(id){
  if (!canBuyTalent(id)) { sfx.damage(); return; }
  save.talPoints -= talentCost(id);
  save.talents[id] = getTalentLvl(id) + 1;
  saveAll();
  sfx.buff();
  if (typeof renderTalents === 'function') renderTalents();
}
function applyTalentsToPlayer(){
  const l = id => getTalentLvl(id);
  player.maxHp += 20 * l('t_hp');
  player.hp = player.maxHp;
  knives.damage *= 1 + 0.1 * l('t_damage');
  player.speed *= 1 + 0.05 * l('t_speed');
  player.regen += 0.3 * l('t_regen');
  player.critChance = (player.critChance || 0) + 0.03 * l('t_crit');
  player.lifesteal = (player.lifesteal || 0) + 1 * l('t_lifesteal');
  knives.count += 1 * l('t_knife');
  player.coinBonus = (player.coinBonus || 0) + 0.1 * l('t_coin');
  player.xpMult *= 1 + 0.1 * l('t_xp');
  knives.distance *= 1 + 0.1 * l('t_range');
  knives.rotSpeed *= 1 + 0.1 * l('t_rot');
  player.pickupRange *= 1 + 0.2 * l('t_magnet');
}

// ================= ИНВЕНТАРЬ-ФУНКЦИИ =================
function isWeaponSkinOwned(id){ return save.weaponSkins.indexOf(id) >= 0; }
function isCharSkinOwned(id){ return save.charSkins.indexOf(id) >= 0; }
function isUltOwned(id){ return save.ownedUlts.indexOf(id) >= 0; }
function isSkillOwned(id){ return save.ownedSkills.indexOf(id) >= 0; }
function isPetOwned(id){ return save.ownedPets.indexOf(id) >= 0; }
function isOwned(id){ return save.owned.indexOf(id) >= 0; }

function unlockRandomSkin(caseId){
  const cs = CASES.find(c => c.id === caseId);
  if (!cs) return null;
  const available = cs.pool.filter(id => !isWeaponSkinOwned(id) && !isCharSkinOwned(id));
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  if (WEAPON_SKINS.find(x => x.id === pick)) save.weaponSkins.push(pick);
  else if (CHAR_SKINS.find(x => x.id === pick)) save.charSkins.push(pick);
  saveAll();
  return pick;
}
// ================= ПЕРЕМЕННЫЕ UI =================
let currentShopTab = 'items';
let currentQuestTab = 'daily';
let currentInvTab = 'skins';
let currentRecordsTab = 'kills';
let cameFromGame = false;
let roundRestFromTalents = false;

// ================= ПОКАЗ ЭКРАНОВ =================
function showScreen(id){
  sfx.click();
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
  if (id === 'gameScreen') initAudio();
  if (id === 'mainMenu'){ updateMenuInfo(); checkDailyReward(); }
  if (id === 'shopMenu') renderShop();
  if (id === 'characterMenu') renderCharacters();
  if (id === 'questsMenu') renderQuests();
  if (id === 'achievementsMenu') renderAchievements();
  if (id === 'talentsMenu') renderTalents();
  if (id === 'inventoryMenu') renderInventory();
  if (id === 'petsMenu') renderPets();
  if (id === 'recordsMenu') renderRecords();
  if (id === 'dailyMenu') renderDailyRewards();
}
function updateMenuInfo(){
  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('menuCoins', save.coins);
  set('menuCrystals', save.crystals);
  set('menuRecord', save.record.kills);
  set('menuRound', save.record.round);
  set('menuName', save.playerName || 'Бобёр');
  set('menuAvatar', save.playerAvatar || '🦫');
}
function backFromSettings(){
  if (cameFromGame){
    cameFromGame = false;
    showScreen('gameScreen');
    paused = false;
    const po = document.getElementById('pauseOverlay');
    if (po) po.classList.add('hidden');
    const pb = document.querySelector('.pause-btn');
    if (pb) pb.style.display = 'block';
    lastTime = performance.now();
    applyResolution();
  } else {
    showScreen('mainMenu');
  }
}
function openSettingsFromGame(){
  cameFromGame = true;
  showScreen('settingsMenu');
}
function savePlayerName(){
  const inp = document.getElementById('playerNameInput');
  if (!inp) return;
  const n = inp.value.trim();
  if (n.length < 1) return;
  save.playerName = n;
  saveAll();
  updateMenuInfo();
  sfx.coin();
}

// ================= ЕЖЕДНЕВНАЯ НАГРАДА =================
function checkDailyReward(){
  const today = new Date().toDateString();
  if (save.dailyDate !== today){
    // Проверяем streak
    const yesterday = new Date(Date.now() - 24*3600*1000).toDateString();
    if (save.dailyLastClaim === yesterday){
      save.dailyStreak = (save.dailyStreak || 0);
    } else if (save.dailyLastClaim !== today){
      save.dailyStreak = 0;
    }
    save.dailyDate = today;
    save.dailyKills = 0;
    save.dailyBosses = 0;
    save.dailyRound = 1;
    save.claimedDaily = [];
    saveAll();
  }
  // Еженедельный сброс
  const now = new Date();
  const week = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / (7*24*3600*1000));
  const weekKey = now.getFullYear() + '-W' + week;
  if (save.weeklyDate !== weekKey){
    save.weeklyDate = weekKey;
    save.weeklyKills = 0;
    save.weeklyBosses = 0;
    save.claimedWeekly = [];
    saveAll();
  }
}
function showAchievement(name){
  const el = document.getElementById('achievementToast');
  const nm = document.getElementById('achName');
  if (!el || !nm) return;
  nm.textContent = name;
  el.classList.remove('hidden');
  sfx.ach();
  clearTimeout(el._to);
  el._to = setTimeout(() => el.classList.add('hidden'), 3000);
}
function showEventToast(icon, name){
  const el = document.getElementById('eventToast');
  const ic = el ? el.querySelector('.event-icon') : null;
  const nm = document.getElementById('eventName');
  if (!el || !nm) return;
  if (ic) ic.textContent = icon;
  nm.textContent = name;
  el.classList.remove('hidden');
  clearTimeout(el._to);
  el._to = setTimeout(() => el.classList.add('hidden'), 4000);
}

// ================= МАГАЗИН =================
function switchShopTab(tab){
  currentShopTab = tab;
  document.querySelectorAll('#shopMenu .shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const tabs = ['shopItems', 'shopSkills', 'shopCases', 'shopLives', 'shopCrystals'];
  const map = { items:'shopItems', skills:'shopSkills', cases:'shopCases', lives:'shopLives', crystals:'shopCrystals' };
  tabs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== map[tab]);
  });
  renderShop();
}
function renderShop(){
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('shopCoins', save.coins);
  set('shopCrystals', save.crystals);

  // Предметы
  const itemsEl = document.getElementById('shopItems');
  if (itemsEl){
    itemsEl.innerHTML = '';
    SHOP_ITEMS.forEach(it => {
      const owned = isOwned(it.id);
      const canBuy = !owned && save.coins >= it.price;
      const d = document.createElement('div');
      d.className = 'shop-item' + (owned ? ' owned' : '');
      d.innerHTML = '<div class="si-head"><span class="si-icon">' + it.icon + '</span><span class="si-name">' + it.name + '</span></div>' +
        '<div class="si-desc">' + it.desc + '</div>' +
        '<div class="si-price">💰 ' + it.price + '</div>' +
        '<button class="si-buy"' + (owned || !canBuy ? ' disabled' : '') + '>' + (owned ? '✅ КУПЛЕНО' : 'Купить') + '</button>';
      if (!owned && canBuy){
        d.querySelector('.si-buy').onclick = () => {
          save.coins -= it.price; save.owned.push(it.id); saveAll(); sfx.coin();
          renderShop(); updateMenuInfo();
        };
      }
      itemsEl.appendChild(d);
    });
  }

  // Навыки + Ульты
  const skillsEl = document.getElementById('shopSkills');
  if (skillsEl){
    skillsEl.innerHTML = '';
    SKILLS.forEach(sk => {
      const owned = isSkillOwned(sk.id);
      const canBuy = !owned && ((sk.price && save.coins >= sk.price) || (sk.priceCrystals && save.crystals >= sk.priceCrystals));
      const priceText = sk.price ? '💰 ' + sk.price : ('💎 ' + sk.priceCrystals);
      const d = document.createElement('div');
      d.className = 'shop-item' + (owned ? ' owned' : '');
      d.innerHTML = '<div class="si-head"><span class="si-icon">' + sk.icon + '</span><span class="si-name">' + sk.name + ' (E)</span></div>' +
        '<div class="si-desc">' + sk.desc + '</div>' +
        '<div class="si-price">' + priceText + '</div>' +
        '<button class="si-buy"' + (owned || !canBuy ? ' disabled' : '') + '>' + (owned ? '✅' : 'Купить') + '</button>';
      if (!owned && canBuy){
        d.querySelector('.si-buy').onclick = () => {
          if (sk.price) save.coins -= sk.price; else save.crystals -= sk.priceCrystals;
          save.ownedSkills.push(sk.id);
          if (!save.activeSkill) save.activeSkill = sk.id;
          saveAll(); sfx.coin(); renderShop(); updateMenuInfo();
        };
      }
      skillsEl.appendChild(d);
    });
    ULTS.forEach(u => {
      const owned = isUltOwned(u.id);
      const canBuy = !owned && ((u.price && save.coins >= u.price) || (u.priceCrystals && save.crystals >= u.priceCrystals));
      const priceText = u.price ? '💰 ' + u.price : ('💎 ' + u.priceCrystals);
      const d = document.createElement('div');
      d.className = 'shop-item' + (owned ? ' owned' : '');
      d.innerHTML = '<div class="si-head"><span class="si-icon">' + u.icon + '</span><span class="si-name">' + u.name + ' (Q)</span></div>' +
        '<div class="si-desc">' + u.desc + '</div>' +
        '<div class="si-price">' + priceText + '</div>' +
        '<button class="si-buy"' + (owned || !canBuy ? ' disabled' : '') + '>' + (owned ? '✅' : 'Купить') + '</button>';
      if (!owned && canBuy){
        d.querySelector('.si-buy').onclick = () => {
          if (u.price) save.coins -= u.price; else save.crystals -= u.priceCrystals;
          save.ownedUlts.push(u.id); saveAll(); sfx.coin(); renderShop(); updateMenuInfo();
        };
      }
      skillsEl.appendChild(d);
    });
  }

  // Кейсы
  const casesEl = document.getElementById('shopCases');
  if (casesEl){
    casesEl.innerHTML = '';
    CASES.forEach(cs => {
      const canBuy = save.coins >= cs.price;
      const d = document.createElement('div');
      d.className = 'shop-item';
      d.innerHTML = '<div class="si-head"><span class="si-icon">' + cs.icon + '</span><span class="si-name">' + cs.name + '</span></div>' +
        '<div class="si-desc">' + cs.desc + '</div>' +
        '<div class="si-price">💰 ' + cs.price + '</div>' +
        '<button class="si-buy"' + (!canBuy ? ' disabled' : '') + '>Открыть</button>';
      if (canBuy){
        d.querySelector('.si-buy').onclick = () => openCaseAnimation(cs.id);
      }
      casesEl.appendChild(d);
    });
  }

  // Жизни
  const livesEl = document.getElementById('shopLives');
  if (livesEl){
    livesEl.innerHTML = '';
    LIVES_UPGRADES.forEach(u => {
      const owned = save.owned.indexOf('life_' + u.level) >= 0;
      const prevOk = u.level === 1 || save.owned.indexOf('life_' + (u.level - 1)) >= 0;
      const canBuy = !owned && prevOk && save.coins >= u.price;
      const d = document.createElement('div');
      d.className = 'shop-item' + (owned ? ' owned' : '') + (!prevOk ? ' locked' : '');
      d.innerHTML = '<div class="si-head"><span class="si-icon">❤</span><span class="si-name">Апгрейд №' + u.level + '</span></div>' +
        '<div class="si-desc">' + u.desc + '</div>' +
        '<div class="si-price">💰 ' + u.price + '</div>' +
        '<button class="si-buy"' + (owned || !canBuy ? ' disabled' : '') + '>' +
          (owned ? '✅' : (!prevOk ? '🔒 Сначала №' + (u.level - 1) : 'Купить')) + '</button>';
      if (!owned && canBuy){
        d.querySelector('.si-buy').onclick = () => {
          save.coins -= u.price; save.owned.push('life_' + u.level);
          saveAll(); sfx.coin(); renderShop(); updateMenuInfo();
        };
      }
      livesEl.appendChild(d);
    });
  }

  // Кристальный магазин
  const crysEl = document.getElementById('shopCrystals');
  if (crysEl){
    crysEl.innerHTML = '';
    // Обмен монет на кристаллы
    const exchange = document.createElement('div');
    exchange.className = 'shop-item';
    exchange.innerHTML = '<div class="si-head"><span class="si-icon">🔄</span><span class="si-name">Обмен 1000💰 → 10💎</span></div>' +
      '<div class="si-desc">Обменять монеты на кристаллы</div>' +
      '<div class="si-price">💰 1000</div>' +
      '<button class="si-buy"' + (save.coins < 1000 ? ' disabled' : '') + '>Обменять</button>';
    if (save.coins >= 1000){
      exchange.querySelector('.si-buy').onclick = () => {
        save.coins -= 1000; save.crystals += 10; saveAll(); sfx.crystal();
        renderShop(); updateMenuInfo();
      };
    }
    crysEl.appendChild(exchange);
    // Обмен кристаллов на монеты
    const exchange2 = document.createElement('div');
    exchange2.className = 'shop-item';
    exchange2.innerHTML = '<div class="si-head"><span class="si-icon">🔄</span><span class="si-name">Обмен 10💎 → 1500💰</span></div>' +
      '<div class="si-desc">Обменять кристаллы на монеты</div>' +
      '<div class="si-price">💎 10</div>' +
      '<button class="si-buy"' + (save.crystals < 10 ? ' disabled' : '') + '>Обменять</button>';
    if (save.crystals >= 10){
      exchange2.querySelector('.si-buy').onclick = () => {
        save.crystals -= 10; save.coins += 1500; saveAll(); sfx.coin();
        renderShop(); updateMenuInfo();
      };
    }
    crysEl.appendChild(exchange2);
  }
}

// ================= ПЕРСОНАЖИ =================
function renderCharacters(){
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('charCoins', save.coins);
  set('charCrystals', save.crystals);
  const el = document.getElementById('characterList');
  if (!el) return;
  el.innerHTML = '';
  CHARACTERS.forEach(c => {
    if (c.secret && !save.napoleonUnlocked) return;
    const owned = save.characters.indexOf(c.id) >= 0;
    const selected = save.character === c.id;
    const canBuy = !owned && save.coins >= c.price;
    const d = document.createElement('div');
    d.className = 'char-card' + (selected ? ' selected' : '') + (owned ? '' : ' locked');
    d.innerHTML = '<div class="cc-preview"><canvas width="140" height="140"></canvas></div>' +
      '<div class="cc-name">' + c.icon + ' ' + c.name + '</div>' +
      '<div class="cc-desc">' + c.desc + '</div>' +
      '<div class="cc-price">' + (owned ? '✅ Куплено' : '💰 ' + c.price) + '</div>' +
      '<div class="cc-actions">' +
        (owned
          ? '<button class="use"' + (selected ? ' disabled' : '') + '>' + (selected ? 'Выбран' : 'Выбрать') + '</button>'
          : '<button class="buy"' + (canBuy ? '' : ' disabled') + '>Купить</button>') +
      '</div>';
    el.appendChild(d);
    const cv = d.querySelector('canvas');
    if (cv) drawCharacterPreview(cv.getContext('2d'), c.id, 140);
    if (owned && !selected){
      d.querySelector('.cc-actions .use').onclick = () => {
        save.character = c.id; saveAll(); renderCharacters();
      };
    } else if (!owned && canBuy){
      d.querySelector('.cc-actions .buy').onclick = () => {
        save.coins -= c.price; save.characters.push(c.id); save.character = c.id;
        saveAll(); sfx.coin(); renderCharacters(); updateMenuInfo();
      };
    }
  });
}

// ================= КВЕСТЫ =================
function switchQuestTab(tab){
  currentQuestTab = tab;
  document.querySelectorAll('#questsMenu .shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderQuests();
}
function renderQuests(){
  const el = document.getElementById('questsList');
  if (!el) return;
  el.innerHTML = '';
  const list = currentQuestTab === 'daily' ? DAILY_QUESTS : WEEKLY_QUESTS;
  const claimedList = currentQuestTab === 'daily' ? save.claimedDaily : save.claimedWeekly;
  list.forEach(q => {
    const progress = Math.min(save[q.key] || 0, q.target);
    const pct = Math.round((progress / q.target) * 100);
    const done = progress >= q.target;
    const claimed = claimedList.indexOf(q.id) >= 0;
    const d = document.createElement('div');
    d.className = 'quest-item' + (claimed ? ' done' : '');
    d.innerHTML = '<div class="quest-title">' + q.name + '</div>' +
      '<div class="quest-desc">' + q.desc + ' — ' + progress + ' / ' + q.target + '</div>' +
      '<div class="quest-progress"><div class="quest-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="quest-reward">' + (q.skin ? '🎁 Скин Наполеона' : '💰 ' + q.reward + ' монет') + '</div>' +
      '<button class="quest-claim"' + (!done || claimed ? ' disabled' : '') + '>' +
        (claimed ? '✅ Получено' : (done ? 'Забрать' : 'Не готово')) + '</button>';
    const btn = d.querySelector('.quest-claim');
    if (done && !claimed){
      btn.onclick = () => {
        if (q.skin === 'napoleon'){
          if (save.charSkins.indexOf('napoleon') < 0){
            save.charSkins.push('napoleon');
            save.napoleonUnlocked = true;
            showAchievement('Открыт скин: 🎩 Наполеон!');
          }
        } else {
          save.coins += q.reward;
          showAchievement('Получено ' + q.reward + '💰');
        }
        claimedList.push(q.id);
        saveAll(); sfx.coin(); renderQuests(); updateMenuInfo();
      };
    }
    el.appendChild(d);
  });
}
// ================= ДОСТИЖЕНИЯ =================
function getAchValue(ach){
  switch (ach.stat){
    case 'totalKills': return save.totalKills || 0;
    case 'bossesKilled': return save.bossesKilled || 0;
    case 'bestRound': return save.record.round || 1;
    case 'totalEarned': return save.totalEarned || 0;
    case 'bestTime': return save.record.time || 0;
    case 'caseCount': return save.caseCount || 0;
    case 'crystalsTotal': return save.totalCrystalsEarned || 0;
    case 'skinsCount': return (save.weaponSkins.length - 1) + (save.charSkins.length - 1);
    case 'dailyStreak': return save.dailyStreak || 0;
    case 'firstBlood': return save.firstBloodDone ? 1 : 0;
    case 'noHitRound': return save.noHitRoundDone ? 1 : 0;
    case 'speedRun': return save.speedRunDone ? 1 : 0;
    case 'usedBobr': return save.promoUsed.indexOf('bobr') >= 0 ? 1 : 0;
    case 'knifeMaster': return save.knifeMasterDone ? 1 : 0;
    default: return 0;
  }
}
function renderAchievements(){
  const done = ACHIEVEMENTS.filter(a => getAchValue(a) >= a.target).length;
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('achDone', done);
  set('achTotal', ACHIEVEMENTS.length);
  const el = document.getElementById('achList');
  if (!el) return;
  el.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const val = getAchValue(a);
    const progress = Math.min(val, a.target);
    const pct = Math.round((progress / a.target) * 100);
    const completed = val >= a.target;
    const claimed = save.claimedAchievements.indexOf(a.id) >= 0;
    const d = document.createElement('div');
    d.className = 'ach-item' + (completed ? ' done' : '') + (claimed ? ' claimed' : '');
    d.innerHTML = '<div class="ach-icon-box">' +
        '<span class="ach-big-icon">' + a.icon + '</span>' +
        '<div class="ach-info">' +
          '<div class="ach-title">' + a.name + '</div>' +
          '<div class="ach-desc">' + a.desc + '</div>' +
          '<div class="ach-progress-mini"><div class="ach-progress-mini-fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="ach-reward">💰 ' + a.reward + ' · ' + progress + ' / ' + a.target + '</div>' +
      '<button class="ach-claim ' + (claimed ? 'claimed' : '') + '"' + (!completed || claimed ? ' disabled' : '') + '>' +
        (claimed ? '✅ ПОЛУЧЕНО' : (completed ? '🎁 ЗАБРАТЬ' : 'ЕЩЁ НЕ ГОТОВО')) + '</button>';
    const btn = d.querySelector('.ach-claim');
    if (completed && !claimed){
      btn.onclick = () => {
        save.claimedAchievements.push(a.id);
        save.coins += a.reward;
        saveAll();
        sfx.coin();
        showAchievement('Получено ' + a.reward + '💰');
        renderAchievements();
        updateMenuInfo();
      };
    }
    el.appendChild(d);
  });
}

// ================= ТАЛАНТЫ UI =================
function renderTalents(){
  const tp = document.getElementById('talPoints');
  if (tp) tp.textContent = save.talPoints;
  const el = document.getElementById('talentsGrid');
  if (!el) return;
  el.innerHTML = '';
  TALENTS.forEach(t => {
    const lvl = getTalentLvl(t.id);
    const maxed = lvl >= t.maxLvl;
    const canBuy = canBuyTalent(t.id);
    const d = document.createElement('div');
    d.className = 'talent-node' + (lvl > 0 ? ' unlocked' : '') + (maxed ? ' maxed' : '') + (!canBuy && !maxed ? ' locked' : '');
    d.innerHTML = '<div class="talent-icon">' + t.icon + '</div>' +
      '<div class="talent-name">' + t.name + '</div>' +
      '<div class="talent-desc">' + t.desc + '</div>' +
      '<div class="talent-level">Ур. ' + lvl + ' / ' + t.maxLvl + (maxed ? '' : ' · Стоит: ' + talentCost(t.id) + '🌳') + '</div>';
    if (canBuy){
      d.onclick = () => { buyTalent(t.id); renderTalents(); };
    }
    el.appendChild(d);
  });
}
function resetTalents(){
  if (!confirm('Сбросить все таланты и вернуть очки?')) return;
  let refund = 0;
  for (const id in save.talents){
    const lvl = save.talents[id];
    for (let i = 1; i <= lvl; i++) refund += i;
  }
  save.talPoints += refund;
  save.talents = {};
  saveAll();
  renderTalents();
  showAchievement('Возвращено ' + refund + '🌳 очков');
}
function closeTalents(){
  if (roundRestFromTalents){
    roundRestFromTalents = false;
    showScreen('gameScreen');
    paused = true;
    const rc = document.getElementById('roundClearOverlay');
    if (rc) rc.classList.remove('hidden');
    return;
  }
  if (cameFromGame){
    cameFromGame = false;
    showScreen('gameScreen');
    paused = false;
    const po = document.getElementById('pauseOverlay');
    if (po) po.classList.add('hidden');
    const pb = document.querySelector('.pause-btn');
    if (pb) pb.style.display = 'block';
    lastTime = performance.now();
    return;
  }
  showScreen('mainMenu');
}
function openTalentsFromRound(){
  roundRestFromTalents = true;
  showScreen('talentsMenu');
}

// ================= ИНВЕНТАРЬ =================
function switchInvTab(tab){
  currentInvTab = tab;
  document.querySelectorAll('#inventoryMenu .shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderInventory();
}
function renderInventory(){
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('invCaseCount', save.caseCount || 0);
  const el = document.getElementById('invList');
  if (!el) return;
  el.innerHTML = '';

  if (currentInvTab === 'skins'){
    const ownedSkins = WEAPON_SKINS.filter(sk => isWeaponSkinOwned(sk.id));
    const lockedSkins = WEAPON_SKINS.filter(sk => !isWeaponSkinOwned(sk.id));

    if (ownedSkins.length === 0){
      el.innerHTML = '<div class="inv-empty"><span class="inv-empty-icon">📦</span>Инвентарь пуст.<br>Открой кейс в магазине, чтобы получить скин!</div>';
      return;
    }

    ownedSkins.forEach(sk => {
      const active = save.activeWeaponSkin === sk.id;
      const d = document.createElement('div');
      d.className = 'inv-item' + (active ? ' equipped' : '');
      d.innerHTML = '<div class="inv-icon">' + sk.icon + '</div>' +
        '<div class="inv-name">' + sk.name + '</div>' +
        '<div class="inv-desc">' + sk.desc + '</div>' +
        '<div class="inv-rarity ' + sk.rarity + '">' + sk.rarity.toUpperCase() + '</div>' +
        '<button class="inv-btn"' + (active ? ' disabled' : '') + '>' + (active ? '✅ Надет' : 'Надеть') + '</button>';
      const btn = d.querySelector('.inv-btn');
      if (btn && !active){
        btn.onclick = () => {
          save.activeWeaponSkin = sk.id;
          saveAll(); renderInventory(); sfx.click();
        };
      }
      el.appendChild(d);
    });

    lockedSkins.forEach(sk => {
      const d = document.createElement('div');
      d.className = 'inv-item locked';
      d.innerHTML = '<div class="inv-icon">🔒</div>' +
        '<div class="inv-name">???</div>' +
        '<div class="inv-desc">Открой кейс, чтобы узнать</div>' +
        '<div class="inv-rarity ' + sk.rarity + '">' + sk.rarity.toUpperCase() + '</div>';
      el.appendChild(d);
    });
  }
  else if (currentInvTab === 'charskins'){
    const ownedSkins = CHAR_SKINS.filter(sk => isCharSkinOwned(sk.id) || sk.id === 'default');
    const lockedSkins = CHAR_SKINS.filter(sk => !isCharSkinOwned(sk.id) && sk.id !== 'default' && !sk.secret);

    ownedSkins.forEach(sk => {
      const active = save.activeCharSkin === sk.id;
      const d = document.createElement('div');
      d.className = 'inv-item' + (active ? ' equipped' : '');
      d.innerHTML = '<div class="inv-icon">' + sk.icon + '</div>' +
        '<div class="inv-name">' + sk.name + '</div>' +
        '<div class="inv-desc">' + sk.desc + '</div>' +
        '<div class="inv-rarity ' + sk.rarity + '">' + sk.rarity.toUpperCase() + '</div>' +
        '<button class="inv-btn"' + (active ? ' disabled' : '') + '>' + (active ? '✅ Надет' : 'Надеть') + '</button>';
      const btn = d.querySelector('.inv-btn');
      if (btn && !active){
        btn.onclick = () => {
          save.activeCharSkin = sk.id;
          saveAll(); renderInventory(); sfx.click();
        };
      }
      el.appendChild(d);
    });

    lockedSkins.forEach(sk => {
      const d = document.createElement('div');
      d.className = 'inv-item locked';
      d.innerHTML = '<div class="inv-icon">🔒</div>' +
        '<div class="inv-name">???</div>' +
        '<div class="inv-desc">Из кейса</div>' +
        '<div class="inv-rarity ' + sk.rarity + '">' + sk.rarity.toUpperCase() + '</div>';
      el.appendChild(d);
    });
  }
  else if (currentInvTab === 'ult'){
    ULTS.forEach(u => {
      const owned = isUltOwned(u.id);
      const active = save.activeUlt === u.id;
      const d = document.createElement('div');
      d.className = 'inv-item' + (active ? ' equipped' : '') + (owned ? '' : ' locked');
      d.innerHTML = '<div class="inv-icon">' + (owned ? u.icon : '🔒') + '</div>' +
        '<div class="inv-name">' + (owned ? u.name : '???') + '</div>' +
        '<div class="inv-desc">' + (owned ? u.desc : 'Купи в магазине') + '</div>' +
        (owned ? '<button class="inv-btn"' + (active ? ' disabled' : '') + '>' +
          (active ? '✅ Выбрана' : 'Выбрать') + '</button>' : '');
      const btn = d.querySelector('.inv-btn');
      if (btn && owned && !active){
        btn.onclick = () => {
          save.activeUlt = u.id;
          saveAll(); renderInventory(); sfx.click();
        };
      }
      el.appendChild(d);
    });
  }
}

// ================= ПИТОМЦЫ =================
function renderPets(){
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('petsCoins', save.coins);
  set('petsCrystals', save.crystals);
  const el = document.getElementById('petsList');
  if (!el) return;
  el.innerHTML = '';
  PETS.forEach(p => {
    const owned = isPetOwned(p.id);
    const active = save.activePet === p.id;
    const canBuy = !owned && ((p.price && save.coins >= p.price) || (p.priceCrystals && save.crystals >= p.priceCrystals));
    const priceText = p.price ? '💰 ' + p.price : ('💎 ' + p.priceCrystals);
    const d = document.createElement('div');
    d.className = 'pet-item' + (owned ? ' owned' : '') + (active ? ' active' : '');
    d.innerHTML = '<div class="pet-icon">' + p.icon + '</div>' +
      '<div class="pet-name">' + p.name + '</div>' +
      '<div class="pet-desc">' + p.desc + '</div>' +
      '<div class="pet-price">' + (owned ? '✅ Куплено' : priceText) + '</div>' +
      '<button class="pet-btn ' + (owned ? (active ? 'active' : 'owned') : '') + '"' + (!owned && !canBuy ? ' disabled' : '') + '>' +
        (owned ? (active ? '✅ Выбран' : 'Выбрать') : (canBuy ? 'Купить' : 'Мало денег')) + '</button>';
    const btn = d.querySelector('.pet-btn');
    if (owned && !active){
      btn.onclick = () => {
        save.activePet = p.id; saveAll(); renderPets();
      };
    } else if (!owned && canBuy){
      btn.onclick = () => {
        if (p.price) save.coins -= p.price; else save.crystals -= p.priceCrystals;
        save.ownedPets.push(p.id);
        save.activePet = p.id;
        saveAll(); sfx.coin(); renderPets(); updateMenuInfo();
      };
    }
    el.appendChild(d);
  });
}

// ================= РЕКОРДЫ =================
function switchRecordsTab(tab){
  currentRecordsTab = tab;
  document.querySelectorAll('#recordsMenu .shop-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  renderRecords();
}
function renderRecords(){
  const el = document.getElementById('recordsList');
  if (!el) return;
  el.innerHTML = '';
  const list = save.records[currentRecordsTab] || [];
  if (list.length === 0){
    el.innerHTML = '<div class="record-empty">🏅 Пока нет записей.<br>Сыграй игру чтобы попасть в таблицу!</div>';
    return;
  }
  const sorted = [...list].sort((a, b) => b.value - a.value).slice(0, 5);
  sorted.forEach((r, i) => {
    const d = document.createElement('div');
    d.className = 'record-row' + (i === 0 ? ' top1' : (i === 1 ? ' top2' : (i === 2 ? ' top3' : '')));
    let suffix = '';
    if (currentRecordsTab === 'time') suffix = ' сек';
    if (currentRecordsTab === 'round') suffix = ' раунд';
    if (currentRecordsTab === 'kills') suffix = ' 💀';
    d.innerHTML = '<div class="record-rank r' + (i + 1) + '">#' + (i + 1) + '</div>' +
      '<div class="record-info">' +
        '<div class="record-name">' + (r.name || 'Игрок') + '</div>' +
        '<div class="record-value">Результат: <b>' + r.value + suffix + '</b></div>' +
      '</div>';
    el.appendChild(d);
  });
}
function addRecord(type, value){
  if (!save.records[type]) save.records[type] = [];
  save.records[type].push({
    name: save.playerName || 'Бобёр',
    value: value,
    date: Date.now()
  });
  save.records[type] = save.records[type].sort((a, b) => b.value - a.value).slice(0, 10);
}

// ================= ЕЖЕДНЕВНЫЕ НАГРАДЫ =================
const DAILY_REWARDS = [
  { day: 1, icon: '💰', reward: '500', type: 'coins', amount: 500 },
  { day: 2, icon: '💰', reward: '1000', type: 'coins', amount: 1000 },
  { day: 3, icon: '💎', reward: '5', type: 'crystals', amount: 5 },
  { day: 4, icon: '💰', reward: '2000', type: 'coins', amount: 2000 },
  { day: 5, icon: '💎', reward: '10', type: 'crystals', amount: 10 },
  { day: 6, icon: '💰', reward: '3000', type: 'coins', amount: 3000 },
  { day: 7, icon: '🤠', reward: 'Скин Ковбой', type: 'skin', amount: 'cowboy' }
];
function renderDailyRewards(){
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('dailyStreak', save.dailyStreak || 0);
  const el = document.getElementById('dailyCalendar');
  if (!el) return;
  el.innerHTML = '';
  const today = new Date().toDateString();
  const canClaimToday = save.dailyLastClaim !== today;
  DAILY_REWARDS.forEach((r, idx) => {
    const dayIndex = idx + 1;
    const isClaimed = (save.dailyStreak || 0) >= dayIndex;
    const isToday = canClaimToday && dayIndex === (save.dailyStreak || 0) + 1;
    const isLocked = dayIndex > (save.dailyStreak || 0) + 1;
    const d = document.createElement('div');
    d.className = 'daily-day' + (isClaimed ? ' claimed' : '') + (isToday ? ' today' : '') + (isLocked ? ' locked' : '');
    d.innerHTML = '<div class="daily-day-num">День ' + dayIndex + '</div>' +
      '<div class="daily-day-icon">' + r.icon + '</div>' +
      '<div class="daily-day-reward">' + r.reward + '</div>' +
      '<button class="daily-day-btn ' + (isClaimed ? 'claimed' : '') + '"' + (!isToday ? ' disabled' : '') + '>' +
        (isClaimed ? '✅' : (isToday ? 'ЗАБРАТЬ' : '🔒')) + '</button>';
    const btn = d.querySelector('.daily-day-btn');
    if (isToday){
      btn.onclick = () => {
        claimDailyReward(r);
        renderDailyRewards();
      };
    }
    el.appendChild(d);
  });
}
function claimDailyReward(r){
  const today = new Date().toDateString();
  if (save.dailyLastClaim === today) return;
  save.dailyLastClaim = today;
  save.dailyStreak = (save.dailyStreak || 0) + 1;
  if (r.type === 'coins'){
    save.coins += r.amount;
    showAchievement('Получено ' + r.amount + '💰');
    sfx.coin();
  } else if (r.type === 'crystals'){
    save.crystals += r.amount;
    showAchievement('Получено ' + r.amount + '💎');
    sfx.crystal();
  } else if (r.type === 'skin'){
    if (save.charSkins.indexOf(r.amount) < 0){
      save.charSkins.push(r.amount);
      showAchievement('Открыт скин: 🤠 Ковбой!');
    } else {
      save.coins += 5000;
      showAchievement('Скин уже есть — +5000💰');
    }
    sfx.ach();
  }
  saveAll();
  updateMenuInfo();
}

// ================= НАСТРОЙКИ ФУНКЦИИ =================
function onVolumeChange(){
  const v = document.getElementById('volumeSlider');
  if (!v) return;
  settings.volume = parseInt(v.value);
  const vv = document.getElementById('volVal');
  if (vv) vv.textContent = settings.volume;
  saveSettings();
}
function updateOptGroup(id, val){
  document.querySelectorAll('#' + id + ' button').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}
function setGfx(v){ settings.gfx = v; updateOptGroup('gfxOptions', v); saveSettings(); sfx.click(); }
function setRes(v){ settings.res = (v === 'auto' ? 'auto' : parseFloat(v)); updateOptGroup('resOptions', String(v)); saveSettings(); sfx.click(); applyResolution(); }
function setWeather(v){ settings.weather = v; updateOptGroup('weatherOptions', v); saveSettings(); sfx.click(); initWeather(); }
function setBg(v){ settings.bg = v; updateOptGroup('bgOptions', v); saveSettings(); sfx.click(); initMenuBg(); updateBgLabel(); }
function setSeason(v){ settings.season = v; updateOptGroup('seasonOptions', v); saveSettings(); sfx.click(); }
function setAnimSpeed(v){ settings.animSpeed = v; updateOptGroup('speedOptions', v); saveSettings(); sfx.click(); }
function setAutosave(v){ settings.autosave = parseInt(v); updateOptGroup('autosaveOptions', String(v)); saveSettings(); sfx.click(); }
function setDmgShow(v){ settings.showDamage = (v === 'on'); updateOptGroup('dmgShowOptions', v); saveSettings(); sfx.click(); }
function setAutoAttack(v){ settings.autoAttack = (v === 'on'); updateOptGroup('autoAttackOptions', v); saveSettings(); sfx.click(); }
function syncSettingsUI(){
  const v = document.getElementById('volumeSlider');
  if (v) v.value = settings.volume;
  const vv = document.getElementById('volVal');
  if (vv) vv.textContent = settings.volume;
  const inp = document.getElementById('playerNameInput');
  if (inp) inp.value = save.playerName || '';
  updateOptGroup('gfxOptions', settings.gfx);
  updateOptGroup('fpsOptions', settings.showFps ? 'on' : 'off');
  updateOptGroup('fxOptions', settings.screenFx ? 'on' : 'off');
  updateOptGroup('resOptions', settings.res === 'auto' ? 'auto' : String(settings.res));
  updateOptGroup('bloodOptions', settings.blood ? 'on' : 'off');
  updateOptGroup('weatherOptions', settings.weather);
  updateOptGroup('bgOptions', settings.bg);
  updateOptGroup('seasonOptions', settings.season);
  updateOptGroup('speedOptions', settings.animSpeed);
  updateOptGroup('autosaveOptions', String(settings.autosave));
  updateOptGroup('dmgShowOptions', settings.showDamage ? 'on' : 'off');
  updateOptGroup('autoAttackOptions', settings.autoAttack ? 'on' : 'off');
}
function updateFpsVisibility(){
  const d = document.getElementById('fpsDisplay');
  if (d) d.classList.toggle('hidden', !settings.showFps);
}

// ================= МЕТКИ ФОНОВ =================
const BG_LABELS = {
  zombie: 'ИМПЕРИЯ БОБРИКОВ',
  stars: 'КОСМОС',
  matrix: 'СЛЕДУЙ ЗА БЕЛЫМ КРОЛИКОМ',
  fire: 'АД',
  snow: 'ХОЛОД',
  rain: 'ГРОЗА'
};
function updateBgLabel(){
  const el = document.getElementById('bgLabel');
  if (!el) return;
  el.textContent = BG_LABELS[settings.bg] || 'ZOMBIE SURVIVOR';
}

// ================= ЦИТАТЫ =================
const QUOTES = [
  '«Империя начинается с одного бобра»',
  '«Наполеон одобряет»',
  '«Не зли бобра — он строит»',
  '«Зомби не пройдут!»',
  '«Один бобёр — сила, много — империя»',
  '«Плотина крепче, чем кажется»',
  '«Ножи крутятся — зомби боятся»',
  '«Босс не вечен»',
  '«Дерево талантов — твой путь»',
  '«Кристаллы — наше всё»'
];
function updateQuote(){
  const el = document.getElementById('menuQuote');
  if (!el) return;
  el.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ================= АНИМАЦИЯ КЕЙСА =================
let caseOpeningActive = false;

function openCaseAnimation(caseId){
  if (caseOpeningActive) return;
  const cs = CASES.find(c => c.id === caseId);
  if (!cs) return;
  if (save.coins < cs.price){ sfx.damage(); return; }

  const available = cs.pool.filter(id => !isWeaponSkinOwned(id) && !isCharSkinOwned(id));
  if (available.length === 0){
    save.coins += 100;
    saveAll();
    showAchievement('Все скины уже есть — +100💰 назад');
    renderShop();
    updateMenuInfo();
    return;
  }

  save.coins -= cs.price;
  save.caseCount = (save.caseCount || 0) + 1;
  saveAll();
  caseOpeningActive = true;

  const modal = document.getElementById('caseModal');
  const spinner = document.getElementById('caseSpinner');
  const itemShow = document.getElementById('caseItemShow');
  const result = document.getElementById('caseResult');
  const okBtn = document.getElementById('caseOkBtn');

  if (!modal){
    const got = available[Math.floor(Math.random() * available.length)];
    if (WEAPON_SKINS.find(x => x.id === got)) save.weaponSkins.push(got);
    else if (CHAR_SKINS.find(x => x.id === got)) save.charSkins.push(got);
    saveAll();
    const skin = WEAPON_SKINS.find(x => x.id === got) || CHAR_SKINS.find(x => x.id === got);
    if (skin) showAchievement('Получен скин: ' + skin.icon + ' ' + skin.name);
    caseOpeningActive = false;
    renderShop(); updateMenuInfo();
    return;
  }

  modal.classList.remove('hidden');
  result.classList.add('hidden');
  okBtn.classList.add('hidden');
  spinner.style.visibility = 'visible';
  spinner.classList.add('spinning');

  const winner = available[Math.floor(Math.random() * available.length)];
  const allSkins = [...WEAPON_SKINS, ...CHAR_SKINS];
  const animPool = [];
  for (let i = 0; i < 25; i++){
    animPool.push(allSkins[Math.floor(Math.random() * allSkins.length)]);
  }
  animPool.push(allSkins.find(s => s.id === winner));

  let idx = 0;
  let delay = 50;
  const startTime = performance.now();
  const totalDuration = 2500;

  function spin(){
    const now = performance.now();
    const progress = Math.min(1, (now - startTime) / totalDuration);
    const skin = animPool[Math.min(idx, animPool.length - 1)];
    const ic = itemShow.querySelector('.ci-icon');
    const nm = itemShow.querySelector('.ci-name');
    if (ic) ic.textContent = skin.icon;
    if (nm) nm.textContent = skin.name;
    sfx.caseOpen();
    idx++;
    delay = 50 + Math.pow(progress, 3) * 300;
    if (progress < 1 && idx < animPool.length){
      setTimeout(spin, delay);
    } else {
      spinner.classList.remove('spinning');
      spinner.style.visibility = 'hidden';
      showCaseResult(winner);
    }
  }
  spin();
}
function showCaseResult(skinId){
  const skin = WEAPON_SKINS.find(s => s.id === skinId) || CHAR_SKINS.find(s => s.id === skinId);
  if (!skin) return;

  if (WEAPON_SKINS.find(s => s.id === skinId) && !isWeaponSkinOwned(skinId)){
    save.weaponSkins.push(skinId);
  } else if (CHAR_SKINS.find(s => s.id === skinId) && !isCharSkinOwned(skinId)){
    save.charSkins.push(skinId);
  }
  saveAll();

  const result = document.getElementById('caseResult');
  const icon = document.getElementById('caseResultIcon');
  const rarity = document.getElementById('caseResultRarity');
  const name = document.getElementById('caseResultName');
  const desc = document.getElementById('caseResultDesc');
  const okBtn = document.getElementById('caseOkBtn');

  icon.textContent = skin.icon;
  icon.style.color =
    skin.rarity === 'mythic' ? '#ff4080' :
    skin.rarity === 'legendary' ? '#ffd166' :
    skin.rarity === 'epic' ? '#e0a0ff' :
    skin.rarity === 'rare' ? '#8cb8ff' : '#ddd';
  rarity.textContent = skin.rarity.toUpperCase();
  rarity.className = 'case-result-rarity ' + skin.rarity;
  name.textContent = skin.name;
  desc.textContent = skin.desc;

  result.classList.remove('hidden');
  okBtn.classList.remove('hidden');

  sfx.coin();
  showAchievement('Получен скин: ' + skin.icon + ' ' + skin.name);
}
function closeCaseModal(){
  document.getElementById('caseModal').classList.add('hidden');
  caseOpeningActive = false;
  sfx.click();
  renderShop();
  updateMenuInfo();
}
document.addEventListener('click', (e) => {
  if (e.target.id === 'caseModal' && caseOpeningActive){
    if (!document.getElementById('caseOkBtn').classList.contains('hidden')){
      closeCaseModal();
    }
  }
});
// ================= CANVAS =================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, renderScale = 1, dpr = Math.min(window.devicePixelRatio || 1, 2);

function applyResolution(){
  let s = 1;
  if (settings.res === 'auto'){
    const area = innerWidth * innerHeight;
    if (area > 2500000) s = 0.85;
    else if (area > 1600000) s = 1;
    else s = Math.min(dpr, 1.5);
  } else s = settings.res;
  renderScale = s;
  W = canvas.width = Math.floor(innerWidth * s * dpr);
  H = canvas.height = Math.floor(innerHeight * s * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}
applyResolution();
addEventListener('resize', () => {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  applyResolution();
  resizeMenu();
});

// ================= УТИЛИТЫ =================
const rand = (a, b) => Math.random() * (b - a) + a;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
function hashAbs(x, y, s){
  s = s || 0;
  let n = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453;
  return n - Math.floor(n);
}
function getGfxSettings(){
  if (settings.gfx === 'low')    return { blood:4, maxBlood:60, shadows:false, detail:1, trail:false, props:false };
  if (settings.gfx === 'medium') return { blood:8, maxBlood:150, shadows:true, detail:2, trail:true, props:true };
  return { blood:16, maxBlood:400, shadows:true, detail:3, trail:true, props:true };
}
function getDiffSettings(){
  if (settings.difficulty === 'easy') return { spawnMul:1.35, dmgMul:0.7, hpMul:0.85, xpMul:1.2 };
  if (settings.difficulty === 'hard') return { spawnMul:0.65, dmgMul:1.4, hpMul:1.3, xpMul:0.9 };
  return { spawnMul:1.0, dmgMul:1.0, hpMul:1.0, xpMul:1.0 };
}

// ================= ТЕКСТУРЫ =================
function makeAsphalt(){
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const x = c.getContext('2d');
  x.fillStyle = '#2e2e34'; x.fillRect(0,0,512,512);
  for (let i=0;i<20000;i++){
    const px = Math.random()*512, py = Math.random()*512, s = Math.random()*1.6+0.2;
    const v = 25 + Math.random()*45;
    x.fillStyle = 'rgb('+v+','+v+','+(v+5)+')';
    x.beginPath(); x.arc(px,py,s,0,6.28); x.fill();
  }
  for (let i=0;i<800;i++){
    const px=Math.random()*512, py=Math.random()*512, s=Math.random()*2.8+0.4;
    x.fillStyle = 'rgba('+(70+Math.random()*50)+','+(70+Math.random()*50)+','+(75+Math.random()*50)+',0.6)';
    x.beginPath(); x.arc(px,py,s,0,6.28); x.fill();
  }
  for (let i=0;i<40;i++){
    const px=Math.random()*512, py=Math.random()*512, r=Math.random()*100+20;
    const g = x.createRadialGradient(px,py,0,px,py,r);
    g.addColorStop(0,'rgba(0,0,0,0.5)'); g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px,py,r,0,6.28); x.fill();
  }
  return c;
}
function makeGrass(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#2d4a24'; x.fillRect(0,0,256,256);
  for (let i=0;i<300;i++){
    const px=Math.random()*256, py=Math.random()*256, r=Math.random()*40+10;
    const g = x.createRadialGradient(px,py,0,px,py,r);
    const v = Math.random()<0.5 ? 'rgba(60,100,50,0.4)' : 'rgba(40,70,35,0.4)';
    g.addColorStop(0, v); g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px,py,r,0,6.28); x.fill();
  }
  for (let i=0;i<8000;i++){
    const px=Math.random()*256, py=Math.random()*256;
    const col = Math.random()<0.5 ? 'rgba(70,110,55,0.7)' : 'rgba(50,80,40,0.7)';
    x.strokeStyle = col; x.lineWidth = 1;
    x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.random()*2-1,py-2-Math.random()*3); x.stroke();
  }
  return c;
}
function makeSnow(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#e8eef5'; x.fillRect(0,0,256,256);
  for (let i=0;i<6000;i++){
    const px=Math.random()*256, py=Math.random()*256;
    x.fillStyle = 'rgba('+(220+Math.random()*35)+','+(230+Math.random()*25)+',255,'+(0.3+Math.random()*0.4)+')';
    x.beginPath(); x.arc(px,py,Math.random()*2.5,0,6.28); x.fill();
  }
  return c;
}

let asphaltPattern=null, grassPattern=null, snowPattern=null;
function initPatterns(){
  if (!asphaltPattern) asphaltPattern = ctx.createPattern(makeAsphalt(), 'repeat');
  if (!grassPattern) grassPattern = ctx.createPattern(makeGrass(), 'repeat');
  if (!snowPattern) snowPattern = ctx.createPattern(makeSnow(), 'repeat');
}

// ================= БИОМЫ =================
function getBiomeAt(wx, wy){
  const d = Math.max(Math.abs(wx), Math.abs(wy));
  if (d < 3500) return 'city';
  if (d < 7000) return 'forest';
  return 'snow';
}
function getBiomePattern(b){
  if (b === 'city') return asphaltPattern;
  if (b === 'forest') return grassPattern;
  if (b === 'snow') return snowPattern;
  return asphaltPattern;
}

// ================= СОСТОЯНИЕ ИГРЫ =================
let camX=0, camY=0, gameTime=0, spawnTimer=0, gameOver=false, paused=false, choosingBuff=false;
let screenShake = 0, lastTime = 0, gameLoopId = null;
let fpsAccum = 0, fpsFrames = 0;
let currentRound = 1, killsInRound = 0, killsNeeded = 12;
let inBossFight = false, bossKilledThisRound = false, roundClearPending = false;
let gameCoins = 0, gameCrystals = 0, bossesKilledThisRun = 0;
let playerLives = 0, livesBoughtThisRun = 0, deathOverlayActive = false;
let restTimerActive = false, restTimerValue = 0;
let comboCount = 0, comboTimer = 0, comboMult = 1;
let noHitThisRound = true, roundStartTime = 0;

const player = {
  x: 0, y: 0, speed: 260, radius: 14,
  hp: 100, maxHp: 100, invuln: 0,
  facing: 1, facingAngle: 0, walkPhase: 0,
  level: 1, xp: 0, xpNext: 15, kills: 0,
  pickupRange: 90, regen: 0.4,
  xpMult: 1, lifesteal: 0, critChance: 0, coinBonus: 0,
  sprinting: false, stamina: 100, maxStamina: 100, staminaDrain: 40, staminaRegen: 18
};

const knives = {
  count: 2, distance: 58, rotSpeed: 3.6, angle: 0,
  damage: 18, size: 16, hitCooldowns: new Map()
};

let enemies = [], bloodParticles = [], footprints = [], pickups = [], chests = [];
let floatingTexts = [], boss = null;
let bossProjectiles = [], bullets = [], turrets = [], meteors = [];
let blackhole = null, orbitalMarkers = [];
let lightningBolts = [], earthquakeWaves = [];
let wolf = null, clones = [];
let enemyId = 0;

let playerSkillCd = 0;
let playerUltCd = 0;
let skillShieldTime = 0;
let skillSpeedTime = 0;

let keys = {};
let mouse = { x: 0, y: 0 };

addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === 'Escape' && !document.getElementById('gameScreen').classList.contains('hidden')){
    if (choosingBuff || roundClearPending || gameOver || deathOverlayActive) return;
    if (paused) resumeGame(); else pauseGame();
  }
  if ((e.key === 'e' || e.key === 'у') && !paused && !gameOver && !choosingBuff){
    useSkill();
  }
  if ((e.key === 'q' || e.key === 'й') && !paused && !gameOver && !choosingBuff){
    useUlt();
  }
});
addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });

// ================= БАФФЫ =================
const BUFFS = [
  { id:'speed',       icon:'⚡', name:'Быстрые ноги',    desc:'Скорость +15%',              rarity:'common', apply:()=>{ player.speed *= 1.15; } },
  { id:'hp_max',      icon:'❤', name:'Крепкое тело',    desc:'Макс HP +25 и +25 HP',       rarity:'common', apply:()=>{ player.maxHp += 25; player.hp = Math.min(player.maxHp, player.hp+25); } },
  { id:'damage',      icon:'⚔', name:'Заточенные ножи', desc:'Урон ножей +25%',            rarity:'common', apply:()=>{ knives.damage *= 1.25; } },
  { id:'rot',         icon:'🔄', name:'Быстрое вращение',desc:'Скорость вращения +25%',     rarity:'common', apply:()=>{ knives.rotSpeed *= 1.25; } },
  { id:'pickup',      icon:'🧲', name:'Магнит',         desc:'Радиус подбора +50%',         rarity:'common', apply:()=>{ player.pickupRange *= 1.5; } },
  { id:'regen',       icon:'💚', name:'Регенерация',    desc:'Восстановление +0.5/сек',     rarity:'common', apply:()=>{ player.regen += 0.5; } },
  { id:'stamina',     icon:'🏃', name:'Стайер',         desc:'Макс выносливости +50',       rarity:'common', apply:()=>{ player.maxStamina += 50; player.stamina = player.maxStamina; } },
  { id:'coin',        icon:'💰', name:'Делец',          desc:'Монеты +25%',                 rarity:'common', apply:()=>{ player.coinBonus = (player.coinBonus||0) + 0.25; } },
  { id:'knife',       icon:'🔪', name:'+1 Нож',         desc:'Добавить ещё нож',            rarity:'rare',   apply:()=>{ knives.count += 1; } },
  { id:'range',       icon:'📏', name:'Дальний радиус', desc:'Дальность ножей +25%',        rarity:'rare',   apply:()=>{ knives.distance *= 1.25; } },
  { id:'size',        icon:'🗡', name:'Большие клинки', desc:'Размер ножей +30%',           rarity:'rare',   apply:()=>{ knives.size *= 1.3; } },
  { id:'xp_mult',     icon:'💎', name:'Мудрец',         desc:'Опыт +25%',                   rarity:'rare',   apply:()=>{ player.xpMult *= 1.25; } },
  { id:'crit',        icon:'💥', name:'Критический удар',desc:'+10% шанс крита',            rarity:'rare',   apply:()=>{ player.critChance = (player.critChance||0) + 0.1; } },
  { id:'lifesteal',   icon:'🩸', name:'Кровопийца',     desc:'+1 HP за убийство',           rarity:'rare',   apply:()=>{ player.lifesteal = (player.lifesteal||0) + 1; } },
  { id:'damage2',     icon:'🔥', name:'Кровавая жатва', desc:'Урон ножей +60%',             rarity:'epic',   apply:()=>{ knives.damage *= 1.6; } },
  { id:'all_k',       icon:'🌀', name:'Вихрь клинков',  desc:'+2 ножа и +15% скорости',     rarity:'epic',   apply:()=>{ knives.count += 2; knives.rotSpeed *= 1.15; } },
  { id:'big_hp',      icon:'🛡', name:'Живая крепость', desc:'Макс HP +60, полное HP',      rarity:'epic',   apply:()=>{ player.maxHp += 60; player.hp = player.maxHp; } },
  { id:'turret',      icon:'🔫', name:'Турель',         desc:'Устанавливает турель рядом',  rarity:'epic',   apply:()=>{ spawnTurret(); } },
  { id:'godmode',     icon:'👑', name:'Ярость богов',   desc:'+2 ножа, урон +50%, скор +10%',rarity:'legendary', apply:()=>{ knives.count += 2; knives.damage *= 1.5; player.speed *= 1.1; } },
  { id:'vampire',     icon:'🧛', name:'Вампир',         desc:'+3 HP за убийство',           rarity:'legendary', apply:()=>{ player.lifesteal = (player.lifesteal||0) + 3; } },
  { id:'second_wind', icon:'🌟', name:'Второе дыхание', desc:'+1 жизнь',                    rarity:'legendary', apply:()=>{ playerLives++; updateLivesDisplay(); } }
];
const playerBuffs = {};

function spawnTurret(){ turrets.push({ x: player.x, y: player.y, angle: 0, cooldown: 0 }); }
function randomBuffs(n){
  const rarityWeight = { common:60, rare:30, epic:8, legendary:2 };
  const pool = [];
  BUFFS.forEach(b => {
    const w = rarityWeight[b.rarity] || 10;
    for (let i=0;i<w;i++) pool.push(b);
  });
  const chosen = [], used = {};
  while (chosen.length < n && chosen.length < BUFFS.length){
    const b = pool[Math.floor(Math.random()*pool.length)];
    if (used[b.id]) continue;
    used[b.id] = true; chosen.push(b);
  }
  return chosen;
}
function applyBuff(b){
  b.apply();
  playerBuffs[b.id] = (playerBuffs[b.id]||0) + 1;
  sfx.buff();
  updateBuffsList();
}
function updateBuffsList(){
  const el = document.getElementById('buffsList');
  if (!el) return;
  el.innerHTML = '';
  const sorted = Object.entries(playerBuffs).sort((a,b) => b[1] - a[1]);
  if (sorted.length === 0){ el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  sorted.forEach(pair => {
    const id = pair[0], count = pair[1];
    const buff = BUFFS.find(b => b.id === id);
    if (!buff) return;
    const d = document.createElement('div');
    d.className = 'buff-item';
    d.innerHTML = '<span>' + buff.icon + '</span><span>' + buff.name + '</span><span class="bi-count">×' + count + '</span>';
    el.appendChild(d);
  });
}
function showLevelUp(){
  choosingBuff = true; paused = true;
  sfx.levelup();
  const choices = randomBuffs(3);
  const cont = document.getElementById('buffCards');
  if (!cont) return;
  cont.innerHTML = '';
  choices.forEach(b => {
    const card = document.createElement('button');
    card.className = 'buff-card';
    card.innerHTML = '<div class="bc-icon">' + b.icon + '</div>' +
      '<div class="bc-name">' + b.name + '</div>' +
      '<div class="bc-desc">' + b.desc + '</div>' +
      '<div class="bc-rarity ' + b.rarity + '">' + b.rarity.toUpperCase() + '</div>';
    card.onclick = () => {
      applyBuff(b);
      document.getElementById('levelUpOverlay').classList.add('hidden');
      choosingBuff = false; paused = false;
      lastTime = performance.now();
    };
    cont.appendChild(card);
  });
  document.getElementById('levelUpOverlay').classList.remove('hidden');
}

// ================= БОСС КОСТЮМЫ =================
const BOSS_COSTUMES = [
  null,
  { id:'reaper',  name:'ЖНЕЦ СМЕРТИ',       color:'#0a0a0a', accent:'#8b0000' },
  { id:'demon',   name:'ДЕМОН БЕЗДНЫ',      color:'#4a0a0a', accent:'#ff3030' },
  { id:'skull',   name:'КОРОЛЬ КОСТЕЙ',     color:'#dcdcc8', accent:'#3a3a2a' },
  { id:'ice',     name:'ПОВЕЛИТЕЛЬ ЛЬДА',   color:'#80d0ff', accent:'#2080ff' },
  { id:'dragon',  name:'ОГНЕННЫЙ ДРАКОН',   color:'#8b0000', accent:'#ff8000' },
  { id:'necro',   name:'НЕКРОМАНТ',         color:'#2a0a3a', accent:'#a040ff' },
  { id:'void',    name:'КОРОЛЬ ПУСТОТЫ',    color:'#1a0a2a', accent:'#c040ff' },
  { id:'napoleon',name:'ДУХ НАПОЛЕОНА',     color:'#2a3a6a', accent:'#ffd166' }
];
function getBossCostume(round){
  if (round >= 10) return BOSS_COSTUMES[8];
  if (round >= 7) return BOSS_COSTUMES[7];
  if (round >= 6) return BOSS_COSTUMES[6];
  if (round >= 5) return BOSS_COSTUMES[5];
  if (round >= 4) return BOSS_COSTUMES[4];
  if (round >= 3) return BOSS_COSTUMES[3];
  if (round >= 2) return BOSS_COSTUMES[2];
  if (round >= 1) return BOSS_COSTUMES[1];
  return null;
}
// ================= СПАВН =================
function spawnEnemy(){
  const ang = Math.random() * 6.28;
  const sd = Math.max(W, H) * 0.7;
  const x = player.x + Math.cos(ang) * sd;
  const y = player.y + Math.sin(ang) * sd;
  const roundDifficulty = 1 + (currentRound - 1) * 0.25;
  const d = getDiffSettings();
  const types = [
    { hp:30, sp:70,  col:'#3e6b3e', size:14, dmg:8,  weight:7 },
    { hp:18, sp:100, col:'#5a5a3a', size:11, dmg:5,  weight:3 },
    { hp:60, sp:55,  col:'#2a4a2a', size:18, dmg:12, weight:2 },
    { hp:40, sp:130, col:'#4a7a4a', size:12, dmg:7,  weight:2 }
  ];
  const totalW = types.reduce((s,t) => s + t.weight, 0);
  let r = Math.random() * totalW, type = types[0];
  for (let i=0; i<types.length; i++){
    if (r < types[i].weight){ type = types[i]; break; }
    r -= types[i].weight;
  }
  const diff = (1 + player.level * 0.12) * roundDifficulty * d.hpMul;
  const skin = Math.floor(Math.random() * Math.min(currentRound, 6));
  enemies.push({
    id: enemyId++, x, y, knockX:0, knockY:0,
    hp: type.hp * diff, maxHp: type.hp * diff,
    speed: type.sp * (0.9 + Math.random() * 0.2),
    color: type.col, size: type.size, dmg: type.dmg * d.dmgMul * roundDifficulty,
    walkPhase: Math.random() * 6.28, facing: 1, hurt: 0, frozen: 0,
    skin: skin, coinValue: 1
  });
}
function spawnBoss(){
  const ang = Math.random() * 6.28;
  const sd = Math.max(W, H) * 0.6;
  const x = player.x + Math.cos(ang) * sd;
  const y = player.y + Math.sin(ang) * sd;
  const d = getDiffSettings();
  const baseHp = (700 + currentRound * 500) * d.hpMul;
  const costume = getBossCostume(currentRound);
  boss = {
    id: enemyId++, x, y, knockX:0, knockY:0,
    hp: baseHp, maxHp: baseHp,
    speed: 80 + currentRound * 4,
    size: 42 + currentRound * 2,
    color: costume ? costume.color : '#1a4a1a',
    dmg: (18 + currentRound * 3) * d.dmgMul,
    walkPhase: 0, facing: 1, hurt: 0, frozen: 0,
    skin: 10, coinValue: 30 + currentRound * 15,
    isBoss: true, costume,
    phase: 1, state: 'idle', stateTimer: 2,
    telegraphTimer: 0, telegraphType: '',
    chargeX: 0, chargeY: 0, slamRadius: 0,
    secondPhaseDone: false
  };
  inBossFight = true; roundClearPending = false;
  const bn = document.getElementById('bossName');
  const bp = document.getElementById('bossPhase');
  if (bn) bn.textContent = costume ? ('👹 ' + costume.name) : '👹 БОСС';
  if (bp) bp.textContent = 'ФАЗА 1 / ' + (currentRound >= 3 ? '2' : '1');
  document.getElementById('bossIntro').classList.remove('hidden');
  sfx.bossSpawn();
  setTimeout(() => {
    const bi = document.getElementById('bossIntro');
    if (bi) bi.classList.add('hidden');
    const bb = document.getElementById('bossBar');
    if (bb) bb.classList.remove('hidden');
  }, 2000);
  if (settings.screenFx) screenShake = 1.2;
}
function spawnBossMinion(){
  if (!boss) return;
  const ang = Math.random() * 6.28, r = 100 + Math.random() * 50;
  enemies.push({
    id: enemyId++, x: boss.x + Math.cos(ang)*r, y: boss.y + Math.sin(ang)*r,
    knockX:0, knockY:0,
    hp: 20 * currentRound, maxHp: 20 * currentRound,
    speed: 90, color:'#4a3a2a', size:12, dmg: 3 * currentRound,
    walkPhase: Math.random()*6.28, facing:1, hurt:0, frozen: 0,
    skin: 0, coinValue: 1, isMinion: true
  });
}
function spawnChest(){
  const ang = Math.random() * 6.28, d = rand(350, 700);
  chests.push({
    x: player.x + Math.cos(ang) * d,
    y: player.y + Math.sin(ang) * d,
    opened: false, bob: Math.random() * 6.28,
    xpValue: 4 + Math.floor(Math.random() * 3)
  });
}

// ================= ЭФФЕКТЫ =================
function addBlood(x, y, n, dx, dy){
  if (!settings.blood) return;
  dx = dx || 0; dy = dy || 0;
  const g = getGfxSettings();
  const c = Math.min(n, g.blood);
  for (let i=0; i<c; i++){
    const a = Math.random() * 6.28, sp = rand(60, 220);
    bloodParticles.push({
      x, y, vx: Math.cos(a)*sp + dx*100, vy: Math.sin(a)*sp + dy*100,
      life: rand(0.5, 1.1), maxLife: 1.1, size: rand(2, 5)
    });
  }
  if (bloodParticles.length > g.maxBlood) bloodParticles.splice(0, bloodParticles.length - g.maxBlood);
}
function addFloatingText(x, y, text, color, size){
  if (!settings.showDamage && text.startsWith('-')) return;
  floatingTexts.push({ x, y, text, color: color||'#fff', life:1.2, maxLife:1.2, size: size||16 });
}
function addCoinFx(x, y, amount){ addFloatingText(x, y-15, '+' + amount + '💰', '#ffd166', 14); }
function gainCoins(amount){
  const bonus = 1 + (player.coinBonus||0) + (comboMult - 1);
  const real = Math.round(amount * bonus);
  gameCoins += real;
  save.coins += real;
  save.totalEarned += real;
  return real;
}
function gainCrystals(amount){
  gameCrystals += amount;
  save.crystals += amount;
  save.totalCrystalsEarned = (save.totalCrystalsEarned||0) + amount;
  return amount;
}

// ================= УРОН И ВРАГИ =================
function damageEnemy(e, dmg, dx, dy, isCrit){
  const finalDmg = isCrit ? dmg*2 : dmg;
  e.hp -= finalDmg; e.hurt = 0.15;
  e.knockX += dx*250; e.knockY += dy*250;
  addBlood(e.x, e.y, 6, dx, dy);
  sfx.hit();
  const col = isCrit ? '#ffd166' : '#ff6060';
  addFloatingText(e.x + rand(-5,5), e.y - e.size - 10,
    (isCrit ? 'КРИТ ' : '') + '-' + Math.round(finalDmg), col, isCrit ? 20 : 16);
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e){
  if (e.isBoss) return;
  const idx = enemies.indexOf(e);
  if (idx < 0) return;
  enemies.splice(idx, 1);
  if (!e.isMinion){
    player.kills++;
    killsInRound++;
    save.totalKills++;
    save.dailyKills++;
    save.weeklyKills++;
    comboCount++;
    comboTimer = 3;
    if (comboCount > 10) comboMult = 1.5;
    else if (comboCount > 5) comboMult = 1.25;
    else comboMult = 1;
  }
  addBlood(e.x, e.y, 20);
  pickups.push({ x: e.x, y: e.y, value: 1, bob: Math.random()*6.28 });
  if (Math.random() < 0.35){
    const amt = gainCoins(e.coinValue);
    addCoinFx(e.x, e.y, amt);
  }
  if (Math.random() < 0.05){
    const c = gainCrystals(1);
    addFloatingText(e.x, e.y-30, '+1💎', '#80d0ff', 14);
    sfx.crystal();
  }
  if (player.lifesteal) player.hp = Math.min(player.maxHp, player.hp + player.lifesteal);
  if (!inBossFight && killsInRound >= killsNeeded && !bossKilledThisRound) setTimeout(spawnBoss, 500);
}
function damageBoss(dmg, dx, dy, isCrit){
  if (!boss) return;
  const finalDmg = isCrit ? dmg*2 : dmg;
  boss.hp -= finalDmg; boss.hurt = 0.15;
  boss.knockX += dx*100; boss.knockY += dy*100;
  addBlood(boss.x, boss.y, 10, dx, dy);
  sfx.hit();
  addFloatingText(boss.x + rand(-10,10), boss.y - boss.size - 10,
    (isCrit ? 'КРИТ ' : '') + '-' + Math.round(finalDmg),
    isCrit ? '#ffd166' : '#ff6060', isCrit ? 24 : 18);

  const hpPct = boss.hp / boss.maxHp;
  if (currentRound >= 3 && hpPct < 0.5 && !boss.secondPhaseDone){
    boss.secondPhaseDone = true;
    boss.phase = 2;
    boss.speed *= 1.4;
    boss.dmg *= 1.3;
    boss.color = '#2a0a4a';
    boss.size += 8;
    const bp = document.getElementById('bossPhase');
    if (bp) bp.textContent = 'ФАЗА 2 / 2 — ПРЕОБРАЖЕНИЕ!';
    if (settings.screenFx) screenShake = 1.5;
    showEventToast('👹', 'БОСС ПЕРЕРОДИЛСЯ!');
    for (let i=0; i<60; i++){
      bloodParticles.push({
        x: boss.x, y: boss.y,
        vx: Math.cos(Math.random()*6.28)*rand(100,400),
        vy: Math.sin(Math.random()*6.28)*rand(100,400),
        life: rand(0.6,1.4), maxLife:1.4, size: rand(3,6)
      });
    }
  }
  if (currentRound < 3){
    if (hpPct < 0.4 && boss.phase < 3){
      boss.phase = 3; boss.speed *= 1.3;
      const bp = document.getElementById('bossPhase');
      if (bp) bp.textContent = 'ФАЗА 3 / 3 — ЯРОСТЬ!';
      if (settings.screenFx) screenShake = 1.2;
    } else if (hpPct < 0.7 && boss.phase < 2){
      boss.phase = 2;
      const bp = document.getElementById('bossPhase');
      if (bp) bp.textContent = 'ФАЗА 2 / 3';
      if (settings.screenFx) screenShake = 0.7;
    }
  }
  if (boss.hp <= 0) killBoss();
}
function killBoss(){
  if (!boss) return;
  const b = boss;
  for (let i=0; i<120; i++){
    bloodParticles.push({
      x: b.x, y: b.y,
      vx: Math.cos(Math.random()*6.28)*rand(100,500),
      vy: Math.sin(Math.random()*6.28)*rand(100,500),
      life: rand(0.7,1.8), maxLife:1.8, size: rand(3,8)
    });
  }
  const reward = gainCoins(b.coinValue);
  const crystals = gainCrystals(10 + Math.floor(Math.random() * 20));
  save.bossesKilled++;
  save.totalBossesAllTime++;
  save.dailyBosses++;
  save.weeklyBosses++;
  bossesKilledThisRun++;
  save.talPoints += 1;
  addCoinFx(b.x, b.y, reward);
  addFloatingText(b.x, b.y - 40, '+' + crystals + '💎', '#80d0ff', 18);
  for (let i=0; i<25; i++){
    pickups.push({
      x: b.x + rand(-80,80), y: b.y + rand(-80,80),
      value: 1, bob: Math.random()*6.28
    });
  }
  boss = null;
  inBossFight = false;
  bossKilledThisRound = true;
  bossProjectiles = [];
  meteors = [];
  enemies = enemies.filter(e => !e.isMinion);
  const bb = document.getElementById('bossBar');
  if (bb) bb.classList.add('hidden');
  if (settings.screenFx) screenShake = 1.5;
  saveAll();
  setTimeout(showRoundClear, 900);
}

// ================= РАУНДЫ =================
function showRoundClear(){
  roundClearPending = true;
  paused = true;
  sfx.roundClear();
  const reward = gainCoins(30 + currentRound * 15);

  // Проверка достижений раунда
  if (noHitThisRound) save.noHitRoundDone = true;
  const roundDuration = (performance.now() - roundStartTime) / 1000;
  if (roundDuration < 30) save.speedRunDone = true;

  // Добавляем в таблицу рекордов
  addRecord('kills', player.kills);
  addRecord('round', currentRound);
  addRecord('time', Math.floor(gameTime));

  saveAll();
  const cr = document.getElementById('clearRound');
  const cc = document.getElementById('clearCoins');
  if (cr) cr.textContent = currentRound;
  if (cc) cc.textContent = reward;
  restTimerValue = 15;
  restTimerActive = true;
  updateRestTimer();
  document.getElementById('roundClearOverlay').classList.remove('hidden');
  updateRoundHUD();
}
function updateRestTimer(){
  const el = document.getElementById('restTimer');
  if (el) el.textContent = restTimerValue;
}
function skipRest(){
  sfx.click();
  restTimerActive = false;
  document.getElementById('roundClearOverlay').classList.add('hidden');
  startNextRound();
}
function startNextRound(){
  currentRound++;
  save.dailyRound = Math.max(save.dailyRound, currentRound);
  if (currentRound > save.record.round){
    save.record.round = currentRound;
    saveAll();
  }
  killsInRound = 0;
  killsNeeded = 12 + (currentRound - 1) * 6;
  bossKilledThisRound = false;
  inBossFight = false;
  roundClearPending = false;
  paused = false;
  noHitThisRound = true;
  roundStartTime = performance.now();
  lastTime = performance.now();
  updateRoundHUD();
}
function updateRoundHUD(){
  const rn = document.getElementById('roundNum');
  const rp = document.getElementById('roundProgress');
  if (rn) rn.textContent = currentRound;
  if (rp) rp.textContent = killsInRound + ' / ' + killsNeeded + ' 💀';
}
function updateLivesDisplay(){
  const el = document.getElementById('livesDisplay');
  if (!el) return;
  let s = '';
  for (let i=0; i<playerLives; i++) s += '❤';
  el.innerHTML = s || '<span style="opacity:0.35;font-size:12px">Нет жизней</span>';
}

// ================= СТАРТ ИГРЫ =================
function startGame(){
  initAudio();
  sfx.click();
  showScreen('gameScreen');
  document.getElementById('hud').classList.remove('hidden');
  document.querySelector('.pause-btn').style.display = 'block';
  updateFpsVisibility();
  restartGame(true);
}
function applyStartingBuffs(){
  if (isOwned('knife_start')) knives.count = 3;
  if (isOwned('damage_start')) knives.damage *= 1.2;
  if (isOwned('speed_start')) player.speed *= 1.12;
  if (isOwned('hp_start')){ player.maxHp += 40; player.hp = player.maxHp; }
  if (isOwned('magnet_start')) player.pickupRange *= 1.5;
  if (isOwned('regen_start')) player.regen += 0.5;
  if (isOwned('crit_start')) player.critChance = (player.critChance||0) + 0.1;
  if (isOwned('stamina_start')){ player.maxStamina += 50; player.stamina = player.maxStamina; }
  if (isOwned('coin_start')) player.coinBonus = (player.coinBonus||0) + 0.3;
  if (isOwned('level_start')){
    for (let i=0; i<2; i++){
      const pool = BUFFS.filter(b => b.rarity === 'common' || b.rarity === 'rare');
      applyBuff(pool[Math.floor(Math.random()*pool.length)]);
    }
    player.level = 3;
    player.xpNext = 40;
  }
  const char = getActiveCharacter();
  if (char && char.apply) char.apply();
  applyTalentsToPlayer();
  playerLives = 0;
  LIVES_UPGRADES.forEach(u => {
    if (save.owned.indexOf('life_' + u.level) >= 0) playerLives = u.level;
  });
}
function restartGame(silent){
  if (!silent) sfx.click();
  player.x = 0; player.y = 0;
  player.hp = player.maxHp = 100;
  player.invuln = 0; player.facing = 1; player.walkPhase = 0;
  player.level = 1; player.xp = 0; player.xpNext = 15; player.kills = 0;
  player.speed = 260; player.pickupRange = 90; player.regen = 0.4;
  player.xpMult = 1; player.lifesteal = 0; player.critChance = 0; player.coinBonus = 0;
  player.stamina = player.maxStamina = 100; player.sprinting = false;

  for (const k in playerBuffs) delete playerBuffs[k];
  updateBuffsList();

  knives.count = 2; knives.angle = 0; knives.hitCooldowns.clear();
  knives.distance = 58; knives.rotSpeed = 3.6; knives.damage = 18; knives.size = 16;

  enemies = []; bloodParticles = []; footprints = []; pickups = [];
  chests = []; floatingTexts = []; boss = null;
  bossProjectiles = []; turrets = []; bullets = [];
  meteors = []; blackhole = null; orbitalMarkers = [];
  lightningBolts = []; earthquakeWaves = []; wolf = null; clones = [];
  enemyId = 0;

  gameTime = 0; spawnTimer = 0; gameOver = false; paused = false;
  choosingBuff = false; screenShake = 0;
  currentRound = 1; killsInRound = 0; killsNeeded = 12;
  inBossFight = false; bossKilledThisRound = false; roundClearPending = false;
  gameCoins = 0; gameCrystals = 0; bossesKilledThisRun = 0;
  livesBoughtThisRun = 0; deathOverlayActive = false;
  restTimerActive = false; restTimerValue = 0;
  comboCount = 0; comboTimer = 0; comboMult = 1;
  noHitThisRound = true; roundStartTime = performance.now();

  playerSkillCd = 0;
  playerUltCd = 0;
  skillShieldTime = 0;
  skillSpeedTime = 0;

  ['pauseOverlay','gameOverOverlay','levelUpOverlay','roundClearOverlay','bossIntro','bossBar','deathOverlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const pb = document.querySelector('.pause-btn');
  if (pb) pb.style.display = 'block';

  initPatterns();
  for (let i=0; i<6; i++) spawnChest();
  applyStartingBuffs();
  updateRoundHUD();
  updateHUD();
  updateLivesDisplay();

  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  lastTime = performance.now();
  gameLoopId = requestAnimationFrame(loop);
}
function pauseGame(){
  if (gameOver || choosingBuff || roundClearPending || deathOverlayActive) return;
  paused = true;
  document.getElementById('pauseOverlay').classList.remove('hidden');
  const pb = document.querySelector('.pause-btn');
  if (pb) pb.style.display = 'none';
}
function resumeGame(){
  paused = false;
  lastTime = performance.now();
  document.getElementById('pauseOverlay').classList.add('hidden');
  const pb = document.querySelector('.pause-btn');
  if (pb) pb.style.display = 'block';
}
function exitToMenu(){
  sfx.click();
  gameOver = true; paused = false; choosingBuff = false; roundClearPending = false; deathOverlayActive = false;
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  ['pauseOverlay','gameOverOverlay','levelUpOverlay','roundClearOverlay','bossIntro','bossBar','deathOverlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  save.totalTime += gameTime;
  saveAll();
  showScreen('mainMenu');
  updateMenuInfo();
  syncSettingsUI();
}

// ================= СМЕРТЬ И ВОЗРОЖДЕНИЕ =================
function onPlayerDeath(){
  if (playerLives > 0){
    deathOverlayActive = true; paused = true;
    const ds = document.getElementById('deathSub');
    if (ds) ds.textContent = 'У вас есть ' + playerLives + ' жизней';
    const btns = document.getElementById('deathButtons');
    if (!btns) return;
    btns.innerHTML = '';
    const b1 = document.createElement('button');
    b1.className = 'btn-revive';
    b1.textContent = '❤ ВОЗРОДИТЬСЯ (-1 жизнь)';
    b1.onclick = () => revivePlayer();
    btns.appendChild(b1);
    const b2 = document.createElement('button');
    b2.className = 'btn';
    b2.textContent = '🏳 СДАТЬСЯ';
    b2.onclick = () => {
      document.getElementById('deathOverlay').classList.add('hidden');
      deathOverlayActive = false;
      endGame();
    };
    btns.appendChild(b2);
    document.getElementById('deathOverlay').classList.remove('hidden');
  } else {
    deathOverlayActive = true; paused = true;
    const ds = document.getElementById('deathSub');
    if (ds) ds.textContent = 'Жизней нет. Купить за монеты?';
    const btns = document.getElementById('deathButtons');
    if (!btns) return;
    btns.innerHTML = '';
    const price = getLifePrice();
    if (livesBoughtThisRun < 3 && save.coins >= price){
      const b1 = document.createElement('button');
      b1.className = 'btn-revive';
      b1.textContent = '💰 Купить жизнь (' + price + ') и возродиться';
      b1.onclick = () => {
        save.coins -= price;
        livesBoughtThisRun++;
        saveAll(); sfx.coin();
        playerLives++;
        revivePlayer();
      };
      btns.appendChild(b1);
    } else if (livesBoughtThisRun >= 3){
      const p = document.createElement('p');
      p.style.color = '#ff8080';
      p.textContent = 'Лимит покупок исчерпан (3/3)';
      btns.appendChild(p);
    } else {
      const p = document.createElement('p');
      p.style.color = '#ff8080';
      p.textContent = 'Не хватает монет: ' + price;
      btns.appendChild(p);
    }
    const b2 = document.createElement('button');
    b2.className = 'btn';
    b2.textContent = '🏳 ЗАВЕРШИТЬ';
    b2.onclick = () => {
      document.getElementById('deathOverlay').classList.add('hidden');
      deathOverlayActive = false;
      endGame();
    };
    btns.appendChild(b2);
    document.getElementById('deathOverlay').classList.remove('hidden');
  }
}
function getLifePrice(){
  const prices = [500, 1500, 3500];
  return prices[Math.min(livesBoughtThisRun, 2)];
}
function revivePlayer(){
  deathOverlayActive = false;
  paused = false;
  playerLives--;
  player.hp = player.maxHp;
  player.invuln = 3;
  enemies = enemies.filter(e => dist(e.x, e.y, player.x, player.y) > 400);
  bossProjectiles = [];
  meteors = [];
  document.getElementById('deathOverlay').classList.add('hidden');
  const pb = document.querySelector('.pause-btn');
  if (pb) pb.style.display = 'block';
  updateLivesDisplay();
  sfx.revive();
  lastTime = performance.now();
}
function endGame(){
  gameOver = true;
  sfx.death();
  const rec = player.kills > save.record.kills;
  if (rec){
    save.record.kills = player.kills;
    save.record.level = player.level;
    save.record.time = Math.floor(gameTime);
  }
  if (player.level > save.record.level) save.record.level = player.level;
  if (gameTime > save.record.time) save.record.time = Math.floor(gameTime);
  if (currentRound > save.record.round) save.record.round = currentRound;
  save.totalTime += gameTime;
  addRecord('kills', player.kills);
  addRecord('time', Math.floor(gameTime));
  addRecord('round', currentRound);
  saveAll();
  const fk = document.getElementById('finalKills');
  const fl = document.getElementById('finalLevel');
  const fr = document.getElementById('finalRound');
  const ft = document.getElementById('finalTime');
  const fc = document.getElementById('finalCoins');
  if (fk) fk.textContent = player.kills;
  if (fl) fl.textContent = player.level;
  if (fr) fr.textContent = currentRound;
  if (ft) ft.textContent = Math.floor(gameTime);
  if (fc) fc.textContent = gameCoins;
  document.getElementById('gameOverOverlay').classList.remove('hidden');
  const pb = document.querySelector('.pause-btn');
  if (pb) pb.style.display = 'none';
}
// ================= СКИЛЛ (E) =================
function useSkill(){
  const sk = getActiveSkill();
  if (!sk){ showAchievement('Купи навык в магазине'); return; }
  if (playerSkillCd > 0) return;
  playerSkillCd = 20;
  sfx.skill();

  const worldMouseX = camX + mouse.x / (renderScale * dpr);
  const worldMouseY = camY + mouse.y / (renderScale * dpr);

  if (sk.id === 'throw_knife'){
    const a = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    bullets.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * 700, vy: Math.sin(a) * 700,
      life: 1.2, damage: knives.damage * 2, throwKnife: true, spin: 0
    });
  } else if (sk.id === 'freeze'){
    enemies.forEach(e => {
      if (dist(e.x, e.y, player.x, player.y) < 400){
        e.frozen = 3;
        e.knockX = 0; e.knockY = 0;
      }
    });
    if (settings.screenFx) screenShake = 0.5;
    for (let i=0; i<60; i++){
      const a = Math.random()*6.28, r = Math.random()*400;
      bloodParticles.push({
        x: player.x + Math.cos(a)*r,
        y: player.y + Math.sin(a)*r,
        vx: 0, vy: 0,
        life: 1.2, maxLife: 1.2, size: 3, isIce: true
      });
    }
  } else if (sk.id === 'heal'){
    player.hp = Math.min(player.maxHp, player.hp + 50);
    addFloatingText(player.x, player.y - 40, '+50 HP', '#4fc46d', 20);
  } else if (sk.id === 'teleport'){
    const a = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    const dist_ = Math.min(400, dist(worldMouseX, worldMouseY, player.x, player.y));
    // Взрыв на месте старта
    for (let i=0; i<30; i++){
      bloodParticles.push({
        x: player.x, y: player.y,
        vx: Math.cos(Math.random()*6.28)*rand(80,250),
        vy: Math.sin(Math.random()*6.28)*rand(80,250),
        life: 0.8, maxLife: 0.8, size: 3
      });
    }
    player.x += Math.cos(a) * dist_;
    player.y += Math.sin(a) * dist_;
    player.invuln = 1;
    // Взрыв на месте прибытия
    for (let i=0; i<30; i++){
      bloodParticles.push({
        x: player.x, y: player.y,
        vx: Math.cos(Math.random()*6.28)*rand(80,250),
        vy: Math.sin(Math.random()*6.28)*rand(80,250),
        life: 0.8, maxLife: 0.8, size: 3
      });
    }
  } else if (sk.id === 'shield'){
    skillShieldTime = 3;
    player.invuln = 3;
    addFloatingText(player.x, player.y - 40, '🛡 ЩИТ!', '#7fd2ff', 20);
  } else if (sk.id === 'fireball'){
    const a = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);
    bullets.push({
      x: player.x, y: player.y,
      vx: Math.cos(a) * 500, vy: Math.sin(a) * 500,
      life: 2, damage: knives.damage * 3, fireball: true, size: 14
    });
  } else if (sk.id === 'speed_boost'){
    skillSpeedTime = 5;
    addFloatingText(player.x, player.y - 40, '💨 X2 СКОРОСТЬ!', '#ffd166', 20);
  }
}

// ================= УЛЬТА (Q) =================
function useUlt(){
  const u = getActiveUlt();
  if (!u) return;
  if (playerUltCd > 0) return;
  playerUltCd = 120;
  sfx.ult();

  if (u.id === 'blackhole'){
    blackhole = {
      x: player.x, y: player.y,
      radius: 0, maxRadius: 260,
      life: 6, maxLife: 6, suckPower: 900
    };
    if (settings.screenFx) screenShake = 1;
    showEventToast('🕳', 'ЧЁРНАЯ ДЫРА!');
  } else if (u.id === 'orbital'){
    for (let i=0; i<3; i++){
      const a = Math.random() * 6.28, r = Math.random() * 500;
      orbitalMarkers.push({
        x: player.x + Math.cos(a) * r,
        y: player.y + Math.sin(a) * r,
        delay: i * 0.4, maxDelay: 1.2, radius: 180, exploded: false
      });
    }
    showEventToast('☄', 'ОРБИТАЛЬНАЯ ПУШКА!');
  } else if (u.id === 'lightning'){
    // Молнии по всем врагам на экране
    const viewW = W / (renderScale * dpr);
    const viewH = H / (renderScale * dpr);
    enemies.forEach(e => {
      if (Math.abs(e.x - player.x) < viewW/2 && Math.abs(e.y - player.y) < viewH/2){
        lightningBolts.push({
          x: e.x, y: e.y, life: 0.5, maxLife: 0.5
        });
        damageEnemy(e, knives.damage * 2, 0, 0, false);
      }
    });
    if (boss) damageBoss(knives.damage * 2, 0, 0, false);
    if (settings.screenFx) screenShake = 1.2;
    showEventToast('⚡', 'МОЛНИЯ!');
  } else if (u.id === 'earthquake'){
    earthquakeWaves.push({
      x: player.x, y: player.y, radius: 0, maxRadius: 700, life: 2, maxLife: 2
    });
    if (settings.screenFx) screenShake = 1.5;
    showEventToast('🌋', 'ЗЕМЛЕТРЯСЕНИЕ!');
  } else if (u.id === 'wolf'){
    wolf = {
      x: player.x + 40, y: player.y, hp: 200, maxHp: 200,
      damage: knives.damage * 2, attackCd: 0, life: 20, facing: 1, walkPhase: 0
    };
    showEventToast('🐺', 'ВОЛК-СОЮЗНИК!');
  } else if (u.id === 'clones'){
    clones = [];
    for (let i=0; i<2; i++){
      const a = i * 3.14;
      clones.push({
        x: player.x + Math.cos(a) * 60,
        y: player.y + Math.sin(a) * 60,
        angle: Math.random() * 6.28,
        life: 10
      });
    }
    showEventToast('👥', 'КЛОНЫ!');
  }
}

function updateSkillCd(dt){
  if (playerSkillCd > 0) playerSkillCd -= dt;
  if (playerUltCd > 0) playerUltCd -= dt;
  if (skillShieldTime > 0) skillShieldTime -= dt;
  if (skillSpeedTime > 0) skillSpeedTime -= dt;

  const cdE = document.getElementById('skillCdE');
  const cdQ = document.getElementById('skillCdQ');
  const icE = document.getElementById('skillIconE');
  const icQ = document.getElementById('skillIconQ');
  const sk = getActiveSkill();
  const u = getActiveUlt();
  if (icE) icE.textContent = sk ? sk.icon : '—';
  if (icQ) icQ.textContent = u ? u.icon : '—';
  if (cdE){
    if (playerSkillCd > 0){
      cdE.classList.remove('hidden');
      cdE.textContent = Math.ceil(playerSkillCd);
    } else cdE.classList.add('hidden');
  }
  if (cdQ){
    if (playerUltCd > 0){
      cdQ.classList.remove('hidden');
      cdQ.textContent = Math.ceil(playerUltCd);
    } else cdQ.classList.add('hidden');
  }
  const se = document.getElementById('skillSlotE');
  const sq = document.getElementById('skillSlotQ');
  if (se) se.classList.toggle('ready', !!sk && playerSkillCd <= 0);
  if (sq) sq.classList.toggle('ready', !!u && playerUltCd <= 0);
}

// ================= ЦИКЛ ИГРЫ =================
function loop(ts){
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;
  fpsAccum += dt; fpsFrames++;
  if (fpsAccum >= 0.5){
    const f = Math.round(fpsFrames / fpsAccum);
    const fv = document.getElementById('fpsValue');
    if (fv) fv.textContent = f;
    fpsAccum = 0; fpsFrames = 0;
  }

  if (restTimerActive && paused){
    restTimerValue -= dt;
    if (restTimerValue <= 0){
      restTimerValue = 0;
      restTimerActive = false;
      const rco = document.getElementById('roundClearOverlay');
      if (rco) rco.classList.add('hidden');
      startNextRound();
    }
    updateRestTimer();
  }

  // Автосохранение
  if (settings.autosave > 0 && !gameOver){
    autosaveTimer += dt;
    if (autosaveTimer >= settings.autosave){
      autosaveTimer = 0;
      saveAll();
    }
  }

  updateWeather(dt);
  if (!gameOver && !paused) update(dt);
  render();
  if (!gameOver) gameLoopId = requestAnimationFrame(loop);
}

// ================= ОБНОВЛЕНИЕ =================
function update(dt){
  gameTime += dt;
  if (screenShake > 0 && settings.screenFx) screenShake = Math.max(0, screenShake - dt * 4);

  // Комбо-таймер
  if (comboTimer > 0){
    comboTimer -= dt;
    if (comboTimer <= 0){ comboCount = 0; comboMult = 1; updateComboDisplay(); }
  } else updateComboDisplay();

  let dx = 0, dy = 0;
  if (keys['w']||keys['ц']||keys['arrowup'])    dy -= 1;
  if (keys['s']||keys['ы']||keys['arrowdown'])  dy += 1;
  if (keys['a']||keys['ф']||keys['arrowleft'])  dx -= 1;
  if (keys['d']||keys['в']||keys['arrowright']) dx += 1;
  const moving = dx || dy;
  if (moving){ const l = Math.hypot(dx, dy); dx /= l; dy /= l; }

  const wantSprint = (keys['shift']||keys['shiftleft']||keys['shiftright']) && moving && player.stamina > 5;
  player.sprinting = wantSprint;
  let speedMul = skillSpeedTime > 0 ? 2 : 1;
  if (wantSprint){
    speedMul *= 1.65;
    player.stamina -= player.staminaDrain * dt;
    if (player.stamina <= 0){ player.stamina = 0; player.sprinting = false; }
  } else {
    player.stamina += player.staminaRegen * dt;
    if (player.stamina > player.maxStamina) player.stamina = player.maxStamina;
  }

  player.x += dx * player.speed * speedMul * dt;
  player.y += dy * player.speed * speedMul * dt;

  if (moving){
    player.walkPhase += dt * (11 + (wantSprint ? 4 : 0));
    player.facingAngle = Math.atan2(dy, dx);
    if (Math.abs(dx) > 0.1) player.facing = dx > 0 ? 1 : -1;
    const step = Math.floor(player.walkPhase / Math.PI);
    if (!player._lastStep || player._lastStep !== step){
      player._lastStep = step;
      footprints.push({ x: player.x, y: player.y + 10, angle: player.facingAngle, life: 2.5 });
      if (footprints.length > 60) footprints.shift();
    }
  } else player.walkPhase += dt * 2;

  camX = player.x - W / (2 * renderScale * dpr);
  camY = player.y - H / (2 * renderScale * dpr);

  player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  if (player.invuln > 0) player.invuln -= dt;

  updateSkillCd(dt);

  // Ножи
  knives.angle += knives.rotSpeed * dt;
  for (let i = 0; i < knives.count; i++){
    const a = knives.angle + (i / knives.count) * 6.28;
    const kx = player.x + Math.cos(a) * knives.distance;
    const ky = player.y + Math.sin(a) * knives.distance;
    for (let ei = 0; ei < enemies.length; ei++){
      const e = enemies[ei];
      const rr = e.size + knives.size * 0.7;
      if (dist(kx, ky, e.x, e.y) < rr){
        const last = knives.hitCooldowns.get(e.id) || -999;
        if (gameTime - last > 0.28){
          knives.hitCooldowns.set(e.id, gameTime);
          const crit = Math.random() < (player.critChance || 0);
          damageEnemy(e, knives.damage, Math.cos(a), Math.sin(a), crit);
          if (settings.screenFx) screenShake = 0.15;
        }
      }
    }
    if (boss){
      const rr = boss.size + knives.size * 0.7;
      if (dist(kx, ky, boss.x, boss.y) < rr){
        const last = knives.hitCooldowns.get(boss.id) || -999;
        if (gameTime - last > 0.28){
          knives.hitCooldowns.set(boss.id, gameTime);
          const crit = Math.random() < (player.critChance || 0);
          damageBoss(knives.damage, Math.cos(a), Math.sin(a), crit);
          if (settings.screenFx) screenShake = 0.15;
        }
      }
    }
  }

  // Турели
  for (let i = 0; i < turrets.length; i++){
    const t = turrets[i];
    t.cooldown -= dt;
    let closest = null, minD = 400;
    for (let j = 0; j < enemies.length; j++){
      const d2 = dist(t.x, t.y, enemies[j].x, enemies[j].y);
      if (d2 < minD){ minD = d2; closest = enemies[j]; }
    }
    if (closest && t.cooldown <= 0){
      const a = Math.atan2(closest.y - t.y, closest.x - t.x);
      bullets.push({ x: t.x, y: t.y, vx: Math.cos(a)*500, vy: Math.sin(a)*500, life: 1.5, damage: knives.damage*0.6 });
      t.cooldown = 0.6;
    }
    t.angle += dt * 2;
  }

  // Волк-союзник
  if (wolf){
    wolf.life -= dt;
    if (wolf.life <= 0){ wolf = null; }
    else {
      // Ищем ближайшего врага
      let target = null, minD = 500;
      for (let i=0; i<enemies.length; i++){
        const d2 = dist(wolf.x, wolf.y, enemies[i].x, enemies[i].y);
        if (d2 < minD){ minD = d2; target = enemies[i]; }
      }
      if (target){
        const a = Math.atan2(target.y - wolf.y, target.x - wolf.x);
        wolf.x += Math.cos(a) * 250 * dt;
        wolf.y += Math.sin(a) * 250 * dt;
        wolf.facing = Math.cos(a) > 0 ? 1 : -1;
        wolf.walkPhase += dt * 15;
        wolf.attackCd -= dt;
        if (dist(wolf.x, wolf.y, target.x, target.y) < target.size + 20 && wolf.attackCd <= 0){
          damageEnemy(target, wolf.damage, Math.cos(a), Math.sin(a), false);
          wolf.attackCd = 0.5;
        }
      } else {
        const a = Math.atan2(player.y - wolf.y, player.x - wolf.x);
        if (dist(wolf.x, wolf.y, player.x, player.y) > 80){
          wolf.x += Math.cos(a) * 200 * dt;
          wolf.y += Math.sin(a) * 200 * dt;
        }
      }
    }
  }

  // Клоны
  for (let i = clones.length - 1; i >= 0; i--){
    const c = clones[i];
    c.life -= dt;
    if (c.life <= 0){ clones.splice(i, 1); continue; }
    c.angle += knives.rotSpeed * dt;
    // Урон по врагам вокруг клона
    for (let j = enemies.length - 1; j >= 0; j--){
      const e = enemies[j];
      if (dist(c.x, c.y, e.x, e.y) < knives.distance){
        const last = knives.hitCooldowns.get('c'+i+'_'+e.id) || -999;
        if (gameTime - last > 0.3){
          knives.hitCooldowns.set('c'+i+'_'+e.id, gameTime);
          damageEnemy(e, knives.damage * 0.6, 0, 0, false);
        }
      }
    }
  }

  // Пули
  for (let i = bullets.length - 1; i >= 0; i--){
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.throwKnife) b.spin = (b.spin || 0) + dt * 15;
    if (b.life <= 0){
      if (b.fireball){
        // Взрыв
        for (let j = enemies.length - 1; j >= 0; j--){
          const e = enemies[j];
          if (dist(e.x, e.y, b.x, b.y) < 100){
            damageEnemy(e, knives.damage * 2, 0, 0, false);
          }
        }
        for (let k=0; k<40; k++){
          bloodParticles.push({
            x: b.x, y: b.y,
            vx: Math.cos(Math.random()*6.28)*rand(100,300),
            vy: Math.sin(Math.random()*6.28)*rand(100,300),
            life: 0.8, maxLife: 0.8, size: 4, isFire: true
          });
        }
      }
      bullets.splice(i, 1);
      continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--){
      const e = enemies[j];
      const rr = e.size + (b.fireball ? b.size : 6);
      if (dist(b.x, b.y, e.x, e.y) < rr){
        damageEnemy(e, b.damage, 0, 0, false);
        bullets.splice(i, 1);
        break;
      }
    }
    if (boss && dist(b.x, b.y, boss.x, boss.y) < boss.size + 6){
      damageBoss(b.damage, 0, 0, false);
      bullets.splice(i, 1);
    }
  }

  // Чёрная дыра
  if (blackhole){
    blackhole.life -= dt;
    blackhole.radius = Math.min(blackhole.maxRadius, blackhole.radius + dt * 200);
    if (blackhole.life <= 0){
      blackhole = null;
    } else {
      for (let i = 0; i < enemies.length; i++){
        const e = enemies[i];
        const d2 = dist(e.x, e.y, blackhole.x, blackhole.y);
        if (d2 < blackhole.radius){
          const a = Math.atan2(blackhole.y - e.y, blackhole.x - e.x);
          const power = blackhole.suckPower * (1 - d2 / blackhole.radius);
          e.x += Math.cos(a) * power * dt;
          e.y += Math.sin(a) * power * dt;
          if (d2 < 30) damageEnemy(e, knives.damage * 3 * dt * 30, 0, 0, false);
        }
      }
      if (boss){
        const d2 = dist(boss.x, boss.y, blackhole.x, blackhole.y);
        if (d2 < blackhole.radius){
          const a = Math.atan2(blackhole.y - boss.y, blackhole.x - boss.x);
          const power = blackhole.suckPower * 0.3 * (1 - d2 / blackhole.radius);
          boss.x += Math.cos(a) * power * dt;
          boss.y += Math.sin(a) * power * dt;
        }
      }
    }
  }

  // Орбитальные удары
  for (let i = orbitalMarkers.length - 1; i >= 0; i--){
    const o = orbitalMarkers[i];
    o.delay -= dt;
    if (o.delay <= 0 && !o.exploded){
      o.exploded = true;
      if (settings.screenFx) screenShake = 1.5;
      sfx.meteor();
      for (let j = enemies.length - 1; j >= 0; j--){
        const e = enemies[j];
        if (dist(e.x, e.y, o.x, o.y) < o.radius) damageEnemy(e, 9999, 0, 0, false);
      }
      if (boss && dist(boss.x, boss.y, o.x, o.y) < o.radius){
        damageBoss(200 + currentRound * 50, 0, 0, false);
      }
      for (let k = 0; k < 40; k++){
        bloodParticles.push({
          x: o.x, y: o.y,
          vx: Math.cos(Math.random()*6.28) * rand(100, 400),
          vy: Math.sin(Math.random()*6.28) * rand(100, 400),
          life: rand(0.6, 1.2), maxLife: 1.2, size: rand(2, 5)
        });
      }
    }
    if (o.delay < -0.6) orbitalMarkers.splice(i, 1);
  }

  // Молнии
  for (let i = lightningBolts.length - 1; i >= 0; i--){
    lightningBolts[i].life -= dt;
    if (lightningBolts[i].life <= 0) lightningBolts.splice(i, 1);
  }

  // Землетрясение
  for (let i = earthquakeWaves.length - 1; i >= 0; i--){
    const w = earthquakeWaves[i];
    w.life -= dt;
    w.radius += dt * 350;
    if (w.radius > w.maxRadius || w.life <= 0){ earthquakeWaves.splice(i, 1); continue; }
    for (let j = enemies.length - 1; j >= 0; j--){
      const e = enemies[j];
      const d2 = dist(e.x, e.y, w.x, w.y);
      if (Math.abs(d2 - w.radius) < 40){
        const a = Math.atan2(e.y - w.y, e.x - w.x);
        e.knockX = Math.cos(a) * 800;
        e.knockY = Math.sin(a) * 800;
        const last = knives.hitCooldowns.get('eq_'+e.id) || -999;
        if (gameTime - last > 0.5){
          knives.hitCooldowns.set('eq_'+e.id, gameTime);
          damageEnemy(e, knives.damage, Math.cos(a), Math.sin(a), false);
        }
      }
    }
  }

  // Спавн
  const d = getDiffSettings();
  if (!inBossFight){
    spawnTimer += dt;
    const interval = Math.max(0.4, (1.6 - player.level * 0.06 - currentRound * 0.05) * d.spawnMul);
    if (spawnTimer > interval){
      spawnTimer = 0;
      spawnEnemy();
      if (currentRound >= 4 && Math.random() < 0.35) spawnEnemy();
    }
  } else {
    spawnTimer += dt;
    if (spawnTimer > 4){ spawnTimer = 0; spawnEnemy(); }
  }

  // Враги
  for (let i = enemies.length - 1; i >= 0; i--){
    const e = enemies[i];
    if (e.frozen > 0){
      e.frozen -= dt;
      continue;
    }
    const a = Math.atan2(player.y - e.y, player.x - e.x);
    e.x += (Math.cos(a) * e.speed + e.knockX) * dt;
    e.y += (Math.sin(a) * e.speed + e.knockY) * dt;
    e.knockX *= 0.88; e.knockY *= 0.88;
    e.walkPhase += dt * 8;
    if (Math.abs(Math.cos(a)) > 0.1) e.facing = Math.cos(a) > 0 ? 1 : -1;
    if (e.hurt > 0) e.hurt -= dt;

    if (i % 2 === 0){
      for (let j = 0; j < enemies.length; j += 2){
        if (i === j) continue;
        const e2 = enemies[j];
        const dd = dist(e.x, e.y, e2.x, e2.y);
        const minD = e.size + e2.size;
        if (dd < minD && dd > 0.01){
          const push = (minD - dd) * 0.5;
          const ang = Math.atan2(e.y - e2.y, e.x - e2.x);
          e.x += Math.cos(ang) * push * dt * 8;
          e.y += Math.sin(ang) * push * dt * 8;
        }
      }
    }

    if (dist(e.x, e.y, player.x, player.y) < e.size + player.radius){
      if (player.invuln <= 0 && skillShieldTime <= 0){
        player.hp -= e.dmg;
        player.invuln = 0.5;
        noHitThisRound = false;
        if (settings.screenFx) screenShake = 0.5;
        e.knockX = -Math.cos(a) * 400;
        e.knockY = -Math.sin(a) * 400;
        sfx.damage();
        if (player.hp <= 0){ player.hp = 0; onPlayerDeath(); return; }
      }
    }
  }

  // БОСС
  if (boss) updateBoss(dt);

  // Снаряды босса
  for (let i = bossProjectiles.length - 1; i >= 0; i--){
    const p = bossProjectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0){ bossProjectiles.splice(i, 1); continue; }
    if (dist(p.x, p.y, player.x, player.y) < player.radius + p.size){
      if (player.invuln <= 0 && skillShieldTime <= 0){
        player.hp -= p.damage;
        player.invuln = 0.4;
        noHitThisRound = false;
        sfx.damage();
        if (player.hp <= 0){ player.hp = 0; onPlayerDeath(); return; }
      }
      bossProjectiles.splice(i, 1);
    }
  }

  // Метеоры
  for (let i = meteors.length - 1; i >= 0; i--){
    const m = meteors[i];
    m.delay -= dt;
    if (m.delay <= 0){
      if (settings.screenFx) screenShake = 1.2;
      sfx.meteor();
      for (let j = enemies.length - 1; j >= 0; j--){
        const e = enemies[j];
        if (dist(e.x, e.y, m.x, m.y) < 100) damageEnemy(e, 9999, 0, 0, false);
      }
      if (boss && dist(boss.x, boss.y, m.x, m.y) < 100) damageBoss(80, 0, 0, false);
      for (let k = 0; k < 30; k++){
        bloodParticles.push({
          x: m.x, y: m.y,
          vx: Math.cos(Math.random()*6.28)*rand(80, 300),
          vy: Math.sin(Math.random()*6.28)*rand(80, 300),
          life: rand(0.5, 1), maxLife: 1, size: rand(2, 4)
        });
      }
      meteors.splice(i, 1);
    }
  }

  // Частицы
  for (let i = bloodParticles.length - 1; i >= 0; i--){
    const p = bloodParticles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.9; p.vy *= 0.9;
    p.life -= dt;
    if (p.life <= 0) bloodParticles.splice(i, 1);
  }
  for (let i = footprints.length - 1; i >= 0; i--){
    footprints[i].life -= dt;
    if (footprints[i].life <= 0) footprints.splice(i, 1);
  }
  for (let i = floatingTexts.length - 1; i >= 0; i--){
    const t = floatingTexts[i];
    t.y -= 40 * dt;
    t.life -= dt;
    if (t.life <= 0) floatingTexts.splice(i, 1);
  }

  // Пикапы
  for (let i = pickups.length - 1; i >= 0; i--){
    const p = pickups[i];
    const dd = dist(p.x, p.y, player.x, player.y);
    if (dd < player.pickupRange){
      const a = Math.atan2(player.y - p.y, player.x - p.x);
      const pull = (1 - dd / player.pickupRange) * 700;
      p.x += Math.cos(a) * pull * dt;
      p.y += Math.sin(a) * pull * dt;
    }
    if (dd < player.radius + 10){
      player.xp += p.value * player.xpMult;
      sfx.pickup();
      pickups.splice(i, 1);
      checkLevelUp();
    }
  }

  // Сундуки
  for (let i = chests.length - 1; i >= 0; i--){
    const c = chests[i];
    if (c.opened) continue;
    c.bob += dt * 2;
    const dd = dist(c.x, c.y, player.x, player.y);
    let touched = dd < player.radius + 22;
    if (!touched){
      for (let k = 0; k < knives.count; k++){
        const a = knives.angle + (k / knives.count) * 6.28;
        const kx = player.x + Math.cos(a) * knives.distance;
        const ky = player.y + Math.sin(a) * knives.distance;
        if (dist(kx, ky, c.x, c.y) < knives.size + 22){ touched = true; break; }
      }
    }
    if (touched){
      c.opened = true;
      sfx.chest();
      player.xp += c.xpValue * player.xpMult;
      addFloatingText(c.x, c.y - 30, '+' + Math.round(c.xpValue * player.xpMult) + ' XP', '#ffe066');
      if (Math.random() < 0.5){
        const amt = gainCoins(3);
        addCoinFx(c.x, c.y - 50, amt);
      }
      for (let b = 0; b < 25; b++){
        bloodParticles.push({
          x: c.x, y: c.y,
          vx: Math.cos(Math.random()*6.28) * rand(80, 250),
          vy: Math.sin(Math.random()*6.28) * rand(80, 250),
          life: rand(0.6, 1.2), maxLife: 1.2, size: rand(2, 4)
        });
      }
      chests.splice(i, 1);
      setTimeout(spawnChest, 6000);
      checkLevelUp();
    }
  }

  updateHUD();
}
function updateComboDisplay(){
  const el = document.getElementById('comboDisplay');
  if (!el) return;
  if (comboCount >= 5){
    el.classList.remove('hidden');
    el.textContent = '×' + comboMult.toFixed(1) + ' КОМБО ' + comboCount;
  } else {
    el.classList.add('hidden');
  }
}
function checkLevelUp(){
  if (player.xp >= player.xpNext && !choosingBuff){
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.4 + 4);
    if (player.level >= 5 && knives.count >= 3) save.knifeMasterDone = true;
    showLevelUp();
  }
}
function updateHUD(){
  const hp = document.getElementById('hpFill');
  const hpt = document.getElementById('hpText');
  const xp = document.getElementById('xpFill');
  const xpt = document.getElementById('xpText');
  const st = document.getElementById('staminaFill');
  if (hp) hp.style.width = (player.hp / player.maxHp * 100) + '%';
  if (hpt) hpt.textContent = Math.ceil(player.hp) + ' / ' + player.maxHp;
  if (xp) xp.style.width = (player.xp / player.xpNext * 100) + '%';
  if (xpt) xpt.textContent = Math.floor(player.xp) + ' / ' + player.xpNext + ' XP';
  if (st) st.style.width = (player.stamina / player.maxStamina * 100) + '%';
  const kc = document.getElementById('killCount');
  const tc = document.getElementById('timeCount');
  const gc = document.getElementById('gameCoins');
  const gcr = document.getElementById('gameCrystals');
  if (kc) kc.textContent = player.kills;
  if (tc) tc.textContent = Math.floor(gameTime);
  if (gc) gc.textContent = gameCoins;
  if (gcr) gcr.textContent = gameCrystals;
  updateRoundHUD();
}

// ================= ИИ БОССА =================
function updateBoss(dt){
  if (!boss) return;
  boss.hurt = Math.max(0, boss.hurt - dt);
  boss.walkPhase += dt * 6;
  const a = Math.atan2(player.y - boss.y, player.x - boss.x);
  boss.facing = Math.cos(a) > 0 ? 1 : -1;
  boss.stateTimer -= dt;
  if (boss.telegraphTimer > 0) boss.telegraphTimer -= dt;

  // Метеоры с 3-го босса
  if (currentRound >= 3 && Math.random() < dt * 0.4){
    const ma = Math.random() * 6.28, mr = 200 + Math.random() * 500;
    meteors.push({
      x: boss.x + Math.cos(ma) * mr,
      y: boss.y + Math.sin(ma) * mr,
      delay: 1.5
    });
    showEventToast('☄', 'МЕТЕОРИТ!');
  }

  if (boss.state === 'idle'){
    boss.x += (Math.cos(a) * boss.speed * 0.6 + boss.knockX) * dt;
    boss.y += (Math.sin(a) * boss.speed * 0.6 + boss.knockY) * dt;
    if (boss.stateTimer <= 0){
      const roll = Math.random();
      if (roll < 0.3){
        boss.state = 'tele_charge';
        boss.chargeX = Math.cos(a); boss.chargeY = Math.sin(a);
        boss.telegraphTimer = 3; boss.telegraphType = 'charge';
        boss.stateTimer = 3;
      } else if (roll < 0.55){
        boss.state = 'tele_slam';
        boss.telegraphTimer = 2; boss.telegraphType = 'slam';
        boss.slamRadius = 0; boss.stateTimer = 2;
      } else if (roll < 0.8){
        boss.state = 'summon';
        boss.stateTimer = 0.9;
        for (let i = 0; i < 3; i++) spawnBossMinion();
      } else {
        boss.state = 'shoot';
        boss.stateTimer = 0.8;
        for (let k = -2; k <= 2; k++){
          const ang2 = a + k * 0.25;
          bossProjectiles.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(ang2) * 320,
            vy: Math.sin(ang2) * 320,
            life: 4, size: 14, damage: 12
          });
        }
      }
    }
  } else if (boss.state === 'tele_charge'){
    if (boss.stateTimer <= 0){ boss.state = 'charge'; boss.stateTimer = 0.6; }
  } else if (boss.state === 'charge'){
    const mult = boss.phase === 3 ? 5 : (boss.phase === 2 ? 4.5 : 4);
    boss.x += (boss.chargeX * boss.speed * mult + boss.knockX) * dt;
    boss.y += (boss.chargeY * boss.speed * mult + boss.knockY) * dt;
    if (boss.stateTimer <= 0){ boss.state = 'idle'; boss.stateTimer = rand(1, 1.8); }
  } else if (boss.state === 'tele_slam'){
    if (boss.stateTimer <= 0){ boss.state = 'slam'; boss.stateTimer = 0.7; boss.slamRadius = 0; }
  } else if (boss.state === 'slam'){
    boss.slamRadius = Math.min(280, boss.slamRadius + dt * 700);
    const dd = dist(boss.x, boss.y, player.x, player.y);
    if (dd < boss.slamRadius && player.invuln <= 0 && skillShieldTime <= 0 && boss.slamRadius > 50){
      player.hp -= boss.dmg * 1.8;
      player.invuln = 0.6;
      noHitThisRound = false;
      if (settings.screenFx) screenShake = 1.2;
    }
    if (boss.stateTimer <= 0){ boss.state = 'idle'; boss.stateTimer = rand(1.2, 2); }
  } else if (boss.state === 'summon'){
    if (boss.stateTimer <= 0){ boss.state = 'idle'; boss.stateTimer = rand(1.2, 2); }
  } else if (boss.state === 'shoot'){
    if (boss.stateTimer <= 0){ boss.state = 'idle'; boss.stateTimer = rand(1.2, 2); }
  }

  boss.knockX *= 0.9; boss.knockY *= 0.9;

  if (dist(boss.x, boss.y, player.x, player.y) < boss.size + player.radius){
    if (player.invuln <= 0 && skillShieldTime <= 0){
      player.hp -= boss.dmg;
      player.invuln = 0.7;
      noHitThisRound = false;
      if (settings.screenFx) screenShake = 0.9;
      sfx.damage();
      if (player.hp <= 0){ player.hp = 0; onPlayerDeath(); return; }
    }
  }

  const bh = document.getElementById('bossHpFill');
  const bt = document.getElementById('bossHpText');
  if (bh) bh.style.width = (boss.hp / boss.maxHp * 100) + '%';
  if (bt) bt.textContent = Math.ceil(boss.hp) + ' / ' + boss.maxHp;
}

// ================= ПОГОДА =================
let weatherParticles = [];
let lightningTime = 0, lightningFlash = 0;
let fogClouds = [];

function initWeather(){
  weatherParticles = [];
  fogClouds = [];
  if (settings.weather === 'rain' || settings.weather === 'storm'){
    for (let i = 0; i < 300; i++){
      weatherParticles.push({
        x: rand(0, 2000), y: rand(0, 2000),
        v: 900 + Math.random() * 500,
        len: 15 + Math.random() * 15,
        alpha: 0.3 + Math.random() * 0.5
      });
    }
  } else if (settings.weather === 'snow'){
    for (let i = 0; i < 250; i++){
      weatherParticles.push({
        x: rand(0, 2000), y: rand(0, 2000),
        vy: 30 + Math.random() * 70,
        vx: (Math.random() - 0.5) * 40,
        size: 1.5 + Math.random() * 3.5,
        wobble: Math.random() * 6.28,
        wobbleSpeed: 1 + Math.random() * 3,
        alpha: 0.5 + Math.random() * 0.5
      });
    }
  } else if (settings.weather === 'fog'){
    for (let i = 0; i < 25; i++){
      fogClouds.push({
        x: rand(-500, 2500), y: rand(-500, 2500),
        vx: 20 + Math.random() * 40,
        size: 250 + Math.random() * 350,
        alpha: 0.06 + Math.random() * 0.06
      });
    }
  }
}
initWeather();

function updateWeather(dt){
  if (settings.weather === 'rain' || settings.weather === 'storm'){
    for (let i = 0; i < weatherParticles.length; i++){
      const p = weatherParticles[i];
      p.y += p.v * dt;
      p.x -= 150 * dt;
      const camRight = camX + W / (renderScale * dpr) + 50;
      const camBottom = camY + H / (renderScale * dpr) + 50;
      if (p.y > camBottom){ p.y = camY - 50; p.x = camX - 50 + Math.random() * (camRight - camX + 100); }
      if (p.x < camX - 50) p.x = camRight;
    }
    if (settings.weather === 'storm'){
      lightningTime -= dt;
      if (lightningTime <= 0){
        lightningTime = rand(2.5, 7);
        lightningFlash = 1;
        sfx.thunder();
      }
      if (lightningFlash > 0) lightningFlash = Math.max(0, lightningFlash - dt * 2);
    }
  } else if (settings.weather === 'snow'){
    for (let i = 0; i < weatherParticles.length; i++){
      const p = weatherParticles[i];
      p.wobble += p.wobbleSpeed * dt;
      p.y += p.vy * dt;
      p.x += p.vx * dt + Math.sin(p.wobble) * 30 * dt;
      const viewW = W / (renderScale * dpr);
      const viewH = H / (renderScale * dpr);
      if (p.y > camY + viewH + 30){ p.y = camY - 30; p.x = camX + Math.random() * viewW; }
      if (p.x < camX - 30) p.x = camX + viewW + 30;
      if (p.x > camX + viewW + 30) p.x = camX - 30;
    }
  } else if (settings.weather === 'fog'){
    for (let i = 0; i < fogClouds.length; i++){
      const c = fogClouds[i];
      c.x += c.vx * dt;
      const camRight = camX + W / (renderScale * dpr);
      if (c.x > camRight + c.size) c.x = camX - c.size;
    }
  }
}

function drawWeather(){
  if (settings.weather === 'fog'){
    for (let i = 0; i < fogClouds.length; i++){
      const c = fogClouds[i];
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size);
      g.addColorStop(0, 'rgba(200,210,220,' + c.alpha + ')');
      g.addColorStop(1, 'rgba(200,210,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, 6.28);
      ctx.fill();
    }
  } else if (settings.weather === 'rain'){
    ctx.lineCap = 'round';
    for (let i = 0; i < weatherParticles.length; i++){
      const p = weatherParticles[i];
      const grd = ctx.createLinearGradient(p.x, p.y, p.x - 3, p.y + p.len);
      grd.addColorStop(0, 'rgba(180,200,230,0)');
      grd.addColorStop(1, 'rgba(180,200,230,' + p.alpha + ')');
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 3, p.y + p.len);
      ctx.stroke();
    }
  } else if (settings.weather === 'storm'){
    ctx.lineCap = 'round';
    for (let i = 0; i < weatherParticles.length; i++){
      const p = weatherParticles[i];
      ctx.strokeStyle = 'rgba(200,220,240,' + p.alpha + ')';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 4, p.y + p.len);
      ctx.stroke();
    }
  } else if (settings.weather === 'snow'){
    for (let i = 0; i < weatherParticles.length; i++){
      const p = weatherParticles[i];
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      g.addColorStop(0, 'rgba(255,255,255,' + p.alpha + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, 6.28);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + p.alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 6.28);
      ctx.fill();
    }
  }
}

function drawWeatherOverlay(){
  const viewW = W / (renderScale * dpr);
  const viewH = H / (renderScale * dpr);
  if (settings.weather === 'rain'){
    ctx.fillStyle = 'rgba(30,40,70,0.28)';
    ctx.fillRect(camX, camY, viewW, viewH);
  } else if (settings.weather === 'storm'){
    ctx.fillStyle = 'rgba(20,25,45,0.5)';
    ctx.fillRect(camX, camY, viewW, viewH);
    if (lightningFlash > 0){
      ctx.fillStyle = 'rgba(220,230,255,' + (lightningFlash * 0.5) + ')';
      ctx.fillRect(camX, camY, viewW, viewH);
    }
  } else if (settings.weather === 'snow'){
    ctx.fillStyle = 'rgba(200,220,255,0.05)';
    ctx.fillRect(camX, camY, viewW, viewH);
  }
}
// ================= ОТРИСОВКА =================
function render(){
  ctx.fillStyle = '#0a0a0e';
  ctx.fillRect(0, 0, W, H);

  let shakeX = 0, shakeY = 0;
  if (screenShake > 0 && settings.screenFx){
    shakeX = (Math.random() - 0.5) * screenShake * 20;
    shakeY = (Math.random() - 0.5) * screenShake * 20;
  }

  ctx.save();
  ctx.translate(-camX * renderScale * dpr + shakeX, -camY * renderScale * dpr + shakeY);
  ctx.scale(renderScale * dpr, renderScale * dpr);

  drawGround();
  drawFootprints();
  drawGroundBlood();
  drawChests();
  drawBlackhole();
  drawOrbitalMarkers();
  drawTurrets();
  drawBullets();
  drawPickups();

  for (let i = 0; i < enemies.length; i++) drawZombie(enemies[i]);
  if (boss) drawZombie(boss);
  if (wolf) drawWolf();
  for (let i = 0; i < clones.length; i++) drawClone(clones[i]);

  drawBossProjectiles();
  drawMeteors();
  drawLightningBolts();
  drawEarthquakeWaves();
  drawPlayer();
  drawKnives();
  drawAirBlood();
  drawFloatingTexts();

  drawWeather();

  ctx.restore();

  drawWeatherOverlay();

  if (settings.screenFx && screenShake > 0.3){
    ctx.fillStyle = 'rgba(180,0,0,' + ((screenShake - 0.3) * 0.5) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (inBossFight && boss){
    const vg = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(120,0,0,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  drawMinimap();
}

// ================= МИНИ-КАРТА =================
function drawMinimap(){
  const mc = document.getElementById('minimapCanvas');
  if (!mc) return;
  const m = mc.getContext('2d');
  const mw = mc.width, mh = mc.height;
  m.clearRect(0, 0, mw, mh);
  // Фон
  m.fillStyle = 'rgba(20,20,30,0.9)';
  m.fillRect(0, 0, mw, mh);
  // Масштаб: показываем 6000x6000 вокруг игрока
  const range = 6000;
  const cx = mw/2, cy = mh/2;
  const scale = mw / range;
  // Биомы
  for (let bx = -range/2; bx < range/2; bx += 500){
    for (let by = -range/2; by < range/2; by += 500){
      const wx = player.x + bx, wy = player.y + by;
      const biome = getBiomeAt(wx, wy);
      const col = biome === 'city' ? '#3a3a40' : (biome === 'forest' ? '#2a4a24' : '#a0b0c0');
      m.fillStyle = col;
      m.fillRect(cx + bx*scale, cy + by*scale, 500*scale + 1, 500*scale + 1);
    }
  }
  // Враги
  m.fillStyle = '#ff4040';
  for (let i = 0; i < enemies.length; i++){
    const e = enemies[i];
    const dx = (e.x - player.x) * scale;
    const dy = (e.y - player.y) * scale;
    if (Math.abs(dx) < mw/2 && Math.abs(dy) < mh/2){
      m.fillRect(cx + dx, cy + dy, 2, 2);
    }
  }
  // Босс
  if (boss){
    const dx = (boss.x - player.x) * scale;
    const dy = (boss.y - player.y) * scale;
    if (Math.abs(dx) < mw/2 && Math.abs(dy) < mh/2){
      m.fillStyle = '#ff00ff';
      m.beginPath();
      m.arc(cx + dx, cy + dy, 4, 0, 6.28);
      m.fill();
    }
  }
  // Сундуки
  m.fillStyle = '#ffd166';
  for (let i = 0; i < chests.length; i++){
    const c = chests[i];
    const dx = (c.x - player.x) * scale;
    const dy = (c.y - player.y) * scale;
    if (Math.abs(dx) < mw/2 && Math.abs(dy) < mh/2){
      m.fillRect(cx + dx, cy + dy, 3, 3);
    }
  }
  // Игрок
  m.fillStyle = '#00ff00';
  m.beginPath();
  m.arc(cx, cy, 3, 0, 6.28);
  m.fill();
}

// ================= ЗЕМЛЯ =================
function drawGround(){
  const viewW = W / (renderScale * dpr);
  const viewH = H / (renderScale * dpr);
  const TS = 300;
  const startX = Math.floor((camX - 150) / TS) * TS;
  const startY = Math.floor((camY - 150) / TS) * TS;
  const endX = camX + viewW + 150;
  const endY = camY + viewH + 150;

  for (let ty = startY; ty < endY; ty += TS){
    for (let tx = startX; tx < endX; tx += TS){
      const biome = getBiomeAt(tx + TS/2, ty + TS/2);
      const pat = getBiomePattern(biome);
      ctx.fillStyle = pat || '#2e2e34';
      ctx.fillRect(tx - 1, ty - 1, TS + 2, TS + 2);
    }
  }
  drawBiomeDetails();

  // Сезонная тонировка
  if (settings.season !== 'none'){
    const seasonColor =
      settings.season === 'spring' ? 'rgba(120,220,100,0.08)' :
      settings.season === 'summer' ? 'rgba(255,200,60,0.08)' :
      settings.season === 'autumn' ? 'rgba(200,120,40,0.10)' :
      'rgba(200,220,255,0.10)';
    ctx.fillStyle = seasonColor;
    ctx.fillRect(camX, camY, viewW, viewH);
  }
}

function drawBiomeDetails(){
  const viewW = W / (renderScale * dpr);
  const viewH = H / (renderScale * dpr);
  const TS = 500;
  const sx = Math.floor(camX / TS) - 1, ex = Math.floor((camX + viewW) / TS) + 1;
  const sy = Math.floor(camY / TS) - 1, ey = Math.floor((camY + viewH) / TS) + 1;
  const detail = getGfxSettings().detail;
  const props = getGfxSettings().props;

  for (let tx = sx; tx <= ex; tx++){
    for (let ty = sy; ty <= ey; ty++){
      const wcx = tx * TS + TS/2, wcy = ty * TS + TS/2;
      const biome = getBiomeAt(wcx, wcy);
      if (biome === 'city') drawCityTile(tx, ty, TS, detail, props);
      else if (biome === 'forest') drawForestTile(tx, ty, TS, detail, props);
      else if (biome === 'snow') drawSnowTile(tx, ty, TS, detail, props);
    }
  }
}

function drawCityTile(tx, ty, TS, detail, props){
  const x0 = tx * TS, y0 = ty * TS;
  const isRoadV = (tx % 3 === 0);
  const isRoadH = (ty % 3 === 0);
  if (isRoadV || isRoadH){
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    if (isRoadV) ctx.fillRect(x0 + TS/2 - 90, y0, 180, TS);
    if (isRoadH) ctx.fillRect(x0, y0 + TS/2 - 90, TS, 180);
    ctx.fillStyle = 'rgba(235,205,70,0.9)';
    if (isRoadV){
      const cy = Math.floor(y0/70) * 70;
      for (let y = cy; y < y0 + TS; y += 70) ctx.fillRect(x0 + TS/2 - 3, y, 6, 40);
    }
    if (isRoadH){
      const cx = Math.floor(x0/70) * 70;
      for (let x = cx; x < x0 + TS; x += 70) ctx.fillRect(x, y0 + TS/2 - 3, 40, 6);
    }
  }
  if (props){
    if (hashAbs(tx, ty, 1) > 0.93) drawTrafficLight(x0 + hashAbs(tx,ty,2)*TS, y0 + hashAbs(tx,ty,3)*TS, tx, ty);
    else if (hashAbs(tx, ty, 4) > 0.85) drawBrokenCar(x0 + hashAbs(tx,ty,5)*TS, y0 + hashAbs(tx,ty,6)*TS, tx, ty);
    else if (hashAbs(tx, ty, 7) > 0.78) drawManhole(x0 + hashAbs(tx,ty,8)*TS, y0 + hashAbs(tx,ty,9)*TS);
    else if (hashAbs(tx, ty, 10) > 0.72) drawBarrel(x0 + hashAbs(tx,ty,11)*TS, y0 + hashAbs(tx,ty,12)*TS, tx, ty);
  }
}
function drawForestTile(tx, ty, TS, detail, props){
  const x0 = tx * TS, y0 = ty * TS;
  if (props){
    const roll = hashAbs(tx, ty, 20);
    if (roll > 0.85) drawTree(x0 + hashAbs(tx,ty,21)*TS, y0 + hashAbs(tx,ty,22)*TS, tx, ty);
    else if (roll > 0.75) drawBush(x0 + hashAbs(tx,ty,23)*TS, y0 + hashAbs(tx,ty,24)*TS, hashAbs(tx,ty,25));
    else if (roll > 0.68) drawRock(x0 + hashAbs(tx,ty,26)*TS, y0 + hashAbs(tx,ty,27)*TS, tx, ty);
  }
}
function drawSnowTile(tx, ty, TS, detail, props){
  const x0 = tx * TS, y0 = ty * TS;
  if (props){
    const roll = hashAbs(tx, ty, 100);
    if (roll > 0.88) drawPineTree(x0 + hashAbs(tx,ty,101)*TS, y0 + hashAbs(tx,ty,102)*TS, tx, ty);
    else if (roll > 0.78) drawSnowPile(x0 + hashAbs(tx,ty,103)*TS, y0 + hashAbs(tx,ty,104)*TS, tx, ty);
    else if (roll > 0.7) drawRock(x0 + hashAbs(tx,ty,105)*TS, y0 + hashAbs(tx,ty,106)*TS, tx, ty);
  }
}

// ================= ПРОПСЫ =================
function drawTree(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(4, 6, 40, 14, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#4a2a14';
  ctx.fillRect(-6, -10, 12, 25);
  const hue = 80 + hashAbs(sx, sy, 200) * 40;
  const g = ctx.createRadialGradient(-10, -40, 0, 0, -25, 50);
  g.addColorStop(0, 'hsl(' + hue + ',50%,45%)');
  g.addColorStop(1, 'hsl(' + hue + ',60%,20%)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, -35, 35, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(-22, -25, 22, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(22, -25, 22, 0, 6.28); ctx.fill();
  ctx.restore();
}
function drawBush(x, y, seed){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(2, 4, 22, 8, 0, 0, 6.28); ctx.fill();
  const r = 18 + seed * 8;
  const g = ctx.createRadialGradient(-r*0.3, -r*0.3, 0, 0, 0, r);
  g.addColorStop(0, '#4a7a3a');
  g.addColorStop(1, '#1e3518');
  ctx.fillStyle = g;
  for (let i = 0; i < 5; i++){
    const ang = (i/5) * 6.28 + seed * 3;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * r * 0.4, Math.sin(ang) * r * 0.4, r * 0.6, 0, 6.28);
    ctx.fill();
  }
  ctx.restore();
}
function drawRock(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(3, 6, 22, 8, 0, 0, 6.28); ctx.fill();
  const size = 15 + hashAbs(sx, sy, 400) * 15;
  const g = ctx.createRadialGradient(-size*0.3, -size*0.3, 0, 0, 0, size);
  g.addColorStop(0, '#9a9a8a');
  g.addColorStop(1, '#3a3a2a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-size, 0);
  ctx.lineTo(-size*0.7, -size*0.6);
  ctx.lineTo(0, -size);
  ctx.lineTo(size*0.7, -size*0.7);
  ctx.lineTo(size, -size*0.2);
  ctx.lineTo(size*0.8, size*0.3);
  ctx.lineTo(-size*0.6, size*0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawPineTree(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(4, 6, 28, 10, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-5, -10, 10, 22);
  const g = ctx.createLinearGradient(0, -70, 0, 0);
  g.addColorStop(0, '#1a4a2a');
  g.addColorStop(1, '#0a2a15');
  ctx.fillStyle = g;
  for (let i = 0; i < 4; i++){
    const size = 35 - i * 8, y1 = -20 - i * 15;
    ctx.beginPath();
    ctx.moveTo(-size, y1);
    ctx.lineTo(0, y1 - 22);
    ctx.lineTo(size, y1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(240,250,255,0.75)';
  ctx.beginPath(); ctx.arc(-15, -55, 5, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(10, -40, 5, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -75, 4, 0, 6.28); ctx.fill();
  ctx.restore();
}
function drawSnowPile(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  const size = 20 + hashAbs(sx, sy, 500) * 15;
  const g = ctx.createRadialGradient(-size*0.3, -size*0.5, 0, 0, 0, size);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#b8c8d8');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size*0.5, 0, 0, 6.28);
  ctx.fill();
  ctx.restore();
}
function drawTrafficLight(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((hashAbs(sx, sy, 311) - 0.5) * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.ellipse(4, 6, 20, 8, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(-3, -60, 6, 60);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.roundRect(-12, -85, 24, 36, 6); ctx.fill();
  const phase = Math.floor((performance.now()/700 + sx*sy) % 3);
  const colors = [['#ff2020','#401010'], ['#ffcc00','#403300'], ['#20ff40','#104010']];
  for (let i = 0; i < 3; i++){
    const cy = -78 + i * 10;
    const isOn = i === phase;
    ctx.fillStyle = isOn ? colors[i][0] : colors[i][1];
    ctx.beginPath(); ctx.arc(0, cy, 4.5, 0, 6.28); ctx.fill();
    if (isOn){
      ctx.shadowColor = colors[i][0];
      ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(0, cy, 4.5, 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}
function drawBrokenCar(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(hashAbs(sx, sy, 320) * 6.28);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(3, 6, 60, 30, 0, 0, 6.28); ctx.fill();
  const g = ctx.createLinearGradient(0, -25, 0, 25);
  g.addColorStop(0, '#6a4a3a');
  g.addColorStop(0.5, '#4a2a1a');
  g.addColorStop(1, '#1a0a05');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-55, -15); ctx.lineTo(-50, -25); ctx.lineTo(20, -25);
  ctx.lineTo(50, -18); ctx.lineTo(55, 5); ctx.lineTo(48, 18);
  ctx.lineTo(-48, 18); ctx.lineTo(-55, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(10,10,20,0.9)';
  ctx.beginPath();
  ctx.moveTo(-40, -22); ctx.lineTo(-15, -22); ctx.lineTo(-18, -8); ctx.lineTo(-42, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.ellipse(-38, 20, 8, 5, 0, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(38, 20, 8, 5, 0, 0, 6.28); ctx.fill();
  ctx.restore();
}
function drawManhole(x, y){
  const r = 22;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.arc(3, 4, r, 0, 6.28); ctx.fill();
  const g = ctx.createRadialGradient(-6, -6, 0, 0, 0, r);
  g.addColorStop(0, '#52525a');
  g.addColorStop(1, '#1a1a1e');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#0a0a0e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, 6.28); ctx.stroke();
  ctx.restore();
}
function drawBarrel(x, y, sx, sy){
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(2, 12, 14, 5, 0, 0, 6.28); ctx.fill();
  const g = ctx.createRadialGradient(-4, -4, 0, 0, 0, 16);
  g.addColorStop(0, '#7a5a2a');
  g.addColorStop(1, '#2a1a05');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#1a1205';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.stroke();
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('☣', 0, 4);
  ctx.restore();
}

// ================= ОТРИСОВКА ЭЛЕМЕНТОВ =================
function drawFootprints(){
  if (getGfxSettings().detail < 2) return;
  for (let i = 0; i < footprints.length; i++){
    const f = footprints[i];
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.fillStyle = 'rgba(0,0,0,' + (f.life / 2.5 * 0.4) + ')';
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, 6.28); ctx.fill();
    ctx.restore();
  }
}
function drawGroundBlood(){
  for (let i = 0; i < bloodParticles.length; i++){
    const p = bloodParticles[i];
    if (p.life < 0.55){
      if (p.isIce){
        ctx.fillStyle = 'rgba(150,220,255,' + (p.life * 1.5) + ')';
      } else if (p.isFire){
        ctx.fillStyle = 'rgba(255,150,30,' + (p.life * 1.5) + ')';
      } else {
        ctx.fillStyle = 'rgba(120,10,10,' + (p.life * 1.5) + ')';
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.7, 0, 6.28);
      ctx.fill();
    }
  }
}
function drawAirBlood(){
  for (let i = 0; i < bloodParticles.length; i++){
    const p = bloodParticles[i];
    if (p.life >= 0.55){
      if (p.isIce){ ctx.fillStyle = 'rgba(200,240,255,' + p.life + ')'; }
      else if (p.isFire){ ctx.fillStyle = 'rgba(255,200,80,' + p.life + ')'; }
      else { ctx.fillStyle = 'rgba(190,15,15,' + p.life + ')'; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 6.28);
      ctx.fill();
    }
  }
}
function drawFloatingTexts(){
  for (let i = 0; i < floatingTexts.length; i++){
    const t = floatingTexts[i];
    const a = Math.min(1, t.life / (t.maxLife * 0.5));
    ctx.font = 'bold ' + (t.size || 16) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.globalAlpha = a;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 3;
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
    ctx.globalAlpha = 1;
  }
}
function drawPickups(){
  for (let i = 0; i < pickups.length; i++){
    const p = pickups[i];
    p.bob += 0.08;
    const by = Math.sin(p.bob) * 3;
    const g = ctx.createRadialGradient(p.x, p.y + by, 0, p.x, p.y + by, 14);
    g.addColorStop(0, 'rgba(140,255,140,0.9)');
    g.addColorStop(1, 'rgba(100,255,100,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y + by, 14, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#b3ffb3';
    ctx.beginPath(); ctx.arc(p.x, p.y + by, 5, 0, 6.28); ctx.fill();
  }
}
function drawChests(){
  for (let i = 0; i < chests.length; i++){
    const c = chests[i];
    if (c.opened) continue;
    const by = Math.sin(c.bob) * 2;
    ctx.save();
    ctx.translate(c.x, c.y + by);
    const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 45);
    gg.addColorStop(0, 'rgba(255,200,60,0.45)');
    gg.addColorStop(1, 'rgba(255,200,60,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(0, 0, 45, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(0, 16, 22, 7, 0, 0, 6.28); ctx.fill();
    const g1 = ctx.createLinearGradient(0, -16, 0, 16);
    g1.addColorStop(0, '#8a5a2a');
    g1.addColorStop(1, '#4a2f14');
    ctx.fillStyle = g1;
    ctx.fillRect(-20, -10, 40, 26);
    const g2 = ctx.createLinearGradient(0, -22, 0, -8);
    g2.addColorStop(0, '#b57a3a');
    g2.addColorStop(1, '#6a4520');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.moveTo(-20, -10); ctx.lineTo(-20, -16);
    ctx.quadraticCurveTo(0, -28, 20, -16);
    ctx.lineTo(20, -10); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a1a08';
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -10, 40, 26);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-5, -4, 10, 10);
    ctx.restore();
  }
}
function drawTurrets(){
  for (let i = 0; i < turrets.length; i++){
    const t = turrets[i];
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(2, 12, 16, 6, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, 6.28); ctx.fill();
    ctx.save();
    ctx.rotate(t.angle);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, -3, 22, 6);
    ctx.restore();
    ctx.fillStyle = '#ff3030';
    ctx.shadowColor = '#ff3030';
    ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.28); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
function drawBullets(){
  for (let i = 0; i < bullets.length; i++){
    const b = bullets[i];
    if (b.throwKnife){
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.spin || 0);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(3, -3); ctx.lineTo(3, 3);
      ctx.lineTo(-3, 3); ctx.lineTo(-3, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(-3, 3, 6, 8);
      ctx.restore();
    } else if (b.fireball){
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 2);
      g.addColorStop(0, '#ffff80');
      g.addColorStop(0.4, '#ff8000');
      g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.size * 2, 0, 6.28); ctx.fill();
    } else {
      ctx.fillStyle = '#ffee44';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
function drawBossProjectiles(){
  for (let i = 0; i < bossProjectiles.length; i++){
    const p = bossProjectiles[i];
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
    g.addColorStop(0, '#ffcc00');
    g.addColorStop(0.4, '#ff6030');
    g.addColorStop(1, 'rgba(255,60,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 2, 0, 6.28); ctx.fill();
  }
}
function drawMeteors(){
  for (let i = 0; i < meteors.length; i++){
    const m = meteors[i];
    const pulse = 0.6 + Math.sin(performance.now() * 0.02) * 0.4;
    ctx.strokeStyle = 'rgba(255,80,20,' + (0.6 + pulse * 0.4) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 100, 0, 6.28);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,80,20,0.15)';
    ctx.fill();
  }
}
function drawLightningBolts(){
  for (let i = 0; i < lightningBolts.length; i++){
    const b = lightningBolts[i];
    const a = b.life / b.maxLife;
    ctx.strokeStyle = 'rgba(200,220,255,' + a + ')';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(b.x - 50, camY - 50);
    let lx = b.x - 50, ly = camY - 50;
    while (ly < b.y){
      lx = b.x + (Math.random() - 0.5) * 60;
      ly += 30 + Math.random() * 50;
      ctx.lineTo(lx, Math.min(ly, b.y));
    }
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    // Свечение
    ctx.strokeStyle = 'rgba(120,180,255,' + (a * 0.5) + ')';
    ctx.lineWidth = 14;
    ctx.stroke();
  }
}
function drawEarthquakeWaves(){
  for (let i = 0; i < earthquakeWaves.length; i++){
    const w = earthquakeWaves[i];
    const a = w.life / w.maxLife;
    ctx.strokeStyle = 'rgba(255,180,60,' + a + ')';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, 6.28);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,80,20,' + (a * 0.6) + ')';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius * 0.9, 0, 6.28);
    ctx.stroke();
  }
}
function drawBlackhole(){
  if (!blackhole) return;
  const b = blackhole;
  const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.3, 'rgba(60,0,80,0.9)');
  g.addColorStop(0.6, 'rgba(120,20,180,0.6)');
  g.addColorStop(1, 'rgba(200,80,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(b.x, b.y, 30, 0, 6.28); ctx.fill();
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(performance.now() * 0.005);
  ctx.strokeStyle = 'rgba(180,80,255,0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, b.radius * 0.7, b.radius * 0.25, 0, 0, 6.28);
  ctx.stroke();
  ctx.restore();
}
function drawOrbitalMarkers(){
  for (let i = 0; i < orbitalMarkers.length; i++){
    const o = orbitalMarkers[i];
    if (o.delay > 0){
      const pulse = 0.5 + Math.sin(performance.now() * 0.02) * 0.5;
      ctx.strokeStyle = 'rgba(255,200,60,' + (0.5 + pulse * 0.5) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, 6.28);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,200,60,0.15)';
      ctx.fill();
    } else {
      const t = -o.delay / 0.6;
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius * (1 + t * 0.5));
      g.addColorStop(0, 'rgba(255,255,200,' + (1 - t) + ')');
      g.addColorStop(0.5, 'rgba(255,150,40,' + (0.7 - t * 0.7) + ')');
      g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.radius * (1 + t * 0.5), 0, 6.28); ctx.fill();
    }
  }
}

// ================= ВОЛК И КЛОНЫ =================
function drawWolf(){
  if (!wolf) return;
  ctx.save();
  ctx.translate(wolf.x, wolf.y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 12, 20, 6, 0, 0, 6.28); ctx.fill();
  ctx.scale(wolf.facing, 1);
  const walk = Math.sin(wolf.walkPhase);
  // Тело
  const g = ctx.createRadialGradient(-5, -5, 0, 0, 0, 25);
  g.addColorStop(0, '#7a7a7a');
  g.addColorStop(1, '#3a3a3a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, 6.28); ctx.fill();
  // Лапы
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-14, 8); ctx.lineTo(-14 + walk*3, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(-4 - walk*3, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(4 + walk*3, 18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, 8); ctx.lineTo(14 - walk*3, 18); ctx.stroke();
  // Голова
  ctx.fillStyle = '#5a5a5a';
  ctx.beginPath(); ctx.arc(20, -8, 10, 0, 6.28); ctx.fill();
  // Уши
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.moveTo(14, -16); ctx.lineTo(16, -22); ctx.lineTo(20, -16); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(24, -16); ctx.lineTo(26, -22); ctx.lineTo(30, -16); ctx.closePath(); ctx.fill();
  // Глаза
  ctx.fillStyle = '#ffff00';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(20, -8, 2, 0, 6.28); ctx.fill();
  ctx.shadowBlur = 0;
  // Хвост
  ctx.strokeStyle = '#5a5a5a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-20, -5);
  ctx.quadraticCurveTo(-28, -15, -25, -20);
  ctx.stroke();
  ctx.restore();
  // HP-бар
  const barW = 50, barH = 5, barX = wolf.x - barW/2, barY = wolf.y - 32;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#3a0a0a';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#4fc46d';
  ctx.fillRect(barX, barY, barW * (wolf.life / 20), barH);
}

function drawClone(c){
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 12, 14, 5, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#5dade2';
  ctx.beginPath(); ctx.ellipse(0, -2, 11, 13, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#ffd1a3';
  ctx.beginPath(); ctx.arc(0, -11, 9, 0, 6.28); ctx.fill();
  // Ножи клона
  for (let i = 0; i < 2; i++){
    const a = c.angle + (i / 2) * 6.28;
    const kx = Math.cos(a) * knives.distance;
    const ky = Math.sin(a) * knives.distance;
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(a + Math.PI/2);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(3, -3); ctx.lineTo(3, 3);
    ctx.lineTo(-3, 3); ctx.lineTo(-3, -3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ================= ИГРОК =================
function drawPlayer(){
  const char = getActiveCharacter();
  const charSkin = save.activeCharSkin || 'default';
  const isImmune = skillShieldTime > 0;
  const speedGlow = skillSpeedTime > 0;

  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.sprinting || speedGlow){
    ctx.fillStyle = 'rgba(255,209,102,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 12, 20, 8, 0, 0, 6.28); ctx.fill();
  }
  if (getGfxSettings().shadows){
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(0, 12, 16, 6, 0, 0, 6.28); ctx.fill();
  }

  // Щит
  if (isImmune){
    ctx.strokeStyle = 'rgba(120,220,255,0.9)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -2, 26 + Math.sin(performance.now() * 0.01) * 3, 0, 6.28);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,220,255,0.15)';
    ctx.fill();
  }

  ctx.scale(player.facing, 1);
  const walk = Math.sin(player.walkPhase);
  const hurtFlash = player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 0;

  ctx.strokeStyle = hurtFlash ? '#fff' : '#2c3e50';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4, 7); ctx.lineTo(-4 + walk*5, 19); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, 7);  ctx.lineTo(4 - walk*5, 19); ctx.stroke();

  let bodyCol = char ? char.color : '#5dade2';
  if (charSkin === 'gold') bodyCol = '#d4a017';
  if (charSkin === 'shadow') bodyCol = '#2a2a4a';
  if (charSkin === 'napoleon') bodyCol = '#2a3a6a';
  if (charSkin === 'cowboy') bodyCol = '#8b5a2a';
  if (charSkin === 'cosmo') bodyCol = '#e0e0e0';
  if (charSkin === 'dragon') bodyCol = '#3a6a2a';

  const bg = ctx.createRadialGradient(-3, -3, 0, 0, 0, 14);
  bg.addColorStop(0, hurtFlash ? '#fff' : bodyCol);
  bg.addColorStop(1, hurtFlash ? '#f88' : '#1f618d');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0, -2, 11, 13, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#0d2b4a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, -2, 11, 13, 0, 0, 6.28); ctx.stroke();

  ctx.strokeStyle = bodyCol;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-11 - walk*2, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -2);  ctx.lineTo(11 + walk*2, 6); ctx.stroke();

  const hg = ctx.createRadialGradient(-2, -14, 0, 0, -11, 10);
  hg.addColorStop(0, '#ffd1a3');
  hg.addColorStop(1, '#c69678');
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, -11, 9, 0, 6.28); ctx.fill();
  ctx.strokeStyle = '#4a2a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -11, 9, 0, 6.28); ctx.stroke();

  // Костюмы и скины
  if (charSkin === 'napoleon'){
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(-10, -18); ctx.lineTo(-8, -25); ctx.lineTo(0, -27);
    ctx.lineTo(8, -25); ctx.lineTo(10, -18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -21, 2.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#1a3a8a';
    ctx.fillRect(-3, -22, 3, 3);
    ctx.fillStyle = '#8b1a1a';
    ctx.fillRect(0, -22, 3, 3);
  } else if (charSkin === 'gold'){
    ctx.fillStyle = '#d4a017';
    ctx.beginPath(); ctx.arc(0, -12, 9, Math.PI, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -11, 12, 0, 6.28); ctx.stroke();
  } else if (charSkin === 'shadow'){
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath(); ctx.arc(0, -12, 9, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#c060ff';
    ctx.shadowColor = '#a040ff';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(3, -11, 1.5, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(-3, -11, 1.5, 0, 6.28); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (charSkin === 'cowboy'){
    // Шляпа
    ctx.fillStyle = '#4a2a14';
    ctx.beginPath();
    ctx.ellipse(0, -18, 16, 4, 0, 0, 6.28); ctx.fill();
    ctx.fillRect(-8, -26, 16, 8);
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-8, -20, 16, 3);
  } else if (charSkin === 'cosmo'){
    // Шлем
    ctx.fillStyle = 'rgba(180,220,255,0.4)';
    ctx.beginPath(); ctx.arc(0, -11, 13, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#7fd2ff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -11, 13, 0, 6.28); ctx.stroke();
  } else if (charSkin === 'dragon'){
    // Рожки
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.moveTo(-6, -18); ctx.lineTo(-8, -24); ctx.lineTo(-4, -20); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -18); ctx.lineTo(8, -24); ctx.lineTo(4, -20); ctx.closePath(); ctx.fill();
    // Чешуя
    ctx.fillStyle = 'rgba(255,200,60,0.4)';
    for (let i=0;i<3;i++){
      ctx.beginPath(); ctx.arc(-4 + i*4, -5, 1.5, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(-4 + i*4, 2, 1.5, 0, 6.28); ctx.fill();
    }
  } else if (charSkin === 'default'){
    ctx.fillStyle = '#3b2418';
    ctx.beginPath(); ctx.arc(0, -12, 9, Math.PI, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(4, -11, 1.5, 0, 6.28); ctx.fill();
  } else {
    if (char && char.id === 'soldier'){
      ctx.fillStyle = '#3a4a2a';
      ctx.beginPath(); ctx.arc(0, -13, 9, Math.PI, Math.PI*2); ctx.fill();
    } else if (char && char.id === 'ninja'){
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(0, -11, 9, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(4, -11, 1.5, 0, 6.28); ctx.fill();
    } else if (char && char.id === 'medic'){
      ctx.fillStyle = '#ff2020';
      ctx.fillRect(-2, -16, 4, 10);
      ctx.fillRect(-6, -12, 12, 4);
    } else if (char && char.id === 'pirate'){
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-9, -14, 18, 4);
      ctx.fillStyle = '#3a2010';
      ctx.beginPath(); ctx.arc(5, -11, 3, 0, 6.28); ctx.fill();
    } else if (char && char.id === 'robot'){
      ctx.fillStyle = '#c0c0c0';
      ctx.beginPath(); ctx.arc(0, -11, 9, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#ff3030';
      ctx.shadowColor = '#ff3030';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(-3, -11, 2, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(4, -11, 2, 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (char && char.id === 'king'){
      ctx.fillStyle = '#d4a017';
      ctx.beginPath();
      ctx.moveTo(-9, -20); ctx.lineTo(-7, -26); ctx.lineTo(-4, -22);
      ctx.lineTo(0, -28); ctx.lineTo(4, -22); ctx.lineTo(7, -26);
      ctx.lineTo(9, -20); ctx.closePath(); ctx.fill();
    } else if (char && char.id === 'napoleon'){
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(-10, -18); ctx.lineTo(-8, -25); ctx.lineTo(0, -27);
      ctx.lineTo(8, -25); ctx.lineTo(10, -18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, -21, 2.5, 0, 6.28); ctx.fill();
    }
  }
  ctx.restore();

  // HP-бар
  const barW = 60, barH = 7, barX = player.x - barW/2, barY = player.y - 42;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#2a0a0a';
  ctx.fillRect(barX, barY, barW, barH);
  const hpPct = Math.max(0, player.hp / player.maxHp);
  const hg2 = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  hg2.addColorStop(0, '#8b0000');
  hg2.addColorStop(1, '#e74c3c');
  ctx.fillStyle = hg2;
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
}

// ================= НОЖИ =================
function drawKnives(){
  const trails = getGfxSettings().trail;
  const skin = save.activeWeaponSkin || 'knife_default';

  for (let i = 0; i < knives.count; i++){
    const a = knives.angle + (i / knives.count) * 6.28;
    const kx = player.x + Math.cos(a) * knives.distance;
    const ky = player.y + Math.sin(a) * knives.distance;

    if (trails){
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = skin === 'knife_fire' ? '#ff8000' :
                       skin === 'knife_ice' ? '#80d0ff' :
                       skin === 'knife_blood' ? '#c02020' :
                       skin === 'knife_void' ? '#a040ff' :
                       skin === 'knife_mythic' ? '#ff40ff' : '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let t = 0; t < 8; t++){
        const ta = a - t * 0.15;
        const tx = player.x + Math.cos(ta) * knives.distance;
        const ty = player.y + Math.sin(ta) * knives.distance;
        if (t === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(a + Math.PI / 2);

    if (getGfxSettings().shadows){
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(2, 3, 4, 7, 0, 0, 6.28); ctx.fill();
    }

    const sz = knives.size / 16;
    ctx.scale(sz, sz);

    let bladeCol1 = '#fff', bladeCol2 = '#c8d0d8', bladeCol3 = '#6a727a', glow = null;
    if (skin === 'knife_gold'){ bladeCol1 = '#ffe066'; bladeCol2 = '#d4a017'; bladeCol3 = '#8a6a00'; glow = 'rgba(255,215,0,0.6)'; }
    else if (skin === 'knife_diamond'){ bladeCol1 = '#e0f0ff'; bladeCol2 = '#a0d8ff'; bladeCol3 = '#4080c0'; glow = 'rgba(160,220,255,0.7)'; }
    else if (skin === 'knife_fire'){ bladeCol1 = '#ffff80'; bladeCol2 = '#ff8000'; bladeCol3 = '#801000'; glow = 'rgba(255,120,0,0.7)'; }
    else if (skin === 'knife_ice'){ bladeCol1 = '#ffffff'; bladeCol2 = '#80d0ff'; bladeCol3 = '#2080c0'; glow = 'rgba(120,220,255,0.7)'; }
    else if (skin === 'knife_blood'){ bladeCol1 = '#ff6060'; bladeCol2 = '#c02020'; bladeCol3 = '#6a0a0a'; glow = 'rgba(200,30,30,0.7)'; }
    else if (skin === 'knife_void'){ bladeCol1 = '#c080ff'; bladeCol2 = '#6020a0'; bladeCol3 = '#1a0030'; glow = 'rgba(160,60,255,0.7)'; }
    else if (skin === 'knife_rainbow'){
      const hue = (performance.now() * 0.1) % 360;
      bladeCol1 = 'hsl(' + hue + ',100%,70%)';
      bladeCol2 = 'hsl(' + ((hue + 60) % 360) + ',100%,50%)';
      bladeCol3 = 'hsl(' + ((hue + 120) % 360) + ',100%,35%)';
      glow = 'hsla(' + hue + ',100%,60%,0.7)';
    }
    else if (skin === 'knife_mythic'){
      const hue = (performance.now() * 0.2) % 360;
      bladeCol1 = 'hsl(' + hue + ',100%,80%)';
      bladeCol2 = 'hsl(' + ((hue + 120) % 360) + ',100%,60%)';
      bladeCol3 = 'hsl(' + ((hue + 240) % 360) + ',100%,40%)';
      glow = 'hsla(' + hue + ',100%,70%,0.9)';
    }

    if (glow){
      ctx.shadowColor = glow;
      ctx.shadowBlur = 15;
    }

    const bg = ctx.createLinearGradient(-3, -14, 3, 4);
    bg.addColorStop(0, bladeCol1);
    bg.addColorStop(0.5, bladeCol2);
    bg.addColorStop(1, bladeCol3);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(0, -16); ctx.lineTo(3, -4); ctx.lineTo(3, 4);
    ctx.lineTo(-3, 4); ctx.lineTo(-3, -4);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(3, -4); ctx.stroke();
    ctx.fillStyle = skin === 'knife_void' ? '#2a0040' :
                    skin === 'knife_gold' ? '#8a6a00' :
                    skin === 'knife_mythic' ? '#a020a0' : '#3a2010';
    ctx.fillRect(-3, 4, 6, 9);
    ctx.fillStyle = skin === 'knife_gold' ? '#a08000' : '#5a3018';
    ctx.fillRect(-2, 5, 4, 7);
    ctx.fillStyle = '#999';
    ctx.fillRect(-4, 3, 8, 2);
    ctx.restore();
  }
}

// ================= ЗОМБИ =================
function drawZombie(e){
  ctx.save();
  ctx.translate(e.x, e.y);
  if (getGfxSettings().shadows){
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, e.size * 0.7, e.size * 1.1, e.size * 0.4, 0, 0, 6.28); ctx.fill();
  }
  ctx.scale(e.facing, 1);
  const walk = Math.sin(e.walkPhase);
  const lean = Math.sin(e.walkPhase * 0.5) * 2;
  const hurt = e.hurt > 0;
  const frozen = e.frozen > 0;
  const isBoss = e.isBoss;
  const costume = e.costume;

  ctx.strokeStyle = hurt ? '#fff' : (frozen ? '#a0d0ff' : (costume ? costume.color : '#1a2a1a'));
  ctx.lineWidth = e.size * 0.45;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-e.size*0.3, e.size*0.4); ctx.lineTo(-e.size*0.3 + walk*e.size*0.3, e.size*1.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(e.size*0.3, e.size*0.4);  ctx.lineTo(e.size*0.3 - walk*e.size*0.3, e.size*1.1); ctx.stroke();

  const bodyColor = costume ? costume.color : e.color;
  const bg = ctx.createRadialGradient(-e.size*0.3, -e.size*0.3, 0, 0, 0, e.size*1.1);
  bg.addColorStop(0, hurt ? '#fdd' : (frozen ? '#a0d0ff' : (isBoss ? '#4a7a4a' : '#7b9b6a')));
  bg.addColorStop(1, hurt ? '#f55' : (frozen ? '#4080c0' : bodyColor));
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0, lean*0.5, e.size*0.75, e.size*1.0, 0, 0, 6.28); ctx.fill();

  ctx.fillStyle = 'rgba(90,10,10,0.7)';
  ctx.beginPath(); ctx.arc(-e.size*0.3, e.size*0.1, e.size*0.2, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(e.size*0.2, -e.size*0.2, e.size*0.15, 0, 6.28); ctx.fill();

  ctx.strokeStyle = hurt ? '#fff' : (frozen ? '#a0d0ff' : (costume ? costume.color : '#5a7a4a'));
  ctx.lineWidth = e.size * 0.35;
  ctx.beginPath(); ctx.moveTo(-e.size*0.6, -e.size*0.3); ctx.lineTo(-e.size*0.9, e.size*0.3 + walk*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(e.size*0.6, -e.size*0.3);  ctx.lineTo(e.size*0.9, e.size*0.3 - walk*2); ctx.stroke();

  const headCol1 = costume ? '#3a2a1a' : (hurt ? '#fdd' : (frozen ? '#c0e0ff' : '#8ba57a'));
  const headCol2 = costume ? costume.color : (hurt ? '#faa' : (frozen ? '#5080a0' : '#4a6a3a'));
  const hg = ctx.createRadialGradient(-e.size*0.2, -e.size*1.2, 0, 0, -e.size, e.size*0.7);
  hg.addColorStop(0, headCol1);
  hg.addColorStop(1, headCol2);
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, -e.size*0.9, e.size*0.6, 0, 6.28); ctx.fill();

  ctx.fillStyle = 'rgba(40,30,20,0.8)';
  ctx.beginPath(); ctx.arc(0, -e.size*1.0, e.size*0.6, Math.PI*1.1, Math.PI*1.9); ctx.fill();

  drawZombieSkin(e, hurt, lean);

  const eyeColor = costume ? costume.accent : (isBoss ? '#ff0000' : '#ff3030');
  ctx.shadowColor = frozen ? '#80c0ff' : eyeColor;
  ctx.shadowBlur = isBoss ? 25 : 8;
  ctx.fillStyle = frozen ? '#80c0ff' : eyeColor;
  const eyeSize = isBoss ? 3.5 : 1.6;
  ctx.beginPath(); ctx.arc(-e.size*0.2, -e.size*0.9, eyeSize, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.arc(e.size*0.2, -e.size*0.9, eyeSize, 0, 6.28); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(0, -e.size*0.62, e.size*0.15, e.size*0.09, 0, 0, 6.28); ctx.fill();
  ctx.restore();

  if (isBoss && boss.state === 'tele_charge'){
    ctx.save();
    ctx.globalAlpha = 0.6 + Math.sin(performance.now() * 0.02) * 0.4;
    ctx.strokeStyle = '#ff3030';
    ctx.lineWidth = 6;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y);
    ctx.lineTo(boss.x + boss.chargeX * 800, boss.y + boss.chargeY * 800);
    ctx.stroke();
    ctx.setLineDash([]);
    const ax = boss.x + boss.chargeX * 800;
    const ay = boss.y + boss.chargeY * 800;
    ctx.fillStyle = '#ff2020';
    ctx.beginPath(); ctx.arc(ax, ay, 20, 0, 6.28); ctx.fill();
    ctx.restore();
  }
  if (isBoss && boss.state === 'tele_slam'){
    ctx.save();
    ctx.strokeStyle = 'rgba(255,60,30,0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(boss.x, boss.y, 240, 0, 6.28); ctx.stroke();
    ctx.fillStyle = 'rgba(255,60,30,0.2)';
    ctx.fill();
    ctx.restore();
  }
  if (isBoss && boss.state === 'slam' && boss.slamRadius > 0){
    ctx.save();
    ctx.strokeStyle = 'rgba(255,120,30,0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(boss.x, boss.y, boss.slamRadius, 0, 6.28); ctx.stroke();
    ctx.restore();
  }

  if (e.hp < e.maxHp && !e.isBoss){
    const bw = e.size * 2, bh = 3;
    const bx = e.x - bw/2, by = e.y - e.size*2 - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    ctx.fillStyle = '#3a0a0a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
  }
}

function drawZombieSkin(e, hurt, lean){
  const s = e.size, skin = e.skin;
  if (skin === 1){
    ctx.fillStyle = hurt ? '#fff' : '#1a3a6a';
    ctx.beginPath(); ctx.arc(0, -s*1.1, s*0.62, Math.PI*1.05, Math.PI*1.95); ctx.fill();
  } else if (skin === 2){
    ctx.fillStyle = hurt ? '#fff' : '#3a4a2a';
    ctx.beginPath(); ctx.arc(0, -s*1.05, s*0.68, Math.PI*1.0, Math.PI*2.0); ctx.fill();
  } else if (skin === 3){
    ctx.fillStyle = hurt ? '#fff' : '#2a1a3a';
    ctx.beginPath(); ctx.arc(0, -s*1.0, s*0.75, Math.PI*1.05, Math.PI*1.95); ctx.fill();
  } else if (skin === 4){
    ctx.fillStyle = hurt ? '#fff' : '#4a4a5a';
    ctx.beginPath(); ctx.ellipse(0, lean*0.5, s*0.85, s*1.1, 0, 0, 6.28); ctx.fill();
  } else if (skin === 5){
    ctx.fillStyle = hurt ? '#fff' : '#5a2a2a';
    ctx.beginPath(); ctx.arc(0, -s*1.1, s*0.62, Math.PI*1.05, Math.PI*1.95); ctx.fill();
  } else if (skin === 10){
    const c = e.costume;
    if (!c){
      ctx.fillStyle = hurt ? '#fff' : '#1a0a0a';
      ctx.beginPath();
      ctx.moveTo(-s*0.5, -s*1.1); ctx.lineTo(-s*1.0, -s*1.8); ctx.lineTo(-s*0.6, -s*1.6);
      ctx.lineTo(-s*0.7, -s*2.0); ctx.lineTo(-s*0.35, -s*1.4); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s*0.5, -s*1.1); ctx.lineTo(s*1.0, -s*1.8); ctx.lineTo(s*0.6, -s*1.6);
      ctx.lineTo(s*0.7, -s*2.0); ctx.lineTo(s*0.35, -s*1.4); ctx.closePath(); ctx.fill();
      return;
    }
    if (c.id === 'reaper'){
      ctx.fillStyle = hurt ? '#fff' : '#0a0a0a';
      ctx.beginPath();
      ctx.moveTo(-s*0.85, -s*0.5); ctx.lineTo(-s*0.9, -s*1.7); ctx.lineTo(0, -s*2.1);
      ctx.lineTo(s*0.9, -s*1.7); ctx.lineTo(s*0.85, -s*0.5);
      ctx.quadraticCurveTo(s*0.4, -s*0.3, 0, -s*0.3);
      ctx.quadraticCurveTo(-s*0.4, -s*0.3, -s*0.85, -s*0.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(0, -s*1.1, s*0.55, s*0.7, 0, 0, 6.28); ctx.fill();
    } else if (c.id === 'demon'){
      ctx.strokeStyle = 'rgba(255,80,30,' + (0.5 + Math.sin(performance.now() * 0.008) * 0.3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(0, lean*0.5, s*0.9, s*1.2, 0, 0, 6.28); ctx.stroke();
      ctx.fillStyle = hurt ? '#fff' : '#3a0a0a';
      ctx.beginPath();
      ctx.moveTo(-s*0.5, -s*1.1);
      ctx.quadraticCurveTo(-s*1.4, -s*1.6, -s*1.2, -s*2.5);
      ctx.quadraticCurveTo(-s*1.0, -s*1.8, -s*0.4, -s*1.4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s*0.5, -s*1.1);
      ctx.quadraticCurveTo(s*1.4, -s*1.6, s*1.2, -s*2.5);
      ctx.quadraticCurveTo(s*1.0, -s*1.8, s*0.4, -s*1.4);
      ctx.closePath(); ctx.fill();
    } else if (c.id === 'skull'){
      ctx.fillStyle = hurt ? '#fff' : '#dcdcc8';
      ctx.beginPath(); ctx.arc(0, -s*0.9, s*0.7, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(-s*0.25, -s*0.9, s*0.18, s*0.22, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s*0.25, -s*0.9, s*0.18, s*0.22, 0, 0, 6.28); ctx.fill();
    } else if (c.id === 'ice'){
      ctx.strokeStyle = 'rgba(180,230,255,' + (0.6 + Math.sin(performance.now() * 0.005) * 0.3) + ')';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, lean*0.5, s*0.9, s*1.2, 0, 0, 6.28); ctx.stroke();
      ctx.fillStyle = hurt ? '#fff' : '#c0e8ff';
      for (let i = 0; i < 5; i++){
        const ang = -Math.PI/2 + (i-2) * 0.4;
        const px = Math.cos(ang) * s*0.85, py = Math.sin(ang) * s*1.0;
        ctx.beginPath();
        ctx.moveTo(px - 3, py); ctx.lineTo(px, py - 12); ctx.lineTo(px + 3, py);
        ctx.closePath(); ctx.fill();
      }
    } else if (c.id === 'dragon'){
      ctx.strokeStyle = 'rgba(255,120,30,' + (0.6 + Math.sin(performance.now() * 0.008) * 0.3) + ')';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, lean*0.5, s*1.0, s*1.2, 0, 0, 6.28); ctx.stroke();
      ctx.fillStyle = hurt ? '#fff' : '#6a2000';
      ctx.beginPath();
      ctx.moveTo(-s*0.6, -s*0.9); ctx.lineTo(-s*1.2, -s*1.5); ctx.lineTo(-s*0.9, -s*0.7); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s*0.6, -s*0.9); ctx.lineTo(s*1.2, -s*1.5); ctx.lineTo(s*0.9, -s*0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff8000';
      ctx.shadowColor = '#ff8000'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(-s*0.2, -s*0.9, 2, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(s*0.2, -s*0.9, 2, 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (c.id === 'necro'){
      ctx.strokeStyle = 'rgba(160,60,255,' + (0.7 + Math.sin(performance.now() * 0.006) * 0.3) + ')';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(0, lean*0.5, s*1.0, s*1.2, 0, 0, 6.28); ctx.stroke();
      ctx.fillStyle = hurt ? '#fff' : '#2a0a3a';
      ctx.beginPath();
      ctx.moveTo(-s*0.5, -s*1.1); ctx.lineTo(-s*0.9, -s*2.0); ctx.lineTo(-s*0.6, -s*1.6);
      ctx.lineTo(-s*0.7, -s*2.2); ctx.lineTo(-s*0.35, -s*1.4); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(s*0.5, -s*1.1); ctx.lineTo(s*0.9, -s*2.0); ctx.lineTo(s*0.6, -s*1.6);
      ctx.lineTo(s*0.7, -s*2.2); ctx.lineTo(s*0.35, -s*1.4); ctx.closePath(); ctx.fill();
    } else if (c.id === 'void'){
      const secondPhase = e.secondPhaseDone;
      ctx.strokeStyle = secondPhase
        ? 'rgba(200,80,255,0.9)'
        : 'rgba(160,60,255,' + (0.6 + Math.sin(performance.now() * 0.005) * 0.4) + ')';
      ctx.lineWidth = secondPhase ? 7 : 5;
      ctx.beginPath();
      ctx.ellipse(0, lean*0.5, s * (secondPhase ? 1.15 : 1.0), s * (secondPhase ? 1.4 : 1.25), 0, 0, 6.28);
      ctx.stroke();
      ctx.fillStyle = secondPhase ? '#ff40ff' : '#c060ff';
      ctx.shadowColor = secondPhase ? '#ff40ff' : '#a040ff';
      ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(-s*0.4, -s*1.0, 4, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(s*0.4, -s*1.0, 4, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(-s*0.2, -s*0.8, 3, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(s*0.2, -s*0.8, 3, 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (c.id === 'napoleon'){
      ctx.fillStyle = hurt ? '#fff' : '#1a1a1a';
      ctx.beginPath();
      ctx.moveTo(-s*0.7, -s*1.2); ctx.lineTo(-s*0.6, -s*1.8); ctx.lineTo(0, -s*2.0);
      ctx.lineTo(s*0.6, -s*1.8); ctx.lineTo(s*0.7, -s*1.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, -s*1.5, s*0.15, 0, 6.28); ctx.fill();
    }
  }
}

// ================= ПРЕВЬЮ ПЕРСОНАЖА =================
function drawCharacterPreview(cx, id, size){
  cx.clearRect(0, 0, size, size);
  const c = CHARACTERS.find(x => x.id === id);
  if (!c) return;
  const s = size / 140;
  cx.save();
  cx.translate(size/2, size/2 + 10*s);
  cx.scale(s * 1.5, s * 1.5);
  const bg = cx.createRadialGradient(-3, -3, 0, 0, 0, 14);
  bg.addColorStop(0, c.color);
  bg.addColorStop(1, '#1f618d');
  cx.fillStyle = bg;
  cx.beginPath(); cx.ellipse(0, -2, 11, 13, 0, 0, 6.28); cx.fill();
  cx.strokeStyle = c.color;
  cx.lineWidth = 5;
  cx.lineCap = 'round';
  cx.beginPath(); cx.moveTo(-8, -2); cx.lineTo(-11, 6); cx.stroke();
  cx.beginPath(); cx.moveTo(8, -2);  cx.lineTo(11, 6); cx.stroke();
  cx.strokeStyle = '#2c3e50';
  cx.lineWidth = 5;
  cx.beginPath(); cx.moveTo(-4, 7); cx.lineTo(-4, 19); cx.stroke();
  cx.beginPath(); cx.moveTo(4, 7);  cx.lineTo(4, 19); cx.stroke();
  const hg = cx.createRadialGradient(-2, -14, 0, 0, -11, 10);
  hg.addColorStop(0, '#ffd1a3');
  hg.addColorStop(1, '#c69678');
  cx.fillStyle = hg;
  cx.beginPath(); cx.arc(0, -11, 9, 0, 6.28); cx.fill();
  cx.strokeStyle = '#4a2a1a';
  cx.lineWidth = 1.5;
  cx.beginPath(); cx.arc(0, -11, 9, 0, 6.28); cx.stroke();
  if (c.id === 'soldier'){ cx.fillStyle = '#3a4a2a'; cx.beginPath(); cx.arc(0, -13, 9, Math.PI, Math.PI*2); cx.fill(); }
  else if (c.id === 'ninja'){ cx.fillStyle = '#1a1a1a'; cx.beginPath(); cx.arc(0, -11, 9, 0, 6.28); cx.fill(); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(4, -11, 1.5, 0, 6.28); cx.fill(); }
  else if (c.id === 'medic'){ cx.fillStyle = '#ff2020'; cx.fillRect(-2, -16, 4, 10); cx.fillRect(-6, -12, 12, 4); }
  else if (c.id === 'pirate'){ cx.fillStyle = '#1a1a1a'; cx.fillRect(-9, -14, 18, 4); }
  else if (c.id === 'robot'){ cx.fillStyle = '#c0c0c0'; cx.beginPath(); cx.arc(0, -11, 9, 0, 6.28); cx.fill(); cx.fillStyle = '#ff3030'; cx.beginPath(); cx.arc(-3, -11, 2, 0, 6.28); cx.fill(); cx.beginPath(); cx.arc(4, -11, 2, 0, 6.28); cx.fill(); }
  else if (c.id === 'king'){ cx.fillStyle = '#d4a017'; cx.beginPath(); cx.moveTo(-9, -20); cx.lineTo(-7, -26); cx.lineTo(-4, -22); cx.lineTo(0, -28); cx.lineTo(4, -22); cx.lineTo(7, -26); cx.lineTo(9, -20); cx.closePath(); cx.fill(); }
  else if (c.id === 'napoleon'){ cx.fillStyle = '#1a1a1a'; cx.beginPath(); cx.moveTo(-10, -18); cx.lineTo(-8, -25); cx.lineTo(0, -27); cx.lineTo(8, -25); cx.lineTo(10, -18); cx.closePath(); cx.fill(); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(0, -21, 2.5, 0, 6.28); cx.fill(); }
  else { cx.fillStyle = '#3b2418'; cx.beginPath(); cx.arc(0, -12, 9, Math.PI, Math.PI*2); cx.fill(); cx.fillStyle = '#000'; cx.beginPath(); cx.arc(4, -11, 1.5, 0, 6.28); cx.fill(); }
  cx.restore();
}
// ================= АНИМАЦИЯ МЕНЮ =================
const menuCanvas = document.getElementById('menuCanvas');
const mctx = menuCanvas ? menuCanvas.getContext('2d') : null;
let menuW = 0, menuH = 0;
let menuParticles = [], menuTime = 0, menuLastTs = 0;
let menuLightningTimer = 0, menuLightningFlash = 0;
let matrixColumns = [];
let fireParticles = [];

function resizeMenu(){
  if (!menuCanvas) return;
  menuW = menuCanvas.width = innerWidth;
  menuH = menuCanvas.height = innerHeight;
}
resizeMenu();

function initMenuBg(){
  if (!menuCanvas) return;
  menuParticles = [];
  matrixColumns = [];
  fireParticles = [];

  if (settings.bg === 'zombie' || settings.bg === 'snow' || settings.bg === 'rain'){
    const numZombies = (settings.bg === 'zombie') ? 6 : 0;
    for (let i = 0; i < numZombies; i++){
      menuParticles.push({
        type: 'zombie',
        x: rand(0, menuW), y: rand(menuH * 0.4, menuH + 60),
        vx: rand(-15, 15), vy: rand(-8, -3),
        size: rand(20, 42), walkPhase: rand(0, 6.28), rot: rand(-0.15, 0.15)
      });
    }
    if (settings.bg === 'snow'){
      for (let i = 0; i < 120; i++){
        menuParticles.push({
          type: 'snow', x: Math.random() * menuW, y: Math.random() * menuH,
          vy: 20 + Math.random() * 50, vx: (Math.random() - 0.5) * 30,
          size: 1.5 + Math.random() * 3,
          wobble: Math.random() * 6.28,
          alpha: 0.5 + Math.random() * 0.5
        });
      }
    }
    if (settings.bg === 'rain'){
      for (let i = 0; i < 200; i++){
        menuParticles.push({
          type: 'rain', x: Math.random() * menuW, y: Math.random() * menuH,
          v: 600 + Math.random() * 400,
          len: 10 + Math.random() * 15,
          alpha: 0.3 + Math.random() * 0.5
        });
      }
    }
  } else if (settings.bg === 'stars'){
    for (let i = 0; i < 200; i++){
      menuParticles.push({
        type: 'star', x: Math.random() * menuW, y: Math.random() * menuH,
        size: 0.5 + Math.random() * 2,
        phase: Math.random() * 6.28,
        speed: 0.5 + Math.random() * 2
      });
    }
  } else if (settings.bg === 'matrix'){
    const cols = Math.floor(menuW / 20);
    for (let i = 0; i < cols; i++){
      matrixColumns.push({
        x: i * 20 + Math.random() * 10,
        y: -Math.random() * menuH,
        speed: 50 + Math.random() * 120,
        chars: []
      });
      for (let j = 0; j < 30; j++){
        matrixColumns[i].chars.push(String.fromCharCode(33 + Math.floor(Math.random() * 93)));
      }
    }
  } else if (settings.bg === 'fire'){
    for (let i = 0; i < 150; i++){
      fireParticles.push({
        x: Math.random() * menuW,
        y: menuH - Math.random() * 100,
        vy: -50 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 40,
        size: 20 + Math.random() * 40,
        life: 0, maxLife: 1 + Math.random() * 2
      });
    }
  }
}

function updateMenuBg(dt){
  menuTime += dt;

  for (let i = 0; i < menuParticles.length; i++){
    const p = menuParticles[i];
    if (p.type === 'zombie'){
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.walkPhase += dt * 4;
      if (p.y < -80 || p.x < -80 || p.x > menuW + 80){
        p.x = rand(0, menuW);
        p.y = menuH + 60;
        p.vy = rand(-8, -3);
        p.vx = rand(-15, 15);
      }
    } else if (p.type === 'snow'){
      p.wobble += dt * 2;
      p.y += p.vy * dt;
      p.x += p.vx * dt + Math.sin(p.wobble) * 30 * dt;
      if (p.y > menuH){ p.y = -10; p.x = Math.random() * menuW; }
      if (p.x < -10) p.x = menuW + 10;
      if (p.x > menuW + 10) p.x = -10;
    } else if (p.type === 'rain'){
      p.y += p.v * dt;
      p.x -= 150 * dt;
      if (p.y > menuH){ p.y = -10; p.x = Math.random() * menuW + 100; }
      if (p.x < -10) p.x = menuW + 10;
    } else if (p.type === 'star'){
      p.phase += dt * p.speed;
    }
  }

  for (let i = 0; i < matrixColumns.length; i++){
    const col = matrixColumns[i];
    col.y += col.speed * dt;
    if (col.y > menuH + 30){
      col.y = -Math.random() * 100;
      for (let j = 0; j < col.chars.length; j++){
        col.chars[j] = String.fromCharCode(33 + Math.floor(Math.random() * 93));
      }
    }
  }

  for (let i = 0; i < fireParticles.length; i++){
    const p = fireParticles[i];
    p.life += dt;
    p.y += p.vy * dt;
    p.x += p.vx * dt;
    p.size *= 0.995;
    if (p.life > p.maxLife || p.y < -50){
      p.x = Math.random() * menuW;
      p.y = menuH + 20;
      p.vy = -50 - Math.random() * 100;
      p.vx = (Math.random() - 0.5) * 40;
      p.size = 20 + Math.random() * 40;
      p.life = 0;
      p.maxLife = 1 + Math.random() * 2;
    }
  }

  menuLightningTimer -= dt;
  if (menuLightningTimer <= 0){
    menuLightningTimer = rand(3, 8);
    menuLightningFlash = 1;
  }
  if (menuLightningFlash > 0){
    menuLightningFlash = Math.max(0, menuLightningFlash - dt * 3);
  }
}

function drawMenuBg(){
  if (!mctx) return;

  // Фон
  if (settings.bg === 'zombie'){
    const g = mctx.createRadialGradient(menuW/2, menuH/2, 50, menuW/2, menuH/2, Math.max(menuW, menuH));
    g.addColorStop(0, 'rgba(20,30,20,0.9)');
    g.addColorStop(1, 'rgba(5,5,10,0.98)');
    mctx.fillStyle = g;
  } else if (settings.bg === 'stars'){
    const g = mctx.createRadialGradient(menuW/2, menuH/2, 50, menuW/2, menuH/2, Math.max(menuW, menuH));
    g.addColorStop(0, 'rgba(20,10,40,0.95)');
    g.addColorStop(1, 'rgba(2,2,15,0.99)');
    mctx.fillStyle = g;
  } else if (settings.bg === 'matrix'){
    mctx.fillStyle = 'rgba(0,5,0,0.95)';
  } else if (settings.bg === 'fire'){
    const g = mctx.createRadialGradient(menuW/2, menuH*0.8, 50, menuW/2, menuH*0.8, Math.max(menuW, menuH)*0.9);
    g.addColorStop(0, 'rgba(60,15,5,0.95)');
    g.addColorStop(1, 'rgba(10,0,0,0.99)');
    mctx.fillStyle = g;
  } else if (settings.bg === 'snow'){
    const g = mctx.createRadialGradient(menuW/2, menuH/2, 50, menuW/2, menuH/2, Math.max(menuW, menuH));
    g.addColorStop(0, 'rgba(20,30,50,0.9)');
    g.addColorStop(1, 'rgba(5,8,15,0.98)');
    mctx.fillStyle = g;
  } else if (settings.bg === 'rain'){
    const g = mctx.createRadialGradient(menuW/2, menuH/2, 50, menuW/2, menuH/2, Math.max(menuW, menuH));
    g.addColorStop(0, 'rgba(15,20,35,0.9)');
    g.addColorStop(1, 'rgba(3,3,10,0.98)');
    mctx.fillStyle = g;
  }
  mctx.fillRect(0, 0, menuW, menuH);

  // Сетка
  mctx.strokeStyle = 'rgba(120,180,255,0.05)';
  mctx.lineWidth = 1;
  const gridSize = 50;
  const offX = (menuTime * 15) % gridSize;
  const offY = (menuTime * 10) % gridSize;
  for (let x = -offX; x < menuW; x += gridSize){
    mctx.beginPath(); mctx.moveTo(x, 0); mctx.lineTo(x, menuH); mctx.stroke();
  }
  for (let y = -offY; y < menuH; y += gridSize){
    mctx.beginPath(); mctx.moveTo(0, y); mctx.lineTo(menuW, y); mctx.stroke();
  }

  // Молния
  if (menuLightningFlash > 0){
    mctx.fillStyle = 'rgba(200,220,255,' + (menuLightningFlash * 0.3) + ')';
    mctx.fillRect(0, 0, menuW, menuH);
  }

  // Контент
  if (settings.bg === 'zombie'){
    for (let i = 0; i < menuParticles.length; i++){
      const p = menuParticles[i];
      if (p.type !== 'zombie') continue;
      mctx.save();
      mctx.globalAlpha = 0.35;
      mctx.translate(p.x, p.y);
      mctx.rotate(p.rot);
      const walk = Math.sin(p.walkPhase);
      mctx.fillStyle = '#1a3a1a';
      mctx.beginPath(); mctx.ellipse(0, 0, p.size*0.7, p.size*1.0, 0, 0, 6.28); mctx.fill();
      mctx.beginPath(); mctx.arc(0, -p.size*0.9, p.size*0.55, 0, 6.28); mctx.fill();
      mctx.strokeStyle = '#1a3a1a';
      mctx.lineWidth = p.size * 0.4;
      mctx.lineCap = 'round';
      mctx.beginPath(); mctx.moveTo(-p.size*0.3, p.size*0.4); mctx.lineTo(-p.size*0.3 + walk*p.size*0.3, p.size*1.1); mctx.stroke();
      mctx.beginPath(); mctx.moveTo(p.size*0.3, p.size*0.4); mctx.lineTo(p.size*0.3 - walk*p.size*0.3, p.size*1.1); mctx.stroke();
      mctx.fillStyle = 'rgba(255,40,40,0.9)';
      mctx.beginPath(); mctx.arc(-p.size*0.2, -p.size*0.9, 2, 0, 6.28); mctx.fill();
      mctx.beginPath(); mctx.arc(p.size*0.2, -p.size*0.9, 2, 0, 6.28); mctx.fill();
      mctx.restore();
    }
  } else if (settings.bg === 'stars'){
    for (let i = 0; i < menuParticles.length; i++){
      const p = menuParticles[i];
      const a = 0.3 + Math.sin(p.phase) * 0.5 + 0.2;
      mctx.fillStyle = 'rgba(255,255,255,' + a + ')';
      mctx.beginPath(); mctx.arc(p.x, p.y, p.size, 0, 6.28); mctx.fill();
    }
    const ng = mctx.createRadialGradient(menuW*0.3, menuH*0.3, 0, menuW*0.3, menuH*0.3, menuW*0.5);
    ng.addColorStop(0, 'rgba(120,60,200,0.15)');
    ng.addColorStop(1, 'rgba(120,60,200,0)');
    mctx.fillStyle = ng;
    mctx.fillRect(0, 0, menuW, menuH);
    const ng2 = mctx.createRadialGradient(menuW*0.7, menuH*0.6, 0, menuW*0.7, menuH*0.6, menuW*0.4);
    ng2.addColorStop(0, 'rgba(60,120,200,0.12)');
    ng2.addColorStop(1, 'rgba(60,120,200,0)');
    mctx.fillStyle = ng2;
    mctx.fillRect(0, 0, menuW, menuH);
  } else if (settings.bg === 'matrix'){
    mctx.font = 'bold 16px monospace';
    for (let i = 0; i < matrixColumns.length; i++){
      const col = matrixColumns[i];
      for (let j = 0; j < col.chars.length; j++){
        const cy = col.y - j * 20;
        if (cy < -20 || cy > menuH + 20) continue;
        const alpha = j === 0 ? 1 : Math.max(0, 1 - j / 25);
        mctx.fillStyle = 'rgba(60,255,60,' + alpha * 0.9 + ')';
        if (j === 0) mctx.fillStyle = 'rgba(200,255,200,1)';
        mctx.fillText(col.chars[j], col.x, cy);
      }
    }
  } else if (settings.bg === 'fire'){
    for (let i = 0; i < fireParticles.length; i++){
      const p = fireParticles[i];
      const life = p.life / p.maxLife;
      const alpha = (1 - life) * 0.7;
      const g2 = mctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      g2.addColorStop(0, 'rgba(255,220,100,' + alpha + ')');
      g2.addColorStop(0.4, 'rgba(255,120,40,' + alpha * 0.7 + ')');
      g2.addColorStop(1, 'rgba(180,20,0,0)');
      mctx.fillStyle = g2;
      mctx.beginPath(); mctx.arc(p.x, p.y, p.size, 0, 6.28); mctx.fill();
    }
  } else if (settings.bg === 'snow'){
    for (let i = 0; i < menuParticles.length; i++){
      const p = menuParticles[i];
      if (p.type !== 'snow') continue;
      const g2 = mctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      g2.addColorStop(0, 'rgba(255,255,255,' + p.alpha + ')');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      mctx.fillStyle = g2;
      mctx.beginPath(); mctx.arc(p.x, p.y, p.size * 2, 0, 6.28); mctx.fill();
      mctx.fillStyle = 'rgba(255,255,255,' + p.alpha + ')';
      mctx.beginPath(); mctx.arc(p.x, p.y, p.size, 0, 6.28); mctx.fill();
    }
  } else if (settings.bg === 'rain'){
    mctx.lineCap = 'round';
    for (let i = 0; i < menuParticles.length; i++){
      const p = menuParticles[i];
      if (p.type !== 'rain') continue;
      const grd = mctx.createLinearGradient(p.x, p.y, p.x - 3, p.y + p.len);
      grd.addColorStop(0, 'rgba(180,200,230,0)');
      grd.addColorStop(1, 'rgba(180,200,230,' + p.alpha + ')');
      mctx.strokeStyle = grd;
      mctx.lineWidth = 1.2;
      mctx.beginPath();
      mctx.moveTo(p.x, p.y);
      mctx.lineTo(p.x - 3, p.y + p.len);
      mctx.stroke();
    }
  }
}

function menuLoop(ts){
  if (!menuLastTs) menuLastTs = ts;
  const dt = Math.min(0.05, (ts - menuLastTs) / 1000);
  menuLastTs = ts;
  const menuVisible = !document.getElementById('mainMenu').classList.contains('hidden');
  if (menuVisible){
    updateMenuBg(dt);
    drawMenuBg();
  }
  requestAnimationFrame(menuLoop);
}

// ================= ВСТУПЛЕНИЕ И ЗАПУСК =================
function playIntro(){
  const fill = document.getElementById('introProgressFill');
  const intro = document.getElementById('introScreen');
  if (!fill || !intro) return;
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 15 + 5;
    if (p >= 100) p = 100;
    fill.style.width = p + '%';
    if (p >= 100){
      clearInterval(tick);
      setTimeout(() => {
        intro.classList.add('hidden');
        showScreen('mainMenu');
        initMenuBg();
        updateBgLabel();
        updateQuote();
      }, 500);
    }
  }, 180);
}

window.addEventListener('load', () => {
  syncSettingsUI();
  updateFpsVisibility();
  updateMenuInfo();
  updateBgLabel();
  updateQuote();
  initMenuBg();
  requestAnimationFrame(menuLoop);

  // Смена цитат каждые 10 секунд
  setInterval(() => {
    const menuVisible = !document.getElementById('mainMenu').classList.contains('hidden');
    if (menuVisible) updateQuote();
  }, 10000);

  setTimeout(playIntro, 300);
});