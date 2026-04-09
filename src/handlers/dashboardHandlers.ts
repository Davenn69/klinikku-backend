import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { appointmentSlots, doctors, encounters, regions, users } from "../db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { HttpStatusCode } from "../types/httpStatusCode";
import { success } from "../utils/successMessages";
import CustomError from "../types/error";
import { errors } from "../utils/errorMessages";

export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = res.locals.user;

    const user = await db.query.users.findFirst({
      where: eq(users.id, authUser.sub),
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new CustomError(errors.invalidToken, HttpStatusCode.UNAUTHORIZED);
    }

    const [recentBooking] = await db
      .select({
        id: encounters.id,
        bookingCode: encounters.bookingCode,
        complaint: encounters.complaint,
        status: encounters.status,
        createdAt: encounters.createdAt,
        updatedAt: encounters.updatedAt,
        appointment: {
          id: appointmentSlots.id,
          date: appointmentSlots.slotDate,
          startTime: appointmentSlots.startTime,
          endTime: appointmentSlots.endTime,
          maxCapacity: appointmentSlots.maxCapacity,
          bookedCount: appointmentSlots.bookedCount,
          isAvailable: appointmentSlots.isAvailable,
          remainingCapacity: sql<number>`${appointmentSlots.maxCapacity} - ${appointmentSlots.bookedCount}`,
          doctorId: appointmentSlots.doctorId,
          regionId: appointmentSlots.regionId,
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          specialization: doctors.specialization,
          regionId: doctors.regionId,
          licenseNumber: doctors.licenseNumber,
          isActive: doctors.isActive,
        },
        region: {
          id: regions.id,
          name: regions.name,
          code: regions.code,
          isActive: regions.isActive,
        },
      })
      .from(encounters)
      .innerJoin(doctors, eq(encounters.doctorId, doctors.id))
      .innerJoin(regions, eq(encounters.regionId, regions.id))
      .innerJoin(
        appointmentSlots,
        eq(encounters.appointmentSlotId, appointmentSlots.id),
      )
      .where(eq(encounters.userId, user.id))
      .orderBy(asc(encounters.createdAt))
      .limit(1);

    if (!recentBooking) {
      throw new CustomError(errors.encounterNotFound, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json({
      message: success.successGetEncounterDetails,
      recentBooking: recentBooking,
      user: user,
    });
  } catch (e: any) {
    next(e);
  }
};
