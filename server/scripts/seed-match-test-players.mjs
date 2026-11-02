// UI pe "Match with players" test karne ke liye 6 test players banata hai,
// sab ki Cricket ki request KAL 6-8 PM ke aas paas (Karachi time).
// Chalao (server chal raha ho):  npm run seed:match-players
// Phir UI mein apna account banao, profile (Karachi, matching ON) aur
// Request to Play (Cricket, kal, 6:00 PM - 8:00 PM, budget 500) bharo, aur button dabao.

const API = process.env.API ?? 'http://localhost:3001';
const H = { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' };
const RUN = Date.now().toString(36);

const pk = (day, hhmm) => {
  const d = new Date(Date.now() + day * 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
  return new Date(`${d}T${hhmm}:00+05:00`).toISOString();
};

async function player(name, skill, from, until, budget, city = 'Karachi') {
  const email = `${name.toLowerCase()}.${RUN}@test.com`;
  const r = await fetch(API + '/api/auth/sign-up/email', {
    method: 'POST', headers: H, body: JSON.stringify({ name, email, password: 'password123' }),
  });
  if (!r.ok) throw new Error(`signup ${name}: ${r.status}`);
  const Cookie = r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  await fetch(API + '/player-profile', {
    method: 'PATCH', headers: { ...H, Cookie },
    body: JSON.stringify({ displayName: name, city, availableForMatching: true, preferredSports: ['Cricket'], ...(skill ? { skillLevel: skill } : {}) }),
  });
  const q = await fetch(API + '/matchwith-players', {
    method: 'POST', headers: { ...H, Cookie },
    body: JSON.stringify({ preferredSport: 'CRICKET', availableFrom: pk(1, from), availableUntil: pk(1, until), budget }),
  });
  console.log(`${q.ok ? '✅' : '❌'} ${name.padEnd(6)} ${(skill ?? 'no skill').padEnd(12)} ${from}-${until}  Rs ${budget}  ${city}`);
}

await player('Hamza', 'INTERMEDIATE', '18:00', '20:00', 500);
await player('Rafay', 'ADVANCED', '17:30', '19:30', 450);
await player('Saad', null, '18:00', '19:00', 400);
await player('Talha', 'BEGINNER', '19:00', '21:00', 300);
await player('Moiz', 'PRO', '18:00', '20:00', 900);
await player('Faraz', 'INTERMEDIATE', '18:00', '20:00', 500, 'Lahore'); // city alag -> nahi dikhna chahiye
console.log('\nDone. Ab UI mein Cricket ki request (kal 6-8 PM) bhar ke "Match with players" dabao.');
