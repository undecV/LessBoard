document.addEventListener("DOMContentLoaded", () => {
    const loginEntry = document.getElementById("login-entry");
    const signupEntry = document.getElementById("signup-entry");
    const messageFormContainer = document.getElementById("message-form-container");
    const userInfo = document.getElementById("user-info");
    const userAvatar = document.getElementById("user-avatar");
    const userName = document.getElementById("user-name");

    const user = {
        username: localStorage.getItem("username"),
        avatar_url: localStorage.getItem("avatar_url")
    };

    if (user.username && user.avatar_url) {
        // 使用者已登入
        loginEntry.style.display = "none";
        signupEntry.style.display = "none";
        messageFormContainer.style.display = "block";
        userInfo.style.display = "flex";

        userAvatar.src = user.avatar_url;
        userName.textContent = user.username;

        fetchMessages();
    } else {
        // 未登入
        loginEntry.style.display = "block";
        signupEntry.style.display = "block";
        messageFormContainer.style.display = "none";
        userInfo.style.display = "none";
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const messageForm = document.getElementById("message-form");
    const sendButton = document.querySelector("#send-button button");

    sendButton.addEventListener("click", handleFirstSendClick);
    messageForm.addEventListener("submit", (e) => {
        e.preventDefault();
        userPostMessage();
    });
});



function sanitizeHtml(input) {
    // 僅轉譯常見危險符號為 HTML-safe，允許 emoji 與多語系文字
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


function handleFirstSendClick() {
    const rawMessage = document.getElementById("message").value.trim();

    // === 訊息清洗（防注入） ===
    const sanitizedMessage = sanitizeHtml(rawMessage);

    // 訊息不得為空
    if (!sanitizedMessage.trim()) {
        alert("請輸入訊息內容！");
        return;
    }

    document.getElementById("send-button").style.display = "none";
    document.getElementById("login-sub-form").style.display = "block";
}


async function userPostMessage() {
    const local = {
        username: localStorage.getItem("username"),
        sessionId: localStorage.getItem("session-id"),
        csrfToken: localStorage.getItem("csrf-token"),
    };

    // 驗證是否登入 & 檢查必要欄位
    if (!local.username || !local.sessionId || !local.csrfToken) {
        alert("登入狀態異常，請重新登入");
        userLogout();
        return;
    }

    // 取得輸入帳號與訊息
    const form = document.getElementById("message-form");
    const inputUsername = form.querySelector("#username").value.trim();
    const password = form.querySelector("#password").value;
    const rawMessage = form.querySelector("#message").value;

    // 比對帳號一致性
    if (inputUsername !== local.username) {
        alert("帳號不一致！");
        return;
    }

    // === 訊息清洗（防注入） ===
    const sanitizedMessage = sanitizeHtml(rawMessage);

    // 訊息不得為空
    if (!sanitizedMessage.trim()) {
        alert("請輸入訊息內容！");
        return;
    }

    const payload = {
        message: sanitizedMessage
    };

    try {
        const res = await fetch("/api/v1/messages", {
            method: "POST",
            headers: {
            'Content-Type': 'application/json',
            'X-Username': inputUsername,
            'X-Password': password,
            'X-Session-ID': local.sessionId,
            'X-CSRF-Token': local.csrfToken,
        },
            body: JSON.stringify(payload),
        });


        if (!res.ok) {
            alert(res.error || "訊息傳送失敗");
            return;
        }
    
        const result = await res.json();

        alert("留言成功！");
        document.getElementById("message").value = "";

        // 更新留言板內容（從舊到新）
        const newMessageElement = createMessageElement(result);
        const board = document.getElementById("message-board");
        board.appendChild(newMessageElement);

    } catch (err) {
        console.error("傳送失敗", err);
        alert("發生錯誤，請稍後再試");
    }
}

async function fetchMessages() {
    try {
        const response = await fetch('/api/v1/messages?limit=10&offset=0');

        if (response.status === 204) {
            document.getElementById('message-board').innerHTML = '目前沒有留言。';
            return;
        }

        const messages = await response.json();
        if (response.ok && messages.length > 0) {
            displayMessages(messages);
        } else {
            document.getElementById('message-board').innerHTML = '目前沒有留言。';
        }
    } catch (error) {
        console.error('無法獲取訊息:', error);
    }
}

function displayMessages(messages) {
    const messageBoard = document.getElementById('message-board');
    messageBoard.innerHTML = '';

    // 依照新到舊排序訊息
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messageBoard.appendChild(messageElement);
    });
}


function createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'link-block dark-block message';
    messageElement.dataset.messageId = message.message_id;
    messageElement.dataset.username = message.username;

    messageElement.innerHTML = `
        <a>
        <div class="icon">
            <img src="${message.avatar_url}" onerror="this.src='./assets/images/avatar.default.jpg'" alt="Avatar">
        </div>
        <div class="text">
            <p class="main username"></p>
            <p class="sub message"></p>
            <p class="super-small-text post_datetime"></p>
            <p class="super-small-text">
                <button class="delete-button link-like" type="button">刪除</button>
            </p>
            <div id="delete-form-container"></div>
        </div>
        </a>
    `;

    messageElement.querySelector('.username').textContent = message.username;
    messageElement.querySelector('.message').textContent = message.message;
    messageElement.querySelector('.post_datetime').textContent = message.post_datetime;

    // 如果不是自己的訊息，隱藏刪除按鈕
    const currentUser = localStorage.getItem('username');
    if (message.username !== currentUser) {
        messageElement.querySelector('.delete-button').style.display = 'none';
    }

    return messageElement;
}


function createDeleteForm(username) {
    const form = document.createElement('form');
    form.className = 'delete-message-form';
    form.style.display = 'block';
    form.autocomplete = 'on';
    form.innerHTML = `
        <div class="form-section">
        <p class="small-text">為了保護您的帳戶安全，<br>請再次輸入帳密以刪除訊息。</p>
        </div>
        <div class="form-section">
        <label>Username:</label>
        <input type="text" name="username" required pattern="^[A-Za-z0-9_]{3,20}$" autocomplete="username">
        </div>
        <div class="form-section">
        <label>Password:</label>
        <input type="password" name="password" required
        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[#%&@\\^\`~])[A-Za-z\\d#%&@\\^\`~]{8,64}$" autocomplete="password">
        </div>
        <div class="form-section">
        <button type="submit">Send</button>
        </div>
    `;
    return form;
}


function showDeleteForm(targetButton) {
    const messageElement = targetButton.closest('.message');
    const container = messageElement.querySelector('#delete-form-container');

    // 隱藏其他表單
    document.querySelectorAll('.delete-message-form').forEach(f => f.remove());

    // 已經展開的情況下不重複插入
    if (container.querySelector('.delete-message-form')) return;

    const username = messageElement.dataset.username;
    const form = createDeleteForm(username);
    container.appendChild(form);
}


async function deleteMessage({ messageId, username, password }) {
    const sessionId = localStorage.getItem('session-id');
    const csrfToken = localStorage.getItem('csrf-token');

    try {
        const response = await fetch(`/api/v1/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'X-Username': username,
                'X-Password': password,
                'X-Session-ID': sessionId,
                'X-CSRF-Token': csrfToken,
            },
        });

        if (response.ok) {
            document.querySelector(`.message[data-message-id="${messageId}"]`).remove();
            alert('訊息已刪除');
        } else {
            alert('刪除失敗，請確認您的帳號密碼是否正確');
        }
    } catch (error) {
        console.error('刪除訊息錯誤:', error);
    }
}


window.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-button')) {
        showDeleteForm(e.target);
    }
});


document.addEventListener('submit', async (e) => {
    if (!e.target.classList.contains('delete-message-form')) return;
    e.preventDefault();

    const form = e.target;
    const messageElement = form.closest('.message');
    const messageId = messageElement.dataset.messageId;
    const postUsername = messageElement.dataset.username;
    const inputUsername = form.username.value;
    const password = form.password.value;

    if (inputUsername !== localStorage.getItem('username')) {
        alert('用戶名不一致');
        return;
    }

    await deleteMessage({ messageId, username: inputUsername, password });
});
