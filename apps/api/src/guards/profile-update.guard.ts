import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Observable } from "rxjs";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../../../../libs/common/src/decorators";
import { Request } from "express";

@Injectable()
export class ProfileUpdateGuard implements CanActivate {
  constructor(private jwtService: JwtService,
    private reflector: Reflector) {
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const req: Request = context.switchToHttp().getRequest();
      const authHeader = req.headers.authorization;
      const userIdToUpdate = req.params.id;
      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException({ message: 'Пользователь не авторизован' })
      }

      const user = this.jwtService.verify(token);
      req.user = user;
      const isAdmin = user.roles?.some(role => role.value === 'ADMIN');

      if (isAdmin) {
        return true;
      }

      if (+user.sub === +userIdToUpdate) {
        return true;
      }

      return false;
    } catch (e) {
      console.log(e)
      throw new ForbiddenException('Нет доступа')
    }
  }

}