import { Module } from '@nestjs/common';
import { AwsController } from './aws.controller';
import { AwsService } from './aws.service';
import * as AWS from 'aws-sdk';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule],
  controllers: [AwsController],
  providers:[AwsService],
  exports:[AwsService]
})
export class AwsModule {}


 