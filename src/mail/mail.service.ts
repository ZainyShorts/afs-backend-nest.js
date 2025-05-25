import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendOtpEmail(to: string, otp: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Your OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <span>heres your otp ${otp}</span>
      </div>
      `,
    });
  }
}
