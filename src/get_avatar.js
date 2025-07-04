
import { usernameRegex } from "./validate.js";

/**
 * GET /api/v1/users/{username}/avatar
 */
export default async function getAvatar(request, env, ctx, { username }) {
    try {
        if (request.method !== "GET") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        const body = await request.text();
        if (body !== "") {
            return new Response("Invalid Message Format", { status: 400 });
        }

        // 驗證 username
        if (typeof username !== "string" || !usernameRegex.test(username)) {
            return new Response("Invalid Username", { status: 400 });
        }

        const objectKey = `avatars/${username}.jpg`;


        // Get Avatar
        const object = await env.MT_AVATARS.get(objectKey);

        if (!object) {
            return new Response("Not Found", { status: 404 });
        }

        // 304 Not Changed
        const etag = object.httpEtag || `"${objectKey}"`;

        const clientEtag = request.headers.get("If-None-Match");
        if (clientEtag === etag) {
            return new Response(null, {
                status: 304,
                headers: {
                    "ETag": etag,
                    "Cache-Control": "public, max-age=3600"
                }
            });
        }

        const headers = new Headers();
        headers.set("Content-Type", "image/jpeg");
        headers.set("Cache-Control", "public, max-age=3600");
        headers.set("ETag", etag);

        return new Response(object.body, { status: 200, headers });
    } catch (err) {
        return err instanceof Response ? err : new Response("Server Error", { status: 500 });
    }
}
