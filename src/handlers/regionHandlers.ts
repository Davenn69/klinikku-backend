import { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "../types/httpStatusCode";
import { db } from "../db";
import { regions } from "../db/schema";
import { success } from "../utils/successMessages";

export const getRegions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // const user = res.locals.user;
    const region = await db.select().from(regions);

    res.status(HttpStatusCode.OK).json({
      message: success.successRetrieveRegions,
      regions: region,
    });
  } catch (e: any) {
    next(e);
  }
};
