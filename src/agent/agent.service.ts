import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Agent } from './schema/agent.schema';
import mongoose, { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { generateMongoIdFormat } from 'utils/mongoId/deScopeIdForrmater';
import { ResponseDto } from 'src/dto/response.dto';
import { HttpStatusCode } from 'axios';
import { OpenaiService } from 'src/openai/openai.service';

@Injectable()
export class AgentService {
    private stripe: Stripe;
    
    constructor(
        @InjectModel(Agent.name) private AgentModel:Model<Agent>,
        private readonly OpenaiSevice:OpenaiService
         ){
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
          }
      
          this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2022-11-15',
          } as any);
    }



    async getCustomAgents(userId:string):Promise<Agent[]>{
      try{
        return await this.AgentModel.find({deScopeId:new Types.ObjectId(generateMongoIdFormat(userId))})
      }catch(e){
        return []
      }
    }

    async deleteAgent(_id:string):Promise<ResponseDto>{
      try{
        console.log(_id)
         await this.AgentModel.findByIdAndDelete(_id)
         return {
          success:true,
          statusCode:HttpStatusCode.Ok
         }
      }catch(e){
        return {
          success:false,
          statusCode:HttpStatusCode.InternalServerError
         }
      }
    }


    async createAgent(agent:any):Promise<ResponseDto>{
      try{
        let textData:string = ""
        if(agent.coursetype === "File"){
           const response = await this.OpenaiSevice.imageToText([agent.course],"Extract Image Data")
           textData = response.data
        }
        else{
          textData = agent.course
        }
        const outline = await this.OpenaiSevice.generateCourseOutline(agent.subjectName,agent.difficulty,agent.educationLevel,textData)
        if(!outline.success) return{
          success:false,
          statusCode:HttpStatusCode.InternalServerError,
          msg:"Error generating course outline may be your data is not accurate or not properly visible"
        }
        const data = await this.AgentModel.create({...agent,course:JSON.parse(outline.data).sections,
          deScopeId: new Types.ObjectId(generateMongoIdFormat(agent.deScopeId))
        })
        return{
          success:true,
          data:data,
          statusCode:HttpStatusCode.Created,
          msg:"Custom Agent Created"
        }
      }catch(e){
        return{
          success:false,
          statusCode:HttpStatusCode.InternalServerError,
          msg:"Error while Creaing Custom Agent"
        }
      }
    }

    async getAgentAndCourseById(_id:string):Promise<Agent>{
      try{
        return this.AgentModel.findById(_id)
      }catch(e){
        return 
      }
    }


    async courseTopicStatusUpdate(docId:string,status:string,courseId:string,topicId:string):Promise<ResponseDto>{

      try {
          await this.AgentModel.updateOne(
          { 
            "_id": docId, 
            "course._id": courseId, 
            "course.topics._id": topicId 
          },
          { 
            $set: { "course.$.topics.$[topic].status": status } 
          },
          { 
            arrayFilters: [{ "topic._id": topicId }] 
          }
        );


        return {
          success: true,
          statusCode: HttpStatus.OK,
      };
      } catch (error) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg:`Error updating topic status: , ${error}`
      };
      }
    }

    async courseTopicCompleteStatus(status:boolean,courseId:string,docId:string):Promise<ResponseDto>{

      try {



          await this.AgentModel.updateOne(
          { 
            "_id":docId,
            "course._id": courseId, 
          },
          { 
            $set: { "course.$.courseComplete": status } 
          }
        );

        const agent =  await this.AgentModel.findOne(
          { 
            "_id": docId, 
          }
        );

        let noOfTopics = agent.course.length;
        let noOfCompleteTopics = agent.course.filter(topic => topic.courseComplete).length;
        let progress = (noOfCompleteTopics / noOfTopics) * 100 || 0;


        await this.AgentModel.findByIdAndUpdate({"_id":docId},{progress})




        return {
          success: true,
          statusCode: HttpStatus.OK,
      };
      } catch (error) {
        return {
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          msg:`Error updating topic status: , ${error}`
      };
      }
    }

    async getTotalAgentCount(userId:string):Promise<number>{
      try{
          return this.AgentModel.find({deScopeId:new Types.ObjectId(generateMongoIdFormat(userId))}).countDocuments()
      }
      catch(e){
          return 0
      }
  }
}
