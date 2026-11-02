import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const publicPath = [
    "/login",
    "/sign-up",
    "/api/auth",
    "/panic-planner-logo.png",
    "/icon.png",
  ].includes(path);
  if (!publicPath && !request.cookies.get("panic_session")?.value) {
    if (path.startsWith("/api/"))
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
