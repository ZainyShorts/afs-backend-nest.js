import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubDevelopment,
  SubDevelopmentSchema,
} from './schema/subdevelopment.schema';
import { SubDevelopmentController } from './subdevelopment.controller';
import { SubDevelopmentService } from './subdevelopment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
    ]),
  ],
  controllers: [SubDevelopmentController],
  providers: [SubDevelopmentService],
})
export class SubDevelopmentModule {}
