import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Trích xuất thông tin user từ request (do JwtStrategy.validate gắn vào req.user).
 * Dùng: @User() user | @User('userId') userId
 */
export const User = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & { user?: Record<string, any> }>();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);