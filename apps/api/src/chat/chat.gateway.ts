import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_channel')
  handleJoin(@MessageBody() channelId: string, @ConnectedSocket() client: Socket) {
    client.join(`channel:${channelId}`);
  }

  @SubscribeMessage('leave_channel')
  handleLeave(@MessageBody() channelId: string, @ConnectedSocket() client: Socket) {
    client.leave(`channel:${channelId}`);
  }

  broadcastMessage(channelId: string, message: any) {
    this.server.to(`channel:${channelId}`).emit('new_message', message);
  }
}
