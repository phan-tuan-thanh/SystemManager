import { Controller, Post, Get, Body, HttpCode, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new local account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password (authenticated user)' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto.current_password, dto.new_password);
  }

  @Public()
  @Get('ms365')
  @ApiOperation({ summary: 'Redirect to Microsoft 365 login page' })
  ms365Login(@Res() res: Response) {
    const url = this.authService.getMicrosoftLoginUrl();
    return res.redirect(url);
  }

  @Public()
  @Get('ms365/callback')
  @ApiOperation({ summary: 'Handle Microsoft 365 OAuth2 callback' })
  async ms365Callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:5173');
    if (error || !code) {
      return res.redirect(`${frontendUrl}/login?sso_error=${error || 'missing_code'}`);
    }
    try {
      const result = await this.authService.loginWithMicrosoft(code);
      const params = new URLSearchParams({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      return res.redirect(`${frontendUrl}/auth/callback?${params}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?sso_error=auth_failed`);
    }
  }
}
