(() => {
  const initLightBox = () => {
    const lightBox = document.querySelector("#lokiLightBox");
    const targetControl = lightBox.querySelector(".control");

    document.querySelectorAll("#lokiPark .col").forEach((item) => {
      /*step.1 複製卡片圖片，記下卡片標題，再放到底部縮圖區*/
      const minImg = item.querySelector("img").cloneNode();
      minImg.dataset.str = item.querySelector("h5").textContent;
      targetControl.appendChild(minImg);

      /*step.2 點營區卡片，加上 open 讓燈箱顯示*/
      item.addEventListener("click", () => {
        lightBox.classList.add("open");
      });
    });

    /*step.3 點黑色背景，移除 open 讓燈箱關閉*/
    lightBox.querySelector(".backdrop").addEventListener("click", () => {
      lightBox.classList.remove("open");
    });
  };

  initLightBox();
})(); //IIFE：定義完立刻執行
