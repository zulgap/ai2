import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('이메일과 비밀번호를 입력하세요.');
    }
    try {
      return await this.authService.signup(dto);
    } catch (e) {
      return { error: e.message || '회원가입 실패' };
    }
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('이메일과 비밀번호를 입력하세요.');
    }
    return this.authService.login(body);
  }
}