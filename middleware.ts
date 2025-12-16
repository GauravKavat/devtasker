import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/projects(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // If it's a protected route, use Clerk's built-in protect method
  // This handles session synchronization better than manual checks
  if (isProtectedRoute(req)) {
    try {
      await auth.protect();
    } catch (error) {
      // Only redirect to unauthorized if authentication actually failed
      // This prevents race conditions during login
      // Store the original URL to redirect back after auth sync
      const url = new URL("/unauthorized", req.url);
      url.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
