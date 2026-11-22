(function(){
  'use strict';
  var D = window.VV, $ = function(id){ return document.getElementById(id); };
  var app = $('app');
  var cats = D.cats, P = D.products;
  var catBy = {}; cats.forEach(function(c,i){ c.index=i; catBy[c.slug]=c; });
  var all = []; cats.forEach(function(c){ c.items.forEach(function(h){ all.push(h); }); });
  var CURS = [['USD','US dollar'],['EUR','Euro'],['GBP','British pound'],['INR','Indian rupee'],['CAD','Canadian dollar'],['AUD','Australian dollar'],['AED','UAE dirham'],['JPY','Japanese yen']];
  var cur = 'USD'; try { var sc = localStorage.getItem('vv-cur'); if (sc && CURS.some(function(c){ return c[0]===sc; })) cur = sc; } catch(e){}
  function price(p){ return p.pr[cur]; }
  var money = function(n){ try { return new Intl.NumberFormat('en', { style:'currency', currency:cur, minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); } catch(e){ return cur + ' ' + n; } };
  var two = function(n){ return (n<10?'0':'') + n; };
  var IMG = 'img/';
  var S = { view:'home', filter:'shop', piece:null, img:0, size:null, last:'home', list:'shop' };
  var narrow = window.matchMedia('(max-width:820px)');
  function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function soldOut(p){ return !p.v.some(function(v){ return v.a; }); }
  function priceOf(p){ return soldOut(p) ? 'Sold out' : money(price(p)); }

  /* ---------- static parts ---------- */
  $('cats').innerHTML = '<a href="#shop" data-cat="shop">All</a>' + cats.map(function(c){ return '<a href="#'+c.slug+'" data-cat="'+c.slug+'">'+c.name+'</a>'; }).join('') + '<a href="#story" data-cat="story">Story</a>';
  $('menuList').innerHTML = '<a href="#shop" data-cat="shop"><span>All pieces</span><i>'+all.length+'</i></a>'
    + cats.map(function(c){ return '<a href="#'+c.slug+'" data-cat="'+c.slug+'"><span>'+c.name+'</span><i>'+c.items.length+'</i></a>'; }).join('')
    + '<a class="m-story" href="#story" data-cat="story"><span>Story</span><i>The collection and its prints</i></a>';
  var gl=''; for (var g=0;g<24;g++) gl+='<i></i>'; $('gridlines').innerHTML = gl;

  /* ---------- names: one word ---------- */
  function nameHTML(p){ return '<span class="nm" aria-label="'+esc(p.t)+'">'+p.t.split('').map(function(ch){ return '<i aria-hidden="true">'+esc(ch)+'</i>'; }).join('')+'</span>' + (p.s ? '<span class="sub">'+esc(p.s)+'</span>' : ''); }
  function label(p){ return p.t + (p.s ? ' ' + p.s : ''); }

  /* ---------- the wall ---------- */
  var home = document.querySelector('.v-home'), catalog = $('catalog'), wall = $('wall');
  wall.innerHTML = all.map(function(h){ return cellHTML(h); }).join('');
  var cells = [].slice.call(wall.children);
  /* ---------- featured: ten pieces turning in a row, with a buy card for the one in front ---------- */
  var FEAT = ['yugen','maitri','qing','hikari','mani','ekatva','padma','dolma','darvish','yashodhara'];
  var feat = { i:0, timer:null, held:false, paused:false, size:null };
  var featEl = $('feat'), featStage = $('featStage'), featCard = $('featCard'), featDots = $('featDots'), featN = $('featN'), featPause = $('featPause');
  var FEAT_MS = 6500, featCalm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function featDist(k){ var n = FEAT.length, d = ((k - feat.i) % n + n) % n; return d > n/2 ? d - n : d; }
  function featBuild(){
    featStage.innerHTML = FEAT.map(function(h,k){
      return '<a class="fs" href="#piece-'+h+'" data-k="'+k+'" aria-label="'+esc(P[h].f)+'"><img src="'+IMG+P[h].i[0]+'" alt="" draggable="false"'+(k>2?' loading="lazy"':'')+'></a>';
    }).join('');
    featDots.innerHTML = FEAT.map(function(h,k){ return '<button type="button" data-k="'+k+'" aria-label="'+esc(P[h].t)+'"></button>'; }).join('');
    featPlace();
  }
  function featPlace(){
    [].forEach.call(featStage.children, function(el){
      var d = featDist(+el.getAttribute('data-k')), a = Math.abs(d);
      el.classList.toggle('front', d === 0);
      el.style.zIndex = 10 - a;
      el.style.opacity = a > 2 ? 0 : 1 - a * 0.3;
      el.style.visibility = a > 2 ? 'hidden' : 'visible';
      el.style.transform = 'translate3d(' + (d * 62) + '%,0,' + (-a * 180) + 'px) rotateY(' + (-d * 28) + 'deg) scale(' + (1 - a * 0.12) + ')';
      el.tabIndex = d === 0 ? 0 : -1;
    });
    [].forEach.call(featDots.children, function(b,k){ b.setAttribute('aria-current', k === feat.i); });
    featN.textContent = two(feat.i + 1) + ' / ' + two(FEAT.length);
    featPause.textContent = feat.paused ? 'Play' : 'Pause';
    featRenderCard();
  }
  function featRenderCard(){
    var p = P[FEAT[feat.i]], so = soldOut(p), avail = p.v.filter(function(v){ return v.a; });
    var ok = feat.size && p.v.some(function(v){ return String(v.id) === feat.size && v.a; });
    if (!ok) feat.size = avail.length === 1 ? String(avail[0].id) : null;
    featCard.innerHTML = '<p class="fc-kind">' + KIND[p.c] + '</p>'
      + '<h3 class="fc-name">' + esc(p.t) + '</h3>'
      + '<p class="fc-price">' + priceOf(p) + '</p>'
      + '<p class="fc-row"><span>Size</span><span>' + (so ? 'Sold out' : feat.size ? '' : 'Select one') + '</span></p>'
      + '<div class="fc-sizes">' + p.v.map(function(v){ return '<button type="button" data-id="' + v.id + '" aria-pressed="' + (String(v.id) === feat.size) + '"' + (v.a ? '' : ' disabled') + '>' + v.s + '</button>'; }).join('') + '</div>'
      + '<button type="button" class="btn solid fc-add" id="fcAdd"' + (so ? ' disabled' : '') + '>' + (so ? 'Sold out' : 'Add to bag') + '</button>'
      + '<a class="link fc-view" href="#piece-' + p.h + '">View the piece</a>';
  }
  function addLine(p, sizeId){
    var v = p.v.filter(function(x){ return String(x.id) === String(sizeId); })[0]; if (!v) return;
    var line = bag.filter(function(l){ return String(l.id) === String(sizeId); })[0];
    if (line) line.q++; else bag.push({ h:p.h, id:v.id, s:v.s, q:1 });
    renderBag(); snd('toll'); openBag(true);
  }
  featCard.addEventListener('click', function(e){
    var sz = e.target.closest('.fc-sizes button');
    if (sz && !sz.disabled){ feat.size = sz.getAttribute('data-id'); snd('tick'); featRenderCard(); return; }
    if (e.target.closest('#fcAdd')){
      var p = P[FEAT[feat.i]]; if (soldOut(p)) return;
      if (!feat.size){ $('fcAdd').textContent = 'Pick a size first'; return; }
      addLine(p, feat.size);
    }
  });
  function featGo(k){ var n = FEAT.length; feat.i = ((k % n) + n) % n; feat.size = null; featPlace(); featTick(); }
  function featIn(){ return S.view === 'home' && !document.hidden && home.scrollTop < featEl.offsetHeight * 0.6; }
  function featTick(){
    clearTimeout(feat.timer);
    if (featCalm) return;
    feat.timer = setTimeout(function(){
      if (!feat.held && !feat.paused && featIn()) featGo(feat.i + 1); else featTick();
    }, FEAT_MS);
  }
  featStage.addEventListener('click', function(e){
    var a = e.target.closest('.fs'); if (!a) return;
    if (!a.classList.contains('front')){ e.preventDefault(); featGo(+a.getAttribute('data-k')); }
  });
  featDots.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) featGo(+b.getAttribute('data-k')); });
  $('featPrev').onclick = function(){ featGo(feat.i - 1); };
  $('featNext').onclick = function(){ featGo(feat.i + 1); };
  featPause.onclick = function(){ feat.paused = !feat.paused; featPlace(); featTick(); };
  featEl.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') feat.held = true; });
  featEl.addEventListener('pointerleave', function(e){ if (e.pointerType === 'mouse') feat.held = false; });
  featEl.addEventListener('keydown', function(e){
    if (e.key === 'ArrowLeft'){ e.preventDefault(); featGo(feat.i - 1); }
    else if (e.key === 'ArrowRight'){ e.preventDefault(); featGo(feat.i + 1); }
  });
  var fx0 = null;
  featStage.addEventListener('touchstart', function(e){ fx0 = e.touches[0].clientX; feat.held = true; }, { passive:true });
  featStage.addEventListener('touchend', function(e){
    feat.held = false; if (fx0 == null) return;
    var dx = e.changedTouches[0].clientX - fx0; fx0 = null;
    if (Math.abs(dx) > 40){ e.preventDefault(); featGo(feat.i + (dx < 0 ? 1 : -1)); }
  }, { passive:false });
  function setFilter(f){
    var c = catBy[f];
    cells.forEach(function(t){ t.hidden = !!c && t.getAttribute('data-cat')!==f; });
    var shown = cells.filter(function(t){ return !t.hidden; }).length;
    if (S.filter !== f){ wall.classList.remove('swap'); void wall.offsetWidth; wall.classList.add('swap'); }
    S.filter = f;
  }
  // now and then a letter or two in a name on screen turns red for a moment
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(function(){
    if (S.view !== 'home' || document.hidden) return;
    var hr = home.getBoundingClientRect(), vis = cells.filter(function(c){ if (c.hidden) return false; var r = c.getBoundingClientRect(); return r.bottom > hr.top && r.top < hr.bottom; });
    if (!vis.length) return;
    var ls = vis[Math.floor(Math.random()*vis.length)].querySelectorAll('.nm i'), n = 1 + Math.floor(Math.random()*2);
    for (var k=0;k<n;k++){ (function(l){ l.classList.add('r'); setTimeout(function(){ l.classList.remove('r'); }, 380 + Math.random()*420); })(ls[Math.floor(Math.random()*ls.length)]); }
  }, 520);

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
    app.style.setProperty('--print', 'url('+c.toDataURL()+')');
    app.style.setProperty('--grain', 'url('+g.toDataURL()+')');
  })();
  function fit(){ app.style.setProperty('--vh', home.clientHeight + 'px'); }
  fit(); window.addEventListener('resize', fit);

  function inCatalog(){ return true; }   // the home page now opens on the pieces
  function syncChrome(){
    var list = S.view==='home' && inCatalog();
    app.classList.toggle('solid', S.view==='home' && home.scrollTop > home.clientHeight - 80);
    [].forEach.call(document.querySelectorAll('#cats a, #menuList a'), function(a){
      var k = a.getAttribute('data-cat');
      a.setAttribute('aria-current', (list && k===S.filter) || (S.view==='piece' && S.piece && k===S.piece.c) || (S.view==='story' && k==='story'));
    });
  }
  home.addEventListener('scroll', syncChrome, { passive:true });
  function toCatalog(smooth){ home.scrollTo({ top:Math.max(0, wall.offsetTop - document.querySelector('.top').offsetHeight - 44), behavior: smooth ? 'smooth' : 'auto' }); }

  /* ---------- sound: the film carries the music ---------- */
  var film = $('film'), wantSound = true, soundBtn = $('soundBtn');
  // phones play the lake film, full length
  if (narrow.matches){ film.removeAttribute('poster'); film.poster = 'media/hero-m-poster.jpg'; film.src = 'media/hero-m.mp4'; film.load(); }
  // one soundtrack in its own element; navigation never touches it, so it plays on from the first visit to the last
  var track = $('track'); track.volume = 0.9; film.muted = true;   // the film is picture only
  function paintSound(){ var on = !track.paused && !track.muted; soundBtn.textContent = $('soundBtn2').textContent = on ? 'Sound on' : 'Sound off'; soundBtn.setAttribute('aria-pressed', on); }
  function startTrack(){
    track.muted = !wantSound;
    var pr = track.play();
    if (pr && pr.catch) pr.then(paintSound).catch(function(){ track.muted = true; var p2 = track.play(); if (p2 && p2.catch) p2.catch(function(){}); paintSound(); });
    else paintSound();
  }
  function playFilm(){
    if (film.paused){ var pv = film.play(); if (pv && pv.catch) pv.catch(function(){}); }
    if (track.paused) startTrack();
  }
  // the browser allows sound only after a visitor's first touch; until then the track waits silently
  function firstTouch(){ if (wantSound && (track.muted || track.paused)) startTrack(); }
  ['pointerdown','keydown'].forEach(function(ev){ window.addEventListener(ev, firstTouch, { capture:true }); });
  soundBtn.onclick = $('soundBtn2').onclick = function(){
    if (track.paused){ wantSound = true; startTrack(); }
    else { wantSound = track.muted; track.muted = !track.muted; paintSound(); }
  };
  track.addEventListener('play', paintSound); track.addEventListener('pause', paintSound); track.addEventListener('volumechange', paintSound);

  /* ---------- piece ---------- */
  var KIND = { kimonos:'Kimono', dresses:'Dress', tops:'Top', bottoms:'Bottom', layers:'Layer' };
  function cellHTML(h){
    var p = P[h];
    return '<a class="cell" href="#piece-'+h+'" data-cat="'+p.c+'" aria-label="'+esc(p.f)+', '+priceOf(p)+'">'
      + '<div class="box"><img class="cut" src="cut2/'+h+'.webp" alt="" loading="lazy" decoding="async" draggable="false"></div>'
      + '<div class="cap">'+nameHTML(p)+'<span class="pr">'+priceOf(p)+'</span></div></a>';
  }
  var imgA = $('pieceImgA'), imgB = $('pieceImgB'), front = imgA, thumbs = $('thumbs');
  function showImg(i, instant){
    var p = S.piece; S.img = (i + p.i.length) % p.i.length;
    var next = front === imgA ? imgB : imgA, f = front, src = IMG + p.i[S.img];
    imgA.onload = imgB.onload = null;
    // a new piece: clear what the last piece left behind, so its photo can never show here
    if (instant){ imgA.classList.remove('on'); imgB.classList.remove('on'); f.removeAttribute('src'); next.removeAttribute('src'); }
    var done = function(){ if (next.getAttribute('data-want') !== src) return; f.classList.remove('on'); next.classList.add('on'); };
    next.setAttribute('data-want', src); next.alt = p.f + ', photo ' + (S.img+1);
    next.onload = done; next.src = src;
    if (next.complete && next.naturalWidth) done();
    front = next;
    $('pNum').textContent = two(S.img+1) + ' / ' + two(p.i.length);
    [].forEach.call(thumbs.children, function(b,k){ b.setAttribute('aria-selected', k===S.img); });
  }
  function buildPiece(p){
    var c = catBy[p.c], k = c.items.indexOf(p.h);
    S.size = null;
    $('pieceBack').href = '#' + S.list; $('pieceBackLabel').textContent = catBy[S.list] ? catBy[S.list].name : 'All';
    $('pieceCrumb').textContent = c.name + ', ' + two(k+1) + ' of ' + two(c.items.length);
    var ti = $('pieceTitle'); ti.setAttribute('aria-label', p.t); ti.classList.toggle('long', p.t.length > 8);
    ti.innerHTML = p.t.split('').map(function(ch,i){ return '<span aria-hidden="true" style="--i:'+i+'">'+esc(ch)+'</span>'; }).join('');
    $('piecePrice').textContent = priceOf(p);
    $('pieceDesc').innerHTML = p.d.map(function(t){ return '<p>'+esc(t.replace(/([a-z]\.)([A-Z])/g,'$1 $2'))+'</p>'; }).join('');
    thumbs.innerHTML = p.i.map(function(f,i){ return '<button type="button" role="tab" data-i="'+i+'" aria-label="Photo '+(i+1)+'"><img src="'+IMG+f+'" alt=""></button>'; }).join('');
    var so = soldOut(p);
    $('sizes').innerHTML = p.v.map(function(v){ return '<button type="button" role="radio" aria-checked="false" data-id="'+v.id+'"'+(v.a?'':' disabled')+'>'+v.s+'</button>'; }).join('');
    var avail = p.v.filter(function(v){ return v.a; });
    if (avail.length === 1) pickSize(avail[0].id);
    var add = $('addBtn'); add.disabled = so; add.textContent = so ? 'Sold out' : 'Add to bag';
    $('buyNote').innerHTML = so ? 'This piece is sold out in every size.' : 'Ships worldwide from India. <a class="link" href="#returns">14-day returns</a>.';
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
  $('sizes').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b && !b.disabled){ pickSize(b.getAttribute('data-id')); snd('tick'); } });
  thumbs.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) showImg(+b.getAttribute('data-i')); });
  $('pPhoto').addEventListener('click', function(){ showImg(S.img+1); });


  // start loading a piece's first photograph the moment it is pointed at or touched
  var warmed = {};
  function warm(e){
    var a = e.target.closest && e.target.closest('a[href^="#piece-"]'); if (!a) return;
    var h = a.getAttribute('href').slice(7), p = P[h]; if (!p || warmed[h]) return;
    warmed[h] = 1; new Image().src = IMG + p.i[0];
  }
  app.addEventListener('pointerover', warm, { passive:true }); app.addEventListener('touchstart', warm, { passive:true });

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

  /* ---------- story: eleven prints. A gallery you click, and a reader that opens ---------- */
  var FAMS = [
    { name:'Marks', items:['maitri','hikari','vasanta'] },
    { name:'Bands', items:['midori','aiko'] },
    { name:'Fields', items:['padma','shunya','yashodhara'] },
    { name:'Flora', items:['surya','darvish','mani'] }
  ];
  var MARKS = {
    maitri:{ name:'Chevron and house', hook:'A map home, worn on the back.',
      story:'Arrows stacked in columns, all pointing one way. Between them, small houses with bars inside: a roof, and what the roof keeps. Mud cloth makers in Mali paint marks like these by hand, one at a time. We put them on black so nobody could miss them.' },
    hikari:{ name:'Crossroads', hook:'Four roads. One place to stand.',
      story:'Every square is crossed corner to corner, like a junction seen from above. Every village has one: the spot where people meet, trade, argue and leave from. Printed in brick red, it runs the full length of the robe. Wear it and you are the meeting point.' },
    vasanta:{ name:'Diamond', hook:'An eye that does not close.',
      story:'One line of black diamonds down a pale yellow edge. That is all. The diamond is the oldest guard there is: an open eye, watching the border of the cloth. We kept the rest of the piece plain so the eye has nothing to compete with.' },
    midori:{ name:'Tooth', hook:'A border with a bite.',
      story:'Triangles set point to edge, row after row, like teeth. A band like this goes where things need protecting: a hem, a seam, a doorway. Here it runs head to toe in brown on cream. It is the most traditional print we make and the hardest to ignore.' },
    aiko:{ name:'Tooth and thread', hook:'Same teeth. Louder colour.',
      story:'The tooth band again, this time in cream on deep green, with fine lines running between like thread pulled tight. The lines hold the cloth together. The teeth mark where it is tied off. On trousers, it turns every step into a stripe.' },
    padma:{ name:'Star', hook:'The first map anyone used.',
      story:'Six-pointed stars, each locked inside a hexagon, repeating without a gap. Before roads, people crossed deserts by reading the sky. This is that sky, flattened and printed in purple. It looks soft from a distance. Up close it is all geometry.' },
    shunya:{ name:'Field', hook:'The land, seen from above.',
      story:'A grid of small squares, each stamped by hand with its own loose marks. No two are the same. It reads like farmland from the air: every plot the same size, every one planted differently. In pink, because nothing says a field has to be green.' },
    yashodhara:{ name:'Fan', hook:'One wave laid over the last.',
      story:'Rows of fans, overlapping like scales or shells or water coming in. The shape is the same every time. The rhythm is what you notice. On a long dress it never sits still: walk, and the whole print looks like it is moving with the tide.' },
    surya:{ name:'Sun band', hook:'The sun, crossing the cloth.',
      story:'Cream flowers scattered over sea green, and through the middle a hard blue band of circles and arcs. The flowers are the ground. The band is the sun going over it, edge to edge. It is the one print here that tells you what time it is.' },
    darvish:{ name:'Paisley', hook:'A pattern that never stayed home.',
      story:'Paisley began in Persia and India, crossed to Africa and Europe on trade ships, and has never belonged to one place since. We kept it for that reason. Teardrops, flowers and panels in turquoise and red: proof that cloth travels, and patterns travel with it.' },
    mani:{ name:'Sprig', hook:'Small. Repeated. Enough.',
      story:'Tiny gold sprigs woven into saffron orange, one after another, until the whole cloth is covered. Each one is a seed. On its own it is nothing. Repeated a thousand times it is a field, and a robe you can see from across the street.' }
  };
  var ORDER = [], FAMOF = {}; FAMS.forEach(function(f){ f.items.forEach(function(h){ ORDER.push(h); FAMOF[h] = f.name; }); });
  var markAt = ORDER[0], famAt = 'All', story = document.querySelector('.v-story');
  $('galTabs').innerHTML = '<button type="button" data-f="All">All<i>'+ORDER.length+'</i></button>' + FAMS.map(function(f){ return '<button type="button" data-f="'+f.name+'">'+f.name+'<i>'+f.items.length+'</i></button>'; }).join('');
  $('galGrid').innerHTML = ORDER.map(function(h,i){
    return '<button type="button" class="gt" data-h="'+h+'" data-f="'+FAMOF[h]+'"><img src="media/sw/'+h+'.jpg" alt="" loading="lazy"><span class="gt-n">'+two(i+1)+'</span><b>'+MARKS[h].name+'</b><span class="gt-go">Read the story</span></button>';
  }).join('');
  function setFam(f){
    famAt = f;
    [].forEach.call($('galTabs').children, function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-f')===f); });
    [].forEach.call($('galGrid').children, function(t){ t.hidden = f!=='All' && t.getAttribute('data-f')!==f; });
  }
  $('galTabs').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ setFam(b.getAttribute('data-f')); snd('tick'); } });
  function showMark(h){
    markAt = h; var m = MARKS[h], p = P[h], i = ORDER.indexOf(h);
    if ($('rdImg').getAttribute('src') !== 'media/sw/'+h+'.jpg') $('rdImg').removeAttribute('src');
    $('rdImg').src = 'media/sw/'+h+'.jpg'; $('rdImg').alt = m.name + ' pattern';
    $('rdN').textContent = two(i+1) + ' / ' + two(ORDER.length) + '   ' + FAMOF[h];
    $('rdName').textContent = m.name; $('rdHook').textContent = m.hook; $('rdStory').textContent = m.story;
    $('rdPiece').href = '#piece-'+h; if ($('rdCut').getAttribute('src') !== 'cut2/'+h+'.webp') $('rdCut').removeAttribute('src'); $('rdCut').src = 'cut2/'+h+'.webp';
    $('rdPieceName').textContent = p.f; $('rdPiecePrice').textContent = priceOf(p);
    var a = ORDER[(i-1+ORDER.length)%ORDER.length], b = ORDER[(i+1)%ORDER.length];
    $('rdPrev').querySelector('span').textContent = MARKS[a].name; $('rdNext').querySelector('span').textContent = MARKS[b].name;
    var sp = $('storyPat'); sp.style.backgroundImage = 'url(media/sw/'+h+'.jpg)'; sp.style.backgroundSize = '420px 420px';
    $('reader').scrollTop = 0;
  }
  var readerEl = $('reader'), readerOpen = false;
  function openReader(o){
    if (o !== readerOpen) snd(o ? 'open' : 'sheet');
    readerOpen = o; readerEl.classList.toggle('open', o); readerEl.setAttribute('aria-hidden', !o); readerEl.inert = !o;
    if (o) $('rdClose').focus({preventScroll:true});
  }
  function stepMark(d){ var i = ORDER.indexOf(markAt); showMark(ORDER[(i+d+ORDER.length)%ORDER.length]); snd('tick'); }
  $('galGrid').addEventListener('click', function(e){ var b = e.target.closest('.gt'); if (b){ showMark(b.getAttribute('data-h')); openReader(true); } });
  $('rdClose').onclick = function(){ openReader(false); };
  $('rdPrev').onclick = function(){ stepMark(-1); }; $('rdNext').onclick = function(){ stepMark(1); };
  $('rdPiece').addEventListener('click', function(){ openReader(false); });
  setFam('All');

  /* ---------- languages: the interface is translated; long copy stays in English for now ---------- */
  var LANGS = [['en','English'],['es','Español'],['fr','Français'],['hi','हिन्दी'],['ja','日本語']];
  var IDX = { es:0, fr:1, hi:2, ja:3 };
  var TR = {
    'All':['Todo','Tout','सभी','すべて'], 'Kimonos':['Kimonos','Kimonos','किमोनो','キモノ'], 'Dresses':['Vestidos','Robes','ड्रेस','ドレス'],
    'Tops':['Tops','Hauts','टॉप','トップス'], 'Bottoms':['Pantalones','Bas','बॉटम','ボトムス'], 'Layers':['Capas','Vestes','लेयर','アウター'],
    'Story':['Historia','Histoire','कहानी','ストーリー'], 'Menu':['Menú','Menu','मेनू','メニュー'], 'Bag':['Bolsa','Panier','बैग','バッグ'],
    'Account':['Cuenta','Compte','खाता','アカウント'], 'Sound on':['Sonido activado','Son activé','ध्वनि चालू','サウンド オン'], 'Sound off':['Sonido apagado','Son coupé','ध्वनि बंद','サウンド オフ'],
    'Close':['Cerrar','Fermer','बंद करें','閉じる'], 'Add to bag':['Añadir a la bolsa','Ajouter au panier','बैग में डालें','バッグに追加'], 'Sold out':['Agotado','Épuisé','स्टॉक खत्म','売り切れ'],
    'Pick a size first':['Elige una talla primero','Choisissez d’abord une taille','पहले साइज़ चुनें','先にサイズを選択'], 'Check out':['Pagar','Commander','चेकआउट','購入手続きへ'],
    'Subtotal':['Subtotal','Sous-total','उप-योग','小計'], 'Your bag':['Tu bolsa','Votre panier','आपका बैग','バッグ'], 'Remove':['Quitar','Retirer','हटाएँ','削除'],
    'Change':['Cambiar','Modifier','बदलें','変更'], 'Top':['Arriba','Haut','ऊपर','トップへ'], 'Shipping':['Envíos','Livraison','शिपिंग','配送'], 'Returns':['Devoluciones','Retours','वापसी','返品'],
    'Privacy':['Privacidad','Confidentialité','गोपनीयता','プライバシー'], 'Terms':['Términos','Conditions','शर्तें','利用規約'], 'All pieces':['Todas las piezas','Toutes les pièces','सभी पीस','すべてのアイテム'],
    'Read the story':['Leer la historia','Lire l’histoire','कहानी पढ़ें','ストーリーを読む'], 'View the piece':['Ver la pieza','Voir la pièce','पीस देखें','アイテムを見る'], 'Worn on':['Se lleva en','Porté sur','इस पर','使用アイテム'],
    'Currency':['Moneda','Devise','मुद्रा','通貨'], 'Language':['Idioma','Langue','भाषा','言語'], 'Selected':['Seleccionado','Sélectionné','चुनी गई','選択中'],
    'Orders':['Pedidos','Commandes','ऑर्डर','注文'], 'Details':['Datos','Informations','विवरण','登録情報'], 'Addresses':['Direcciones','Adresses','पते','住所'], 'Sign out':['Cerrar sesión','Se déconnecter','साइन आउट','ログアウト'],
    'Email':['Correo electrónico','E-mail','ईमेल','メールアドレス'], 'Send sign-in code':['Enviar código de acceso','Envoyer le code de connexion','साइन-इन कोड भेजें','ログインコードを送信'],
    'Track':['Seguir','Suivre','ट्रैक करें','追跡'], 'Start a return':['Iniciar una devolución','Faire un retour','वापसी शुरू करें','返品を申し込む'], 'Total':['Total','Total','कुल','合計'],
    'On its way':['En camino','En route','रास्ते में','配送中'], 'Delivered':['Entregado','Livré','डिलीवर हो गया','配達済み'], 'Name':['Nombre','Nom','नाम','名前'], 'Phone':['Teléfono','Téléphone','फ़ोन','電話番号'],
    'Not added yet':['Aún sin añadir','Pas encore ajouté','अभी नहीं जोड़ा गया','未登録'],
    'The collection':['La colección','La collection','कलेक्शन','コレクション'], 'The patterns':['Los estampados','Les motifs','पैटर्न','柄'], 'Ancestry':['Ascendencia','Ascendance','वंश','ルーツ'],
    'Choose a print. Its story opens.':['Elige un estampado. Se abre su historia.','Choisissez un motif. Son histoire s’ouvre.','एक प्रिंट चुनें। उसकी कहानी खुलेगी।','柄を選ぶと、その物語が開きます。'],
    'Marks':['Signos','Signes','चिह्न','しるし'], 'Bands':['Franjas','Bandes','पट्टियाँ','帯'], 'Fields':['Campos','Champs','खेत','面'], 'Flora':['Flora','Flore','फूल-पत्ती','草花'],
    'Sorted into four families':['Ordenados en cuatro familias','Classés en quatre familles','चार परिवारों में बाँटे गए','4つのグループに分類'],
    'Vagari Vati, by Jessian Titus':['Vagari Vati, por Jessian Titus','Vagari Vati, par Jessian Titus','Vagari Vati, जस्टिन टाइटस द्वारा','Vagari Vati、ジャスティン・タイタス'],
    'Worn in memory of the land before us':['En memoria de la tierra que nos precedió','En mémoire de la terre d’avant nous','हमसे पहले की धरती की याद में','私たちより前の大地を偲んで'],
    'Eleven prints. Each one says something.':['Once estampados. Cada uno dice algo.','Onze motifs. Chacun dit quelque chose.','ग्यारह प्रिंट। हर एक कुछ कहता है।','11の柄。それぞれに意味がある。'],
    'A record you can wear':['Un registro que puedes vestir','Une mémoire qui se porte','एक दस्तावेज़ जिसे आप पहन सकते हैं','身にまとえる記録'],
    'Turn sound on':['Activar sonido','Activer le son','ध्वनि चालू करें','サウンドをオンにする'],
    'Pause':['Pausar','Pause','रोकें','一時停止'], 'Film':['Film','Film','फ़िल्म','フィルム'],
    'Play the film':['Ver el film','Lire le film','फ़िल्म चलाएँ','フィルムを再生'],
    'The collection and its prints':['La colección y sus estampados','La collection et ses motifs','कलेक्शन और उसके प्रिंट','コレクションと柄'],
    'Ships worldwide from India.':['Envíos a todo el mundo desde la India.','Livraison mondiale depuis l’Inde.','भारत से दुनिया भर में शिपिंग।','インドから世界中へ発送。'],
    '14-day returns':['Devoluciones en 14 días','Retours sous 14 jours','14 दिन में वापसी','14日以内返品可'],
    'Your bag is empty. Open a piece, pick a size and add it here.':['Tu bolsa está vacía. Abre una pieza, elige una talla y añádela aquí.','Votre panier est vide. Ouvrez une pièce, choisissez une taille et ajoutez-la ici.','आपका बैग खाली है। कोई पीस खोलें, साइज़ चुनें और यहाँ जोड़ें।','バッグは空です。アイテムを開き、サイズを選んで追加してください。'],
    'Shipping and taxes are calculated at checkout, which opens on vagarivati.com.':['El envío y los impuestos se calculan al pagar, en vagarivati.com.','La livraison et les taxes sont calculées au paiement, sur vagarivati.com.','शिपिंग और टैक्स चेकआउट पर जोड़े जाते हैं, जो vagarivati.com पर खुलता है।','送料と税金は vagarivati.com の購入手続きで計算されます。'],
    'Sign in to see your orders, track a delivery or start a return.':['Inicia sesión para ver tus pedidos, seguir una entrega o iniciar una devolución.','Connectez-vous pour voir vos commandes, suivre une livraison ou faire un retour.','अपने ऑर्डर देखने, डिलीवरी ट्रैक करने या वापसी शुरू करने के लिए साइन इन करें।','ログインすると、注文の確認、配送の追跡、返品の申し込みができます。'],
    'We email you a six-digit code. No password to remember.':['Te enviamos un código de seis dígitos. Sin contraseñas.','Nous vous envoyons un code à six chiffres. Aucun mot de passe.','हम आपको छह अंकों का कोड ईमेल करते हैं। कोई पासवर्ड नहीं।','6桁のコードをメールでお送りします。パスワードは不要です。'],
    'Prices come from the store. Checkout confirms the final amount.':['Los precios vienen de la tienda. El pago confirma el importe final.','Les prix viennent de la boutique. Le paiement confirme le montant final.','कीमतें स्टोर से आती हैं। अंतिम राशि चेकआउट पर तय होती है।','価格はストアのものです。最終金額は購入手続きで確定します。'],
    '© Vagari Vati 2027. All rights reserved.':['© Vagari Vati 2027. Todos los derechos reservados.','© Vagari Vati 2027. Tous droits réservés.','© Vagari Vati 2027. सर्वाधिकार सुरक्षित।','© Vagari Vati 2027. 無断転載を禁じます。'],
    'Example data. This prototype is not connected to real accounts yet.':['Datos de ejemplo. Este prototipo aún no está conectado a cuentas reales.','Données d’exemple. Ce prototype n’est pas encore relié à de vrais comptes.','उदाहरण डेटा। यह प्रोटोटाइप अभी असली खातों से जुड़ा नहीं है।','サンプルデータです。この試作版は実際のアカウントに接続されていません。'],
    'End of season sale':['Rebajas de fin de temporada','Soldes de fin de saison','सीज़न के अंत की सेल','シーズン終了セール'],
    '10% off with code':['10% de descuento con el código','-10 % avec le code','कोड के साथ 10% की छूट','コードで10%オフ'],
    'Ships worldwide from India':['Envíos a todo el mundo desde la India','Livraison mondiale depuis l’Inde','भारत से दुनिया भर में शिपिंग','インドから世界中へ発送'],
    'Copied':['Copiado','Copié','कॉपी हो गया','コピーしました'],
    'Size':['Talla','Taille','साइज़','サイズ'], 'Select one':['Elige una','Choisir','चुनें','選択'], 'Play':['Reproducir','Lecture','चलाएँ','再生'],
    'Discover Destiny':['Discover Destiny','Discover Destiny','Discover Destiny','Discover Destiny']
  };
  var KTR = { Kimono:['Kimono','Kimono','किमोनो','キモノ'], Dress:['Vestido','Robe','ड्रेस','ドレス'], Top:['Top','Haut','टॉप','トップ'], Bottom:['Pantalón','Bas','बॉटम','ボトム'], Layer:['Capa','Veste','लेयर','アウター'] };
  var PIECES = { es:'piezas', fr:'pièces', hi:'पीस', ja:'点' }, SIZE = { es:'talla', fr:'taille', hi:'साइज़', ja:'サイズ' };
  var lang = 'en'; try { var sl = localStorage.getItem('vv-lang'); if (sl && (sl === 'en' || IDX[sl] != null)) lang = sl; } catch(e){}
  function tr(s){
    if (lang === 'en') return s;
    var k = IDX[lang], hit = TR[s]; if (hit) return hit[k];
    var m = /^(\d+) pieces$/.exec(s); if (m) return m[1] + ' ' + PIECES[lang];
    m = /^(Kimono|Dress|Top|Bottom|Layer), size (\w+)$/.exec(s); if (m) return KTR[m[1]][k] + ', ' + SIZE[lang] + ' ' + m[2];
    return null;
  }
  function trNode(n){
    var v = n.nodeValue; if (n._out === v) return;              // our own write
    n._en = v; var core = v.trim(); if (!core){ return; }
    var at = v.indexOf(core), t = tr(core), out = t == null ? v : v.slice(0, at) + t + v.slice(at + core.length);
    n._out = out; if (out !== v) n.nodeValue = out;
  }
  function trAll(root){
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function(n){ if (n._en != null && n._out === n.nodeValue){ n._out = null; n.nodeValue = n._en; } trNode(n); });
  }
  new MutationObserver(function(ms){
    if (lang === 'en') return;
    ms.forEach(function(m){
      if (m.type === 'characterData') trNode(m.target);
      else [].forEach.call(m.addedNodes, function(a){ if (a.nodeType === 3) trNode(a); else if (a.nodeType === 1) trAll(a); });
    });
  }).observe(app, { childList:true, subtree:true, characterData:true });
  function setLang(l){
    lang = l; try { localStorage.setItem('vv-lang', l); } catch(e){}
    document.documentElement.lang = l; app.setAttribute('data-lang', l);
    trAll(app); paintRegion();
  }

  /* ---------- currency and language ---------- */
  var regionEl = $('region'), regionOpen = false;
  function paintRegion(){
    [].forEach.call(document.querySelectorAll('.regionBtn'), function(b){ b.textContent = cur + ' / ' + lang.toUpperCase(); });
    $('rgCur').innerHTML = CURS.map(function(c){ return '<button type="button" data-c="'+c[0]+'" aria-pressed="'+(c[0]===cur)+'"><b>'+c[0]+'</b><span>'+c[1]+'</span></button>'; }).join('');
    $('rgLang').innerHTML = LANGS.map(function(l){ return '<button type="button" data-l="'+l[0]+'" aria-pressed="'+(l[0]===lang)+'"><b>'+l[1]+'</b><span>'+(l[0]===lang?'Selected':'')+'</span></button>'; }).join('');
  }
  function openRegion(o){
    regionOpen = o; regionEl.classList.toggle('open', o); regionEl.setAttribute('aria-hidden', !o); regionEl.inert = !o;
    $('scrim').hidden = !o && !bagOpen && !menuOpen; if (o){ snd('sheet'); $('rgClose').focus({preventScroll:true}); }
  }
  function setCur(c){
    cur = c; try { localStorage.setItem('vv-cur', c); } catch(e){}
    wall.innerHTML = all.map(function(h){ return cellHTML(h); }).join(''); cells = [].slice.call(wall.children); setFilter(S.filter); featRenderCard();
    renderBag(); paintRegion(); renderAccount();
    if (S.piece) $('piecePrice').textContent = priceOf(S.piece);
    if (readerOpen) showMark(markAt);
  }
  app.addEventListener('click', function(e){ if (e.target.closest('.regionBtn')){ if (menuOpen) openMenu(false); openRegion(!regionOpen); } });
  $('rgClose').onclick = function(){ openRegion(false); };
  $('rgLang').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ setLang(b.getAttribute('data-l')); snd('tick'); openRegion(false); } });
  $('rgCur').addEventListener('click', function(e){ var b = e.target.closest('button'); if (b){ setCur(b.getAttribute('data-c')); snd('tick'); openRegion(false); } });

  /* ---------- account (prototype: sign-in is not wired up, the orders are examples) ---------- */
  var signed = false, accTab = 'orders';
  var EX = [
    { n:'VV-1042', date:'12 November 2026', status:'On its way', note:'Left India on 14 November. Tracking updates by email.', items:[['maitri','M',1],['sora','M',1]] },
    { n:'VV-1017', date:'3 October 2026', status:'Delivered', note:'Delivered on 15 October.', items:[['yugen','L',1]] }
  ];
  function renderAccount(){
    var nav = $('accNav'), doc = $('accDoc');
    if (!signed){
      nav.innerHTML = '';
      doc.innerHTML = '<h2 class="pol-h">Account</h2><p class="acc-lead">Sign in to see your orders, track a delivery or start a return.</p>'
        + '<form class="acc-form" id="accForm" novalidate><label for="accEmail">Email</label><input id="accEmail" type="email" autocomplete="email" placeholder="you@example.com" required>'
        + '<p class="acc-err" id="accErr" hidden>Enter the email you ordered with, like name@example.com.</p>'
        + '<button type="submit" class="btn solid">Send sign-in code</button><p class="fine">We email you a six-digit code. No password to remember.</p></form>';
      $('accForm').addEventListener('submit', function(e){
        e.preventDefault(); var v = $('accEmail').value.trim();
        if (!/^\S+@\S+\.\S+$/.test(v)){ $('accErr').hidden = false; $('accEmail').focus(); return; }
        signed = v; snd('open'); renderAccount();
      });
      return;
    }
    var tabs = [['orders','Orders'],['details','Details'],['addresses','Addresses']];
    nav.innerHTML = tabs.map(function(t){ return '<a href="#account" data-t="'+t[0]+'" aria-current="'+(t[0]===accTab)+'">'+t[1]+'</a>'; }).join('') + '<a href="#account" data-t="out">Sign out</a>';
    var note = '<p class="pol-draft">Example data. This prototype is not connected to real accounts yet.</p>', h = '';
    if (accTab === 'orders'){
      h = '<h2 class="pol-h">Orders</h2>' + note + '<div class="ords">' + EX.map(function(o){
        var total = o.items.reduce(function(s,i){ return s + i[2]*price(P[i[0]]); }, 0);
        return '<section class="ord"><header><p><b>'+o.n+'</b><span>'+o.date+'</span></p><p class="ord-st'+(o.status==='Delivered'?'':' live')+'">'+o.status+'</p></header>'
          + '<div class="ord-items">'+o.items.map(function(i){ var p = P[i[0]]; return '<a href="#piece-'+p.h+'" class="ord-it"><span class="box"><img class="cut" src="cut2/'+p.h+'.webp" alt=""></span><span><b>'+esc(label(p))+'</b><i>'+KIND[p.c]+', size '+i[1]+'</i><i>'+money(price(p))+'</i></span></a>'; }).join('')+'</div>'
          + '<footer><p>'+o.note+'</p><p><span>Total</span><b>'+money(total)+'</b></p><p class="ord-act"><a class="link" href="#shipping">Track</a><a class="link" href="#returns">Start a return</a></p></footer></section>';
      }).join('') + '</div>';
    } else if (accTab === 'details'){
      h = '<h2 class="pol-h">Details</h2>' + note + '<dl class="acc-dl"><dt>Email</dt><dd>'+esc(signed)+'</dd><dt>Name</dt><dd>Not added yet</dd><dt>Phone</dt><dd>Not added yet</dd><dt>Currency</dt><dd>'+cur+' <button type="button" class="link regionBtn2">Change</button></dd></dl>';
    } else {
      h = '<h2 class="pol-h">Addresses</h2>' + note + '<p class="acc-lead">No saved addresses yet. Your address is saved here after your first order.</p>';
    }
    doc.innerHTML = h;
  }
  $('accNav').addEventListener('click', function(e){
    var a = e.target.closest('a'); if (!a) return; e.preventDefault();
    var t = a.getAttribute('data-t'); if (t === 'out'){ signed = false; accTab = 'orders'; } else accTab = t;
    snd('tick'); renderAccount();
  });
  $('accDoc').addEventListener('click', function(e){ if (e.target.closest('.regionBtn2')) openRegion(true); });

  /* ---------- policies ---------- */
  var POL = {
    shipping:{ t:'Shipping', html:
      '<p>We ship worldwide. Every order is packed and sent from India.</p>'
      + '<h3>Dispatch</h3><p>Orders leave us within 2 to 4 business days. You get an email with a tracking link as soon as yours is on its way.</p>'
      + '<h3>Delivery times</h3><ul><li>India: 3 to 6 business days</li><li>United States, Canada, United Kingdom, Europe and Australia: 7 to 14 business days</li><li>Rest of the world: 10 to 20 business days</li></ul><p>These are estimates from the day of dispatch. Customs checks can add a few days.</p>'
      + '<h3>Cost</h3><p>Shipping is calculated at checkout from your address and the weight of your order. You see the full cost before you pay.</p>'
      + '<h3>Duties and taxes</h3><p>Orders sent outside India may be charged import duties or taxes by your country. Where we can, the checkout shows and collects these up front. Where we cannot, the courier collects them on delivery, and they are yours to pay.</p>'
      + '<h3>Changing an address</h3><p>Reply to your order confirmation email before the order is dispatched and we will update it. Once it has left, we cannot redirect it.</p>'
      + '<h3>Late or lost orders</h3><p>If tracking has not moved for 10 days, or your order has not arrived 30 days after dispatch, reply to your order confirmation email. We will trace it with the courier and resend or refund it if it is lost.</p>' },
    returns:{ t:'Returns', html:
      '<p>You can return any piece within 14 days of delivery.</p>'
      + '<h3>Condition</h3><p>Pieces must come back unworn, unwashed and with their tags attached. We cannot accept returns that show signs of wear.</p>'
      + '<h3>How to start a return</h3><ol><li>Reply to your order confirmation email and tell us which piece you are returning and why.</li><li>We send you the return address and instructions within 2 business days.</li><li>Send the piece back with a tracked service and keep the receipt.</li></ol>'
      + '<h3>Return shipping</h3><p>You pay for return shipping, unless the piece arrived faulty or we sent the wrong one.</p>'
      + '<h3>Refunds</h3><p>We refund the price of the piece to your original payment method within 7 business days of receiving it. The original shipping cost and any import duties are not refunded.</p>'
      + '<h3>Exchanges</h3><p>If you need a different size, tell us when you start the return. We will hold it for you if it is in stock and send it once your return arrives.</p>'
      + '<h3>Faulty or wrong pieces</h3><p>Tell us within 7 days of delivery, with a photo. We will replace the piece or refund it in full, including shipping both ways.</p>'
      + '<h3>Handmade variation</h3><p>These pieces are cut, dyed and printed in small batches. Slight differences in colour and print from one piece to the next are part of how they are made and are not faults.</p>' },
    privacy:{ t:'Privacy', html:$('privacySrc').innerHTML },
    terms:{ t:'Terms', html:
      '<p>These terms apply when you order from Vagari Vati.</p>'
      + '<h3>Orders</h3><p>Placing an order is an offer to buy. The order is accepted when we send your dispatch email. We may cancel and fully refund an order if a piece is out of stock or was listed at the wrong price.</p>'
      + '<h3>Prices and payment</h3><p>Prices are shown in the currency at the top of your checkout. Payment is taken at checkout on vagarivati.com. Shipping, taxes and duties are shown before you pay.</p>'
      + '<h3>The pieces</h3><p>We photograph every piece as accurately as we can. Colour can look different from one screen to another, and each piece varies slightly because of how it is made.</p>'
      + '<h3>Shipping and returns</h3><p>Our <a href="#shipping">Shipping</a> and <a href="#returns">Returns</a> pages form part of these terms.</p>'
      + '<h3>Our work</h3><p>The designs, prints, photographs, film and text on this site belong to Vagari Vati. Please do not copy or reuse them without asking.</p>'
      + '<h3>Liability</h3><p>If something goes wrong with an order, our responsibility is limited to the amount you paid for it. Nothing here removes rights you have under the consumer law of your country.</p>'
      + '<h3>Changes</h3><p>We may update these terms. The version on this page on the day you order is the one that applies to that order.</p>'
      + '<h3>Contact</h3><p>For anything about an order, reply to your order confirmation email.</p>' }
  };
  $('polNav').innerHTML = Object.keys(POL).map(function(k){ return '<a href="#'+k+'" data-k="'+k+'">'+POL[k].t+'</a>'; }).join('');
  function showPolicy(k){
    var p = POL[k];
    [].forEach.call($('polNav').children, function(a){ a.setAttribute('aria-current', a.getAttribute('data-k')===k); });
    $('polTitle').textContent = p.t; $('polDraft').hidden = !p.draft; $('polBody').innerHTML = p.html;
    document.querySelector('.v-info').scrollTop = 0;
  }

  /* ---------- interface sounds: low, short, and only while Sound is on ---------- */
  var actx = null;
  function snd(kind){
    if (!wantSound || !actx || actx.state !== 'running') return;
    var t = actx.currentTime, out = actx.createGain(); out.connect(actx.destination);
    function tone(f, g, d, type, f2){
      var o = actx.createOscillator(), a = actx.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + .012); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(a); a.connect(out); o.start(t); o.stop(t + d + .05);
    }
    if (kind === 'tick'){ tone(170, .10, .09, 'sine', 80); }                                   // a knock on wood
    else if (kind === 'open'){ tone(196, .05, 1.3); tone(294, .03, 1.0); tone(466, .012, .7); } // a small bell
    else if (kind === 'toll'){ tone(98, .12, 2.6); tone(147, .06, 2.2); tone(233, .03, 1.6); tone(261, .015, 1.2); } // a deep bell
    else if (kind === 'sheet'){                                                                  // cloth drawn across
      var n = actx.createBufferSource(), buf = actx.createBuffer(1, actx.sampleRate * .35, actx.sampleRate), d = buf.getChannelData(0);
      for (var i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
      var f = actx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1400, t + .3); f.Q.value = .8;
      var a = actx.createGain(); a.gain.value = .05; n.buffer = buf; n.connect(f); f.connect(a); a.connect(out); n.start(t);
    }
  }
  ['pointerdown','keydown'].forEach(function(ev){ window.addEventListener(ev, function(){
    try { if (!actx){ var AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); } if (actx && actx.state === 'suspended') actx.resume(); } catch(e){}
  }, { capture:true }); });

  /* ---------- bag ---------- */
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem('vv-bag') || '[]').filter(function(l){ return P[l.h]; }); } catch(e){ bag = []; }
  function saveBag(){ try { localStorage.setItem('vv-bag', JSON.stringify(bag)); } catch(e){} }
  function renderBag(){
    var n = bag.reduce(function(s,l){ return s+l.q; }, 0), sub = bag.reduce(function(s,l){ return s + l.q*price(P[l.h]); }, 0);
    $('bagCount').textContent = n; $('bagBtn').classList.toggle('has', n>0);
    $('bagEmpty').hidden = n>0; $('bagFoot').hidden = n===0; $('bagList').hidden = n===0;
    $('bagN').textContent = n ? ' (' + n + ')' : '';
    $('bagList').innerHTML = bag.map(function(l,i){
      var p = P[l.h];
      return '<li><a class="box" href="#piece-'+p.h+'"><img class="cut" src="cut2/'+p.h+'.webp" alt=""></a>'
        + '<p class="b-row"><b>'+esc(label(p))+'</b><span>'+money(l.q*price(p))+'</span></p><p class="meta">'+KIND[p.c]+', size '+l.s+'</p>'
        + '<p class="b-row"><span class="qty"><button type="button" data-act="dec" data-i="'+i+'" aria-label="One fewer">&minus;</button><span>'+l.q+'</span><button type="button" data-act="inc" data-i="'+i+'" aria-label="One more">+</button></span>'
        + '<button type="button" class="rm" data-act="rm" data-i="'+i+'">Remove</button></p></li>';
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
    renderBag(); snd('toll'); openBag(true);
  };
  var menuEl = $('menu'), menuOpen = false;
  function openMenu(o){
    if (o && o !== menuOpen) snd('sheet');
    menuOpen = o; menuEl.classList.toggle('open', o); menuEl.setAttribute('aria-hidden', !o); menuEl.inert = !o;
    $('scrim').hidden = !o && !bagOpen;
    if (o) $('menuClose').focus({preventScroll:true});
  }
  $('menuBtn').onclick = function(){ openMenu(true); };
  $('menuClose').onclick = function(){ openMenu(false); };
  menuEl.addEventListener('click', function(e){ if (e.target.closest('a')) openMenu(false); });
  var bagEl = $('bag'), bagOpen = false, lastFocus = null;
  function openBag(o){
    if (o && o !== bagOpen) snd('sheet');
    bagOpen = o; bagEl.classList.toggle('open', o); $('scrim').hidden = !o;
    bagEl.setAttribute('aria-hidden', !o); bagEl.inert = !o;
    if (o){ lastFocus = document.activeElement; $('bagClose').focus({preventScroll:true}); } else if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  }
  $('bagBtn').onclick = function(){ openBag(true); }; $('bagClose').onclick = function(){ openBag(false); }; $('scrim').onclick = function(){ if (regionOpen) openRegion(false); if (menuOpen) openMenu(false); if (bagOpen) openBag(false); };
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
    tip.classList.remove('on'); syncChrome();
  }
  var started = false;
  function route(){
    var h = (location.hash || '#home').slice(1), from = S.view, first = !started; started = true;
    if (bagOpen) openBag(false);
    if (menuOpen) openMenu(false);
    if (regionOpen) openRegion(false);
    if (readerOpen && h !== 'story') openReader(false);
    if (h !== 'system') S.last = h;
    if (h==='shop' || catBy[h]){
      var same = S.filter === h && (from==='piece' || from==='system') && inCatalog();
      setFilter(h); S.list = h; show('home');
      if (!same) toCatalog(from==='home' && !first);
    } else if (h.indexOf('piece-')===0 && P[h.slice(6)]){
      S.piece = P[h.slice(6)]; buildPiece(S.piece); show('piece');
    } else if (h==='story'){ if (readerOpen) openReader(false); showMark(markAt); show('story'); story.scrollTop = 0; }
    else if (POL[h]){ showPolicy(h); show('info'); }
    else if (h==='account'){ renderAccount(); show('account'); document.querySelector('.v-account').scrollTop = 0; }
    else if (h==='system'){ show('system'); }
    else { setFilter('shop'); S.list = 'shop'; show('home'); home.scrollTo({ top:0, behavior: from==='home' && !first ? 'smooth' : 'auto' }); }
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
    if (readerOpen){ if (k==='Escape') openReader(false); else if (k==='ArrowRight') stepMark(1); else if (k==='ArrowLeft') stepMark(-1); return; }
    if (k==='Escape'){
      if (regionOpen) openRegion(false); else if (menuOpen) openMenu(false); else if (bagOpen) openBag(false); else if (S.view==='piece') go(S.list); else if (S.view==='story' || S.view==='info' || S.view==='account') go('shop'); else if (S.view==='system') go(S.last);
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
  var tip = $('cur');
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    app.addEventListener('pointermove', function(e){
      var el = e.target.closest('[data-cur]'), t = el && el.getAttribute('data-cur');
      if (t){ tip.textContent = t; tip.style.transform = 'translate('+(e.clientX+16)+'px,'+(e.clientY+18)+'px)'; tip.classList.add('on'); }
      else tip.classList.remove('on');
    });
    app.addEventListener('pointerleave', function(){ tip.classList.remove('on'); });
  }

  app.addEventListener('click', function(e){ var b = e.target.closest('.totop'); if (b){ var v = b.closest('.view'); (v.classList.contains('v-home') ? home : v).scrollTo({ top:0, behavior:'smooth' }); } });
  // the trident's three blades flicker one after another, never together
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) (function tri(){
    setTimeout(function(){
      if (S.view === 'home' && !document.hidden) [].forEach.call(document.querySelectorAll('.sigil .tri i'), function(t, k){
        setTimeout(function(){ t.classList.remove('flick'); void t.offsetWidth; t.classList.add('flick'); }, k * 460);
      });
      tri();
    }, 2600 + Math.random()*3600);
  })();
  // Add to bag flickers red at random moments
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) (function flick(){
    setTimeout(function(){
      var b = $('addBtn');
      if (S.view === 'piece' && !b.disabled && !document.hidden){ b.classList.add('flick'); setTimeout(function(){ b.classList.remove('flick'); }, 420); }
      flick();
    }, 2600 + Math.random()*5200);
  })();
  /* announcement bar: tap the code to copy it; the cross closes the bar */
  $('ann').addEventListener('click', function(e){
    var c = e.target.closest('.ann-code'); if (!c) return;
    var done = function(){ c.textContent = 'Copied'; snd('tick'); setTimeout(function(){ c.textContent = 'DESTINY10'; }, 1400); };
    try { navigator.clipboard.writeText('DESTINY10').then(done, done); } catch(err){ done(); }
  });
  $('annX').onclick = function(){ $('ann').hidden = true; app.style.setProperty('--ann', '0px'); fit(); };
  featBuild(); featTick();
  paintRegion(); renderBag(); setFilter('shop'); route(); playFilm();
  if (lang !== 'en') setLang(lang);
})();
