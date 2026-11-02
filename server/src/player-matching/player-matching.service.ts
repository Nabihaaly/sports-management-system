import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FindMatchesDto } from './dto/find-matches.dto';
import {
  DEFAULT_TARGET_MINUTES,
  MIN_OVERLAP_MINUTES,
  minutesBetween,
  overlapWindow,
  scoreMatch,
} from './scoring';

/**
 * Player matching: player ki "Request to Play" ko baaki players ki requests se compare karke
 * best partners dhoondta hai. Data sirf existing tables se aata hai:
 *   - MatchWithPlayers (request form: sport, availableFrom/Until, budget)
 *   - PlayerProfile    (city, skillLevel, availableForMatching)
 *   - Court + Venue    (optional: court ka sport, city, price, slot duration)
 */
@Injectable()
export class PlayerMatchingService {
  constructor(private prisma: PrismaService) {}

  async findMatches(userId: string, q: FindMatchesDto) {
    const now = new Date();
    const limit = q.limit ?? 20;

    // ---------- 0. Mera data: profile + meri request ----------
    const me = await this.prisma.playerProfile.findUnique({ where: { userId } });
    if (!me || !me.isProfileComplete) {
      throw new BadRequestException('Please complete your player profile first.');
    }

    const myRequest = q.requestId
      ? await this.prisma.matchWithPlayers.findFirst({ where: { id: q.requestId, userId } })
      : await this.prisma.matchWithPlayers.findFirst({
          where: { userId, availableUntil: { gt: now } },
          orderBy: { createdAt: 'desc' },
        });
    if (!myRequest) {
      throw new NotFoundException('No active Request to Play found. Please submit the request form first.');
    }
    if (myRequest.availableUntil <= now) {
      throw new BadRequestException('This request has expired. Please submit a new Request to Play.');
    }

    // ---------- 0b. Court (agar "Book a court" page se aaye) ----------
    let city = me.city;
    let targetMinutes = DEFAULT_TARGET_MINUTES;
    let minOverlap = MIN_OVERLAP_MINUTES;
    let perPlayerSharePKR: number | null = null;
    let court: { id: string; courtName: string; sport: string; venueName: string; city: string;
      pricePerSlotPKR: number; maxPlayers: number; bookingDurationMinutes: number } | null = null;

    if (q.courtId) {
      const c = await this.prisma.court.findFirst({
        where: {
          id: q.courtId,
          isActive: true,
          venue: { isActive: true, status: ApplicationStatus.APPROVED },
        },
        include: { venue: { select: { venueName: true, city: true } } },
      });
      if (!c) throw new NotFoundException('Court not found.');
      if (c.sport.trim().toLowerCase() !== myRequest.preferredSport.trim().toLowerCase()) {
        throw new BadRequestException(
          `This court is for ${c.sport}, but your request is for ${myRequest.preferredSport}.`,
        );
      }
      city = c.venue.city;
      targetMinutes = c.bookingDurationMinutes;
      minOverlap = c.bookingDurationMinutes; // poora slot saath free hona chahiye
      perPlayerSharePKR = Math.ceil(c.pricePerSlotPKR / Math.max(c.maxPlayers, 1));
      court = {
        id: c.id, courtName: c.courtName, sport: c.sport, venueName: c.venue.venueName, city,
        pricePerSlotPKR: c.pricePerSlotPKR, maxPlayers: c.maxPlayers,
        bookingDurationMinutes: c.bookingDurationMinutes,
      };
    }

    // ---------- STEP 1: Hard filters ----------
    // (a) Requests table se: dusre players ki, same sport, jinka time mere time se overlap kare
    const otherRequests = await this.prisma.matchWithPlayers.findMany({
      where: {
        userId: { not: userId },
        preferredSport: { equals: myRequest.preferredSport.trim(), mode: 'insensitive' },
        availableFrom: { lt: myRequest.availableUntil },
        availableUntil: { gt: myRequest.availableFrom > now ? myRequest.availableFrom : now },
        ...(perPlayerSharePKR !== null ? { budget: { gte: perPlayerSharePKR } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // (b) Profiles table se: matching ON, profile complete, same city
    const profiles = await this.prisma.playerProfile.findMany({
      where: {
        userId: { in: [...new Set(otherRequests.map((r) => r.userId))] },
        availableForMatching: true,
        isProfileComplete: true,
        city: { equals: city.trim(), mode: 'insensitive' },
      },
      select: { id: true, userId: true, displayName: true, profilePicture: true, skillLevel: true, city: true },
    });
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    // ---------- STEP 2: Score + STEP 3: Rank ----------
    const myWindow = { from: myRequest.availableFrom, until: myRequest.availableUntil };
    const bestPerPlayer = new Map<string, ReturnType<typeof toMatch>>();

    function toMatch(r: (typeof otherRequests)[number], p: (typeof profiles)[number], overlap: { from: Date; until: Date }) {
      const s = scoreMatch({
        overlap, targetMinutes,
        mySkill: me!.skillLevel, theirSkill: p.skillLevel,
        myBudget: myRequest!.budget, theirBudget: r.budget,
      });
      return {
        userId: p.userId,
        profileId: p.id,
        displayName: p.displayName,
        profilePicture: p.profilePicture,
        city: p.city,
        skillLevel: p.skillLevel,
        requestId: r.id,
        budget: r.budget,
        availableFrom: r.availableFrom,
        availableUntil: r.availableUntil,
        overlapFrom: overlap.from,
        overlapUntil: overlap.until,
        ...s,
      };
    }

    for (const r of otherRequests) {
      const p = profileByUser.get(r.userId);
      if (!p) continue; // profile filter fail
      const overlap = overlapWindow(myWindow, { from: r.availableFrom, until: r.availableUntil }, now);
      if (!overlap || minutesBetween(overlap) < minOverlap) continue; // kaafi time saath free nahi
      const m = toMatch(r, p, overlap);
      const prev = bestPerPlayer.get(p.userId);
      if (!prev || m.score > prev.score) bestPerPlayer.set(p.userId, m); // ek player ek hi dafa
    }

    const matches = [...bestPerPlayer.values()]
      .sort((a, b) => b.score - a.score || b.overlapMinutes - a.overlapMinutes)
      .slice(0, limit);

    return {
      myRequest: {
        id: myRequest.id,
        preferredSport: myRequest.preferredSport,
        availableFrom: myRequest.availableFrom,
        availableUntil: myRequest.availableUntil,
        budget: myRequest.budget,
      },
      court: court && { ...court, perPlayerSharePKR },
      criteria: { sport: myRequest.preferredSport, city, minOverlapMinutes: minOverlap },
      count: matches.length,
      matches,
    };
  }
}
