(function(){
  'use strict';
  var D = window.VV, $ = function(id){ return document.getElementById(id); };
  var app = $('app');
  var cats = D.cats, P = D.products;
  var catBy = {}; cats.forEach(function(c,i){ c.index=i; catBy[c.slug]=c; });
  var all = []; cats.forEach(function(c){ c.items.forEach(function(h){ all.push(h); }); });
  var money = function(n){ return '$' + n; };
  var two = function(n){ return (n<10?'0':'') + n; };
  var IMG = 'img/';
  var S = { view:'home', filter:'shop', piece:null, img:0, size:null, last:'home', list:'shop' };
  var narrow = window.matchMedia('(max-width:820px)');
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function soldOut(p){ return !p.v.some(function(v){ return v.a; }); }
  function priceOf(p){ return soldOut(p) ? 'Sold out' : money(p.p); }

  /* ---------- static parts ---------- */
  $('cats').innerHTML = '<a href="#shop" data-cat="shop">All</a>' + cats.map(function(c){ return '<a href="#'+c.slug+'" data-cat="'+c.slug+'">'+c.name+'</a>'; }).join('') + '<a href="#story" data-cat="story">Story</a>';
  var gl=''; for (var g=0;g<24;g++) gl+='<i></i>'; $('gridlines').innerHTML = gl;

  /* ---------- names: one word ---------- */
  function nameHTML(p){ return '<span class="nm" data-t="'+esc(p.t)+'">'+esc(p.t)+'</span>' + (p.s ? '<span class="sub">'+esc(p.s)+'</span>' : ''); }
  function label(p){ return p.t + (p.s ? ' ' + p.s : ''); }

  /* ---------- the wall ---------- */
  var home = document.querySelector('.v-home'), catalog = $('catalog'), wall = $('wall');
  wall.innerHTML = all.map(function(h){ return cellHTML(h); }).join('');
  var cells = [].slice.call(wall.children);
  function setFilter(f){
    var c = catBy[f];
    cells.forEach(function(t){ t.hidden = !!c && t.getAttribute('data-cat')!==f; });
    if (S.filter !== f){ wall.classList.remove('swap'); void wall.offsetWidth; wall.classList.add('swap'); }
    S.filter = f;
  }
  /* ---------- the wall's surface: the Maitri print, faded, under heavy grain ---------- */
  (function(){
    var W = 240, H = 320, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'); x.strokeStyle = 'rgba(236,228,214,.2)'; x.lineWidth = 3.2; x.lineCap = 'square';
    function line(a,b,d,e){ x.beginPath(); x.moveTo(a + (Math.random()-.5)*1.6, b + (Math.random()-.5)*1.6); x.lineTo(d + (Math.random()-.5)*1.6, e + (Math.random()-.5)*1.6); x.stroke(); }
    function chevrons(cx){ for (var y=10; y<H; y+=20){ line(cx-10,y+10,cx,y); line(cx,y,cx+10,y+10); } }
    function house(cx, y, up){                       // a pointed roof over a block of bars, as on the kimono
      var w = 46, t = up ? y : y+86, d = up ? 1 : -1;
      line(cx-w/2, t+d*26, cx, t); line(cx, t, cx+w/2, t+d*26);
      line(cx-w/2+9, t+d*26, cx, t+d*10); line(cx, t+d*10, cx+w/2-9, t+d*26);
      for (var k=0;k<5;k++) line(cx-w/2, t+d*(38+k*11), cx+w/2, t+d*(38+k*11));
    }
    function hatch(cx, y){ for (var k=0;k<5;k++) line(cx-20+k*10, y, cx-20+k*10, y+40); line(cx-24, y+52, cx+24, y+52); }
    chevrons(24); chevrons(144);
    house(84, 14, true); hatch(84, 122); house(84, 196, false);
    hatch(204, 8); house(204, 82, false); house(204, 196, true);
    var g = document.createElement('canvas'); g.width = g.height = 220;
    var gx = g.getContext('2d'), im = gx.createImageData(220,220), d = im.data;
    for (var i=0;i<d.length;i+=4){ var v = Math.random(); d[i]=d[i+1]=d[i+2]=255; d[i+3] = v > .5 ? Math.floor(Math.pow(v,3)*120) : 0; }
    gx.putImageData(im,0,0);
    catalog.style.setProperty('--print', 'url('+c.toDataURL()+')');
    app.style.setProperty('--grain', 'url('+g.toDataURL()+')');
  })();
  function fit(){ app.style.setProperty('--vh', home.clientHeight + 'px'); }
  fit(); window.addEventListener('resize', fit);

  function inCatalog(){ return home.scrollTop > home.clientHeight * .5; }
  function syncChrome(){
    var list = S.view==='home' && inCatalog();
    app.classList.toggle('solid', S.view==='home' && home.scrollTop > home.clientHeight - 80);
    [].forEach.call(document.querySelectorAll('#cats a'), function(a){
      var k = a.getAttribute('data-cat');
      a.setAttribute('aria-current', (list && k===S.filter) || (S.view==='piece' && S.piece && k===S.piece.c) || (S.view==='story' && k==='story'));
    });
  }
  home.addEventListener('scroll', syncChrome, { passive:true });
  function toCatalog(smooth){ home.scrollTo({ top:catalog.offsetTop, behavior: smooth ? 'smooth' : 'auto' }); }

  /* ---------- sound: the film carries the music ---------- */
  var film = $('film'), wantSound = true, soundBtn = $('soundBtn');
  function paintSound(){ var on = !film.muted && !film.paused; soundBtn.textContent = on ? 'Sound on' : 'Sound off'; soundBtn.setAttribute('aria-pressed', on); }
  function playFilm(){
    film.muted = !wantSound;
    var pr = film.play();
    if (pr && pr.catch) pr.then(paintSound).catch(function(){ film.muted = true; var p2 = film.play(); if (p2 && p2.catch) p2.catch(function(){}); paintSound(); });
    else paintSound();
  }
  function firstTouch(){ if (wantSound && (film.muted || film.paused)) playFilm(); }
  ['pointerdown','keydown'].forEach(function(ev){ window.addEventListener(ev, firstTouch, { once:true, capture:true }); });
  soundBtn.onclick = function(){ wantSound = film.muted || film.paused; playFilm(); };
  film.addEventListener('volumechange', paintSound);

  /* ---------- piece ---------- */
  var KIND = { kimonos:'Kimono', dresses:'Dress', tops:'Top', bottoms:'Bottom', layers:'Layer' };
  function cellHTML(h){
    var p = P[h];
    return '<a class="cell" href="#piece-'+h+'" data-cat="'+p.c+'" aria-label="'+esc(p.f)+', '+priceOf(p)+'">'
      + '<div class="box"><img class="cut" src="cut/'+h+'.webp" alt="" loading="lazy" draggable="false"></div>'
      + '<div class="cap">'+nameHTML(p)+'<span class="pr">'+priceOf(p)+'</span></div></a>';
  }
  var imgA = $('pieceImgA'), imgB = $('pieceImgB'), front = imgA, thumbs = $('thumbs');
  function showImg(i, instant){
    var p = S.piece; S.img = (i + p.i.length) % p.i.length;
    var next = front === imgA ? imgB : imgA, f = front;
    var done = function(){ f.classList.remove('on'); next.classList.add('on'); };
    next.onload = null; next.src = IMG + p.i[S.img]; next.alt = p.f + ', photo ' + (S.img+1);
    if (instant || next.complete) done(); else next.onload = done;
    front = next;
    $('pNum').textContent = two(S.img+1) + ' / ' + two(p.i.length);
    [].forEach.call(thumbs.children, function(b,k){ b.setAttribute('aria-selected', k===S.img); });
  }
  function buildPiece(p){
    var c = catBy[p.c], k = c.items.indexOf(p.h);
    S.size = null;
    $('pieceBack').href = '#' + S.list; $('pieceBackLabel').textContent = catBy[S.list] ? catBy[S.list].name : 'All';
    $('pieceCrumb').textContent = c.name + ', ' + two(k+1) + ' of ' + two(c.items.length);
    var ti = $('pieceTitle'); ti.textContent = p.t; ti.classList.toggle('long', p.t.length > 8);
    $('piecePrice').textContent = priceOf(p);
    $('pieceDesc').innerHTML = p.d.map(function(t){ return '<p>'+esc(t.replace(/([a-z]\.)([A-Z])/g,'$1 $2'))+'</p>'; }).join('');
    thumbs.innerHTML = p.i.map(function(f,i){ return '<button type="button" role="tab" data-i="'+i+'" aria-label="Photo '+(i+1)+'"><img src="'+IMG+f+'" alt=""></button>'; }).join('');
    var so = soldOut(p);
    $('sizes').innerHTML = p.v.map(function(v){ return '<button type="button" role="radio" aria-checked="false" data-id="'+v.id+'"'+(v.a?'':' disabled')+'>'+v.s+'</button>'; }).join('');
    var avail = p.v.filter(function(v){ return v.a; });
    if (avail.length === 1) pickSize(avail[0].id);
    var add = $('addBtn'); add.disabled = so; add.textContent = so ? 'Sold out' : 'Add to bag';
    $('buyNote').textContent = so ? 'This piece is sold out in every size.' : 'Shipping and taxes are calculated at checkout.';
    setNeighbor($('piecePrev'), c.items[k-1]); setNeighbor($('pieceNext'), c.items[k+1]);
    showImg(0, true);
    document.querySelector('.v-piece').scrollTop = 0;
  }
  function setNeighbor(a, h){ a.style.visibility = h ? '' : 'hidden'; if (h){ a.href = '#piece-'+h; a.querySelector('span').textContent = label(P[h]); } }
  function pickSize(id){
    S.size = String(id);
    [].forEach.call($('sizes').children, function(b){ b.setAttribute('aria-checked', b.getAttribute('data-id')===S.size); });
    if (!$('addBtn').disabled) $('addBtn').textContent = 'Add to bag';
  }
  $('sizes').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b && !b.disabled) pickSize(b.getAttribute('data-id')); });
  thumbs.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) showImg(+b.getAttribute('data-i')); });
  $('pPhoto').addEventListener('click', function(){ showImg(S.img+1); });


  /* a cutout turns a little toward the pointer as it crosses the piece */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    app.addEventListener('pointermove', function(e){
      var c = e.target.closest('.cell'); if (!c) return;
      var r = c.getBoundingClientRect(), k = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2)), img = c.querySelector('.cut');
      img.style.setProperty('--ry', (k * 24).toFixed(1) + 'deg'); img.style.setProperty('--tx', (k * 10).toFixed(1) + 'px'); img.style.setProperty('--rz', (k * 1.5).toFixed(2) + 'deg');
    });
    app.addEventListener('pointerout', function(e){
      var c = e.target.closest('.cell'); if (!c || c.contains(e.relatedTarget)) return;
      var img = c.querySelector('.cut'); img.style.setProperty('--ry','0deg'); img.style.setProperty('--tx','0px'); img.style.setProperty('--rz','0deg');
    });
  }

  /* ---------- story: four marks ---------- */
  var MARKS = [
    { id:'chevron', name:'Chevron', img:'media/pat-maitri.jpg', cap:'Maitri kimono, detail', on:['maitri'],
      see:'A column of arrowheads, one above the next, all pointing the same way.',
      read:'We read it as a path. It is the direction a family has been walking for longer than anyone can remember, and the reason the columns never turn back.',
      svg:'<svg viewBox="0 0 80 120"><path d="M20 38 40 18 60 38M20 66 40 46 60 66M20 94 40 74 60 94M20 122 40 102 60 122"/></svg>' },
    { id:'bars', name:'House', img:'media/pat-maitri.jpg', cap:'Maitri kimono, detail', on:['maitri'],
      see:'A pointed roof drawn twice, with five short bars stacked beneath it.',
      read:'We read it as the house and what it holds. The roof is shelter. The bars are what is stored under it: grain, cloth, the people inside.',
      svg:'<svg viewBox="0 0 80 120"><path d="M12 44 40 12 68 44M24 44 40 26 56 44M12 58H68M12 72H68M12 86H68M12 100H68M12 114H68"/></svg>' },
    { id:'tooth', name:'Tooth', img:'media/pat-midori.jpg', cap:'Haritha kimono, detail', on:['midori','aiko','hikari'],
      see:'Triangles set point to edge in a long band, like a row of teeth.',
      read:'We read it as a guard. Wherever it runs, down a seam or along a hem, it marks the edge of something worth keeping safe.',
      svg:'<svg viewBox="0 0 80 120"><path d="M14 8V112M14 8 62 26 14 44 62 62 14 80 62 98 14 112M62 8V112"/></svg>' },
    { id:'cross', name:'Crossroads', img:'media/pat-hikari.jpg', cap:'Prakasha kimono, detail', on:['hikari'],
      see:'A grid of small squares, each one crossed from corner to corner.',
      read:'We read it as the meeting place. Four roads arrive at one point, and the square repeats because every village has one.',
      svg:'<svg viewBox="0 0 80 120"><path d="M10 20H70V100H10ZM10 60H70M40 20V100M10 20 40 60 10 100M40 20 70 60 40 100M40 20 10 60 40 100M70 20 40 60 70 100"/></svg>' }
  ];
  var markAt = -1, story = document.querySelector('.v-story');
  function tileOf(m){                                  // the mark, repeated, becomes the page's surface
    var c = document.createElement('canvas'); c.width = 160; c.height = 240;
    var x = c.getContext('2d'); x.strokeStyle = 'rgba(236,228,214,.22)'; x.lineWidth = 3; x.lineCap = 'square';
    var p = new Path2D(m.svg.match(/d="([^"]+)"/)[1]);
    x.stroke(p); x.translate(80, 120); x.stroke(p); x.translate(-160, 0); x.stroke(p); x.translate(160, -240); x.stroke(p); x.translate(-160,0); x.stroke(p);
    return 'url(' + c.toDataURL() + ')';
  }
  $('marks').innerHTML = MARKS.map(function(m,i){
    return '<section class="mk" data-i="'+i+'" aria-label="'+m.name+'"><figure class="mk-cloth"><img src="'+m.img+'" alt="'+m.cap+'" loading="lazy"><figcaption>'+m.cap+'</figcaption></figure>'
      + '<div class="mk-text"><div class="mk-glyph" aria-hidden="true">'+m.svg+'</div><h4 class="mk-name">'+m.name+'</h4><p class="mk-see">'+m.see+'</p><p class="mk-read">'+m.read+'</p>'
      + '<p class="mk-on">Worn on'+m.on.map(function(h){ return '<a href="#piece-'+h+'">'+esc(P[h].t)+'</a>'; }).join('')+'</p></div></section>';
  }).join('');
  function showMark(i){
    if (i === markAt) return; markAt = i;
    var sp = $('storyPat'); sp.style.backgroundImage = tileOf(MARKS[i]); sp.style.backgroundSize = '160px 240px';
  }
  if ('IntersectionObserver' in window){
    var mio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) showMark(+e.target.getAttribute('data-i')); }); }, { root:story, rootMargin:'-45% 0px -45% 0px' });
    [].forEach.call(document.querySelectorAll('.mk'), function(el){ mio.observe(el); });
  }

  /* ---------- bag ---------- */
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem('vv-bag') || '[]').filter(function(l){ return P[l.h]; }); } catch(e){ bag = []; }
  function saveBag(){ try { localStorage.setItem('vv-bag', JSON.stringify(bag)); } catch(e){} }
  function renderBag(){
    var n = bag.reduce(function(s,l){ return s+l.q; }, 0), sub = bag.reduce(function(s,l){ return s + l.q*P[l.h].p; }, 0);
    $('bagCount').textContent = n; $('bagBtn').classList.toggle('has', n>0);
    $('bagEmpty').hidden = n>0; $('bagFoot').hidden = n===0; $('bagList').hidden = n===0;
    $('bagList').innerHTML = bag.map(function(l,i){
      var p = P[l.h];
      return '<li><img src="'+IMG+p.i[p.i.length-1]+'" alt=""><div><b>'+esc(label(p))+'</b><span class="meta">'+catBy[p.c].name+', size '+l.s+'</span>'
        + '<div class="qty"><button type="button" data-act="dec" data-i="'+i+'" aria-label="One fewer">&minus;</button><span>'+l.q+'</span><button type="button" data-act="inc" data-i="'+i+'" aria-label="One more">+</button></div></div>'
        + '<div class="right"><span>'+money(l.q*p.p)+'</span><button type="button" class="rm" data-act="rm" data-i="'+i+'">Remove</button></div></li>';
    }).join('');
    $('bagSub').textContent = money(sub);
    $('checkout').href = D.store + '/cart/' + bag.map(function(l){ return l.id+':'+l.q; }).join(',');
    saveBag();
  }
  $('bagList').addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    var i = +b.getAttribute('data-i'), act = b.getAttribute('data-act');
    if (act==='inc') bag[i].q++; else if (act==='dec'){ if (--bag[i].q < 1) bag.splice(i,1); } else bag.splice(i,1);
    renderBag();
  });
  $('addBtn').onclick = function(){
    var p = S.piece; if (!p || soldOut(p)) return;
    if (!S.size){ this.textContent = 'Pick a size first'; return; }
    var v = p.v.filter(function(v){ return String(v.id)===S.size; })[0];
    var line = bag.filter(function(l){ return String(l.id)===S.size; })[0];
    if (line) line.q++; else bag.push({ h:p.h, id:v.id, s:v.s, q:1 });
    renderBag(); openBag(true);
  };
  var bagEl = $('bag'), bagOpen = false, lastFocus = null;
  function openBag(o){
    bagOpen = o; bagEl.classList.toggle('open', o); $('scrim').hidden = !o;
    bagEl.setAttribute('aria-hidden', !o); bagEl.inert = !o;
    if (o){ lastFocus = document.activeElement; $('bagClose').focus({preventScroll:true}); } else if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  }
  $('bagBtn').onclick = function(){ openBag(true); }; $('bagClose').onclick = $('scrim').onclick = function(){ openBag(false); };
  var toastT; function toast(t){ var el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function(){ el.classList.remove('on'); }, 1600); }

  /* ---------- grid overlay ---------- */
  function toggleGrid(){ var gl = $('gridlines'); gl.hidden = !gl.hidden; $('gridBtn').setAttribute('aria-pressed', !gl.hidden); }
  $('gridBtn').onclick = toggleGrid;

  /* ---------- routing ---------- */
  var views = {}; [].forEach.call(document.querySelectorAll('.view'), function(v){ views[v.getAttribute('data-name')] = v; });
  function show(name){
    S.view = name; app.setAttribute('data-view', name);
    Object.keys(views).forEach(function(k){ views[k].classList.toggle('on', k===name); views[k].inert = k!==name; });
    $('sysLink').setAttribute('aria-pressed', name==='system');
    $('sysLink').href = name==='system' ? '#'+S.last : '#system';
    $('sysLink').textContent = name==='system' ? 'Close system' : 'System';
    cur.classList.remove('on'); syncChrome();
  }
  var started = false;
  function route(){
    var h = (location.hash || '#home').slice(1), from = S.view, first = !started; started = true;
    if (bagOpen) openBag(false);
    if (h !== 'system') S.last = h;
    if (h==='shop' || catBy[h]){
      var same = S.filter === h && (from==='piece' || from==='system') && inCatalog();
      setFilter(h); S.list = h; show('home');
      if (!same) toCatalog(from==='home' && !first);
    } else if (h.indexOf('piece-')===0 && P[h.slice(6)]){
      S.piece = P[h.slice(6)]; buildPiece(S.piece); show('piece');
    } else if (h==='story'){ showMark(0); show('story'); story.scrollTop = 0; }
    else if (h==='system'){ show('system'); }
    else { show('home'); home.scrollTo({ top:0, behavior: from==='home' && !first ? 'smooth' : 'auto' }); }
  }
  window.addEventListener('hashchange', route);
  function go(h){ if (location.hash === '#'+h) route(); else location.hash = h; }
  // clicking the filter you are already on still takes you to the wall
  $('cats').addEventListener('click', function(e){ var a = e.target.closest('a'); if (a && location.hash === a.getAttribute('href')){ e.preventDefault(); route(); } });

  /* ---------- product page: wheel, arrows and swipe page through the photos ---------- */
  var acc = 0, lock = 0;
  app.addEventListener('wheel', function(e){
    if (S.view !== 'piece' || narrow.matches || bagOpen) return;
    e.preventDefault();
    var now = Date.now(); if (now < lock) return;
    acc += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    if (Math.abs(acc) > 40){ showImg(S.img + (acc>0?1:-1)); acc = 0; lock = now + 520; }
  }, { passive:false });
  var t0 = null;
  $('pPhoto').addEventListener('touchstart', function(e){ var t = e.touches[0]; t0 = { x:t.clientX, y:t.clientY }; }, { passive:true });
  $('pPhoto').addEventListener('touchend', function(e){
    if (!t0) return; var t = e.changedTouches[0], dx = t.clientX-t0.x, dy = t.clientY-t0.y; t0 = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)){ e.preventDefault(); showImg(S.img + (dx<0?1:-1)); }
  });
  document.addEventListener('keydown', function(e){
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k==='Escape'){
      if (bagOpen) openBag(false); else if (S.view==='piece') go(S.list); else if (S.view==='story') go('shop'); else if (S.view==='system') go(S.last);
      return;
    }
    if (bagOpen) return;
    if (k==='g' || k==='G'){ toggleGrid(); return; }
    if (S.view==='piece'){
      if (k==='ArrowRight'){ e.preventDefault(); showImg(S.img+1); }
      else if (k==='ArrowLeft'){ e.preventDefault(); showImg(S.img-1); }
    }
  });

  /* ---------- pointer label ---------- */
  var cur = $('cur');
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    app.addEventListener('pointermove', function(e){
      var el = e.target.closest('[data-cur]'), t = el && el.getAttribute('data-cur');
      if (t){ cur.textContent = t; cur.style.transform = 'translate('+(e.clientX+16)+'px,'+(e.clientY+18)+'px)'; cur.classList.add('on'); }
      else cur.classList.remove('on');
    });
    app.addEventListener('pointerleave', function(){ cur.classList.remove('on'); });
  }

  renderBag(); setFilter('shop'); route(); playFilm();
})();
