
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, profileId: string) {
    // Find the receiver's User ID using their PlayerProfile ID.
    const receiverProfile = await this.prisma.playerProfile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    });

    if (!receiverProfile) {
      throw new NotFoundException('Player not found.');
    }

    const receiverId = receiverProfile.userId;

    // A player cannot send a friend request to themselves.
    if (senderId === receiverId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself.',
      );
    }

    // Check both directions to prevent duplicate requests.
    const existingFriend = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existingFriend) {
      if (existingFriend.status === 'ACCEPTED') {
        throw new ConflictException('You are already friends.');
      }

      if (existingFriend.senderId === senderId) {
        throw new ConflictException('Friend request already sent.');
      }

      throw new ConflictException(
        'This player has already sent you a friend request.',
      );
    }

    // Create a new pending friend request.
    const friend = await this.prisma.friend.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });

    return {
      message: 'Friend request sent successfully.',
      friend,
    };
  }

  async getReceivedRequests(userId: string) {
  const requests = await this.prisma.friend.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING',
    },
    select: {
      id: true,
      senderId: true,
      createdAt: true,
      sender: {
        select: {
          name: true,
          playerProfile: {
            select: {
              displayName: true,
              profilePicture: true,
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

  return { requests };
}

async acceptFriendRequest(userId: string, requestId: string) {
  // Only the receiver can accept their incoming request.
  const result = await this.prisma.friend.updateMany({
    where: {
      id: requestId,
      receiverId: userId,
      status: 'PENDING',
    },
    data: {
      status: 'ACCEPTED',
    },
  });

  if (result.count === 0) {
    throw new NotFoundException(
      'Friend request not found or it has already been handled.',
    );
  }

  return {
    message: 'Friend request accepted successfully.',
  };
}

async declineFriendRequest(userId: string, requestId: string) {
  // Only the receiver can decline their incoming request.
  const result = await this.prisma.friend.deleteMany({
    where: {
      id: requestId,
      receiverId: userId,
      status: 'PENDING',
    },
  });

  if (result.count === 0) {
    throw new NotFoundException(
      'Friend request not found or it has already been handled.',
    );
  }

  return {
    message: 'Friend request declined successfully.',
  };
}
}

