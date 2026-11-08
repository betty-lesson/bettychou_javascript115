//公用變數區
/*dayjs init*/
dayjs.locale('zh-tw');
dayjs.extend(window.dayjs_plugin_localeData);
dayjs.extend(dayjs_plugin_isSameOrBefore);

const fetchPath = './db.json';
let nationalHoliday, pallet, booked;

//初始化區
fetchData();

//私有方法區private method
async function fetchData() {
  const response = await fetch(fetchPath, { method: 'GET' });
  const json = await response.json();
  ({ nationalHoliday, pallet, booked } = json);

  calenderService();
}

const calenderService = () => {
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
      obj.listBox += `<li class="${className}">${i}</li>`;
    }

    obj.title = `${dayjs.months()[obj.thisDate.month()]}${obj.thisDate.year()}`;

    // return obj;
  };

  //印出行事曆
  const listPrint = () => {
    listMaker(objL);
    listMaker(objR);

    // console.log(objL);

    document.querySelector(".leftDayList").innerHTML = objL.listBox;
    document.querySelector(".rightDayList").innerHTML = objR.listBox;
    document.querySelector(".leftBar>h4").innerHTML = objL.title;
    document.querySelector(".rightBar>h4").innerHTML = objR.title;
  };

  listPrint();
};
