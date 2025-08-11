import crypto from "node:crypto";
import { cookies } from "next/headers";

import { ObjectParser } from "@pilcrowjs/object-parser";
import type { OAuth2Tokens } from "arctic";

import { github } from "~/server/oauth";
import { globalGETRateLimit } from "~/server/request";
import {
  createSession,
  generateSessionToken,
  setSessionTokenCookie,
} from "~/server/session";
import { createUser, getUserFromGitHubId } from "~/server/user";

export async function GET(request: Request): Promise<Response> {
  if (!(await globalGETRateLimit())) {
    return new Response("Too many requests", {
      status: 429,
    });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const storedState =
    (await cookies()).get("github_oauth_state")?.value ?? null;
  if (code === null || state === null || storedState === null) {
    return new Response("Please restart the process.", {
      status: 400,
    });
  }
  if (state !== storedState) {
    return new Response("Please restart the process.", {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await github.validateAuthorizationCode(code);
  } catch {
    // Invalid code or client credentials
    return new Response("Please restart the process.", {
      status: 400,
    });
  }
  const githubAccessToken = tokens.accessToken();

  const userRequest = new Request("https://api.github.com/user");
  userRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const userResponse = await fetch(userRequest);
  const userResult: unknown = await userResponse.json();
  const userParser = new ObjectParser(userResult);

  const githubUserId = userParser.getNumber("id");
  if (typeof githubUserId !== "number") {
    return new Response("Invalid GitHub user ID.", {
      status: 400,
    });
  }
  const username = userParser.getString("login");
  if (typeof username !== "string") {
    return new Response("Invalid GitHub username.", {
      status: 400,
    });
  }
  const displayName = userParser.getString("name");
  if (typeof displayName !== "string") {
    return new Response("Invalid GitHub display name.", {
      status: 400,
    });
  }

  const existingUser = await getUserFromGitHubId(githubUserId);
  if (existingUser !== null) {
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, existingUser.id, {
      twoFactorVerified: false,
    });
    void setSessionTokenCookie(sessionToken, session.expiresAt);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard?loginState=signedIn",
      },
    });
  }

  const emailListRequest = new Request("https://api.github.com/user/emails");
  emailListRequest.headers.set("Authorization", `Bearer ${githubAccessToken}`);
  const emailListResponse = await fetch(emailListRequest);
  const emailListResult: unknown = await emailListResponse.json();
  if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
    return new Response("Please restart the process.", {
      status: 400,
    });
  }
  let email: string | null = null;
  for (const emailRecord of emailListResult) {
    const emailParser = new ObjectParser(emailRecord);
    const primaryEmail = emailParser.getBoolean("primary");
    const verifiedEmail = emailParser.getBoolean("verified");
    if (primaryEmail && verifiedEmail) {
      email = emailParser.getString("email");
    }
  }
  if (email === null) {
    return new Response("Please verify your GitHub email address.", {
      status: 400,
    });
  }

  try {
    const user = await createUser(
      email,
      displayName,
      crypto.randomBytes(8).toString("hex"),
      null,
      null,
      githubUserId,
    );
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id, {
      twoFactorVerified: false,
    });
    void setSessionTokenCookie(sessionToken, session.expiresAt);
  } catch (error) {
    return new Response(
      "An error occurred. Hint: This may mean that a user with this email already exists.",
      {
        status: 500,
      },
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/dashboard?loginState=signedIn",
    },
  });
}
