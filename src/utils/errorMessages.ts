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
}

export const errors = new ErrorMessages();
