import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/posts/new", "/bookmarks", "/admin"];
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (session && isAdminRoute && (session as any).user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};