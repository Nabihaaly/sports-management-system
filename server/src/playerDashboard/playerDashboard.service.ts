
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { WeekDay } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DAYS: WeekDay[] = [
  WeekDay.SUNDAY,
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

const HOLD_MINUTES = 10;
const TIME_ZONE = 'Asia/Karachi';

@Injectable()
export class playerDashboardService {
  constructor(private prisma: PrismaService) {}

  // ---------- 0. Player dashboard ----------

  async getData() {
    return {
      message: 'Player dashboard API is working',
    };
  }

  // ---------- Common date validation ----------

  private validateBookingDate(date: string) {
    // Validate YYYY-MM-DD format.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      throw new BadRequestException(
        'date must be YYYY-MM-DD',
      );
    }

    // Reject invalid calendar dates such as 2026-02-31.
    const selectedDate = new Date(
      `${date}T00:00:00.000Z`,
    );

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException(
        'Invalid calendar date',
      );
    }

    // Get today's date according to Pakistan time.
    const dateParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const year = dateParts.find(
      (part) => part.type === 'year',
    )!.value;

    const month = dateParts.find(
      (part) => part.type === 'month',
    )!.value;

    const day = dateParts.find(
      (part) => part.type === 'day',
    )!.value;

    const todayInPakistan = `${year}-${month}-${day}`;

    // Only allow bookings in the current Pakistan calendar year.
    if (date.substring(0, 4) !== year) {
      throw new BadRequestException(
        `Bookings are only allowed in the current year (${year})`,
      );
    }

    // Reject past dates. Today is allowed.
    if (date < todayInPakistan) {
      throw new BadRequestException(
        'Past dates cannot be booked',
      );
    }

    return selectedDate;
  }

  // ---------- 1. All venues ----------

  async getVenues() {
    const venues =
      await this.prisma.venueApplicationDetails.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
        },
        select: {
          id: true,
          venueName: true,
          address: true,
          city: true,
          images: true,
          courtsPriceRange: true,
          courts: {
            where: { isActive: true },
            select: { sport: true },
          },
        },
      });

    return venues.map(({ courts, ...venue }) => ({
      ...venue,
      courtCount: courts.length,
      sports: [
        ...new Set(courts.map((court) => court.sport)),
      ],
    }));
  }

  // ---------- 2. One venue + its courts ----------

  async getVenue(venueId: string) {
    const venue =
      await this.prisma.venueApplicationDetails.findFirst({
        where: {
          id: venueId,
          status: 'APPROVED',
          isActive: true,
        },
        select: {
          id: true,
          venueName: true,
          description: true,
          address: true,
          city: true,
          images: true,
          sizeOfVenue: true,
          courtsPriceRange: true,
          courts: {
            where: { isActive: true },
          },
        },
      });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    return venue;
  }

  // ---------- 2b. One court with active availability ----------

  async getCourt(courtId: string) {
    const court = await this.prisma.court.findFirst({
      where: {
        id: courtId,
        isActive: true,
        venue: {
          status: 'APPROVED',
          isActive: true,
        },
      },
      include: {
        venue: {
          select: {
            id: true,
            venueName: true,
            address: true,
            city: true,
            status: true,
            isActive: true,
          },
        },
        availabilities: {
          where: {
            isActive: true,
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
      },
    });

    if (!court) {
      throw new NotFoundException('Court not found');
    }

    return court;
  }

  // ---------- 3. Exact availability rows for a selected date ----------

  async getSlots(courtId: string, date: string) {
    // Validate date, year and past-date restrictions.
    const selectedDate = this.validateBookingDate(date);

    const court = await this.prisma.court.findFirst({
      where: {
        id: courtId,
        isActive: true,
        venue: {
          status: 'APPROVED',
          isActive: true,
        },
      },
      include: {
        venue: true,
        availabilities: {
          where: {
            isActive: true,
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });

    if (!court) {
      throw new NotFoundException('Court not found');
    }

    // Get weekday of the selected date.
    // UTC is used because the input is a date-only string.
    const day: WeekDay = DAYS[selectedDate.getUTCDay()];

    // Each active database availability row is one exact slot.
    const availabilityRows = court.availabilities.filter(
      (availability) => availability.dayOfWeek === day,
    );

    // Find confirmed bookings and pending bookings
    // whose 10-minute hold has not expired.
    const holdCutoff = new Date(
      Date.now() - HOLD_MINUTES * 60 * 1000,
    );

    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: date,
        OR: [
          {
            status: 'CONFIRMED',
          },
          {
            status: 'PENDING',
            createdAt: {
              gt: holdCutoff,
            },
          },
        ],
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Compare both startTime and endTime.
    const bookedSlots = new Set(
      bookings.map(
        (booking) =>
          `${booking.startTime}|${booking.endTime}`,
      ),
    );

    // Return each exact database availability row.
    const slots = availabilityRows.map((availability) => ({
      id: availability.id,
      startTime: availability.startTime,
      endTime: availability.endTime,
      status: bookedSlots.has(
        `${availability.startTime}|${availability.endTime}`,
      )
        ? 'BOOKED'
        : 'AVAILABLE',
    }));

    return {
      court: {
        id: court.id,
        courtName: court.courtName,
        sport: court.sport,
        pricePerSlotPKR: court.pricePerSlotPKR,
        venueId: court.venue.id,
        venueName: court.venue.venueName,
      },
      slots,
    };
  }

  // ---------- 4. Player selects a slot -> create booking ----------

  async createBooking(
    userId: string,
    body: {
      courtId: string;
      date: string;
      startTime: string;
    },
  ) {
    const { courtId, date, startTime } = body;

    // Validate date before doing anything else.
    const selectedDate = this.validateBookingDate(date);

    const day: WeekDay = DAYS[selectedDate.getUTCDay()];

    // Use a serializable transaction to reduce the risk of
    // two players booking the same slot simultaneously.
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const court = await tx.court.findFirst({
            where: {
              id: courtId,
              isActive: true,
              venue: {
                status: 'APPROVED',
                isActive: true,
              },
            },
          });

          if (!court) {
            throw new NotFoundException('Court not found');
          }

          // Find the exact active availability row.
          const slot = await tx.courtAvailability.findFirst({
            where: {
              courtId,
              dayOfWeek: day,
              startTime,
              isActive: true,
            },
          });

          if (!slot) {
            throw new BadRequestException(
              'That slot does not exist for this court and day',
            );
          }

          const holdCutoff = new Date(
            Date.now() - HOLD_MINUTES * 60 * 1000,
          );

          // Check whether this exact slot is already booked
          // or currently held by another player.
          const existingBooking =
            await tx.booking.findFirst({
              where: {
                courtId,
                bookingDate: date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                OR: [
                  {
                    status: 'CONFIRMED',
                  },
                  {
                    status: 'PENDING',
                    createdAt: {
                      gt: holdCutoff,
                    },
                  },
                ],
              },
            });

          if (existingBooking) {
            throw new ConflictException(
              'That slot was just taken. Please select another slot.',
            );
          }

          // Create a temporary PENDING booking.
          // The 10-minute hold starts from createdAt.
          return tx.booking.create({
            data: {
              userId,
              courtId,
              bookingDate: date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              totalPricePKR: court.pricePerSlotPKR,
              status: 'PENDING',
            },
          });
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    } catch (error: unknown) {
      // PostgreSQL serializable transactions can reject
      // conflicting simultaneous transactions.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'This slot is being booked by another player. Please try again.',
        );
      }

      throw error;
    }
  }

  // ---------- 5. Checkout page data ----------

  async getBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        court: {
          include: {
            venue: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException();
    }

    return {
      id: booking.id,
      status: booking.status,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPricePKR: booking.totalPricePKR,
      courtName: booking.court.courtName,
      sport: booking.court.sport,
      venueName: booking.court.venue.venueName,
      venueId: booking.court.venue.id,
      address: `${booking.court.venue.address}, ${booking.court.venue.city}`,
    };
  }

  // ---------- 6. Confirm booking on checkout ----------

  async confirmBooking(
    userId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException();
    }

    if (booking.status === 'CONFIRMED') {
      return this.getBooking(userId, bookingId);
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException(
        'Booking was cancelled',
      );
    }

    // Check that the 10-minute hold has not expired.
    const age = Date.now() - booking.createdAt.getTime();

    if (age >= HOLD_MINUTES * 60 * 1000) {
      throw new BadRequestException(
        'Your hold expired. Please pick the slot again.',
      );
    }

    // Confirm the booking without a payment method.
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
      },
    });

    return this.getBooking(userId, bookingId);
  }

  // ---------- Get all active holds of the logged-in player ----------

async getHeldBookings(userId: string) {
  const holdCutoff = new Date(
    Date.now() - HOLD_MINUTES * 60 * 1000,
  );

  const bookings = await this.prisma.booking.findMany({
    where: {
      userId,
      status: 'PENDING',
      createdAt: {
        gt: holdCutoff,
      },
    },
    include: {
      court: {
        include: {
          venue: {
            select: {
              id: true,
              venueName: true,
              address: true,
              city: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    bookings: bookings.map((booking) => ({
      id: booking.id,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPricePKR: booking.totalPricePKR,
      createdAt: booking.createdAt,
      holdExpiresAt: new Date(
        booking.createdAt.getTime() +
          HOLD_MINUTES * 60 * 1000,
      ),
      courtName: booking.court.courtName,
      sport: booking.court.sport,
      venueName: booking.court.venue.venueName,
      venueId: booking.court.venue.id,
      address: `${booking.court.venue.address}, ${booking.court.venue.city}`,
    })),
  };
}
}
