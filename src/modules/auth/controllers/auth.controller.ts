import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { UserResponseDto } from '../../users/dtos/user-response.dto.js';
import { UserRole } from '../../users/entities/user-role.enum.js';
import { UsersService } from '../../users/services/users.service.js';
import { LoginDto } from '../dtos/auth.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { AuthService } from '../services/auth.service.js';

interface AuthenticatedRequest extends Request {
  accessToken?: string;
  user?: {
    sub: number;
    email: string;
    sid: string;
    tokenUse: 'access';
    role: UserRole;
    exp: number;
  };
}

@ApiTags('auth')
@ApiExtraModels(UserResponseDto)
@Controller('auth')
export class AuthController {
  private readonly accessCookieOptions: CookieOptions;
  private readonly refreshCookieOptions: CookieOptions;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    config: ConfigService,
  ) {
    const apiPrefix = config.get<string>('API_PREFIX', 'api/v2').replace(/^\/+|\/+$/g, '');
    const cookieSecure = config.get<boolean>('COOKIE_SECURE', config.get<string>('NODE_ENV') === 'production');
    this.accessCookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'strict',
      path: `/${apiPrefix}`,
    };
    this.refreshCookieOptions = {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'strict',
      path: `/${apiPrefix}/auth`,
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in and set HttpOnly access and refresh cookies.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', maxLength: 254, example: 'jordan@example.com' },
        password: { type: 'string', minLength: 1, maxLength: 72, example: 'a-strong-password' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'The session was created. The browser receives HttpOnly cookies and sends them automatically.',
    schema: {
      type: 'object',
      required: ['user'],
      properties: {
        user: { $ref: getSchemaPath(UserResponseDto) },
      },
    },
    headers: {
      'Set-Cookie': { description: 'HttpOnly accessToken and refreshToken cookies.', schema: { type: 'string' } },
    },
  })
  @ApiUnauthorizedResponse({ description: 'The email or password is invalid.' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    response.cookie('accessToken', result.accessToken, {
      ...this.accessCookieOptions,
      maxAge: this.authService.accessTokenTtlSeconds * 1000,
    });
    response.cookie('refreshToken', result.refreshToken, {
      ...this.refreshCookieOptions,
      maxAge: this.authService.refreshTokenTtlSeconds * 1000,
    });
    return { user: result.user };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the access and refresh cookies using the existing refresh cookie.' })
  @ApiOkResponse({
    description: 'Both HttpOnly cookies were rotated; the browser sends them automatically.',
    schema: {
      type: 'object',
      properties: { message: { type: 'string', example: 'Session refreshed.' } },
      required: ['message'],
    },
    headers: {
      'Set-Cookie': {
        description: 'Rotated HttpOnly accessToken and refreshToken cookies.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'The refresh token is missing, invalid, expired, revoked, or already used.' })
  async refresh(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refreshToken;
    const tokens = await this.authService.refresh(refreshToken);
    response.cookie('accessToken', tokens.accessToken, {
      ...this.accessCookieOptions,
      maxAge: this.authService.accessTokenTtlSeconds * 1000,
    });
    response.cookie('refreshToken', tokens.refreshToken, {
      ...this.refreshCookieOptions,
      maxAge: this.authService.refreshTokenTtlSeconds * 1000,
    });
    return { message: 'Session refreshed.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the profile associated with the access token.' })
  @ApiOkResponse({ description: 'The authenticated user profile.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'The access token is missing, invalid, or revoked.' })
  async me(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException('La solicitud no contiene un usuario autenticado.');
    }
    return this.usersService.findOne(request.user.sub);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revoke the current session and clear the refresh-token cookie.' })
  @ApiOkResponse({
    description: 'The session was revoked.',
    schema: { type: 'object', properties: { message: { type: 'string', example: 'Session closed successfully.' } } },
    headers: { 'Set-Cookie': { description: 'Cleared refreshToken cookie.', schema: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({ description: 'The access token is missing, invalid, or revoked.' })
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    if (!request.user || !request.accessToken) {
      throw new UnauthorizedException('La solicitud no contiene una sesión autenticada.');
    }

    await this.authService.logout(request.user, request.accessToken);
    response.clearCookie('accessToken', this.accessCookieOptions);
    response.clearCookie('refreshToken', this.refreshCookieOptions);
    return { message: 'Sesión cerrada correctamente.' };
  }
}
