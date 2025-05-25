import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          // 1. Try to extract from Authorization header
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            console.log('Extracted JWT token from header:', token);
            return token;
          }

          // 2. Fallback to cookie
          const cookieToken = req?.cookies?.jwt;
          console.log('Extracted JWT token from cookie:', cookieToken);
          return cookieToken;
        },
      ]),
      secretOrKey: 'WATCHDOGS426890',
    });
  }

  async validate(payload: any) {
    console.log('Decoded JWT payload:', payload);
    return {
      userId: payload.userId,
      useremail: payload.useremail,
      role: payload.role,
    };
  }
}
