/* 板書の拡大表示（<dialog>）＋板書を含むセクションの表示保証（kanri-juku-hikaku / online-katei-kyoshi 共通）。
   JS無効・<dialog>非対応のブラウザでは、リンク先の1600px画像がそのまま開く */
(function(){
  var root=document.getElementById('lesson-boards');
  if(!root)return;
  /* 板書で縦に長くなったため、背の低い画面では threshold:0.08 に届かないことがある。1pxでも入れば表示する */
  var sec=root.closest('.section');
  if(sec&&'IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){sec.classList.add('visible');io.disconnect()}});
    io.observe(sec);
  }
  var dlg=document.getElementById('lsnDialog');
  if(!dlg||typeof dlg.showModal!=='function')return;
  var links=[].slice.call(root.querySelectorAll('a.lsn-fig')),
      img=dlg.querySelector('.lsn-dialog-view img'),view=dlg.querySelector('.lsn-dialog-view'),
      cap=document.getElementById('lsnDialogCap'),hint=dlg.querySelector('.lsn-dialog-hint'),
      cnt=dlg.querySelector('.lsn-dialog-count'),idx=0,opener=null;
  function show(i){
    idx=(i+links.length)%links.length;
    var a=links[idx],t=a.querySelector('img');
    img.alt=t.alt;
    img.src=t.currentSrc||t.src;                 /* 表示済みの画像を先に出し… */
    var hi=new Image();hi.onload=function(){if(links[idx]===a)img.src=a.href};hi.src=a.href; /* …1600px版に差し替え */
    cap.textContent=a.getAttribute('data-cap');
    cnt.textContent=(idx+1)+' / '+links.length;
    view.scrollLeft=0;view.scrollTop=0;
    requestAnimationFrame(function(){var x=view.scrollWidth>view.clientWidth+2,y=view.scrollHeight>view.clientHeight+2;hint.hidden=!(x||y);hint.textContent=x?'← 横にスクロールして読めます →':'↓ 下にスクロールして読めます';});
  }
  links.forEach(function(a,i){
    a.addEventListener('click',function(e){
      if(e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return; /* 新しいタブで開く操作はそのまま */
      e.preventDefault();opener=a;dlg.showModal();show(i); /* 開いてから描画（閉じている間はスクロール位置をリセットできないため） */
      document.documentElement.style.overflow='hidden';
    });
  });
  dlg.querySelector('.lsn-dialog-prev').addEventListener('click',function(){show(idx-1)});
  dlg.querySelector('.lsn-dialog-next').addEventListener('click',function(){show(idx+1)});
  dlg.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){e.preventDefault();show(idx-1)}
    else if(e.key==='ArrowRight'){e.preventDefault();show(idx+1)}
  });
  dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()}); /* 背景（ダイアログの外）をクリックで閉じる。全画面時の板書まわりの余白では閉じない */
  dlg.addEventListener('close',function(){             /* Esc・×・背景クリックのどれで閉じても */
    document.documentElement.style.overflow='';
    if(opener)opener.focus({preventScroll:true});      /* 開いた板書にフォーカスを戻す */
  });
})();
