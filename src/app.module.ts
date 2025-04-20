import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { EventsGateway } from './events/events.gateway';
import { EventsController } from './events/events.controller';
import { PropertyModule } from './property/property.module';
import { MasterDevelopmentModule } from './masterdevelopment/masterdevelopment.module';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_CONNECTION_URL),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
    PropertyModule,
    MasterDevelopmentModule,
    DocumentModule,
  ],
  controllers: [AppController, EventsController],
  providers: [AppService, AppResolver, EventsGateway],
})
export class AppModule {}
