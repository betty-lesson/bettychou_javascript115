//公用變數區
const fetchPath = "./db.json";
let nationalHoliday, pallet, booked;
let calendarCtrl;
let tableData = {
  //初始的表格資料
  totalPrice: 0, // 總價
  normalCount: 0, // 平日入住數
  holidayCount: 0, // 平日入住數
  pallet: {
    //營位資料 => 標題名稱、可賣數量、預約日金、小計、訂購數
    aArea: {
      title: "河畔 × A 區",
      sellCount: 0,
      sellInfo: "<div></div>",
      sumPrice: 0,
      orderCount: 0,
    },
    bArea: {
      title: "山間 × B 區",
      sellCount: 0,
      sellInfo: "<div></div>",
      sumPrice: 0,
      orderCount: 0,
    },
    cArea: {
      title: "平原 × C 區",
      sellCount: 0,
      sellInfo: "<div></div>",
      sumPrice: 0,
      orderCount: 0,
    },
    dArea: {
      title: "車屋 × D 區",
      sellCount: 0,
      sellInfo: "<div></div>",
      sumPrice: 0,
      orderCount: 0,
    },
  },
};
/*dayjs init*/
dayjs.locale("zh-tw");
dayjs.extend(window.dayjs_plugin_localeData);
dayjs.extend(dayjs_plugin_isSameOrBefore);
dayjs.extend(dayjs_plugin_isBetween);

//初始化區
fetchData();

//私有方法區private method
async function fetchData() {
  const response = await fetch(fetchPath, { method: "GET" });
  const json = await response.json();
  ({ nationalHoliday, pallet, booked } = json);

  calendarCtrl = calendarService();
  calendarCtrl.print(); //印出左右兩個月曆
  calendarCtrl.refresh(); //印出初始的營位表格

  //綁定月份切換按紐
  /*第一種寫法
   document
     .querySelector('a[href="#prevCtrl"]')
     .addEventListener("click", (e) => {
       e.preventDefault();
       calendarCtrl.prevMonth("上一個月");
     });
   document
     .querySelector('a[href="#nextCtrl"]')
     .addEventListener("click", (e) => {
       e.preventDefault();
       calendarCtrl.nextMonth("下一個月");
     });*/
  document.querySelector(".ctrlBtn").addEventListener("click", (e) => {
    e.preventDefault();
    calendarCtrl.swap(e.target.closest("a").getAttribute("href"));
  });

  //選擇日期
  document.querySelector(".calendar").addEventListener("click", (e) => {
    e.preventDefault();
    const sltDay = e.target.closest(".selectDay");
    sltDay && calendarCtrl.choose(sltDay);
  });

  //選擇帳數
  const allSelect = document.querySelectorAll("#selectPallet select");

  allSelect.forEach((slt) => {
    slt.addEventListener("change", () => {
      //每次改一區，都從 0 重新加總四區
      tableData.totalPrice = 0;

      allSelect.forEach((node) => {
        const areaData = tableData.pallet[node.name];

        //下拉選單的 value 是字串，先轉成數字再存起來
        //老師的寫法：areaData.orderCount = +node.value;
        areaData.orderCount = Number(node.value);

        //該區小計 = 選了幾帳 × 一帳住完整段的價格
        tableData.totalPrice += areaData.orderCount * areaData.sumPrice;
      });

      //只更新標題。呼叫 tablePrint() 會重建選項，讓剛選的帳數回到 0
      const { totalPrice, normalCount, holidayCount } = tableData;
      document.querySelector("#selectPallet>h3").textContent = `$${totalPrice} / ${normalCount}晚平日，${holidayCount}晚假日`;
    });
  });

  //預約側欄：用 Bootstrap 控制開關
  const offcanvas = new bootstrap.Offcanvas(document.querySelector(".offcanvas"));

  //按下預約按鈕
  document.querySelector("#selectPallet button").addEventListener("click", (e) => {
    e.preventDefault(); //先阻止營位表格直接送出

    const orderForm = document.querySelector("#orderForm");
    const palletData = tableData.pallet;
    let palletItemsHtml = "";

    /*step.1 依照各區的訂購帳數，組出側欄清單*/
    for (const key in palletData) {
      const areaData = palletData[key];
      if (areaData.orderCount === 0) continue; //這區選 0 帳，跳過

      palletItemsHtml += `
        <li class="list-group-item d-flex justify-content-between align-items-start">
          <div class="ms-2 me-auto">
            <div class="fw-bold">${areaData.title}</div>
            <div>${areaData.sellInfo}</div>
          </div>
          <span class="badge bg-warning rounded-pill">
            x <span class="fs-6">${areaData.orderCount}</span>帳
          </span>
        </li>`;
    }

    /*step.2 把清單和總價印到側欄*/
    orderForm.querySelector("ol").innerHTML = palletItemsHtml;
    orderForm.querySelector(".card-header").textContent = document.querySelector("#selectPallet>h3").textContent;

    /*step.3 沒有選任何營位時，停用側欄的提交按鈕*/
    orderForm.querySelector('button[type="submit"]').disabled = !palletItemsHtml;

    //資料都放好之後，再打開側欄
    offcanvas.show();
  });

  //按下提交按鈕
  document.querySelector("#orderForm").addEventListener("submit", async (e) => {
    e.preventDefault(); //先阻止表單照預設方式送出並跳頁

    const form = e.currentTarget;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;

    /*step.1 檢查必填欄位，讓 Bootstrap 顯示驗證提示*/
    form.classList.add("was-validated");
    if (!form.checkValidity()) return;

    /*step.2 整理要送出的資料*/
    const formObj = Object.fromEntries(new FormData(form));

    //入住日和區間內的日期都要算，退房日當晚不算
    const sleepDays = [];
    document.querySelectorAll(".calendar li.selectHead, .calendar li.selectConnect").forEach((node) => sleepDays.push(node.dataset.date));
    formObj.selectDate = sleepDays;

    //把 A～D 區的訂購帳數放進 sellout
    const sellout = {};
    Object.keys(tableData.pallet).forEach((key) => {
      sellout[key] = tableData.pallet[key].orderCount;
    });
    formObj.sellout = sellout;

    /*step.3 轉成 JSON，送到老師的測試 API*/
    submitButton.disabled = true; //等待回覆時先鎖住按鈕，避免連點

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify(formObj),
        headers: { "Content-Type": "application/json; charset=UTF-8" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      alert(`測試送出成功，回傳 ID：${result.id}`);
    } catch (error) {
      console.error(error);
      alert("測試送出失敗，請稍後再試。");
    } finally {
      submitButton.disabled = false;
    }
  });
}

const calendarService = () => {
  //變數
  let theDay = dayjs();
  const today = dayjs();
  //左邊的行事曆
  const objL = {
    listBox: "",
    title: "",
    thisDate: theDay,
  };
  //右邊的行事曆
  const objR = {
    listBox: "",
    title: "",
    thisDate: theDay.add(1, "month"), //右邊的行事曆加一個月
  };

  const chooseDays = [null, null];

  //建立行事曆
  const listMaker = (obj) => {
    const firstDay = dayjs(obj.thisDate).startOf("month").day(); //0，星期天
    const totalDay = dayjs(obj.thisDate).daysInMonth(); //30

    // console.log(firstDay, totalDay);

    /*step.1 星期幾，放幾個空白?
    1->0
    2->1
    ...類推
    0 or 7->6 
    (0 || 7結果會是7)*/
    for (let i = 1; i < (firstDay || 7); i++) {
      obj.listBox += `<li class="JsCal"></li>`;
    }

    /*step2 跑幾次帶值日子 */
    for (let i = 1; i <= totalDay; i++) {
      let className = "JsCal";
      const currentDate = obj.thisDate.date(i);
      const currentDatYMD = currentDate.format("YYYY-MM-DD");

      //計算class外觀
      //1.是否過期
      if (currentDate.isSameOrBefore(today)) className += " delDay";
      else {
        className += " selectDay";

        //2.是否假日 => 六日dayjs().day() === 6 or 0
        /*方法1*/
        // const getDay = currentDate.day();
        // if (getDay === 6 || getDay === 0) className += "holiday";

        /*方法2
        1號在周日 => 0，i === 1/7/8/14/15/21/22/28/29
        1號在周一 => 1，i === 6/7/13/14/20/21/27/28
        1號在周二 => 2，i === 5/6/12/13/19/20/26/27
        1號在周三 => 3，i === 4/5/11/12/18/24/25/26
        1號在周四 => 4，i === 3/4/10/11/17/18/24/25
        1號在周五 => 5，i === 2/3/9/1/16/17/23/24
        1號在周六 => 6，i === 1/2/8/9/15/16/22/23
        ------------------------------------------
        1號在周x => x，  (x+i)%7 === 0 or 1都是紅字
        1號在周x => x，  (x+i)%7 <2 都是紅字
        */
        //+是否國定假日
        if ((firstDay + i) % 7 < 2 || nationalHoliday.includes(currentDatYMD)) className += " holiday";

        //2-2.是否客滿
        const currentBook = booked.find((item) => item.date === currentDatYMD);
        currentBook && Object.values(currentBook.sellout).reduce((a, c) => a + c, 0) === pallet.count && (className += " fullDay");
      }

      //插入li
      obj.listBox += `<li class="${className}" data-date="${currentDatYMD}">${i}</li>`;
    }

    obj.title = `${dayjs.months()[obj.thisDate.month()]}${obj.thisDate.year()}`;

    // return obj;
  };

  //印出行事曆
  const listPrint = () => {
    listMaker(objL);
    listMaker(objR);

    document.querySelector(".leftDayList").innerHTML = objL.listBox;
    document.querySelector(".rightDayList").innerHTML = objR.listBox;
    document.querySelector(".leftBar>h4").innerHTML = objL.title;
    document.querySelector(".rightBar>h4").innerHTML = objR.title;

    // document.querySelectorAll('.selectDay').forEach(item=>{

    // })
  };

  /*第一種寫法：if / else
  const chooseList = (node) => {
    const [fst, sec] = chooseDays;
    if (fst && !sec && node.dataset.date === fst.dataset.date) return; //禁算同一日期點選

    document.querySelectorAll(".calendar li.selectConnect").forEach((item) => {
      item.classList.remove("selectConnect");
    });

    if (!fst && !sec) {
      // [null, null]
      chooseDays[0] = node;
      node.classList.add("selectHead");
    } else if (fst && !sec) {

      // [1st, null]
      chooseDays[1] = node;

      // 判斷是否為[2nd, 1st]，dayjs(2nd) < dayjs(1st)
      const is2before1 = dayjs(node.dataset.date).isSameOrBefore(
        dayjs(chooseDays[0].dataset.date),
      );
      console.log(is2before1); //YMD => dayjs

      if (is2before1) {
        chooseDays[0].classList.replace("selectHead", "selectFoot"); //1st class 改footer
        chooseDays[1].classList.add("selectHead"); //2nd class 加head
        [chooseDays[1], chooseDays[0]] = [chooseDays[0], chooseDays[1]]; //[2nd,1st]=>[1st,2nd]
      } else chooseDays[1].classList.add("selectFoot");
    } else {
      chooseDays.forEach((item) =>
        item.classList.remove("selectHead", "selectFoot"),
      )
      // [!null, !null] =>清空，作成[1st, null]
      node.classList.add("selectHead");
      chooseDays[0] = node;
      chooseDays[1] = null;
    }

    //規劃selectConnect
    if (chooseDays[0] && chooseDays[1]) {
      document.querySelectorAll(".calendar li.selectDay").forEach((item) => {
        const isBetween = dayjs(item.dataset.date).isBetween(
          chooseDays[0].dataset.date,
          chooseDays[1].dataset.date,
        );
        isBetween && item.classList.add("selectConnect");
      });
    }
  };
  */

  /*第二種寫法：switch (true)*/
  const chooseList = (node) => {
    const [fst, sec] = chooseDays;

    switch (true) {
      case !fst && !sec: // [null, null] => 第一次點選
        chooseDays[0] = node;
        node.classList.add("selectHead");
        break;

      case fst && !sec: {
        // [1st, null] => 第二次點選
        if (node.dataset.date === fst.dataset.date) return; //禁算同一日期點選
        chooseDays[1] = node;

        // 判斷是否為 [2nd, 1st]，如果第二次選得比較早，就交換入住與退房日
        const is2before1 = dayjs(node.dataset.date).isSameOrBefore(dayjs(fst.dataset.date));

        if (is2before1) {
          fst.classList.replace("selectHead", "selectFoot");
          node.classList.add("selectHead");
          [chooseDays[0], chooseDays[1]] = [node, fst];
        } else {
          node.classList.add("selectFoot");
        }

        //規劃selectConnect，只標記入住日和退房日中間的日期
        document.querySelectorAll(".calendar li.selectDay").forEach((item) => {
          const isBetween = dayjs(item.dataset.date).isBetween(chooseDays[0].dataset.date, chooseDays[1].dataset.date);
          isBetween && item.classList.add("selectConnect");
        });
        break;
      }

      default: // [!null, !null] => 第三次點選，清掉舊區間，重新選入住日
        chooseDays.forEach((item) => item.classList.remove("selectHead", "selectFoot"));
        document.querySelectorAll(".calendar li.selectConnect").forEach((item) => {
          item.classList.remove("selectConnect");
        });

        node.classList.add("selectHead");
        chooseDays[0] = node;
        chooseDays[1] = null;
        break;
    }
  };

  //切換月份
  const changeMonth = (count) => {
    theDay = theDay.add(count, "month");
    chooseDays[0] = null;
    chooseDays[1] = null;
    objL.listBox = "";
    objL.thisDate = theDay;
    objR.listBox = "";
    objR.thisDate = theDay.add(1, "month");
  };

  //先把初始 tableData 存成字串，每次重算都從 0 開始
  const initTableData = JSON.stringify(tableData);

  //計算營位資料
  const tableMaker = () => {
    tableData = JSON.parse(initTableData);

    //只有入住日，或切換月份清空日期時，印出初始表格
    if (!chooseDays[0] || !chooseDays[1]) {
      tablePrint();
      return;
    }

    const palletKeys = Object.keys(tableData.pallet);

    /*step.1 先把各區的可售帳數設成 db.json 裡的總帳數*/
    for (const key of palletKeys) {
      tableData.pallet[key].sellCount = pallet[key].total;
    }

    /*step.2 找出實際入住的晚上
    selectHead => 入住日，要算
    selectConnect => 中間的日期，要算
    selectFoot => 退房日，當晚不住，所以不算
    */
    const sleepDays = document.querySelectorAll(".calendar .selectHead, .calendar .selectConnect");

    sleepDays.forEach((node) => {
      const date = node.dataset.date;
      const isHoliday = node.classList.contains("holiday");
      const priceKey = isHoliday ? "holidayPrice" : "normalPrice";
      const countKey = isHoliday ? "holidayCount" : "normalCount";
      const hasOrder = booked.find((item) => item.date === date);

      tableData[countKey]++;

      for (const key of palletKeys) {
        const areaData = tableData.pallet[key];

        //每晚都要有營位，所以取這幾晚「剩最少」的帳數
        if (hasOrder) {
          const remaining = pallet[key].total - hasOrder.sellout[key];
          areaData.sellCount = Math.min(areaData.sellCount, remaining);
        }

        //記下這一晚的價格，sumPrice 是這區「一帳、住完整段」的價格
        const dayPrice = pallet[key][priceKey];
        areaData.sellInfo += `<div>${date}(${dayPrice})</div>`;
        areaData.sumPrice += dayPrice;
      }
    });

    /*step.3 算完資料後，交給 tablePrint 更新畫面*/
    tablePrint();
  };

  //印出營位表格
  const tablePrint = () => {
    document.querySelectorAll("#selectPallet select").forEach((node) => {
      //下拉選單的 name 對應 tableData.pallet 的區域，例如 aArea
      const palletData = tableData.pallet[node.name];
      const count = palletData.sellCount;

      //從 0 印到可售數量，例如剩 2 帳就印出 0、1、2
      let optionHtml = "";
      for (let i = 0; i <= count; i++) {
        optionHtml += `<option value="${i}">${i}</option>`;
      }
      node.innerHTML = optionHtml;

      //當可售數量為 0 時，停用下拉選單
      /*方法1：用 if，只處理停用*/
      // if (count === 0) node.disabled = true;

      /*方法2：直接用比較結果，可停用也可重新開放*/
      // node.disabled = count === 0;

      /*方法3：用 !，0 會變成 true，停用下拉選單*/
      node.disabled = !count;

      //從下拉選單所在的 td 往左一格，找到每日價格欄
      const nodeSellInfo = node.parentElement.previousElementSibling;
      nodeSellInfo.innerHTML = !count ? "" : palletData.sellInfo;

      //再往左一格，找到「剩餘 ? 組」的數字
      nodeSellInfo.previousElementSibling.querySelector("span").textContent = count;
    });

    //更新表格上方的總價與平日、假日晚數
    document.querySelector("#selectPallet>h3").textContent =
      `$${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日`;
  };

  return {
    print: listPrint,
    /*第一種寫法
     prevMonth: () => {
       changeMonth(-1);
       listPrint();
     },
     nextMonth: () => {
       changeMonth(1);
       listPrint();
     },*/
    swap: (v) => {
      changeMonth(v === "#prevCtrl" ? -1 : 1);
      listPrint();
      tableMaker(); //切月已清空日期，表格也回到初始狀態
    },

    choose: (node) => {
      chooseList(node);
      tableMaker(); //日期標記更新後，再依照新區間重算表格
    },
    refresh: tablePrint,
  };
};
