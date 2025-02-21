import { Module } from '@nestjs/common';
import { AgentResolver } from './agent.resolver';
import { AgentService } from './agent.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Agent, AgentSchema } from './schema/agent.schema';
import { UserModule } from '../user/user.module';
import { AgentController } from './agent.controller';
import { OpenaiModule } from 'src/openai/openai.module';

@Module({
  imports:[
    MongooseModule.forFeature([{
      name:Agent.name ,
      schema:AgentSchema
    }]),
    UserModule,
    OpenaiModule
  ],
  providers: [AgentResolver, AgentService],
  controllers: [AgentController],
  exports:[AgentModule]
})
export class AgentModule {}
