// import { ObjectType, Field, registerEnumType, Int } from '@nestjs/graphql';
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';
// import { User } from '../../user/schema/user.schema';
// import { agents, AgentStatus } from '../enum/enums';




// registerEnumType(AgentStatus, {
//   name: 'status', 
// });

// registerEnumType(agents, {
//     name: 'agents', 
//   });
  
//   export interface topic{
//     title:string,
//     status:string
//   }
//   export type coursetype = {
//     topics:topic[],
//     courseComplete:boolean
//   }

// @Schema({
//   timestamps: true,
// })


// @ObjectType() 
// export class Agent  extends Document {
  
//   @Field(() => User)
//   @Prop({ type: Types.ObjectId, ref: 'User' }) 
//   deScopeId: Types.ObjectId;


//   @Field(() => String) 
//   @Prop({ type: String})
//   agentName: string;

//   @Field(() => String) 
//   @Prop({ type: String})
//   subjectName: string;

//   @Field(() => String) 
//   @Prop({ type: String})
//   educationLevel: string;

//   @Field(() => String) 
//   @Prop({ type: String})
//   icon: string;

//   @Field(() => String) 
//   @Prop({ type: [coursetype]})
//   course: string;

//   @Field(() => String) 
//   @Prop({ type: String})
//   difficulty: string;

//   @Field(() => Number) 
//   @Prop({ type: Number, default:0})
//   progress: number;



// }

// export const AgentSchema = SchemaFactory.createForClass(Agent);



import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';

// Topic Schema
@ObjectType()
@Schema()
export class Topic {
  @Field(() => String)
  @Prop()
  title: string;

  @Field(() => String)
  @Prop()
  status: string;

  @Field(() => String)
  _id: string;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

// Course Schema
@ObjectType()
@Schema()
export class Course {
  @Field(() => [Topic])
  @Prop({ type: [TopicSchema] })
  topics: Topic[];

  @Field(() => Boolean)
  @Prop()
  courseComplete: boolean;

  @Field(() => String)
  _id: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

// Agent Schema
@ObjectType()
@Schema()
export class Agent extends Document {

  @Field(() => String) 
  _id: Types.ObjectId;

  @Field(() => [Course])
  @Prop({ type: [CourseSchema] })
  course: Course[];

  @Field(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User' }) 
  deScopeId: Types.ObjectId;


  @Field(() => String) 
  @Prop({ type: String})
  agentName: string;

  @Field(() => String) 
  @Prop({ type: String})
  subjectName: string;

  @Field(() => String) 
  @Prop({ type: String})
  educationLevel: string;

  @Field(() => String) 
  @Prop({ type: String})
  icon: string;

  @Field(() => String) 
  @Prop({ type: String})
  difficulty: string;

  @Field(() => String) 
  @Prop({ type: String})
  agentRole: string;

  @Field(() => Number) 
  @Prop({ type: Number, default:0})
  progress: number;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);
