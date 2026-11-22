(() => {
  const initLightBox = () => {
    const lightBox = document.querySelector("#lokiLightBox"); //整個燈箱
    const targetControl = lightBox.querySelector(".control"); //小圖區
    const mainZone = lightBox.querySelector('.mainZone');//燈箱的主區

    document.querySelectorAll("#lokiPark .col").forEach((item) => {
      /*step.1 複製卡片圖片，記下卡片標題，再放到底部縮圖區*/
      const minImg = item.querySelector("img").cloneNode();
      minImg.dataset.str = item.querySelector("h5").textContent;
      targetControl.appendChild(minImg);

      /*step.2 點營區卡片，加上 open 讓燈箱顯示*/
      item.addEventListener("click", () => {
        lightBox.classList.add("open");
        /*一打開就要做換圖換字的動作*/
        minImg.click(); //用JS幫她對指定圖做click
      });

      /*step.3 對燈箱內的小圖規劃點擊事件*/
      minImg.addEventListener('click', (e) => {
        //console.log(e.target.src);
        // mainZone.querySelector('img').src = e.target.src;
        // mainZone.querySelector('p').textContent = e.target.dataset.src;
        mainZone.querySelector('img').src = minImg.src;
        mainZone.querySelector('p').textContent = minImg.dataset.src;
      })
    });

    /*step.4 點黑色背景，移除 open 讓燈箱關閉*/
    lightBox.querySelector(".backdrop").addEventListener("click", () => {
      lightBox.classList.remove("open");
    });
  };

  initLightBox();
})(); //IIFE：定義完立刻執行
