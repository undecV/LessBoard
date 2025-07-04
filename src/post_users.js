import bcrypt from 'bcryptjs';
import { usernameRegex, passwordRegex } from './validate.js';
/**
 * POST /api/v1/users
 */
export default async function postUsers(request, env, ctx, params) {
  try {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response("Unsupported Media Type", { status: 415 });
    }

    const formData = await request.formData();
    const username = formData.get("username")?.trim();
    const password = formData.get("password");
    const avatar = formData.get("avatar");

    if (!username || !usernameRegex.test(username)) {
      return new Response("Invalid Username", { status: 400 });
    }

    // === 驗證 password ===
    if (!password || !passwordRegex.test(password)) {
      return new Response("Invalid Password", { status: 400 });
    }

    // === 驗證 avatar ===
    if (!(avatar instanceof File)) {
      return new Response("Invalid Avatar", { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(avatar.type)) {
      return new Response("Unsupported Avatar Media Type", { status: 415 });
    }

    const maxSize = 128 * 1024;
    if (avatar.size > maxSize) {
      return new Response("Avatar File Too Large", { status: 400 });
    }

    // === 檢查帳號是否已存在 ===
    const existing = await env.MT_USERS.get(`user:${username}`);
    if (existing) {
      return new Response("Conflict", { status: 409 });
    }

    // === Hash 密碼 ===
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // === 圖片清洗與轉換格式 ===
    const cleaned = (
      await env.CF_IMAGES.input(avatar)
        .transform({ width: 128, height: 128 })
        .output({ format: "image/jpeg" })
    ).response();

    const cleanedBlob = await cleaned.blob();
    const r2Key = `avatars/${username}.jpg`;
    await env.MT_AVATARS.put(r2Key, cleanedBlob, {
      httpMetadata: { contentType: "image/jpeg" }
    });

    // === 寫入 KV ===
    const uid = crypto.randomUUID();
    const userObject = {
      uid,
      username,
      password: hashedPassword,
      avatar: r2Key
    };

    await env.MT_USERS.put(`user:${username}`, JSON.stringify(userObject));

    const responseBody = {
      username,
      avatar_url: `/api/v1/users/${username}/avatar`
    };
    return new Response(JSON.stringify(responseBody), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return err instanceof Response ? err : new Response("Server Error", { status: 500 });
  }
}
