
/**
 * GET /api/v1/messages
 */
export default async function getMessages(request, env, ctx, params) {
  try {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await request.text();
    if (body !== "") {
      return new Response("Invalid Message Format", { status: 400 });
    }

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    // === 驗證 limit ===
    let limit = 10; // 預設值
    if (limitParam !== null) {
      if (!/^[0-9]{1,2}$/.test(limitParam)) {
        return new Response("Invalid Param (Limit)", { status: 400 });
      }
      limit = parseInt(limitParam, 10);
      if (limit < 1 || limit > 20) {
        return new Response("Invalid Param (Limit)", { status: 400 });
      }
    }

    // === 驗證 offset ===
    let offset = 0; // 預設值
    if (offsetParam !== null) {
      if (!/^[0-9]{1,6}$/.test(offsetParam)) {
        return new Response("Invalid Param (Offset)", { status: 400 });
      }
      offset = parseInt(offsetParam, 10);
      if (offset < 0) {
        return new Response("Invalid Param (Offset)", { status: 400 });
      }
    }

    // 取得所有訊息的 key
    const list = await env.MT_MESSAGES.list({
      prefix: "msg:",
      limit: offset + limit,
      reverse: true, // 新到舊
    });

    // 若訊息總數不足 offset，則回傳 204 No Content
    if (list.keys.length <= offset) {
      return new Response(null, { status: 204 });
    }

    // 只保留需要的部分
    const keysToFetch = list.keys.slice(offset, offset + limit);
    const values = await Promise.all(
      keysToFetch.map((entry) => env.MT_MESSAGES.get(entry.name, { type: "json" }))
    );

    return new Response(JSON.stringify(values, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });

  } catch (err) {
    return err instanceof Response ? err : new Response("Server Error", { status: 500 });
  }
}
