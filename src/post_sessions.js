import { validateUser } from "./validate.js";

function randomBase64(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let binary = "";
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * POST /api/v1/sessions
 */
export default async function postSessions(request, env, ctx, params) {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.text();
    if (body !== "") {
      return new Response("Invalid Message Format", { status: 400 });
    }

    const user = await validateUser(request, env, ctx, {});

    const fakeSessionID = randomBase64(64);
    const fakeCSRFToken = randomBase64(32);

    const responsePayload = {
      username: user.username,
      avatar_url: `/api/v1/users/${user.username}/avatar`,
      cookies: {
        "session-id": fakeSessionID,
        "csrf-token": fakeCSRFToken,
        HttpOnly: true,
        Secure: true,
      },
      localStorage: {
        "csrf-token": fakeCSRFToken,
        "session-id": fakeSessionID,
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": [
          `session-id=${fakeSessionID}; Path=/; HttpOnly; Secure; SameSite=Strict`,
          `csrf-token=${fakeCSRFToken}; Path=/; HttpOnly; Secure; SameSite=Strict`,
        ].join(", "),
      },
    });
  } catch (err) {
    return err instanceof Response ? err : new Response("Server Error", { status: 500 });
  }
}
