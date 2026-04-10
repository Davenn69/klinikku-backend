import { and, eq, gte, sql } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { appointmentSlots } from "../db/schema";
import { HttpStatusCode } from "../types/httpStatusCode";
import CustomError from "../types/error";
import { errors } from "../utils/errorMessages";
import { success } from "../utils/successMessages";

export const getAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      region_id: regionId,
      doctor_id: doctorId,
      date,
    } = req.query as {
      region_id?: string;
      doctor_id?: string;
      date?: string;
    };

    if (!regionId?.trim()) {
      throw new CustomError(errors.missingRegionId, HttpStatusCode.BAD_REQUEST);
    }

    if (!doctorId?.trim()) {
      throw new CustomError(errors.missingDoctorId, HttpStatusCode.BAD_REQUEST);
    }

    if (!date?.trim()) {
      throw new CustomError(
        errors.missingAppointmentDate,
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const slots = await db
      .select({
        id: appointmentSlots.id,
        doctorId: appointmentSlots.doctorId,
        regionId: appointmentSlots.regionId,
        date: appointmentSlots.slotDate,
        startTime: appointmentSlots.startTime,
        endTime: appointmentSlots.endTime,
        maxCapacity: appointmentSlots.maxCapacity,
        bookedCount: appointmentSlots.bookedCount,
        isAvailable: appointmentSlots.isAvailable,
        remainingCapacity: sql<number>`${appointmentSlots.maxCapacity} - ${appointmentSlots.bookedCount}`,
      })
      .from(appointmentSlots)
      .where(
        and(
          eq(appointmentSlots.regionId, regionId.trim()),
          eq(appointmentSlots.doctorId, doctorId.trim()),
          eq(appointmentSlots.slotDate, date.trim()),
          // eq(appointmentSlots.isAvailable, true),
          // gte(
          //   sql<number>`${appointmentSlots.maxCapacity} - ${appointmentSlots.bookedCount}`,
          //   1,
          // ),
        ),
      );

    res.status(HttpStatusCode.OK).json({
      message: success.successRetrieveAppointmentSlots,
      appointments: slots,
    });
  } catch (e: any) {
    next(e);
  }
};
