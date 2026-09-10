import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, SendMessageDto } from './dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChannel(creatorId: string, dto: CreateChannelDto) {
    const memberIds = Array.from(new Set([...(dto.memberIds || []), creatorId]));
    return this.prisma.channel.create({
      data: {
        name: dto.name,
        teamId: dto.teamId,
        isDM: dto.isDM || false,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
      include: { members: { include: { user: true } } },
    });
  }

  myChannels(userId: string) {
    return this.prisma.channel.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendMessage(channelId: string, senderId: string, dto: SendMessageDto) {
    return this.prisma.message.create({
      data: { channelId, senderId, content: dto.content },
      include: { sender: true },
    });
  }

  messages(channelId: string) {
    return this.prisma.message.findMany({
      where: { channelId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  isMember(channelId: string, userId: string) {
    return this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
  }
}
