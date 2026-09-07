import { NextResponse } from "next/server";
import { ApiError } from "@/server/lib/errors";
import { withRoute } from "@/server/handler";
import { requireAuth } from "@/server/auth";
import {
  deleteLinkedAccount,
  findLinkedAccountById,
} from "@/server/repositories/accountsRepo";

export const DELETE = withRoute(
  async (req: Request, { params }: { params: { id: string } }) => {
    const authUser = requireAuth(req);

    const account = await findLinkedAccountById(params.id);
    if (!account || account.userId !== authUser.id) {
      throw new ApiError(404, "NOT_FOUND", "Linked account not found");
    }

    await deleteLinkedAccount(account.id);
    return new NextResponse(null, { status: 204 });
  }
);
