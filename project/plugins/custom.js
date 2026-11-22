onload = () => {
  //素材提供的瀑布流，非本教學範圍
  const grid = document.querySelector('#lokiPark article.row');
  new Masonry(grid, { percentPosition: 'true' });

  //menu 背景特效(隨scroll改變)
  const checkMenuByScroll = () => {
    document.querySelector('nav.navbar').classList.toggle('init', scrollY <= 500 && window.innerWidth >= 992);
  };

  window.addEventListener('scroll', checkMenuByScroll);
  window.addEventListener('resize', checkMenuByScroll);
  checkMenuByScroll();

  //啟用aos
  // AOS.init();
  AOS.init({
    offset: 140, //這是觸發動畫的起始位置，預設是120
    duration: 800, //動畫持續時間，預設是400
    easing: 'ease', //動畫的緩動效果，預設是'ease'
    //once: true, 是否只觸發一次，預設是false
  });

  //cookie同意提示
  const cookieStr = 'cookieAgree=yes';
  const cookieNode = document.querySelector('#lokiCookie');

  //先判斷之前有無同意，還沒同意就跳cookie給他看
  if (!document.cookie.includes(cookieStr)) {
    // console.log('show it');
    cookieNode.style.display = 'block';
    cookieNode.querySelector('button').addEventListener('click', () => {
      // console.log('todo');
      document.cookie = `${cookieStr}; max-age=${60 * 60 * 24 * 180}; sameSite=Lax`;
      cookieNode.remove();
    });

  } else cookieNode.remove();
}