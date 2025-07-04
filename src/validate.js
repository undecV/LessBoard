import bcrypt from "bcryptjs";

export const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
export const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#$%&@^`~])[A-Za-z\d#$%&@^`~]{8,64}$/

/**
 * 嚴格驗證帳號與密碼格式，並比對密碼 hash。
 * 若成功回傳 user 資料，否則拋出錯誤。
 */
export async function validateUser(request, env, ctx, {}) {
    const username = request.headers.get("X-Username");
    const password = request.headers.get("X-Password");

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        !usernameRegex.test(username) ||
        !passwordRegex.test(password)
    ) {
        throw new Response("Invalid username or password.", { status: 401 });
    }

    const key = `user:${username}`;
    const value = await env.MT_USERS.get(key);
    if (!value) {
        throw new Response("Invalid username or password.", { status: 404 });
    }

    const user = JSON.parse(value);
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Response("Invalid username or password.", { status: 401 });
    }

    return user;
}

/**
 * 檢查 Session ID 和 CSRF Token 是否存在（不驗證其真實性）
 */
export async function validateSession(request, env, ctx, { }) {
    const sessionId = request.headers.get("X-Session-ID");
    const csrfToken = request.headers.get("X-CSRF-Token");

    if (!sessionId || !csrfToken) {
        throw new Response("Missing session or CSRF token", { status: 400 });
    }

    return { sessionId, csrfToken };
}
