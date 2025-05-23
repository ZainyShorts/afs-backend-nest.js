import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          const token = req?.cookies?.jwt;
          console.log('Extracted JWT token:', token);
          return token;
        },
      ]),
      secretOrKey: 'WATCHDOGS426890',
    });
  }

  async validate(payload: any) {
    console.log('Decoded JWT payload:', payload);
    return { userId: payload.userId, useremail: payload.useremail };
  }
}
