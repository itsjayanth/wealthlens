import { NextResponse } from "next/server";
import { ApiError, errorBody } from "./lib/errors";

/**
 * Wraps an async Next.js Route Handler so thrown ApiErrors and unexpected
 * errors are converted into the standard { error: { message, code } }
 * response shape, instead of duplicating try/catch in every route file.
 *
 * Usage: export const POST = withRoute(async (req, ctx) => { ... });
 */
export function withRoute<Args extends unknown[]>(
  fn: (req: Request, ...args: Args) => Promise<NextResponse>
) {
  return async (req: Request, ...args: Args): Promise<NextResponse> => {
    try {
      return await fn(req, ...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(errorBody(err.message, err.code), {
          status: err.status,
        });
      }

      console.error(err);
      return NextResponse.json(
        errorBody("Internal server error", "SERVER_ERROR"),
        { status: 500 }
      );
    }
  };
}
