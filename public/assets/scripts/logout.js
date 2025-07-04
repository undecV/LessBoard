document.addEventListener("DOMContentLoaded", () => {
    const loguotButton = document.getElementById("logout");
    loguotButton.addEventListener("click", userLogout);
});

function userLogout() {
    localStorage.removeItem("username");
    localStorage.removeItem("avatar_url");
    localStorage.removeItem("csrf-token");
    localStorage.removeItem("session-id");

    document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    alert("再見！我的朋友！");
    location.reload();
}
