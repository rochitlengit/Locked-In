import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateChannelDto, SendMessageDto } from './dto';
import { ChatGateway } from './chat.gateway';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService, private gateway: ChatGateway) {}

  @Post('channels')
  createChannel(@CurrentUser() user: any, @Body() dto: CreateChannelDto) {
    return this.chat.createChannel(user.id, dto);
  }

  @Get('channels')
  myChannels(@CurrentUser() user: any) {
    return this.chat.myChannels(user.id);
  }

  @Get('channels/:id/messages')
  messages(@Param('id') id: string) {
    return this.chat.messages(id);
  }

  @Post('channels/:id/messages')
  async send(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    const message = await this.chat.sendMessage(id, user.id, dto);
    this.gateway.broadcastMessage(id, message);
    return message;
  }
}
