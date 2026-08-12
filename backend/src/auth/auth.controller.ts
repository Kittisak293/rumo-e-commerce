/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/create-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyEmailDto, ResendVerificationDto } from './dto/verify-email.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // --- registration + email verification ------------------------------------

  @ApiOperation({
    summary: 'Create an account and email a verification code',
    description:
      'The account starts unverified and cannot log in until POST /auth/verify-email ' +
      'succeeds. Returns an otpToken scoped to the email_verify flow.',
  })
  @ApiResponse({ status: 201, description: 'Account created; code sent' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ ip: { limit: 5, ttl: 60_000 }, email: { limit: 3, ttl: 60_000 } })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Prove control of the address and mark the account verified',
    description: 'Does not sign the user in — they still have to log in.',
  })
  @ApiResponse({ status: 200, description: 'Email verified' })
  @ApiResponse({ status: 401, description: 'Wrong, expired, or used code' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ ip: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(
      verifyEmailDto.otpToken,
      verifyEmailDto.code,
    );
  }

  @ApiOperation({
    summary: 'Send a fresh verification code and burn the old one',
  })
  @ApiResponse({ status: 429, description: 'Still inside the resend cooldown' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ ip: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('resend-verification')
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendVerificationDto.otpToken);
  }

  // --- login ----------------------------------------------------------------

  @ApiOperation({
    summary: 'Step 1 of 2 — check the password and email a 6-digit code',
    description:
      'Returns a short-lived otpToken. This token grants no access on its own; ' +
      'exchange it for a real access token at POST /auth/verify-otp.',
  })
  @ApiResponse({ status: 200, description: 'Code sent; otpToken issued' })
  @ApiResponse({ status: 401, description: 'Wrong email or password' })
  @ApiResponse({
    status: 403,
    description:
      'Address not verified. Body carries emailVerificationRequired plus a ' +
      'fresh email_verify otpToken.',
  })
  @ApiResponse({ status: 429, description: 'Resend cooldown or rate limit' })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    ip: { limit: 20, ttl: 60_000 },
    email: { limit: 5, ttl: 60_000 },
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.startLogin(signInDto.email, signInDto.password);
  }

  @ApiOperation({
    summary: 'Step 2 of 2 — exchange otpToken + code for an access token',
  })
  @ApiResponse({ status: 200, description: 'Access token issued' })
  @ApiResponse({
    status: 401,
    description: 'Wrong, expired, or already-used code',
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({ ip: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.otpToken, verifyOtpDto.code);
  }

  @ApiOperation({
    summary: 'Issue a new code for an in-flight login and burn the old one',
  })
  @ApiResponse({ status: 429, description: 'Still inside the resend cooldown' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ ip: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto.otpToken);
  }

  // --- forgot / reset password ----------------------------------------------

  @ApiOperation({
    summary: 'Email a password-reset code',
    description:
      'Always answers 200 with the same body shape whether or not the address ' +
      'exists, so it cannot be used to discover which emails have accounts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Handled (identical for unknown addresses)',
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    ip: { limit: 10, ttl: 60_000 },
    email: { limit: 5, ttl: 60_000 },
  })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @ApiOperation({ summary: 'Set a new password using the emailed code' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 401, description: 'Wrong, expired, or used code' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ ip: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.otpToken,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
