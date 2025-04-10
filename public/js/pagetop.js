// 画面を100pxスクロールしたら、表示する
window.addEventListener('scroll', function () {
  const pagetop = document.getElementById('pagetop');// pagetopを取得
  const scroll = window.scrollY;// 縦方向のスクロール量を取得

  // 100px以上表示
  if (scroll > 100) {
    pagetop.style.opacity = '1';
  // 100px以下非表示
  } else {
    pagetop.style.opacity = '0';
  }
});

// ページトップまでスムーズに自動スクロールさせるイベントを追加
document.addEventListener('DOMContentLoaded', function () {
  const pagetop = document.getElementById('pagetop');// pagetopを取得

  pagetop.addEventListener('click', () => {
    // スクロールさせる条件を指定
    window.scrollTo({
      'top': 0,
      'behavior': 'smooth'
    });
  });
});
