//公用變數區
const fetchPath = '../db.json';
let nationalHoliday, pallet, booked;

//初始化區
fetchData();

//私有方法區private method
async function fetchData() {
  const response = await fetch(fetchPath, { method: 'GET' });
  const json = await response.json();
  ({ nationalHoliday, pallet, booked } = json);

}