import { NextFunction, Request, Response } from "express";
import CustomError from "../types/error";
import { HttpStatusCode } from "../types/httpStatusCode";
import { errors } from "../utils/errorMessages";

const errorCodeMap = new Map<string, string>([
  [errors.notFound, "ROUTE_NOT_FOUND"],
  [errors.missingRegisterParameters, "MISSING_REGISTER_PARAMETERS"],
  [errors.missingLoginParameters, "MISSING_LOGIN_PARAMETERS"],
  [errors.passwordLength, "PASSWORD_TOO_SHORT"],
  [errors.emailAlreadyExists, "EMAIL_ALREADY_EXISTS"],
  [errors.failedRegisterUser, "FAILED_REGISTER_USER"],
  [errors.invalidLoginCredentials, "INVALID_LOGIN_CREDENTIALS"],
  [errors.accountInactive, "ACCOUNT_INACTIVE"],
  [errors.tokenMissing, "TOKEN_MISSING"],
  [errors.refreshTokenMissing, "REFRESH_TOKEN_MISSING"],
  [errors.invalidToken, "INVALID_TOKEN"],
  [errors.tokenExpired, "TOKEN_EXPIRED"],
  [errors.missingRegionId, "MISSING_REGION_ID"],
  [errors.missingDoctorId, "MISSING_DOCTOR_ID"],
  [errors.missingAppointmentDate, "MISSING_APPOINTMENT_DATE"],
  [errors.missingAppointmentId, "MISSING_APPOINTMENT_SLOT_ID"],
  [errors.missingComplaint, "MISSING_COMPLAINT"],
  [errors.missingEncounterId, "MISSING_ENCOUNTER_ID"],
  [errors.encounterNotFound, "ENCOUNTER_NOT_FOUND"],
  [errors.encounterAlreadyCancelled, "ENCOUNTER_ALREADY_CANCELLED"],
  [errors.encounterCannotBeUpdated, "ENCOUNTER_CANNOT_BE_UPDATED"],
  [errors.appointmentSlotUnavailable, "APPOINTMENT_SLOT_UNAVAILABLE"],
  [errors.encounterAlreadyBooked, "ENCOUNTER_ALREADY_BOOKED"],
  [errors.appointmentNotFound, "APPOINTMENT_NOT_FOUND"],
]);

const getCorrelationId = (req: Request) => {
  const headerValue = req.headers["x-correlation-id"];

  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim();
  }

  if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
    return headerValue[0].trim();
  }

  return `req-${Date.now()}`;
};

const getErrorCode = (err: CustomError) =>
  err.code ?? errorCodeMap.get(err.message) ?? "INTERNAL_SERVER_ERROR";

export default function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR;
  const correlationId = getCorrelationId(req);
  const message =
    status >= HttpStatusCode.INTERNAL_SERVER_ERROR
      ? "Internal server error."
      : err.message;

  return res.status(status).json({
    error: {
      code: getErrorCode(err),
      message,
      correlation_id: correlationId,
    },
  });
}
