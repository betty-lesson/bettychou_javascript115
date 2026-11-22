//public variables 共用變數
const time = document.querySelector('#time');
const combo = document.querySelector('#combo');
const startBtn = document.querySelector('.control>button');
const animals = document.querySelectorAll('.imgs-box>img');
const GAME_TIME = 60; //遊戲時間，秒
const SHOW_RANGE = [2, 4]; //出現範圍，秒
// const MIN_DELAY = 2; //最小延遲，秒
// const MAX_DELAY = 4; //最大延遲，秒
const imgPath = {
    red: './img/on.png',
    green: './img/off.png',
    yellow: './img/state.png',
};
let score = 0;
const MAX_COMBO = 20; //得分機會次數，滿分100分，20次得分機會，每次5分
const codeMap = {
    Numpad1: 6,
    Numpad2: 7,
    Numpad3: 8,
    Numpad4: 3,
    Numpad5: 4,
    Numpad6: 5,
    Numpad7: 0,
    Numpad8: 1,
    Numpad9: 2,
};





//init 初始化區
startBtn.addEventListener('click', startGame);
animals.forEach((item, index) =>
    item.addEventListener('click', (e) => getScore(e.target)),
);
document.addEventListener('keydown', (e) => {
    console.log(codeMap[e.code]);
    getScore(animals[codeMap[e.code]]);
});//讓數字鍵也能操作

//private method 方法區

/*遊戲開始*/
function startGame() {
    //初始化遊戲
    startBtn.disabled = true;
    startBtn.textContent = '遊戲進行中...';
    let sec = GAME_TIME;
    time.textContent = sec;
    score = 0;
    combo.textContent = score;

    //計時
    const timerId = setInterval(() => {
        if (sec === 0) {
            clearInterval(timerId);
            startBtn.disabled = false;
            startBtn.textContent = '遊戲開始';
            return;
        }
        time.textContent = --sec;
    }, 1000);

    //產生100個可得分事件
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const space = Math.floor(Math.random() * animals.length);
            const [a, b] = SHOW_RANGE;
            const delay = Math.floor(Math.random() * (Math.abs(a - b) + 1) + Math.min(a, b)); //隨機2~4秒
            toRedEvent({ space, delay });
        },
            Math.floor(Math.random() * (GAME_TIME - 3) * 1000)
        ); //0~56999.999毫秒
    }
    console.log(timerId)
}

/*安排紅色事件*/
function toRedEvent({ space, delay }) {
    if (!animals[space].src.includes('state')) {
        //該位置不是黃色空間，重新安排執行，放慢速度避免全滿時瞬間狂問占用資源
        setTimeout(
            () =>
                toRedEvent({
                    space: Math.floor(Math.random() * animals.length),
                    delay,
                }),
            100
        );
        return;
    }
    //排入紅色 
    animals[space].src = imgPath.red;

    //這邊的setTimeout是讓紅色自己消失，如果玩家點掉紅色，
    //理所當然這裡的定時器toYellow要消除，才能避免同位置的紅色事件下次不會消失太快
    animals[space].dataset.timeId = setTimeout(
        () => (animals[space].src = imgPath.yellow),
        delay * 1000,
    );
}

/*獲取得分*/
function getScore(animal) {
    //不是紅色都忽略
    if (!animal.src.includes('on')) return;

    //combo.textContent = parseInt(combo.textContent) + 1;
    combo.textContent = Math.floor((++score / MAX_COMBO) * 10000) / 100; //四捨五入到小數點後兩位
    animal.src = imgPath.green;
    clearTimeout(animal.dataset.timeId); //消除被玩家點掉的該格的定時器
    animal.dataset.timeId = null; //清除被玩家點掉的計時器的Id

    setTimeout(() => (animal.src = imgPath.yellow), 1000)
    // console.log(animal, index);
}