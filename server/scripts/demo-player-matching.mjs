// Player Matching ka end-to-end demo - sirf REAL API calls (frontend ki zaroorat nahi)
//
// Pehle:
//   1. Server chalao:   npm run start:dev
//   2. Venues/courts:   seed chala do (prisma/seed.ts ke andar steps likhe hain)
//      Ye script owner account khud bana deti hai: owner@courtconnect.com / password123
//      Agar court nahi mila to script batayegi ki seed chalao, phir dobara run karo.
// Chalao:  node scripts/demo-player-matching.mjs

const API = process.env.API ?? 'http://localhost:3001';
const RUN = Date.now().toString(36); // har run pe naye emails
const HEADERS = { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' };

let passed = 0, failed = 0;
const check = (name, ok, extra = '') => {
  ok ? passed++ : failed++;
  console.log(`${ok ? '  ✅ PASS' : '  ❌ FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`);
};

async function call(method, path, cookie, body) {
  const res = await fetch(API + path, {
    method,
    headers: { ...HEADERS, ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, res };
}
async function ok(method, path, cookie, body) {
  const r = await call(method, path, cookie, body);
  if (r.status >= 400) throw new Error(`${method} ${path} -> ${r.status}: ${JSON.stringify(r.data).slice(0, 300)}`);
  return r;
}

async function signUp(name, email = `${name.toLowerCase()}.${RUN}@test.com`) {
  let r = await call('POST', '/api/auth/sign-up/email', null, { name, email, password: 'password123' });
  if (r.status >= 400) r = await ok('POST', '/api/auth/sign-in/email', null, { email, password: 'password123' });
  const cookie = r.res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  return { id: r.data.user.id, name, cookie };
}

// Karachi time mein date banao: day = aaj se kitne din baad
function pkDate(day, hhmm) {
  const d = new Date(Date.now() + day * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  return new Date(`${d}T${hhmm}:00+05:00`).toISOString();
}

// ---------------- Test players ----------------
// Ali (main player): kal 6–8 PM, Padel, budget 1000, Intermediate
const PLAYERS = [
  // name,    city,      skill,          match, sport,    day, from,    until,   budget, expect (bina court / court ke saath)
  ['Ali',     'Karachi', 'INTERMEDIATE', true,  'Padel',  1, '18:00', '20:00', 1000, 'me'],
  ['Bilal',   'Karachi', 'INTERMEDIATE', true,  'Padel',  1, '18:00', '21:00', 1000, 'shown|shown'],
  ['Sara',    'Karachi', 'ADVANCED',     true,  'Padel',  1, '17:00', '19:30', 900,  'shown|shown'],
  ['Usman',   'Karachi', 'PRO',          true,  'Padel',  1, '18:00', '20:00', 2000, 'shown|shown'],
  ['Zain',    'Karachi', null,           true,  'Padel',  1, '18:00', '19:00', 800,  'shown|hidden: budget Rs 800 < share Rs 875'],
  ['Hina',    'Karachi', 'INTERMEDIATE', true,  'Padel',  1, '19:15', '22:00', 1200, 'shown|hidden: sirf 45 min (court slot 60 min)'],
  ['Danish',  'Karachi', 'INTERMEDIATE', true,  'Padel',  1, '18:00', '20:00', 500,  'shown|hidden: budget < court share'],
  // Ye hamesha filter hone chahiye:
  ['Ahmed',   'Lahore',  'INTERMEDIATE', true,  'Padel',  1, '18:00', '20:00', 1000, 'hidden: other city'],
  ['Fatima',  'Karachi', 'INTERMEDIATE', false, 'Padel',  1, '18:00', '20:00', 1000, 'hidden: matching OFF'],
  ['Omar',    'Karachi', 'INTERMEDIATE', true,  'Tennis', 1, '18:00', '20:00', 1000, 'hidden: other sport'],
  ['Kamran',  'Karachi', 'INTERMEDIATE', true,  'Padel',  1, '20:00', '22:00', 1000, 'hidden: no time overlap'],
  ['Ayesha',  'Karachi', 'INTERMEDIATE', true,  'Padel',  2, '18:00', '20:00', 1000, 'hidden: different day'],
  ['Nida',    'Karachi', 'INTERMEDIATE', true,  'Padel',  1, '19:40', '21:00', 1000, 'hidden: sirf 20 min overlap'],
];

async function main() {
  console.log(`\n▶ API: ${API}   run: ${RUN}\n`);

  // ---- Court dhoondo (team ke seed se) ----
  const owner = await signUp('Owner', 'owner@courtconnect.com');
  await call('PATCH', '/auth/setRole', owner.cookie, { role: 'OWNER' });

  console.log('1) Creating players: signup -> profile -> Request to Play form (team ka endpoint)');
  const users = {};
  for (const [name, city, skill, match, sport, day, from, until, budget, expect] of PLAYERS) {
    const u = await signUp(name);
    await ok('PATCH', '/player-profile', u.cookie, {
      displayName: name, city, availableForMatching: match, preferredSports: [sport],
      ...(skill ? { skillLevel: skill } : {}),
    });
    await ok('POST', '/matchwith-players', u.cookie, {
      preferredSport: sport, availableFrom: pkDate(day, from), availableUntil: pkDate(day, until), budget,
    });
    users[name] = { ...u, expect };
  }
  console.log(`   ${PLAYERS.length} players + ${PLAYERS.length} requests created\n`);

  const venues = (await ok('GET', '/player/venues', users.Ali.cookie)).data;
  const venueList = Array.isArray(venues) ? venues : venues.venues ?? [];
  let padelCourt = null, futsalCourt = null;
  for (const v of venueList) {
    const detail = (await ok('GET', `/player/venues/${v.id}`, users.Ali.cookie)).data;
    const courts = detail.courts ?? detail.venue?.courts ?? [];
    padelCourt ??= courts.find((c) => c.sport === 'Padel');
    futsalCourt ??= courts.find((c) => c.sport === 'Futsal');
  }

  // ---- 2. Dashboard flow: bina court ke ----
  console.log('2) GET /player-matching/matches  (Ali, bina court)');
  const a = (await ok('GET', '/player-matching/matches?limit=50', users.Ali.cookie)).data;
  a.matches = thisRun(a.matches);
  printTable(a.matches);
  verify(a.matches, 0);
  check('Bilal ranked #1 (same level, same budget, full overlap)', a.matches[0]?.displayName === 'Bilal', a.matches[0]?.displayName);
  check('Scores sorted high -> low', a.matches.every((m, i, arr) => !i || arr[i - 1].score >= m.score));

  // ---- 3. Book a court -> Match with players ----
  if (!padelCourt) {
    console.log('\n⚠️  Koi Padel court nahi mila. Seed chalao (owner@courtconnect.com) phir dobara run karo.');
  } else {
    console.log(`\n3) GET /player-matching/matches?courtId=...  (Book a court: ${padelCourt.courtName}, Rs ${padelCourt.pricePerSlotPKR})`);
    const b = (await ok('GET', `/player-matching/matches?limit=50&courtId=${padelCourt.id}`, users.Ali.cookie)).data;
    b.matches = thisRun(b.matches);
    console.log(`   Per-player share: Rs ${b.court.perPlayerSharePKR}  |  Required overlap: ${b.criteria.minOverlapMinutes} min`);
    printTable(b.matches);
    verify(b.matches, 1);
  }

  // ---- 4. Edge cases ----
  console.log('\n4) Validation & security');
  const noReq = await signUp('NoRequest');
  await ok('PATCH', '/player-profile', noReq.cookie, { displayName: 'NoRequest', city: 'Karachi' });
  const r1 = await call('GET', '/player-matching/matches', noReq.cookie);
  check('Player without a request gets a clear error (404)', r1.status === 404, r1.data?.message);
  if (futsalCourt) {
    const r2 = await call('GET', `/player-matching/matches?courtId=${futsalCourt.id}`, users.Ali.cookie);
    check('Padel request + Futsal court rejected (400)', r2.status === 400, r2.data?.message);
  }
  const r3 = await call('GET', '/player-matching/matches', null);
  check('Not logged in -> 401', r3.status === 401);
  const r4 = await call('GET', '/player-matching/matches', owner.cookie);
  check('Venue owner cannot use player matching (403)', r4.status === 403);

  console.log(`\n${failed ? '❌' : '✅'}  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);

  // Naam ki jagah userId se check (script dobara chalao to purane runs ke same naam wale players bhi DB mein hote hain)
  // Table mein sirf is run ke players dikhao (purane runs ke test players DB mein reh jate hain)
  function thisRun(list) {
    const mine = new Set(Object.values(users).map((u) => u.id));
    return list.filter((m) => mine.has(m.userId));
  }

  function verify(matches, col) {
    const ids = matches.map((m) => m.userId);
    for (const [name, u] of Object.entries(users)) {
      if (u.expect === 'me') { check('Ali does not see himself', !ids.includes(u.id)); continue; }
      const exp = u.expect.includes('|') ? u.expect.split('|')[col] : u.expect;
      if (exp.startsWith('hidden')) check(`${name} filtered out (${exp.slice(8)})`, !ids.includes(u.id));
      else check(`${name} is matched`, ids.includes(u.id));
    }
  }
}

function printTable(list) {
  console.table(list.map((m) => ({
    name: m.displayName, skill: m.skillLevel ?? '-', budget: m.budget, score: m.score,
    time: m.breakdown.time, skill_pts: m.breakdown.skill, budget_pts: m.breakdown.budget,
    reasons: m.reasons.join(' | '),
  })));
}

main().catch((e) => {
  console.error('\n💥', e.message);
  console.error('   Server chal raha hai? (npm run start:dev)  .env aur DB check karo.\n');
  process.exit(1);
});
