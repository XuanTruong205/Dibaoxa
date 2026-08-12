export class HttpError extends Error {
  constructor(statusCode, message, code = undefined, details = undefined) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function httpError(statusCode, message, code, details) {
  return new HttpError(statusCode, message, code, details);
}
