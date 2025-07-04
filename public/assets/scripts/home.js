const counterUrl = "https://counter.undecv.workers.dev/?name=lab05";

fetch(counterUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text();
    })
    .then(count => {
        document.getElementById("counter").textContent = count;
        console.log("目前的計數是：", count);
    })
    .catch(error => {
        document.getElementById("counter").textContent = "錯誤";
        console.error("取得計數時發生錯誤：", error);
    });
