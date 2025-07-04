import { uuidRegex, validateUser, validateSession } from "./validate.js";

/**
 * DELETE /api/v1/messages/{message_id}
 */
export default async function deleteMessage(request, env, ctx, { message_id }) {
  try {
    if (request.method !== "DELETE") {
      return new Response("Invalid Method", { status: 405 });
    }

    const body = await request.text();
    if (body !== "") {
      return new Response("Invalid Message Format", { status: 400 });
    }

    if (!uuidRegex.test(message_id)) {
      return new Response("Invalid Path", { status: 400 });
    }

    const { sessionId, csrfToken } = await validateSession(request, env, ctx, {});
    const user = await validateUser(request, env, ctx, {});

    // === 搜尋 MT_MESSAGES 中是否有該訊息 ===
    const list = await env.MT_MESSAGES.list({ prefix: "msg:" });
    const targetKey = list.keys.find(key => key.name.endsWith(`:${message_id}`))?.name;

    if (!targetKey) {
      return new Response("Not Found", { status: 404 });
    }

    const msgDataRaw = await env.MT_MESSAGES.get(targetKey, "json");
    if (!msgDataRaw) {
      return new Response("Can Not Get The Message", { status: 500 });
    }

    // === 驗證該訊息是由本人發布 ===
    if (msgDataRaw.username !== user.username) {
      return new Response("Forbidden", { status: 403 });
    }

    await env.MT_MESSAGES.delete(targetKey);
    return new Response("Deleted", { status: 200 });

  } catch (err) {
    console.debug(err)
    return err instanceof Response ? err : new Response("Server Error", { status: 500 });
  }
}
