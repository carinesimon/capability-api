import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>("roles", ctx.getHandler()) || this.reflector.get("roles", ctx.getClass());
    if (!roles || !roles.length) return true;
    const req = ctx.switchToHttp().getRequest();
    const user = req.user; // injecté par JwtAuthGuard
    return !!user && roles.includes(user.role);
  }
}
