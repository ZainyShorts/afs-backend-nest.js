import { Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AwsService } from './aws.service';
import { multerOptions, UploadedFileType } from '../../utils/multer/multer.config';

@Controller('aws')
export class AwsController {


    constructor(private readonly awsService:AwsService){}


    @Delete(":key")
    async deleteFile(@Param() param:{key:string}){
        return this.awsService.deleteFile(param.key)
    }

    @Get('signed-url')
    async getSignedUrl(
        @Query('fileName') filename: string,
        @Query('contentType') contentType: string,
    ) {
        console.log('hit')
        return this.awsService.generateSignedUrl(filename, contentType);
    }
}