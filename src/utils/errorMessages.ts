class ErrorMessages {
  notFound: string = "route not found";

  //Auth related
  missingRegisterParameters: string = "Name, email, and password are required.";
  missingLoginParameters: string = "Email and password are required.";
  passwordLength: string = "Password must be at least 6 characters long.";
  invalidNameFormat: string = "Name can only contain letters.";
  invalidNameLength: string = "Name is too short.";
  invalidEmailFormat: string = "Email format is incorrect.";
  invalidPasswordFormat: string =
    "Password should follow these formats: at least 6 characters, at least 1 uppercase letter, at least 1 lowercase letter, and at least 1 number.";
  emailAlreadyExists: string = "Email is already registered.";
  failedRegisterUser: string = "Failed to create user.";
  invalidLoginCredentials: string = "Invalid email or password.";
  accountInactive: string = "This account is inactive.";

  //Token related
  tokenMissing: string = "token is not provided";
  refreshTokenMissing: string = "refresh token is not provided";
  invalidToken: string = "token is invalid";
  tokenExpired: string = "token has expired";

  //Doctor related
  missingRegionId: string = "region_id is required.";

  //Appointment related
  missingDoctorId: string = "doctor_id is required.";
  missingAppointmentDate: string = "date is required.";
  appointmentNotFound: string = "appointment not found";

  //Encounters related
  missingAppointmentId: string = "appointment_slot_id is required";
  missingComplaint: string = "complaint is required";
  missingEncounterId: string = "encounter id is required";
  encounterNotFound: string = "encounter not found";
  encounterAlreadyCancelled: string = "encounter is already cancelled";
  appointmentSlotUnavailable: string =
    "appointment slot is unavailable or fully booked";
  encounterAlreadyBooked: string =
    "encounter already exists for this user and appointment slot";
}

export const errors = new ErrorMessages();
