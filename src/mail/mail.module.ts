import { Module } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { MailService } from './mail.service';
@Module({
  imports: [
    NestMailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'zainyshorts@gmail.com',
          pass: 'gciz uelv pugd kspx',
        },
      },
      defaults: {
        from: '"AFS real-estate" <no-reply@afsrealestate.com>',
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
