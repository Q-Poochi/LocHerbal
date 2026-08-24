import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET!,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        roles: { select: { role: { select: { name: true } } } },
        customer: { select: { id: true } },
      },
    });

    if (!user) {
      return { userId: payload.sub, jti: payload.jti, roles: payload.roles || [], permissions: [] };
    }

    // Get all permissions from user's roles
    const roleNames = user.roles.map(r => r.role.name);
    const permissions = await this.prisma.permission.findMany({
      where: {
        roles: {
          some: { role: { name: { in: roleNames } } },
        },
      },
      select: { code: true },
    });

    return {
      userId: user.id,
      jti: payload.jti,
      roles: roleNames,
      permissions: permissions.map(p => p.code),
      customerId: user.customer?.id || null,
    };
  }
}

