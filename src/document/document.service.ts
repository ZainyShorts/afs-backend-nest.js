import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './schema/document.schema';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name) private readonly documentModel: Model<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    try {
      const createdDocument = new this.documentModel(createDocumentDto);
      return await createdDocument.save();
    } catch (error) {
      throw new Error('Error creating document: ' + error.message);
    }
  }

  async find(
    refId: string,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    title?: string,
  ): Promise<{
    data: Document[];
    totalCount: number;
    totalPages: number;
    pageNumber: number;
  }> {
    try {
      const query: any = { refId };

      // If 'tags' is provided, use regex to search tags
      if (title) {
        query.title = { $regex: new RegExp(title, 'i') }; // 'i' for case-insensitive search
      }

      // Set up sorting direction
      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      // Count total matching documents
      const totalCount = await this.documentModel.countDocuments(query);

      // Find documents with pagination, sorting, and filtering
      const data = await this.documentModel
        .find(query)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit) // Pagination: skip documents based on page
        .limit(limit) // Limit the number of documents per page
        .exec();

      return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageNumber: page,
      };
    } catch (error) {
      throw new Error('Error retrieving document: ' + error.message);
    }
  }

  async remove(id: string): Promise<Document> {
    try {
      const deletedDocument = await this.documentModel
        .findByIdAndDelete(id)
        .exec();

      if (!deletedDocument) {
        throw new NotFoundException(`Document with id ${id} not found`);
      }

      return deletedDocument;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw the NotFoundException
      }
      throw new Error('Error deleting document: ' + error.message);
    }
  }
}
