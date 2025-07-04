
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault(); // 阻止預設提交行為
  userLogin();
});

async function userLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // 前端驗證（正則應與 pattern 保持一致）
  const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#%&@^`~])[A-Za-z\d#%&@^`~]{8,64}$/;

  if (!usernameRegex.test(username)) {
    alert("使用者名稱格式錯誤！");
    return;
  }

  if (!passwordRegex.test(password)) {
    alert("密碼格式錯誤！");
    return;
  }

  try {
    const res = await fetch("/api/v1/sessions", {
      method: "POST",
      headers: {
        'X-Username': username,
        'X-Password': password,
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      alert(`登入失敗：${errorText}`);
      return;
    }

    const result = await res.json();

    localStorage.setItem("username", result.username);
    localStorage.setItem("avatar_url", result.avatar_url);
    if (result.localStorage) {
      for (const [key, value] of Object.entries(result.localStorage)) {
        localStorage.setItem(key, value);
      }
    }

    // UI 更新
    const welcomeBlock = document.getElementById("welcome");
    welcomeBlock.style.display = "block";
    const signupEntry = document.getElementById("signup-entry");
    signupEntry.style.display = "none";
    const loginFormContainer = document.getElementById("login-form-container");
    loginFormContainer.style.display = "none";
    const userInfoBlock = document.getElementById("user-info");
    userInfoBlock.style.display = "block";
    const userAvatarImg = document.getElementById("user-avatar");
    userAvatarImg.src = result.avatar_url
    const userNameP = document.getElementById("user-name");
    userNameP.innerText = result.username

  } catch (err) {
    console.error("登入錯誤：", err);
    alert("登入時發生錯誤！");
  }
};
