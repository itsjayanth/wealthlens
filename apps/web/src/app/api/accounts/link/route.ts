import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import { encrypt } from "@/server/lib/crypto";
import { createLinkedAccount } from "@/server/repositories/accountsRepo";

const linkAccountSchema = z.object({
  apiKey: z.string().min(1),
  secureKey: z.string().min(1),
  clientCode: z.string().min(1),
});

export const POST = withRoute(async (req) => {
  const authUser = requireAuth(req);

  const body = await req.json().catch(() => undefined);
  const parsed = linkAccountSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request body"
    );
  }
  const { apiKey, secureKey, clientCode } = parsed.data;

  const account = await createLinkedAccount({
    userId: authUser.id,
    clientCode,
    encryptedApiKey: encrypt(apiKey),
    encryptedSecureKey: encrypt(secureKey),
  });

  return NextResponse.json({ account }, { status: 201 });
});
