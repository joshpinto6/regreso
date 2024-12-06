import { get2FARedirect } from "~/server/2fa";
import { globalGETRateLimit } from "~/server/request";
import { getCurrentSession } from "~/server/session";

export async function GET() {
  if (!(await globalGETRateLimit())) {
    return new Response("Too many requests", {
      status: 429,
    });
  }
  const { session, user } = await getCurrentSession();
  if (session === null || user === null) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/log-in",
      },
    });
  }
  if (session.twoFactorVerified) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard",
      },
    });
  }
  if (!user.registered2FA) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/2fa/setup",
      },
    });
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: get2FARedirect(user),
    },
  });
}
