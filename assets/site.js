
(function(){
  "use strict";

  var PAGES = {home:'index.html',gallery:'index.html',news:'news.html',about:'about.html',framework:'framework.html',expertise:'expertise.html',curation:'curation.html',events:'events.html',reports:'reports.html',pubs:'pubs.html',roles:'roles.html',speaking:'speaking.html',contact:'contact.html'};

  var $  = function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var $$ = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };
  var safe = function(fn){ try { fn(); } catch(e){ console.warn('[site]', e); } };

  /* ---- footer year ---- */
  safe(function(){
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();
  });

  /* ---- sticky header ---- */
  var header = document.getElementById('header');
  safe(function(){
    var onScroll = function(){
      if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
  });

  /* ---- smooth scrolling to sections (event delegation: survives any DOM rewrite) ---- */
  var navList = document.getElementById('navList');
  safe(function(){
    var goTo = function(id){
      var t = document.getElementById(id);
      if (!t){ if (PAGES[id]) location.href = PAGES[id]; return; }
      var h = header ? header.getBoundingClientRect().height : 0;
      var start = window.pageYOffset || document.documentElement.scrollTop || 0;
      var y = t.getBoundingClientRect().top + start - h - 12;
      if (y < 0) y = 0;

      try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) {}

      window.setTimeout(function(){
        var now = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (Math.abs(now - start) < 4 && Math.abs(y - start) > 4) {
          try { window.scrollTo(0, y); } catch (e) {}
          var after = window.pageYOffset || document.documentElement.scrollTop || 0;
          if (Math.abs(after - start) < 4) {
            t.scrollIntoView();
            window.scrollBy(0, -(h + 12));
          }
        }
      }, 350);
    };

    /* one listener on the document — never lost, whatever the language */
    document.addEventListener('click', function(ev){
      var el = ev.target && ev.target.closest ? ev.target.closest('[data-scroll]') : null;
      if (!el) return;
      ev.preventDefault();
      goTo(el.getAttribute('data-scroll'));
      if (navList) navList.classList.remove('open');
    });
  });

  /* ---- mobile menu ---- */
  safe(function(){
    var mt = document.getElementById('menuToggle');
    if (!mt || !navList) return;
    mt.addEventListener('click', function(e){
      e.stopPropagation();
      navList.classList.toggle('open');
    });
    /* tap a nav link: close menu, then browser jumps to the section */
    navList.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ navList.classList.remove('open'); });
    });
    /* tap outside the panel: close menu */
    document.addEventListener('click', function(e){
      if (navList.classList.contains('open') && !navList.contains(e.target)) {
        navList.classList.remove('open');
      }
    });
  });

  /* ---- reveal on scroll ---- */
  safe(function(){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    $$('.reveal').forEach(function(el){ io.observe(el); });
  });

  /* ---- publication filters ---- */
  safe(function(){
    var fb = $$('.pf-btn'), pi = $$('#pubList .pub-item');
    fb.forEach(function(b){
      b.addEventListener('click', function(){
        fb.forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        var c = b.getAttribute('data-cat');
        pi.forEach(function(i){
          i.classList.toggle('hide', !(c === 'all' || i.getAttribute('data-cat') === c));
        });
      });
    });
  });

  /* ---- contact form (Netlify Forms, AJAX) ---- */
  safe(function(){
    var form = document.getElementById('cForm');
    if (!form) return;
    var btn = document.getElementById('cfBtn');
    var status = document.getElementById('cfStatus');
    var msg = {
      zh:{sending:'傳送中…', ok:'已送出，感謝您的來信！', err:'傳送失敗，請稍後再試或直接來信 roywu@gepac.com.tw'},
      en:{sending:'Sending…', ok:'Sent — thank you for your message!', err:'Failed to send. Please try again or email roywu@gepac.com.tw'},
      ja:{sending:'送信中…', ok:'送信しました。ありがとうございます！', err:'送信に失敗しました。後ほどお試しください。'},
      ko:{sending:'전송 중…', ok:'전송되었습니다. 감사합니다!', err:'전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'}
    };
    var curLang = function(){
      var c = document.documentElement.classList;
      if (c.contains('lang-en')) return 'en';
      if (c.contains('lang-ja')) return 'ja';
      if (c.contains('lang-ko')) return 'ko';
      return 'zh';
    };
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var m = msg[curLang()], keep = btn.innerHTML;
      btn.disabled = true; btn.textContent = m.sending; status.textContent = '';
      fetch('/', {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams(new FormData(form)).toString()
      }).then(function(r){
        if (!r.ok) throw new Error(r.status);
        status.textContent = m.ok; form.reset();
      }).catch(function(){
        status.textContent = m.err;
      }).then(function(){
        btn.disabled = false; btn.innerHTML = keep;
      });
    });
  });

  /* ---- language switch: 中 / EN / 日 / 한 ---- */
  safe(function(){
    var i18n  = $$('[data-en]');
    i18n.forEach(function(el){ el.dataset.zh = el.innerHTML; });
    var picks = $$('#langPick .lg');
    var names = {zh:'zh-Hant', en:'en', ja:'ja', ko:'ko'};
    var setLang = function(lang){
      i18n.forEach(function(el){
        el.innerHTML = (lang === 'zh') ? el.dataset.zh : (el.dataset[lang] || el.dataset.zh);
      });
      document.documentElement.lang = names[lang] || 'zh-Hant';
      ['lang-en','lang-ja','lang-ko'].forEach(function(c){
        document.documentElement.classList.remove(c);
      });
      if (lang !== 'zh') document.documentElement.classList.add('lang-' + lang);
      picks.forEach(function(b){ b.classList.toggle('active', b.dataset.lang === lang); });
      try{ localStorage.setItem('siteLang', lang); }catch(e){}
    };
    picks.forEach(function(b){
      b.addEventListener('click', function(){ setLang(b.dataset.lang); });
    });
     var saved = 'zh';
    try{ saved = localStorage.getItem('siteLang') || 'zh'; }catch(e){}
    if (saved !== 'zh') setLang(saved);
  });

  /* ---- mark the current page in the nav ---- */
  safe(function(){
    var path = location.pathname.split('/').pop() || 'index.html';
    $$('#navList a[data-scroll]').forEach(function(a){
      if ((PAGES[a.getAttribute('data-scroll')] || '') === path) a.classList.add('active');
    });
  });

  /* ---- highlight the section currently in view ---- */
  safe(function(){
    var links = $$('#navList a[data-scroll]');
    var secs  = links.map(function(a){
      return document.getElementById(a.getAttribute('data-scroll'));
    }).filter(Boolean);
    var spy = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (e.isIntersecting){
          links.forEach(function(a){
            a.classList.toggle('active', a.getAttribute('data-scroll') === e.target.id);
          });
        }
      });
    }, {rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(sec){ spy.observe(sec); });
  });

})();

  /* ---- photo carousel ---- */
  (function(){
    var c = document.getElementById('photoCarousel');
    if(!c) return;
    var track = c.querySelector('.carousel-track');
    var slides = c.querySelectorAll('.carousel-slide');
    var dotsWrap = c.querySelector('.carousel-dots');
    var idx = 0, n = slides.length, timer;
    for(var i=0;i<n;i++){
      var d = document.createElement('button');
      (function(k){ d.addEventListener('click', function(){ go(k); restart(); }); })(i);
      dotsWrap.appendChild(d);
    }
    var dots = dotsWrap.children;
    function go(k){
      idx = (k+n)%n;
      track.style.transform = 'translateX(-'+(idx*100)+'%)';
      for(var i=0;i<n;i++) dots[i].className = (i===idx)?'on':'';
    }
    function restart(){ clearInterval(timer); timer = setInterval(function(){ go(idx+1); }, 4000); }
    c.querySelector('.prev').addEventListener('click', function(){ go(idx-1); restart(); });
    c.querySelector('.next').addEventListener('click', function(){ go(idx+1); restart(); });
    var sx = null;
    c.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive:true});
    c.addEventListener('touchend', function(e){
      if(sx===null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if(Math.abs(dx) > 40){ go(idx + (dx<0?1:-1)); restart(); }
      sx = null;
    }, {passive:true});
    go(0); restart();
  })();
