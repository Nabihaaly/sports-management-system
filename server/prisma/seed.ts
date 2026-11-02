/**
 * Court Connect — demo data seed
 *
 * Kya karta hai: ek EXISTING user (OWNER_EMAIL) ko venue owner banata hai,
 * uske under 3 approved venues + har venue mein 2 courts (weekly schedule ke saath) banata hai.
 * Photos: Unsplash (free license). Dummy UI data nahi — asli rows DB mein.
 *
 * Run (server folder mein, server band karke):
 *   1. Pehle us owner ka account UI/Postman se signup karo (Better Auth hashing ki wajah se
 *      user yahan nahi banate), aur /access pe "Venue Owner" choose karo.
 *   2. OWNER_EMAIL=owner@courtconnect.com npx ts-node --transpile-only prisma/seed.ts
 *      (Windows PowerShell: $env:OWNER_EMAIL="owner@courtconnect.com"; npx ts-node --transpile-only prisma/seed.ts)
 *
 * Dobara chalane pe duplicate nahi banata (venueName + owner pe check).
 */
import 'dotenv/config';
import { PrismaClient, ApplicationStatus, CourtType, WeekDay, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'owner@courtconnect.com';

const DAYS: WeekDay[] = [
  WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY,
  WeekDay.FRIDAY, WeekDay.SATURDAY, WeekDay.SUNDAY,
];

// Ek court ka pura weekly schedule: har operating day pe opening→closing ek window
const weekly = (opening: string, closing: string, days: WeekDay[] = DAYS) =>
  days.map((d) => ({ dayOfWeek: d, startTime: opening, endTime: closing }));

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const VENUES = [
  {
    venueName: 'KMC Sports Complex',
    description: 'Floodlit padel and futsal courts on Kashmir Road, open till midnight.',
    address: 'Kashmir Road, KMC Complex',
    city: 'Karachi',
    images: [img('photo-1646649853703-7645147474ba'), img('photo-1770230901556-4e1c0bacfb09')],
    businessRegistration: 'KMC-2024-0113',
    sizeOfVenue: '12,000 sq ft',
    courtsPriceRange: 'Rs. 2,500 – Rs. 4,000 per hour',
    courts: [
      {
        courtName: 'Padel Court 1', sport: 'Padel', courtType: CourtType.OUTDOOR,
        maxPlayers: 4, pricePerSlotPKR: 3500, openingTime: '08:00', closingTime: '23:00',
        description: 'Panoramic glass court, LED floodlights, artificial turf.',
      },
      {
        courtName: 'Futsal Arena', sport: 'Futsal', courtType: CourtType.INDOOR,
        maxPlayers: 10, pricePerSlotPKR: 4000, openingTime: '09:00', closingTime: '23:00',
        description: 'Indoor 5-a-side, shock-absorbent turf, changing rooms.',
      },
    ],
  },
  {
    venueName: 'Emaar Oceanfront Club',
    description: 'Seaside tennis and padel courts with sea breeze and sunset views.',
    address: 'Emaar Crescent Bay, DHA Phase 8',
    city: 'Karachi',
    images: [img('photo-1761404984667-16d6c9158c59'), img('photo-1545151414-8a948e1ea54f')],
    businessRegistration: 'EMR-2023-0871',
    sizeOfVenue: '20,000 sq ft',
    courtsPriceRange: 'Rs. 3,000 – Rs. 6,000 per hour',
    courts: [
      {
        courtName: 'Centre Court', sport: 'Tennis', courtType: CourtType.OUTDOOR,
        maxPlayers: 4, pricePerSlotPKR: 6000, openingTime: '06:00', closingTime: '22:00',
        description: 'Hard court, tournament-grade net, shaded benches.',
      },
      {
        courtName: 'Padel Court A', sport: 'Padel', courtType: CourtType.OUTDOOR,
        maxPlayers: 4, pricePerSlotPKR: 3500, openingTime: '07:00', closingTime: '23:00',
        description: 'Glass-walled padel court facing the sea.',
      },
    ],
  },
  {
    venueName: 'Neo Maidan Arena',
    description: 'Multi-sport indoor arena — cricket nets, badminton and basketball.',
    address: 'Main Shahrah-e-Faisal, near Nursery',
    city: 'Karachi',
    images: [img('photo-1641352848874-c96659e03144'), img('photo-1760174012435-630a17a434ed')],
    businessRegistration: 'NMA-2024-0042',
    sizeOfVenue: '15,000 sq ft',
    courtsPriceRange: 'Rs. 1,500 – Rs. 3,000 per hour',
    courts: [
      {
        courtName: 'Cricket Net 1', sport: 'Cricket', courtType: CourtType.INDOOR,
        maxPlayers: 6, pricePerSlotPKR: 2000, openingTime: '10:00', closingTime: '22:00',
        description: 'Bowling machine available, matting wicket.',
      },
      {
        courtName: 'Basketball Court', sport: 'Basketball', courtType: CourtType.INDOOR,
        maxPlayers: 10, pricePerSlotPKR: 3000, openingTime: '10:00', closingTime: '22:00',
        description: 'Full court, wooden floor, scoreboard.',
      },
    ],
  },
];

async function main() {
  const user = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (!user) {
    throw new Error(
      `User ${OWNER_EMAIL} nahi mila. Pehle UI se signup karo, phir dobara seed chalao.`,
    );
  }

  // Role OWNER + owner profile (agar nahi hai)
  if (user.role !== Role.OWNER) {
    await prisma.user.update({ where: { id: user.id }, data: { role: Role.OWNER } });
  }
  const owner = await prisma.venueOwnerPersonal.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      fullName: user.name || 'Demo Owner',
      cnic: '42101-0000000-1',
      phoneNumber: '+92 300 0000000',
    },
    update: {},
  });

  for (const v of VENUES) {
    const existing = await prisma.venueApplicationDetails.findFirst({
      where: { venueOwnerId: owner.id, venueName: v.venueName },
      select: { id: true },
    });
    if (existing) {
      console.log(`skip  ${v.venueName} (already exists)`);
      continue;
    }

    const { courts, ...venueData } = v;
    const venue = await prisma.venueApplicationDetails.create({
      data: {
        ...venueData,
        venueOwnerId: owner.id,
        status: ApplicationStatus.APPROVED,
        isActive: true,
        courts: {
          create: courts.map((c) => ({
            ...c,
            bookingDurationMinutes: 60,
            operatingDays: DAYS,
            isActive: true,
            availabilities: { create: weekly(c.openingTime, c.closingTime) },
          })),
        },
      },
    });
    console.log(`added ${venue.venueName} with ${courts.length} courts`);
  }
}

main()
  .then(() => console.log('Seed done.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
