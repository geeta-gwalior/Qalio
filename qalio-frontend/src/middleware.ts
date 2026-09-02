import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPathAllowedForRole } from "@/utils/routeAccess";

export async function middleware(request: NextRequest) {
  const jwt = request.cookies.get("jwt");
  const pathname = request.nextUrl.pathname;

  //for public profile accesss student
  const publicProfileMatch = pathname.match(
    /^\/publicprofile\/details\/([^/]+)$/
  );

  if (publicProfileMatch) {
    const studentId = publicProfileMatch[1];

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/public/${studentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      if (res.ok) {
        return NextResponse.next();
      }
    } catch (err) {
      console.error("Public student check failed", err);
    }

    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: jwt?.value }),
        cache: "no-store",
      }
    );

    const jwtStatus = await response.json();
    const user = jwtStatus.user;

    if (!jwtStatus.validity) {
      const res = NextResponse.redirect(new URL("/auth/sign-in", request.url));
      res.cookies.delete("jwt");
      return res;
    }

    const role = user?.role?.toLowerCase();

    // 👇 Restrict access if path isn't allowed for the role
    if (!isPathAllowedForRole(pathname, role)) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
    }

    const res = NextResponse.next();
    res.cookies.set("userDetails", encodeURIComponent(JSON.stringify(user)), {
      secure: true,
      sameSite: "strict",
      path: "/",
    });
    return res;
  } catch (error) {
    console.log("Middleware error:", error);
    const res = NextResponse.redirect(new URL("/auth/sign-in", request.url));
    res.cookies.delete("jwt");
    return res;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|sitemap.xml|robots.txt|auth/|404|terms-and-conditions|privacy-policy).*)",
  ],
};
