import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Quiz } from './schema/quiz.schema';
import { Model, Types } from 'mongoose';
import { ResponseDto } from 'src/dto/response.dto';
import { generateMongoIdFormat } from 'utils/mongoId/deScopeIdForrmater';

@Injectable()
export class QuizService {

    constructor(@InjectModel(Quiz.name) private QuizModel:Model<Quiz>){}


    async addQuiz(marks:string,deScopeId:string,subject:string,difficulty:string,level:string,subBranch:string):Promise<ResponseDto>{
        console.log('hit')
        try{
            await this.QuizModel.create({deScopeId:new Types.ObjectId(generateMongoIdFormat(deScopeId)),marks,subject,difficulty,level,subBranch})
            return { success: true, statusCode: HttpStatus.OK };
        }
        catch(e){

            return {
                success: false,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                msg: "Process failed adding quiz record",
              };
        }
    } 

    async getAllQuiz(userId:string):Promise<Quiz[]>{
        try{
            return this.QuizModel.find({deScopeId:new Types.ObjectId(generateMongoIdFormat(userId))})
        }
        catch(e){

            return []
        }
    } 

    async getTotalQuizCount(userId:string):Promise<number>{
        try{
            return this.QuizModel.find({deScopeId:new Types.ObjectId(generateMongoIdFormat(userId))}).countDocuments()
        }
        catch(e){
            return 0
        }
    }
}
