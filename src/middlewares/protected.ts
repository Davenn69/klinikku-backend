import { Request, Response, NextFunction } from "express";
import CustomError from "../types/error";
import { errors } from "../utils/errorMessages";
import { HttpStatusCode } from "../types/httpStatusCode";
import { verifyAccessToken } from "../utils/auth";

const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith("Bearer "))
      return next(
        new CustomError(errors.tokenMissing, HttpStatusCode.BAD_REQUEST),
      );

    const token = bearer.split(" ")[1];

    if (!token)
      return next(
        new CustomError(errors.tokenMissing, HttpStatusCode.BAD_REQUEST),
      );

    const payload = verifyAccessToken(token);
    res.locals.user = payload;

    next();
  } catch (e: any) {
    next(e);
  }
};

export default protect;
