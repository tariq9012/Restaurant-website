import type { NextFunction, Request, RequestHandler, Response } from "express";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "REQUEST_ERROR",
  ) {
    super(message);
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function ok(res: Response, data: unknown, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res: Response, message: string, status = 400, error = "REQUEST_ERROR") {
  return res.status(status).json({ success: false, message, error });
}

export function parseId(value: string | string[] | undefined) {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, "A valid numeric id is required", "INVALID_ID");
  return id;
}

export function requireFields(body: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) throw new HttpError(400, `Missing required fields: ${missing.join(", ")}`, "MISSING_FIELDS");
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) return fail(res, error.message, error.status, error.code);
  req.log.error({ err: error }, "Unhandled API error");
  return fail(res, "Something went wrong while processing the request", 500, "INTERNAL_ERROR");
}