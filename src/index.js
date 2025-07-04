import postUsers from './post_users.js';
import postSessions from './post_sessions.js';
import getAvatar from './get_avatar.js';
import getMessages from './get_messages.js';
import postMessages from './post_messages.js';
import deleteMessage from './delete_message.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method.toUpperCase();

    if (method === 'POST' && pathname === '/api/v1/users') {
      return postUsers(request, env, ctx, {});
    }

    if (method === 'POST' && pathname === '/api/v1/sessions') {
      return postSessions(request, env, ctx, {});
    }

    const avatarMatch = pathname.match(/^\/api\/v1\/users\/([a-zA-Z0-9_]{3,20})\/avatar$/);
    if (method === 'GET' && avatarMatch) {
      return getAvatar(request, env, ctx, { username: avatarMatch[1] });
    }

    if (method === 'GET' && pathname === '/api/v1/messages') {
      return getMessages(request, env, ctx, {});
    }

    if (method === 'POST' && pathname === '/api/v1/messages') {
      return postMessages(request, env, ctx, {});
    }

    const deleteMatch = pathname.match(/^\/api\/v1\/messages\/([0-9a-fA-F-]{36})$/);
    if (method === 'DELETE' && deleteMatch) {
      return deleteMessage(request, env, ctx, { message_id: deleteMatch[1] });
    }

    return new Response('Not Found', { status: 404 });
  }
}
