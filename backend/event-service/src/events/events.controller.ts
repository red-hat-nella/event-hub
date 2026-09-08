import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { InternalTokenGuard } from '../common/internal-token.guard';

/** contracts/event-service.md — base path `/internal`, protegido por `X-Internal-Token`. */
@Controller('internal/events')
@UseGuards(InternalTokenGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findMany(@Query() query: QueryEventsDto) {
    return this.eventsService.findMany(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.eventsService.remove(id);
  }

  @Post(':id/reserve')
  @HttpCode(HttpStatus.OK)
  reserve(@Param('id') id: string) {
    return this.eventsService.reserve(id);
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  release(@Param('id') id: string) {
    return this.eventsService.release(id);
  }
}
