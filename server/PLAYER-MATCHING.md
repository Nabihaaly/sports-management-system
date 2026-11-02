# Player Matching

`GET /player-matching/matches?courtId=<optional>` (PLAYER login)

Player ki latest "Request to Play" ko baaki players ki requests se match karta hai.

**Filter:** same sport · time overlap (30 min, ya court ka poora slot) · `availableForMatching` ON · same city · court ho to budget ≥ per-player share

**Score (100):** time 40 · skill 35 · budget 25

## Demo
```bash
npx prisma generate
npm run start:dev                 # terminal 1
# seed (pehli dafa): prisma/seed.ts ke steps, owner@courtconnect.com
npm run demo:matching             # terminal 2 -> "32 passed, 0 failed"
```
Code: `src/player-matching/` · Frontend: `client/services/playerMatching.tsx`

## UI test
```bash
npm run seed:match-players        # 6 cricket test players (kal 6-8 PM)
```
UI: profile (Karachi, matching ON) → "+ Request to Play" (Cricket, kal 6–8 PM, Rs 500) → **Match with players** (dashboard ya court page).
