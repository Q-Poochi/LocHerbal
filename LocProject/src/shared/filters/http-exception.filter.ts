import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Prisma error codes map
 * Tham khảo: https://www.prisma.io/docs/orm/reference/error-reference#error-codes
 */
const PRISMA_ERROR_MAP: Record<string, HttpStatus> = {
    P2000: HttpStatus.BAD_REQUEST, // Value too long
    P2002: HttpStatus.CONFLICT, // Unique constraint violation
    P2025: HttpStatus.NOT_FOUND, // Record not found
    P2003: HttpStatus.BAD_REQUEST, // Foreign key constraint failed
    P2014: HttpStatus.BAD_REQUEST, // Required relation violation
};

export interface ExceptionResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode: number;
        let message: string;
        let error: string;

        if (exception instanceof HttpException) {
            // NestJS built-in exception (BadRequestException, NotFoundException, etc.)
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as Record<string, unknown>;
                message = (resp.message as string) || exception.message;
                // Nếu message là array (ValidationPipe errors), join lại
                if (Array.isArray(resp.message)) {
                    message = (resp.message as string[]).join('; ');
                }
            } else {
                message = exception.message;
            }

            error = exception.name;
        } else if (this.isPrismaError(exception)) {
            // Prisma known request error
            const prismaError = exception as { code: string; meta?: Record<string, unknown> };
            statusCode = PRISMA_ERROR_MAP[prismaError.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
            message = prismaError.meta?.cause as string ?? `Prisma error: ${prismaError.code}`;
            error = 'Database Error';

            this.logger.warn(`Prisma error ${prismaError.code} on ${request.url}: ${message}`);
        } else {
            // Unknown error — 500, KHÔNG leak stack trace
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            error = 'Internal Server Error';

            this.logger.error(
                `Unhandled exception on ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : exception,
            );
        }

        const responseBody: ExceptionResponse = {
            statusCode,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(statusCode).json(responseBody);
    }

    private isPrismaError(exception: unknown): boolean {
        if (!exception || typeof exception !== 'object') return false;
        const ex = exception as Record<string, unknown>;
        return (
            ex.constructor?.name === 'PrismaClientKnownRequestError' &&
            typeof ex.code === 'string'
        );
    }
}