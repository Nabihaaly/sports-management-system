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

const SPLIT_INVITATION_MINUTES = 30;
const SPLIT_PAYMENT_MINUTES = 20;

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }

    const selectedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid calendar date');
    }

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

    if (date.substring(0, 4) !== year) {
      throw new BadRequestException(
        `Bookings are only allowed in the current year (${year})`,
      );
    }

    if (date < todayInPakistan) {
      throw new BadRequestException('Past dates cannot be booked');
    }

    return selectedDate;
  }

  // ---------- Common booking conflict condition ----------

  private getActiveBookingCondition(now: Date) {
    const singleHoldCutoff = new Date(
      now.getTime() - HOLD_MINUTES * 60 * 1000,
    );

    return {
      OR: [
        {
          status: 'CONFIRMED' as const,
        },
        {
          status: 'PENDING' as const,
          OR: [
            {
              bookingType: 'SINGLE' as const,
              createdAt: {
                gt: singleHoldCutoff,
              },
            },
            {
              bookingType: 'SPLIT' as const,
              splitStatus: 'INVITING' as const,
              invitationExpiresAt: {
                gt: now,
              },
            },
            {
              bookingType: 'SPLIT' as const,
              splitStatus: 'READY_FOR_PAYMENT' as const,
              paymentExpiresAt: {
                gt: now,
              },
            },
          ],
        },
      ],
    };
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
      sports: [...new Set(courts.map((court) => court.sport))],
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
        venue: {
          select: {
            id: true,
            venueName: true,
          },
        },
        availabilities: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!court) {
      throw new NotFoundException('Court not found');
    }

    const day: WeekDay = DAYS[selectedDate.getUTCDay()];

    const availabilityRows = court.availabilities.filter(
      (availability) => availability.dayOfWeek === day,
    );

    const now = new Date();

    // Find all bookings that currently block this court's slots.
    const bookings = await this.prisma.booking.findMany({
      where: {
        courtId,
        bookingDate: date,
        ...this.getActiveBookingCondition(now),
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const bookedSlots = new Set(
      bookings.map(
        (booking) => `${booking.startTime}|${booking.endTime}`,
      ),
    );

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

  // ---------- 4. Create an ordinary single booking ----------

  async createBooking(
    userId: string,
    body: {
      courtId: string;
      date: string;
      startTime: string;
    },
  ) {
    const { courtId, date, startTime } = body;

    const selectedDate = this.validateBookingDate(date);
    const day: WeekDay = DAYS[selectedDate.getUTCDay()];

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

          const now = new Date();

          const existingBooking =
            await tx.booking.findFirst({
              where: {
                courtId,
                bookingDate: date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                ...this.getActiveBookingCondition(now),
              },
            });

          if (existingBooking) {
            throw new ConflictException(
              'That slot was just taken. Please select another slot.',
            );
          }

          return tx.booking.create({
            data: {
              userId,
              courtId,
              bookingDate: date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              totalPricePKR: court.pricePerSlotPKR,
              status: 'PENDING',
              bookingType: 'SINGLE',
            },
          });
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    } catch (error: unknown) {
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
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isCreator = booking.userId === userId;

    const currentParticipant = booking.participants.find(
      (participant) => participant.userId === userId,
    );

    if (!isCreator && !currentParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this booking.',
      );
    }

    const now = new Date();

    const holdExpiresAt =
      booking.bookingType === 'SINGLE'
        ? new Date(
            booking.createdAt.getTime() +
              HOLD_MINUTES * 60 * 1000,
          )
        : booking.splitStatus === 'INVITING'
          ? booking.invitationExpiresAt
          : booking.paymentExpiresAt;

    return {
      id: booking.id,
      status: booking.status,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPricePKR: booking.totalPricePKR,

      bookingType: booking.bookingType,
      splitStatus: booking.splitStatus,
      invitationExpiresAt: booking.invitationExpiresAt,
      paymentExpiresAt: booking.paymentExpiresAt,
      holdExpiresAt,

      isCreator,
      currentParticipant: currentParticipant
        ? {
            userId: currentParticipant.userId,
            amountPKR: currentParticipant.amountPKR,
            invitationStatus: currentParticipant.invitationStatus,
            paymentStatus: currentParticipant.paymentStatus,
            paidAt: currentParticipant.paidAt,
          }
        : null,

      participants: booking.participants.map((participant) => ({
        userId: participant.userId,
        name: participant.user.name,
        isCreator: participant.isCreator,
        amountPKR: participant.amountPKR,
        invitationStatus: participant.invitationStatus,
        paymentStatus: participant.paymentStatus,
        paidAt: participant.paidAt,
      })),

      courtName: booking.court.courtName,
      sport: booking.court.sport,
      venueName: booking.court.venue.venueName,
      venueId: booking.court.venue.id,
      address: `${booking.court.venue.address}, ${booking.court.venue.city}`,

      isHoldExpired:
        booking.status === 'PENDING' &&
        holdExpiresAt !== null &&
        holdExpiresAt <= now,
    };
  }

  // ---------- 6. Confirm an ordinary single booking ----------

  async confirmBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException();
    }

    if (booking.bookingType === 'SPLIT') {
      throw new BadRequestException(
        'Split bookings must be completed through the split payment process.',
      );
    }

    if (booking.status === 'CONFIRMED') {
      return this.getBooking(userId, bookingId);
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking was cancelled');
    }

    const age = Date.now() - booking.createdAt.getTime();

    if (age >= HOLD_MINUTES * 60 * 1000) {
      throw new BadRequestException(
        'Your hold expired. Please pick the slot again.',
      );
    }

    const updated = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        userId,
        status: 'PENDING',
        bookingType: 'SINGLE',
        createdAt: {
          gt: new Date(Date.now() - HOLD_MINUTES * 60 * 1000),
        },
      },
      data: {
        status: 'CONFIRMED',
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Your booking hold has expired or is no longer active.',
      );
    }

    return this.getBooking(userId, bookingId);
  }

  // ---------- 7. Get all active holds for the logged-in player ----------

  async getHeldBookings(userId: string) {
    const now = new Date();

    const singleHoldCutoff = new Date(
      now.getTime() - HOLD_MINUTES * 60 * 1000,
    );

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'PENDING',
        OR: [
          {
            userId,
          },
          {
            participants: {
              some: {
                userId,
              },
            },
          },
        ],
        AND: [
          {
            OR: [
              {
                bookingType: 'SINGLE',
                createdAt: {
                  gt: singleHoldCutoff,
                },
              },
              {
                bookingType: 'SPLIT',
                splitStatus: 'INVITING',
                invitationExpiresAt: {
                  gt: now,
                },
              },
              {
                bookingType: 'SPLIT',
                splitStatus: 'READY_FOR_PAYMENT',
                paymentExpiresAt: {
                  gt: now,
                },
              },
            ],
          },
        ],
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
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      bookings: bookings.map((booking) => {
        const ownParticipant = booking.participants.find(
          (participant) => participant.userId === userId,
        );

        const holdExpiresAt =
          booking.bookingType === 'SINGLE'
            ? new Date(
                booking.createdAt.getTime() +
                  HOLD_MINUTES * 60 * 1000,
              )
            : booking.splitStatus === 'INVITING'
              ? booking.invitationExpiresAt
              : booking.paymentExpiresAt;

        return {
          id: booking.id,
          bookingDate: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          totalPricePKR: booking.totalPricePKR,
          createdAt: booking.createdAt,

          bookingType: booking.bookingType,
          splitStatus: booking.splitStatus,
          invitationExpiresAt: booking.invitationExpiresAt,
          paymentExpiresAt: booking.paymentExpiresAt,
          holdExpiresAt,

          isCreator: booking.userId === userId,
          currentParticipant: ownParticipant
            ? {
                amountPKR: ownParticipant.amountPKR,
                invitationStatus: ownParticipant.invitationStatus,
                paymentStatus: ownParticipant.paymentStatus,
              }
            : null,

          participants: booking.participants.map((participant) => ({
            userId: participant.userId,
            name: participant.user.name,
            isCreator: participant.isCreator,
            amountPKR: participant.amountPKR,
            invitationStatus: participant.invitationStatus,
            paymentStatus: participant.paymentStatus,
          })),

          courtName: booking.court.courtName,
          sport: booking.court.sport,
          venueName: booking.court.venue.venueName,
          venueId: booking.court.venue.id,
          address: `${booking.court.venue.address}, ${booking.court.venue.city}`,
        };
      }),
    };
  }

  // ---------- 8. Create split booking and send invitations ----------

  async createSplitBooking(
    userId: string,
    body: {
      courtId: string;
      date: string;
      startTime: string;
      invitedUserIds: string[];
    },
  ) {
    const { courtId, date, startTime } = body;

    const invitedUserIds = [
      ...new Set(body.invitedUserIds || []),
    ];

    if (invitedUserIds.length === 0) {
      throw new BadRequestException(
        'Please select at least one friend.',
      );
    }

    if (invitedUserIds.includes(userId)) {
      throw new BadRequestException('You cannot invite yourself.');
    }

    const selectedDate = this.validateBookingDate(date);
    const day: WeekDay = DAYS[selectedDate.getUTCDay()];

    const friendships = await this.prisma.friend.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          {
            senderId: userId,
            receiverId: { in: invitedUserIds },
          },
          {
            receiverId: userId,
            senderId: { in: invitedUserIds },
          },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    const acceptedFriendIds = new Set(
      friendships.map((friendship) =>
        friendship.senderId === userId
          ? friendship.receiverId
          : friendship.senderId,
      ),
    );

    const invalidFriends = invitedUserIds.filter(
      (id) => !acceptedFriendIds.has(id),
    );

    if (invalidFriends.length > 0) {
      throw new BadRequestException(
        'One or more selected players are not your accepted friends.',
      );
    }

    const now = new Date();

    const invitationExpiresAt = new Date(
      now.getTime() +
        SPLIT_INVITATION_MINUTES * 60 * 1000,
    );

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
              'That slot is not available for this court and day.',
            );
          }

          const currentTime = new Date();

          const existingBooking =
            await tx.booking.findFirst({
              where: {
                courtId,
                bookingDate: date,
                startTime: slot.startTime,
                endTime: slot.endTime,
                ...this.getActiveBookingCondition(currentTime),
              },
            });

          if (existingBooking) {
            throw new ConflictException(
              'That slot was just taken. Please select another slot.',
            );
          }

          const participantCount = invitedUserIds.length + 1;

          const baseShare = Math.floor(
            court.pricePerSlotPKR / participantCount,
          );

          const creatorShare =
            court.pricePerSlotPKR -
            baseShare * invitedUserIds.length;

          const booking = await tx.booking.create({
            data: {
              userId,
              courtId,
              bookingDate: date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              totalPricePKR: court.pricePerSlotPKR,
              status: 'PENDING',

              bookingType: 'SPLIT',
              splitStatus: 'INVITING',
              invitationExpiresAt,
              paymentExpiresAt: null,

              participants: {
                create: [
                  {
                    userId,
                    isCreator: true,
                    invitationStatus: 'ACCEPTED',
                    amountPKR: creatorShare,
                    paymentStatus: 'PENDING',
                  },
                  ...invitedUserIds.map((invitedUserId) => ({
                    userId: invitedUserId,
                    isCreator: false,
                    invitationStatus: 'PENDING' as const,
                    amountPKR: baseShare,
                    paymentStatus: 'PENDING' as const,
                  })),
                ],
              },
            },
            include: {
              participants: true,
            },
          });

          return {
            message: 'Split booking invitations sent successfully.',
            booking,
            invitationExpiresAt,
          };
        },
        {
          isolationLevel: 'Serializable',
        },
      );
    } catch (error: unknown) {
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

  // ---------- 9. Check and expire a split booking ----------

  private async expireSplitBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.status !== 'PENDING') {
      return;
    }

    const now = new Date();

    const invitationExpired =
      booking.bookingType === 'SPLIT' &&
      booking.splitStatus === 'INVITING' &&
      booking.invitationExpiresAt !== null &&
      booking.invitationExpiresAt <= now;

    const paymentExpired =
      booking.bookingType === 'SPLIT' &&
      booking.splitStatus === 'READY_FOR_PAYMENT' &&
      booking.paymentExpiresAt !== null &&
      booking.paymentExpiresAt <= now;

    if (!invitationExpired && !paymentExpired) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.booking.updateMany({
        where: {
          id: bookingId,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      }),
      this.prisma.bookingParticipant.updateMany({
        where: {
          bookingId,
          invitationStatus: 'PENDING',
        },
        data: {
          invitationStatus: 'EXPIRED',
        },
      }),
    ]);
  }

  // ---------- 10. Get invitations received by a player ----------

  async getSplitInvitations(userId: string) {
    const pending = await this.prisma.bookingParticipant.findMany({
      where: {
        userId,
        invitationStatus: 'PENDING',
        booking: {
          status: 'PENDING',
          bookingType: 'SPLIT',
          splitStatus: 'INVITING',
        },
      },
      select: {
        bookingId: true,
      },
    });

    for (const item of pending) {
      await this.expireSplitBooking(item.bookingId);
    }

    const invitations =
      await this.prisma.bookingParticipant.findMany({
        where: {
          userId,
          invitationStatus: 'PENDING',
          booking: {
            status: 'PENDING',
            bookingType: 'SPLIT',
            splitStatus: 'INVITING',
            invitationExpiresAt: {
              gt: new Date(),
            },
          },
        },
        include: {
          booking: {
            include: {
              court: {
                include: {
                  venue: {
                    select: {
                      venueName: true,
                      address: true,
                      city: true,
                    },
                  },
                },
              },
              user: {
                select: {
                  name: true,
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
      invitations: invitations.map((participant) => ({
        bookingId: participant.bookingId,
        amountPKR: participant.amountPKR,
        invitationExpiresAt:
          participant.booking.invitationExpiresAt,
        creatorName: participant.booking.user.name,
        bookingDate: participant.booking.bookingDate,
        startTime: participant.booking.startTime,
        endTime: participant.booking.endTime,
        courtName: participant.booking.court.courtName,
        venueName: participant.booking.court.venue.venueName,
        address: participant.booking.court.venue.address,
        city: participant.booking.court.venue.city,
      })),
    };
  }

  // ---------- 11. Accept invitation ----------

  async acceptSplitInvitation(
    userId: string,
    bookingId: string,
  ) {
    await this.expireSplitBooking(bookingId);

    return this.prisma.$transaction(
      async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId },
        });

        if (
          !booking ||
          booking.status !== 'PENDING' ||
          booking.bookingType !== 'SPLIT' ||
          booking.splitStatus !== 'INVITING'
        ) {
          throw new BadRequestException(
            'This split invitation is no longer active.',
          );
        }

        if (
          !booking.invitationExpiresAt ||
          booking.invitationExpiresAt <= new Date()
        ) {
          throw new BadRequestException(
            'The invitation period has expired.',
          );
        }

        const participant =
          await tx.bookingParticipant.findUnique({
            where: {
              bookingId_userId: {
                bookingId,
                userId,
              },
            },
          });

        if (!participant || participant.isCreator) {
          throw new ForbiddenException(
            'You are not invited to this booking.',
          );
        }

        if (participant.invitationStatus !== 'PENDING') {
          throw new BadRequestException(
            'You have already responded to this invitation.',
          );
        }

        await tx.bookingParticipant.update({
          where: { id: participant.id },
          data: {
            invitationStatus: 'ACCEPTED',
          },
        });

        const pendingCount =
          await tx.bookingParticipant.count({
            where: {
              bookingId,
              invitationStatus: 'PENDING',
            },
          });

        if (pendingCount === 0) {
          const paymentExpiresAt = new Date(
            Date.now() +
              SPLIT_PAYMENT_MINUTES * 60 * 1000,
          );

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              splitStatus: 'READY_FOR_PAYMENT',
              paymentExpiresAt,
            },
          });

          return {
            message:
              'Everyone accepted. The 20-minute payment period has started.',
            splitStatus: 'READY_FOR_PAYMENT',
            paymentExpiresAt,
          };
        }

        return {
          message: 'Invitation accepted successfully.',
          splitStatus: 'INVITING',
          pendingInvitations: pendingCount,
        };
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  // ---------- 12. Decline invitation and cancel entire booking ----------

  async declineSplitInvitation(
    userId: string,
    bookingId: string,
  ) {
    await this.expireSplitBooking(bookingId);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (
        !booking ||
        booking.status !== 'PENDING' ||
        booking.bookingType !== 'SPLIT' ||
        booking.splitStatus !== 'INVITING'
      ) {
        throw new BadRequestException(
          'This split invitation is no longer active.',
        );
      }

      const participant =
        await tx.bookingParticipant.findUnique({
          where: {
            bookingId_userId: {
              bookingId,
              userId,
            },
          },
        });

      if (!participant || participant.isCreator) {
        throw new ForbiddenException(
          'You are not invited to this booking.',
        );
      }

      if (participant.invitationStatus !== 'PENDING') {
        throw new BadRequestException(
          'You have already responded to this invitation.',
        );
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Mark the person who declined as DECLINED.
      await tx.bookingParticipant.update({
        where: { id: participant.id },
        data: {
          invitationStatus: 'DECLINED',
        },
      });

      // Other unanswered invitations are cancelled.
      await tx.bookingParticipant.updateMany({
        where: {
          bookingId,
          invitationStatus: 'PENDING',
        },
        data: {
          invitationStatus: 'CANCELLED',
        },
      });

      return {
        message:
          'You declined the invitation. The entire split booking has been cancelled.',
      };
    });
  }

  // ---------- 13. Confirm individual participant payment ----------

  async confirmSplitPayment(
    userId: string,
    bookingId: string,
  ) {
    await this.expireSplitBooking(bookingId);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (
        !booking ||
        booking.status !== 'PENDING' ||
        booking.bookingType !== 'SPLIT' ||
        booking.splitStatus !== 'READY_FOR_PAYMENT'
      ) {
        throw new BadRequestException(
          'This booking is not ready for split payment.',
        );
      }

      if (
        !booking.paymentExpiresAt ||
        booking.paymentExpiresAt <= new Date()
      ) {
        throw new BadRequestException(
          'The 20-minute payment period has expired.',
        );
      }

      const participant =
        await tx.bookingParticipant.findUnique({
          where: {
            bookingId_userId: {
              bookingId,
              userId,
            },
          },
        });

      if (
        !participant ||
        participant.invitationStatus !== 'ACCEPTED'
      ) {
        throw new ForbiddenException(
          'You are not an accepted participant in this booking.',
        );
      }

      if (participant.paymentStatus === 'PAID') {
        return {
          message: 'Your share has already been recorded as paid.',
        };
      }

      await tx.bookingParticipant.update({
        where: { id: participant.id },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      const unpaidCount =
        await tx.bookingParticipant.count({
          where: {
            bookingId,
            invitationStatus: 'ACCEPTED',
            paymentStatus: 'PENDING',
          },
        });

      if (unpaidCount === 0) {
        await tx.booking.updateMany({
          where: {
            id: bookingId,
            status: 'PENDING',
            bookingType: 'SPLIT',
            splitStatus: 'READY_FOR_PAYMENT',
          },
          data: {
            status: 'CONFIRMED',
          },
        });

        return {
          message: 'Everyone has paid. Booking confirmed.',
          status: 'CONFIRMED',
        };
      }

      return {
        message: 'Your share has been recorded.',
        remainingPayments: unpaidCount,
      };
    });
  }
}