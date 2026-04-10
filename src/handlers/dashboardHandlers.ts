import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import {
  appointmentSlots,
  doctors,
  encounters,
  regions,
  users,
} from "../db/schema";
import { and, asc, eq, gt, or, sql } from "drizzle-orm";
import { HttpStatusCode } from "../types/httpStatusCode";
import { success } from "../utils/successMessages";
import CustomError from "../types/error";
import { errors } from "../utils/errorMessages";

const DASHBOARD_TIME_ZONE = "Asia/Bangkok";

const formatDateInTimeZone = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format dashboard date in target time zone");
  }

  return `${year}-${month}-${day}`;
};

const formatTimeInTimeZone = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: DASHBOARD_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return formatter.format(date);
};

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

    const currentDate = formatDateInTimeZone(new Date());
    const currentTime = formatTimeInTimeZone(new Date());

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
      .where(
        and(
          eq(encounters.userId, user.id),
          eq(encounters.status, "BOOKED"),
          or(
            gt(appointmentSlots.slotDate, currentDate),
            and(
              eq(appointmentSlots.slotDate, currentDate),
              gt(appointmentSlots.startTime, currentTime),
            ),
          ),
        ),
      )
      .orderBy(asc(appointmentSlots.slotDate), asc(appointmentSlots.startTime))
      .limit(1);

    res.status(HttpStatusCode.OK).json({
      message: success.successGetEncounterDetails,
      recentBooking: recentBooking ?? null,
      user: user,
    });
  } catch (e: any) {
    next(e);
  }
};
