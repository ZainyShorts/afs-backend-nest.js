import { Controller, HttpException, HttpStatus, Req, Headers, Post, Res, Body, Get, Query, Delete, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Agent } from './schema/agent.schema';
import { ResponseDto } from 'src/dto/response.dto';

@Controller('agent')
export class AgentController {

    constructor(private readonly AgentService:AgentService){}


    @Post()
    async createAgent(@Body() agent:Agent):Promise<ResponseDto> {
        return this.AgentService.createAgent(agent)
    }

    @Delete(":_id")
    async deleteAgent(@Param() _id:string):Promise<ResponseDto> {
        return this.AgentService.deleteAgent(_id)
    }

    @Get('courseTopicStatusUpdate')
    async courseTopicStatusUpdate(@Query() data:{docId:string,status:string,courseId:string,topicId:string}):Promise<ResponseDto>{
      const { docId, status, courseId, topicId } = data
      return this.AgentService.courseTopicStatusUpdate(docId, status, courseId, topicId )
    }

    @Get('courseTopicCompleteStatus')
    async courseTopicCompleteStatus(@Query() data:{status:boolean,courseId:string,docId}):Promise<ResponseDto>{
      const { status, courseId, docId } = data
      return this.AgentService.courseTopicCompleteStatus(status, courseId, docId)
    }

    // @Get(':_id')
    // async getAgentAndCourseById(@Param() _id:string):Promise<ResponseDto>{
    //   return this.AgentService.getAgentAndCourseById(_id)
    // }
}
