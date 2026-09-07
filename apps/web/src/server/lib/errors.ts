/**
 * Standard API error shape per docs/API_CONTRACT.md:
 * { "error": { "message": "string", "code": "string" } }
 */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorBody(message: string, code: string) {
  return { error: { message, code } };
}
