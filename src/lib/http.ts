import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
export function sameOrigin(req: NextRequest) {
  if (req.headers.get("origin") !== new URL(req.url).origin)
    throw new Error("Request origin is not allowed.");
}
export function failure(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message ?? "Check your input." },
      { status: 400 },
    );
  const message = error instanceof Error ? error.message : "";
  const safe = [
    "Please log in.",
    "Not allowed.",
    "Task not found.",
    "Join code is incorrect.",
    "Username or password is incorrect.",
    "Too many attempts. Take a breather and try again in 15 minutes.",
    "Join a group for this subject first.",
    "Subject and scope cannot be changed.",
    "The super admin cannot be deleted.",
    "Request origin is not allowed.",
    "Group not found.",
  ];
  if (safe.includes(message))
    return NextResponse.json(
      { error: message },
      { status: message === "Please log in." ? 401 : 400 },
    );
  const cause = error as { code?: string; cause?: { code?: string } };
  if (cause.code === "23505" || cause.cause?.code === "23505")
    return NextResponse.json(
      { error: "That username or group name is already taken." },
      { status: 409 },
    );
  console.error("Request failed", {
    name: error instanceof Error ? error.name : "unknown",
    code: cause.code ?? cause.cause?.code,
  });
  return NextResponse.json(
    { error: "Something went sideways. Please retry; your work matters." },
    { status: 500 },
  );
}
