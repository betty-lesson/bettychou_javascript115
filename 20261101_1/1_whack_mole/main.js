//public variables 共用變數
const time = document.querySelector('#time');
const combo = document.querySelector('#combo');
const startBtn = document.querySelector('.control>button');
const animals = document.querySelectorAll('.imgs-box>img');
const GAME_TIME = 30; //遊戲時間，秒
const MIN_DELAY = 2; //最小延遲，秒
const MAX_DELAY = 4; //最大延遲，秒

//init 初始化區
startBtn.addEventListener('click', startGame);

//private method 方法區

//遊戲開始
function startGame() {
    //初始化遊戲
    startBtn.disabled = true;
    startBtn.textContent = '遊戲進行中...';
    let sec = GAME_TIME;
    time.textContent = sec;
    combo.textContent = 0;

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
            const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY); //2~4秒
            toRedEvent(space, delay);
        },
            Math.floor(Math.random() * (GAME_TIME - 3) * 1000)
        ); //0~56999.999毫秒
    }
    console.log(timerId)
}

//產生可得分事件
function toRedEvent(space, delay) {
    console.log(space, delay);
}