import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AgentModule } from './agent/agent.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { OpenaiModule } from './openai/openai.module';
import { AwsModule } from './aws/aws.module';
import { QuizModule } from './quiz/quiz.module';
import { EventsGateway } from './events/events.gateway';
import { EventsController } from './events/events.controller';
import { PropertyModule } from './property/property.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_URL),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver, 
      autoSchemaFile: true, 
      playground:true
    }),
    PropertyModule,
    // UserModule,
    // AgentModule,
    // OpenaiModule,
    // AwsModule,
    // QuizModule
  ],
  controllers: [AppController, EventsController],
  providers: [AppService, AppResolver, EventsGateway],
})
export class AppModule {}
