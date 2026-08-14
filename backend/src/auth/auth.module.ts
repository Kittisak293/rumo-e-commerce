import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from 'src/redis/redis.module';
import { MailModule } from 'src/mail/mail.module';
import { OtpService } from './otp.service';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    MailModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '3600s'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService],
  // Re-exported so any module that imports AuthModule to get AuthGuard also
  // has UsersService in scope — RolesGuard is instantiated by the *consuming*
  // module and resolves its dependencies from there, not from here.
  exports: [UsersModule],
})
export class AuthModule {}
