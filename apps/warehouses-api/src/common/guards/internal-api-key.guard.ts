import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { INTERNAL_API_KEY } = process.env;
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-internal-api-key'];

    if (!INTERNAL_API_KEY) {
      throw new UnauthorizedException('INTERNAL_API_KEY is not configured');
    }

    if (typeof apiKey !== 'string' || apiKey !== INTERNAL_API_KEY) {
      throw new UnauthorizedException('Invalid or missing internal API key');
    }

    return true;
  }
}
