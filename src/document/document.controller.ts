import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document as MongooseDocument } from 'mongoose'; // Import the Mongoose Document type

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('attachDocument')
  create(
    @Body() createDocumentDto: CreateDocumentDto,
  ): Promise<MongooseDocument> {
    return this.documentService.create(createDocumentDto);
  }

  @Get('byRefId/:id')
  async find(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query('title') title?: string, // Optional tag search parameter (comma-separated)
  ): Promise<any> {
    return this.documentService.find(id, page, limit, sortBy, sortOrder, title);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<MongooseDocument> {
    return this.documentService.remove(id);
  }
}
