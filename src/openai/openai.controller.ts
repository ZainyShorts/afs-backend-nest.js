import { Body, ConsoleLogger, Controller, Delete, Get, Header, NotFoundException, Param, Post, Query, Res, Sse, UploadedFile, UseInterceptors } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { ResponseDto } from '../dto/response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions, UploadedFileType } from 'utils/multer/multer.config';
import { ASSISTANT } from './enum/Assistant.enum';
import { map, Observable } from 'rxjs';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs'
@Controller('openai')
export class OpenaiController {

    constructor(private readonly openaiService:OpenaiService){}


    @Post('createAssistant')
    async createAssistant(@Body() data:any):Promise<ResponseDto>{
        const { role, name} = data;
        return this.openaiService.createAssistant(role,name)
    }

    @Get('assistantList')
    async assistantList():Promise<ResponseDto>{
        return this.openaiService.assistantList()
    }

    @Delete('deleteAssistant/:assistantId')
    async deleteAssistant(@Param('assistantId') assistantId: string):Promise<ResponseDto>{
        return this.openaiService.deleteAssistant(assistantId)
    }

    @Get('createThread')
    async createThread():Promise<ResponseDto>{
        return this.openaiService.createThread()
    }

    @Delete('deleteThread/:threadId')
    async deleteThread(@Param('threadId') threadId: string):Promise<ResponseDto>{
        return this.openaiService.deleteThread(threadId)
    }

    @Post('createMessage')
    async createMessage(@Body() body:any):Promise<ResponseDto>{
        const { message , threadId } = body
        return this.openaiService.createMessage(message,threadId)
    }

    
    @Get('messagesList')
    async messagesList(@Query() query:any):Promise<ResponseDto>{
        const { threadId } = query
        return this.openaiService.messagesList(threadId)
    }

    @Post('createRun')
    async createRun(@Body() body:any):Promise<ResponseDto>{
        const { agent, type , threadId } = body
        return this.openaiService.createRun(agent, type,threadId)
    }

    @Get('cancelRun')
    async cancelRun(@Query() query:any):Promise<ResponseDto>{
        const { runId , threadId } = query
        return this.openaiService.cancelRun(runId,threadId)
    }

    @Get('runStatus')
    async runStatus(@Query() query:any):Promise<ResponseDto>{
        const { runId , threadId } = query
        return this.openaiService.runStatus(runId,threadId)
    }


    // startNewQuiz ------------------------------------------------
    @Post('startNewQuiz')
    async startNewQuiz(@Body() data:any):Promise<ResponseDto>{
        const { subject,difficulty,totalQuestions,subBranch,topic,level,usState } = data
       
        return this.openaiService.startNewQuiz(subject,difficulty,totalQuestions,subBranch,topic,level,usState)
    }

    @Post('speechToText')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    async speechToText(@UploadedFile() file: UploadedFileType):Promise<ResponseDto>{
        return this.openaiService.speechToText(file.path)
    }

    @Post('imageToText')
    async imageToText(@Body() data:{url:string[],userPrompt:string}):Promise<ResponseDto>{
        const { url , userPrompt } =  data;
        return this.openaiService.imageToText(url, userPrompt)
    }

    @Post("completion")
    async chatCompletion(
        @Body() body: { assistantType: string; subType: string, userPrompt: string, token:number}
    ) {
        return this.openaiService.chatCompletion(body.assistantType as keyof typeof ASSISTANT, body.subType,body.userPrompt,body.token);
    }

    


    @Post("stream")
    @Sse("stream") 
    async streamChat(@Body() body: { assistantType: keyof typeof ASSISTANT; subType: string; userPrompt: string; token: number }): Promise<Observable<any>> {
        const { assistantType, subType, userPrompt, token } = body;
        const observable = await this.openaiService.streamChatCompletion(assistantType, subType, userPrompt, token);

        return observable.pipe(
            map((tokenText) => ({
                data: tokenText, // Stream each token separately
            }))
        );
    }

    @Post("streamImgToText")
    @Sse("stream") 
    async streamImageToText(@Body() body:{url:string[],userPrompt:string, token:number}): Promise<Observable<any>> {
        const { url , userPrompt, token } =  body;

        const observable = await this.openaiService.streamImageToText(url, userPrompt, token );

        return observable.pipe(
            map((tokenText) => ({
                data: tokenText, // Stream each token separately
            }))
        );
    }

    @Post('test')
    async generateCourseOutline(@Body() data:any):Promise<any>{
        console.log('hit')
        return this.openaiService.generateCourseOutline(data.subjectName,data.difficult,data.educationLevel,data.course)
        
    }


    @Get('tts/:inputText:/userId')
    async getSpeech(
        @Res() res: Response,
        @Param('inputText') inputText: string,
        @Param('userId') userId: string){
      
        
        try {
            console.log(inputText)
            const dto = await this.openaiService.tts(inputText,userId);
      
            const { stream , size , filPath } = dto.data

            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Length', size);
            stream.pipe(res);
            
            stream.on('end', () => {
                fs.unlink(filPath, (err) => {
                if (err) console.error(err);
                });
            });

            stream.on('error', (err) => {
                console.error('Stream error:', err);
                res.status(500).json({ error: 'File streaming error' });
            });

            // Handle any stream errors
            stream.on('error', (err) => {
                console.error('Stream error:', err);
                res.status(500).json({ error: 'File streaming error' });
            });
            
          } catch (error) {
            throw new NotFoundException(error.message);
          }
    }


    
}
