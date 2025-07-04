document.getElementById("register-form").addEventListener("submit", function (e) {
    e.preventDefault(); // 阻止預設提交行為
    userSignup();
});

async function userSignup() {
    const form = document.getElementById("register-form");
    const username = form.username.value.trim();
    const password = form.password.value;
    const avatarFile = form.avatar.files[0];

    // 規則定義
    const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#%&@^`~])[A-Za-z\d#%&@^`~]{8,64}$/;
    const maxFileSize = 128 * 1024; // 128 KiB
    const allowedTypes = ['image/jpeg', 'image/png'];

    // 前端驗證
    if (!usernameRegex.test(username)) {
        alert("用戶名不符合格式規定。");
        return;
    }

    if (!passwordRegex.test(password)) {
        alert("密碼不符合格式規定。");
        return;
    }

    if (!avatarFile) {
        alert("請選擇頭像檔案。");
        return;
    }

    if (!allowedTypes.includes(avatarFile.type)) {
        alert("僅接受 JPG 或 PNG 圖片。");
        return;
    }

    if (avatarFile.size > maxFileSize) {
        alert("圖片大小不得超過 128 KiB。");
        return;
    }

    // 建立表單資料
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("avatar", avatarFile);

    try {
        const result = await fetch("/api/v1/users", {
            method: "POST",
            body: formData,
        });

        if (result.status === 201) {
            const resultData = await result.json();
            const usersContainer = document.getElementById("users");
            const userBlock = document.createElement("div");
            userBlock.className = "link-block dark-block";
            userBlock.innerHTML = `
            <a>
              <div class="icon">
                <img src="${resultData.avatar_url}" alt="${resultData.username}'s avatar">
              </div>
              <div class="text">
                <p class="main">${resultData.username}</p>
              </div>
            </a>
          `;
            // 顯示歡迎區塊
            document.getElementById("register-form-container").style.display = "none";
            document.getElementById("welcome").style.display = "block";
            usersContainer.appendChild(userBlock);
            alert("註冊成功！");
            form.reset();
        } else if (result.status === 409) {
            alert("此用戶已存在，請改用登入。");
        } else if (result.status === 400) {
            alert(result.body || "請確認輸入格式是否正確。");
        } else {
            alert(result.error || "發生錯誤，請稍後再試。");
        }

    } catch (err) {
        console.error("網路錯誤：", err);
        alert("網路錯誤，請稍後再試。");
    }
}
