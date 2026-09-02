import { Request, Response, NextFunction } from "express";

class ErrorHandler extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorMiddleware = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
  let { message, statusCode } = err;
  statusCode = statusCode || 500;
  message = message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export { ErrorHandler, errorMiddleware };
