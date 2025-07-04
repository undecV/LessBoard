import { validateUser, validateSession } from "./validate.js";

function sanitizeHtml(input) {
  return input.substring(0, 500).replace(/[&<>'"`=\\]/g, (char) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#x27;',
      '"': '&quot;',
      '`': '&#x60;',
      '=': '&#x3D;',
      '\\': '&#x5C;',
    }[char] || '';
  });
}

/**
 * POST /api/v1/messages
 */
export default async function postMessages(request, env, ctx, params) {
  try {
    if (request.method !== "POST") {
      return new Response("Invalid Method", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }
    const { message } = body;

    if (typeof message !== "string") {
      return new Response("Invalid Message Format", { status: 400 });
    }

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.includes("application/json")) {
      return new Response("Unsupported Media Type", { status: 415 });
    }

    const cleanMessage = sanitizeHtml(message).trim();
    if (cleanMessage.length === 0 || cleanMessage.length > 500) {
      return new Response("Message Too Long (Less Then 500)", { status: 400 });
    }

    const { sessionId, csrfToken } = await validateSession(request, env, ctx, {});
    const user = await validateUser(request, env, ctx, {});

    const message_id = crypto.randomUUID();
    const timestamp = Date.now();
    const post_datetime = new Date(timestamp).toISOString();

    const payload = {
      message_id,
      post_datetime,
      username: user.username,
      avatar_url: `/api/v1/users/${user.username}/avatar`,
      message: cleanMessage,
    };

    await env.MT_MESSAGES.put(`msg:${timestamp}:${message_id}`, JSON.stringify(payload));

    return new Response(JSON.stringify(payload), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return err instanceof Response ? err : new Response("Server Error", { status: 500 });
  }
}
