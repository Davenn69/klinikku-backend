import { and, eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { doctors } from "../db/schema";
import { HttpStatusCode } from "../types/httpStatusCode";
import CustomError from "../types/error";
import { errors } from "../utils/errorMessages";
import { success } from "../utils/successMessages";

export const getDoctors = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { region_id: regionId } = req.query as { region_id?: string };

    if (!regionId?.trim()) {
      throw new CustomError(errors.missingRegionId, HttpStatusCode.BAD_REQUEST);
    }

    const doctorList = await db
      .select({
        id: doctors.id,
        name: doctors.name,
        specialization: doctors.specialization,
        regionId: doctors.regionId,
        licenseNumber: doctors.licenseNumber,
        isActive: doctors.isActive,
        createdAt: doctors.createdAt,
      })
      .from(doctors)
      .where(
        and(eq(doctors.regionId, regionId.trim()), eq(doctors.isActive, true)),
      );

    res.status(HttpStatusCode.OK).json({
      message: success.successRetrieveDoctors,
      doctors: doctorList,
    });
  } catch (e: any) {
    next(e);
  }
};
