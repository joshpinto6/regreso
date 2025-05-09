import { globalGETRateLimit } from "~/server/request";
import { getCurrentSession } from "~/server/session";

export async function GET() {
  if (!(await globalGETRateLimit())) {
    return new Response("Too many requests", {
      status: 429,
    });
  }
  const { session, user } = await getCurrentSession();

  if (user) {
    if (session == null) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/log-in",
        },
      });
    } else {
      if (!user.emailVerified && !user.githubId && !user.googleId) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/verify-email",
          },
        });
      }
      if (user.registered2FA && !session.twoFactorVerified) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/2fa",
          },
        });
      }
    }
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/dashboard",
    },
  });
}
