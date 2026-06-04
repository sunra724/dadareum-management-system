import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  hasAdminAuthConfig,
  hasSupabaseAuthEnv,
  isAdminEmail,
  isStudyCafeStaffEmail,
  sanitizeRedirectPath,
} from "@/lib/auth";

const publicPagePaths = ["/login", "/auth/callback", "/study-cafe/checkin", "/study-cafe/my"];
const publicApiPaths = [
  "/api/auth/logout",
  "/api/auth/password-reset",
  "/api/study-cafe/auth",
  "/api/study-cafe/my",
  "/api/study-cafe/submit",
];

function isPublicPath(pathname: string) {
  return publicPagePaths.includes(pathname) || publicApiPaths.includes(pathname);
}

function isCounselorPath(pathname: string) {
  return pathname === "/study-cafe/counselor" || pathname.startsWith("/study-cafe/counselor/");
}

function buildLoginUrl(request: NextRequest, error?: string) {
  const url = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  url.pathname = "/login";
  url.search = "";

  if (request.nextUrl.pathname !== "/login") {
    url.searchParams.set("next", sanitizeRedirectPath(nextPath));
  }

  if (error) {
    url.searchParams.set("error", error);
  }

  return url;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isApiRequest = pathname.startsWith("/api/");

  if (!hasSupabaseAuthEnv() || !hasAdminAuthConfig()) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
    }

    return NextResponse.redirect(buildLoginUrl(request, "auth_config"));
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authorized = isCounselorPath(pathname)
    ? isStudyCafeStaffEmail(user?.email)
    : isAdminEmail(user?.email);

  if (!user || !authorized) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(buildLoginUrl(request, user ? "unauthorized" : undefined));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
