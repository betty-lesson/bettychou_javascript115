//公用變數區
const fetchPath = './db.json';
let nationalHoliday, pallet, booked;
let calendarCtrl;
let tableData = { //初始的表格資料
  totalPrice: 0, // 總價
  normalCount: 0, // 平日入住數
  holidayCount: 0, // 平日入住數
  pallet: { //營位資料 => 標題名稱、可賣數量、預約日金、小計、訂購數
    aArea: {
      title: '河畔 × A 區',
      sellCount: 0,
      sellInfo: '<div></div>',
      sumPrice: 0,
      orderCount: 0
    },
    bArea: {
      title: '山間 × B 區',
      sellCount: 0,
      sellInfo: '<div></div>',
      sumPrice: 0,
      orderCount: 0
    },
    cArea: {
      title: '平原 × C 區',
      sellCount: 0,
      sellInfo: '<div></div>',
      sumPrice: 0,
      orderCount: 0
    },
    dArea: {
      title: '車屋 × D 區',
      sellCount: 0,
      sellInfo: '<div></div>',
      sumPrice: 0,
      orderCount: 0
    }
  }
};
/*dayjs init*/
dayjs.locale('zh-tw');
dayjs.extend(window.dayjs_plugin_localeData);
dayjs.extend(dayjs_plugin_isSameOrBefore);
dayjs.extend(dayjs_plugin_isBetween);

//初始化區
fetchData();

//私有方法區private method
async function fetchData() {
  const response = await fetch(fetchPath, { method: 'GET' });
  const json = await response.json();
  ({ nationalHoliday, pallet, booked } = json);

  calendarCtrl = calendarService();
  calendarCtrl.print();

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
      obj.listBox += `<li class="JsCal"></li>`
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
        if ((firstDay + i) % 7 < 2 || nationalHoliday.includes(currentDatYMD))
          className += " holiday";

        //2-2.是否客滿
        const currentBook = booked.find((item) => item.date === currentDatYMD);
        currentBook &&
          Object.values(currentBook.sellout).reduce((a, c) => a + c, 0) ===
          pallet.count &&
          (className += " fullDay");
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

  //切換月份
  const changeMonth = (count) => {
    theDay = theDay.add(count, "month");
    chooseDays[0] = null;
    chooseDays[1] = null;
    objL.listBox = "";
    objL.thisDate = theDay;
    objR.listBox = "";
    objR.thisDate = theDay.add(1, "month");
  }
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
    },

    choose: (node) => {
      chooseList(node);
    },
    refresh: tablePrint,
  };

};
