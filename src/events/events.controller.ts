import { Controller, Post, Body } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Controller('events')
export class EventsController {
  constructor(private eventsGateway: EventsGateway) {}

  @Post('message')
  sendMessage(@Body() data: { room: string; message: string }) {
    this.eventsGateway.server.to(data.room).emit('msgFromServer', data.message);
  }
}
