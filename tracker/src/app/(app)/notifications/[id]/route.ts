import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { openNotification } from "@/lib/comments";

/** A real link, not a server action: a full page load is what lets the browser jump to and highlight the comment. */
export async function GET(request: NextRequest, ctx: RouteContext<"/notifications/[id]">) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const href = await openNotification(user.username, Number((await ctx.params).id));
  return NextResponse.redirect(new URL(href ?? "/notifications", request.url));
}
