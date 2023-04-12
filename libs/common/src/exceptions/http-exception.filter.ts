import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: object, host: ArgumentsHost) {
    console.log('caught an error');
    console.log(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse()
    const request = ctx.getRequest();
    response
    .getResponse()
    .status(exception['statusCode'])
    .json({
      message: exception['message'],
      statusCode: exception['statusCode'],
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}