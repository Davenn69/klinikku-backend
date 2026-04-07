class ErrorMessages {
  notFound: string = "route not found";

  //Auth related
  missingRegisterParameters: string = "Name, email, and password are required.";
  missingLoginParameters: string = "Email and password are required.";
  passwordLength: string = "Password must be at least 8 characters long.";
  emailAlreadyExists: string = "Email is already registered.";
  failedRegisterUser: string = "Failed to create user.";
  invalidLoginCredentials: string = "Invalid email or password.";
  accountInactive: string = "This account is inactive.";

  //Token related
  tokenMissing: string = "token is not provided";
  invalidToken: string = "token is invalid";
  tokenExpired: string = "token has expired";

  //Doctor related
  missingRegionId: string = "region_id is required.";

  //Appointment related
  missingDoctorId: string = "doctor_id is required.";
  missingAppointmentDate: string = "date is required.";
}

export const errors = new ErrorMessages();
