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
import { InventoryModule } from './inventory/inventory.module';
import { MasterDevelopmentModule } from './masterdevelopment/masterdevelopment.module';
import { DocumentModule } from './document/document.module';
import { SubDevelopmentModule } from './subdevelopment/subdevelopment.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { PaymentplanModule } from './paymentplan/paymentplan.module';

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
    UserModule,
    InventoryModule,
    MasterDevelopmentModule,
    DocumentModule,
    SubDevelopmentModule,
    ProjectModule,
    AuthModule,
    MailModule,
    PaymentplanModule,
  ],
  controllers: [AppController, EventsController],
  providers: [AppService, AppResolver, EventsGateway],
})
export class AppModule {}
