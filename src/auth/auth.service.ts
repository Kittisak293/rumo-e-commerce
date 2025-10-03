import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user?.passwordHash !== pass) {
      throw new UnauthorizedException('น้องรหัสหรือเมลผิดน้อง');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    const payload = { sub: user.id, email: user.email };
    return {
      user: user,
      access_token: await this.jwtService.signAsync(payload),
    };
    return result;
  }
}
