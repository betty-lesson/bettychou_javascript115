
//註解
/*多行
註解*/
const text = "Hello, World!";
const num = 50 + 666;
console.log(text + " " + num);

/*script要寫在哪都可以，但要注意如果做DOM的話
*script要放在body內的最後面
*就是要等到DOM讀取完後才能操作DOM
*才不會報錯
*/
//注意順序，要先有h1才能改變h1的內容
document.querySelector("h1").innerText = "我把H1文字改掉了";