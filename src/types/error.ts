class CustomError extends Error {
  status: number | undefined;
  code: string | undefined;

  constructor(message: string, status: number = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export default CustomError;
