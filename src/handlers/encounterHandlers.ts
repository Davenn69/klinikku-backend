import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { db } from "../db";
import { appointmentSlots, doctors, encounters, regions } from "../db/schema";
import { HttpStatusCode } from "../types/httpStatusCode";
import { and, eq, sql } from "drizzle-orm";
import { success } from "../utils/successMessages";
import CustomError from "../types/error";
import { errors } from "../utils/errorMessages";

const generateBookingCode = () =>
  `BOOK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const getParamId = (id: string | string[] | undefined) => {
  if (typeof id !== "string" || !id.trim()) {
    throw new CustomError(
      errors.missingEncounterId,
      HttpStatusCode.BAD_REQUEST,
    );
  }

  return id.trim();
};

export const getEncounters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = res.locals.user;
    const encounter = await db
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
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          specialization: doctors.specialization,
        },
        region: {
          id: regions.id,
          name: regions.name,
          code: regions.code,
        },
      })
      .from(encounters)
      .innerJoin(doctors, eq(encounters.doctorId, doctors.id))
      .innerJoin(regions, eq(encounters.regionId, regions.id))
      .innerJoin(
        appointmentSlots,
        eq(encounters.appointmentSlotId, appointmentSlots.id),
      )
      .where(eq(encounters.userId, user.sub));

    res.status(HttpStatusCode.OK).json({
      message: success.successGetEncounters,
      encounter,
    });
  } catch (e: any) {
    next(e);
  }
};

export const addEncounters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = res.locals.user;
    const {
      doctor_id: doctorId,
      region_id: regionId,
      appointment_slot_id: appointmentSlotId,
      complaint,
    } = req.body as {
      doctor_id?: string;
      region_id?: string;
      appointment_slot_id?: string;
      complaint?: string;
    };

    if (!regionId?.trim()) {
      throw new CustomError(errors.missingRegionId, HttpStatusCode.BAD_REQUEST);
    }

    if (!doctorId?.trim()) {
      throw new CustomError(errors.missingDoctorId, HttpStatusCode.BAD_REQUEST);
    }

    if (!appointmentSlotId?.trim()) {
      throw new CustomError(
        errors.missingAppointmentId,
        HttpStatusCode.BAD_REQUEST,
      );
    }

    if (!complaint?.trim()) {
      throw new CustomError(
        errors.missingComplaint,
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const [encounter] = await db
      .insert(encounters)
      .values({
        bookingCode: generateBookingCode(),
        userId: user.sub,
        doctorId: doctorId.trim(),
        regionId: regionId.trim(),
        appointmentSlotId: appointmentSlotId.trim(),
        complaint: complaint.trim(),
      })
      .returning();

    //Add appointment minus

    res.status(HttpStatusCode.CREATED).json({
      message: success.successCreateEncounter,
      encounter,
    });
  } catch (e: any) {
    next(e);
  }
};

export const getEncounterDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = res.locals.user;
    const encounterId = getParamId(req.params.id);

    const encounter = await db
      .select({
        id: encounters.id,
        bookingCode: encounters.bookingCode,
        complaint: encounters.complaint,
        status: encounters.status,
        cancelledReason: encounters.cancelledReason,
        cancelledAt: encounters.cancelledAt,
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
        },
        doctor: {
          id: doctors.id,
          name: doctors.name,
          specialization: doctors.specialization,
        },
        region: {
          id: regions.id,
          name: regions.name,
          code: regions.code,
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
          eq(encounters.id, encounterId),
          eq(encounters.userId, user.sub),
        ),
      )
      .limit(1);

    if (encounter.length === 0) {
      throw new CustomError(errors.encounterNotFound, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json({
      message: success.successGetEncounterDetails,
      encounter: encounter[0],
    });
  } catch (e: any) {
    next(e);
  }
};

export const deleteEncounters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = res.locals.user;
    const encounterId = getParamId(req.params.id);

    const cancelledEncounter = await db.transaction(async (tx) => {
      const encounter = await tx.query.encounters.findFirst({
        where: and(
          eq(encounters.id, encounterId),
          eq(encounters.userId, user.sub),
        ),
      });

      if (!encounter) {
        throw new CustomError(
          errors.encounterNotFound,
          HttpStatusCode.NOT_FOUND,
        );
      }

      if (encounter.status === "CANCELLED") {
        throw new CustomError(
          errors.encounterAlreadyCancelled,
          HttpStatusCode.CONFLICT,
        );
      }

      await tx
        .update(appointmentSlots)
        .set({
          bookedCount: sql`GREATEST(${appointmentSlots.bookedCount} - 1, 0)`,
          isAvailable: true,
        })
        .where(eq(appointmentSlots.id, encounter.appointmentSlotId));

      const [updatedEncounter] = await tx
        .update(encounters)
        .set({
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledReason: "Cancelled by user",
          updatedAt: new Date(),
        })
        .where(eq(encounters.id, encounter.id))
        .returning();

      return updatedEncounter;
    });

    res.status(HttpStatusCode.OK).json({
      message: success.successCancelEncounter,
      encounter: cancelledEncounter,
    });
  } catch (e: any) {
    next(e);
  }
};
