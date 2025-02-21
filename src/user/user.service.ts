import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model, Types } from 'mongoose';
import { addUserInput } from './inputDto/userInput'
import { generateMongoIdFormat } from 'utils/mongoId/deScopeIdForrmater';
import axios from 'axios';

@Injectable()
export class UserService {

    constructor(@InjectModel(User.name) private userModel:Model<User>){}


    async updateCustomAttribute(userId:string,attributes:Object):Promise<boolean>{

        try {
            const response = await axios.patch(
              process.env.DESCOPE_URL + '/' + userId,
              { attributes },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.MANAGEMENT_PROJECT_API}`,
                },
              }
            );
        
            console.log("Status:", response.status);
            console.log("Custom attributes updated:", response.data);

            if(response.data) return true

            else return false

          } catch (error) {

            if (error.response) {
              console.log("HTTP error!", error.response.status, error.response.data);
              return false
            } else if (error.request) {
              console.log("No response received:", error.request);
              return false
            } else {
              console.log("Error:", error.message);
              return false
            }
          }

       
    }

    async addUser (addUserInput:addUserInput):Promise<boolean>{
        try{
            const count = await this.userModel.countDocuments({ email: addUserInput.email });
            console.log(count)
            if(count>0) return false
            const user = new this.userModel({
                ...addUserInput,
                deScopeId: addUserInput.deScopeId ? new Types.ObjectId(generateMongoIdFormat(addUserInput.deScopeId)) : new Types.ObjectId(),
            })
            await user.save()
            const customAttributes = {
                Subscription : false
            }
            await this.updateCustomAttribute(addUserInput.deScopeId,customAttributes)
            return true;
        }catch(e){
            console.log(e)
            return false
        }
    }

    async getUser(deScopeId:string):Promise<User>{
        return this.userModel.findOne({deScopeId:new Types.ObjectId(generateMongoIdFormat(deScopeId))})
    }
}
