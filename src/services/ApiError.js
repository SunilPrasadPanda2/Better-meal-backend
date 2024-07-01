class ApiError extends Error {
  constructor(
    errors = [],
    message = "Something went wrong",
    stack = ""
  ) {
    super(message);
    this.statusCode = 500;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    // Make the message property enumerable
    Object.defineProperty(this, "message", {
      enumerable: true,
      writable: true,
      value: message,
    });
  }
}

export { ApiError };
