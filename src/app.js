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
  $('menuList').innerHTML = '<a href="#shop" data-cat="shop"><span>All pieces</span><i>'+all.length+'</i></a>'
    + cats.map(function(c){ return '<a href="#'+c.slug+'" data-cat="'+c.slug+'"><span>'+c.name+'</span><i>'+c.items.length+'</i></a>'; }).join('')
    + '<a class="m-story" href="#story" data-cat="story"><span>Story</span><i>The collection and its prints</i></a>';
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
    var shown = cells.filter(function(t){ return !t.hidden; }).length;
    $('wallNow').innerHTML = '<b>'+(c ? c.name : 'All pieces')+'</b><span>'+shown+' pieces</span><i>Change</i>';
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
    app.style.setProperty('--print', 'url('+c.toDataURL()+')');
    app.style.setProperty('--grain', 'url('+g.toDataURL()+')');
  })();
  function fit(){ app.style.setProperty('--vh', home.clientHeight + 'px'); }
  fit(); window.addEventListener('resize', fit);

  function inCatalog(){ return home.scrollTop > home.clientHeight * .5; }
  function syncChrome(){
    var list = S.view==='home' && inCatalog();
    app.classList.toggle('solid', S.view==='home' && home.scrollTop > home.clientHeight - 80);
    [].forEach.call(document.querySelectorAll('#cats a, #menuList a'), function(a){
      var k = a.getAttribute('data-cat');
      a.setAttribute('aria-current', (list && k===S.filter) || (S.view==='piece' && S.piece && k===S.piece.c) || (S.view==='story' && k==='story'));
    });
  }
  home.addEventListener('scroll', syncChrome, { passive:true });
  function toCatalog(smooth){ home.scrollTo({ top:catalog.offsetTop, behavior: smooth ? 'smooth' : 'auto' }); }

  /* ---------- sound: the film carries the music ---------- */
  var film = $('film'), wantSound = true, soundBtn = $('soundBtn');
  function paintSound(){ var on = !film.muted && !film.paused; soundBtn.textContent = $('soundBtn2').textContent = on ? 'Sound on' : 'Sound off'; soundBtn.setAttribute('aria-pressed', on); }
  function playFilm(){
    film.muted = !wantSound;
    var pr = film.play();
    if (pr && pr.catch) pr.then(paintSound).catch(function(){ film.muted = true; var p2 = film.play(); if (p2 && p2.catch) p2.catch(function(){}); paintSound(); });
    else paintSound();
  }
  function firstTouch(){ if (wantSound && (film.muted || film.paused)) playFilm(); }
  ['pointerdown','keydown'].forEach(function(ev){ window.addEventListener(ev, firstTouch, { once:true, capture:true }); });
  soundBtn.onclick = $('soundBtn2').onclick = function(){ wantSound = film.muted || film.paused; playFilm(); };
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

  /* ---------- story: the prints, sorted into four families, with one viewer ---------- */
  var FAMS = [
    { name:'Marks', note:'Signs drawn by hand', items:['maitri','hikari','vasanta'] },
    { name:'Bands', note:'Teeth and stripes', items:['midori','aiko'] },
    { name:'Fields', note:'One shape, repeated', items:['padma','shunya','yashodhara'] },
    { name:'Flora', note:'Flowers and paisley', items:['surya','darvish','mani'] }
  ];
  var MARKS = {
    maitri:{ name:'Chevron and house', see:'Off-white marks on black. Columns of arrowheads run between pointed blocks filled with short bars.', read:'We read the arrowheads as a path, and the blocks as the house it leads back to.' },
    hikari:{ name:'Crossroads', see:'Red on cream. Bands of triangles sit beside small squares, each crossed corner to corner.', read:'We read the crossed square as a meeting place: four roads arriving at one point.' },
    vasanta:{ name:'Diamond', see:'A black lattice of diamonds and dots running down a pale yellow edge.', read:'We read the diamond as an eye that stays open. It sits on the edge of the cloth and watches.' },
    midori:{ name:'Tooth', see:'Brown triangles set point to edge in long bands, with rows of small diamonds between them.', read:'We read it as a guard: a border that keeps what is inside it.' },
    aiko:{ name:'Tooth and thread', see:'The same teeth in cream on green, running between groups of fine lines.', read:'The lines are the thread. The teeth are where it is tied off.' },
    padma:{ name:'Star', see:'Six-pointed stars set inside hexagons, purple on cream.', read:'We read it as the night sky, used the way it was first used: as a map.' },
    shunya:{ name:'Field', see:'A grid of small squares, each filled with loose stamped marks, pink on cream.', read:'We read it as land seen from above. Every plot is the same size and planted differently.' },
    yashodhara:{ name:'Fan', see:'Rows of overlapping fans, like shells or scales, in plum.', read:'We read it as water: one wave laid over the last.' },
    surya:{ name:'Sun band', see:'Cream flowers on green, crossed by a blue band of circles and arcs.', read:'We read the circles as the sun, crossing from one edge of the cloth to the other.' },
    darvish:{ name:'Paisley', see:'Teardrop shapes and flowers arranged in panels, on turquoise.', read:'Paisley is a teardrop motif that came out of Persia and India. Here it is a reminder that cloth travels, and patterns travel with it.' },
    mani:{ name:'Sprig', see:'Small gold sprigs scattered over orange, above a banded border.', read:'We read each sprig as a seed: small, repeated, and enough to cover the whole field.' }
  };
  var ORDER = []; FAMS.forEach(function(f){ f.items.forEach(function(h){ ORDER.push(h); }); });
  var markAt = null, story = document.querySelector('.v-story');
  $('pgGrid').innerHTML = FAMS.map(function(f){
    return '<div class="fam"><p class="fam-h"><b>'+f.name+'</b><span>'+f.note+'</span></p><div class="fam-row">'
      + f.items.map(function(h){ return '<button type="button" class="sw" data-h="'+h+'" aria-label="'+MARKS[h].name+'"><img src="media/sw/'+h+'.jpg" alt="" loading="lazy"><span>'+MARKS[h].name+'</span></button>'; }).join('')
      + '</div></div>';
  }).join('');
  if (narrow.matches) document.querySelector('.fam').appendChild($('pgView'));
  function showMark(h){
    if (h === markAt) return; markAt = h; var m = MARKS[h], p = P[h];
    [].forEach.call(document.querySelectorAll('.sw'), function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-h')===h); });
    $('pvImg').src = 'media/sw/'+h+'.jpg'; $('pvImg').alt = m.name + ' pattern, drawn flat';
    $('pvN').textContent = two(ORDER.indexOf(h)+1) + ' / ' + two(ORDER.length);
    $('pvName').textContent = m.name; $('pvSee').textContent = m.see; $('pvRead').textContent = m.read;
    $('pvCloth').href = '#piece-'+h; $('pvClothImg').src = 'media/cl/'+h+'.jpg'; $('pvClothName').textContent = p.f;
    var sp = $('storyPat'); sp.style.backgroundImage = 'url(media/sw/'+h+'.jpg)'; sp.style.backgroundSize = '420px 420px';
  }
  $('pgGrid').addEventListener('pointerover', function(e){ var b = e.target.closest('.sw'); if (b && e.pointerType==='mouse') showMark(b.getAttribute('data-h')); });
  $('pgGrid').addEventListener('click', function(e){
    var b = e.target.closest('.sw'); if (!b) return;
    showMark(b.getAttribute('data-h')); snd('tick');
    if (narrow.matches){ b.closest('.fam').appendChild($('pgView')); $('pgView').scrollIntoView({ behavior:'smooth', block:'nearest' }); }
  });

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
  $('cats').addEventListener('click', function(){ snd('tick'); });

  /* ---------- bag ---------- */
  var bag = [];
  try { bag = JSON.parse(localStorage.getItem('vv-bag') || '[]').filter(function(l){ return P[l.h]; }); } catch(e){ bag = []; }
  function saveBag(){ try { localStorage.setItem('vv-bag', JSON.stringify(bag)); } catch(e){} }
  function renderBag(){
    var n = bag.reduce(function(s,l){ return s+l.q; }, 0), sub = bag.reduce(function(s,l){ return s + l.q*P[l.h].p; }, 0);
    $('bagCount').textContent = n; $('bagBtn').classList.toggle('has', n>0);
    $('bagEmpty').hidden = n>0; $('bagFoot').hidden = n===0; $('bagList').hidden = n===0;
    $('bagN').textContent = n ? ' (' + n + ')' : '';
    $('bagList').innerHTML = bag.map(function(l,i){
      var p = P[l.h];
      return '<li><a class="box" href="#piece-'+p.h+'"><img class="cut" src="cut/'+p.h+'.webp" alt=""></a>'
        + '<p class="b-row"><b>'+esc(label(p))+'</b><span>'+money(l.q*p.p)+'</span></p><p class="meta">'+KIND[p.c]+', size '+l.s+'</p>'
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
    if (o !== menuOpen) snd('sheet');
    menuOpen = o; menuEl.classList.toggle('open', o); menuEl.setAttribute('aria-hidden', !o); menuEl.inert = !o;
    $('scrim').hidden = !o && !bagOpen;
    if (o) $('menuClose').focus({preventScroll:true});
  }
  $('menuBtn').onclick = $('wallNow').onclick = function(){ openMenu(true); };
  $('menuClose').onclick = function(){ openMenu(false); };
  menuEl.addEventListener('click', function(e){ if (e.target.closest('a')) openMenu(false); });
  var bagEl = $('bag'), bagOpen = false, lastFocus = null;
  function openBag(o){
    if (o !== bagOpen) snd('sheet');
    bagOpen = o; bagEl.classList.toggle('open', o); $('scrim').hidden = !o;
    bagEl.setAttribute('aria-hidden', !o); bagEl.inert = !o;
    if (o){ lastFocus = document.activeElement; $('bagClose').focus({preventScroll:true}); } else if (lastFocus && lastFocus.focus) lastFocus.focus({preventScroll:true});
  }
  $('bagBtn').onclick = function(){ openBag(true); }; $('bagClose').onclick = function(){ openBag(false); }; $('scrim').onclick = function(){ if (menuOpen) openMenu(false); if (bagOpen) openBag(false); };
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
    if (menuOpen) openMenu(false);
    if (h !== 'system') S.last = h;
    if (h==='shop' || catBy[h]){
      var same = S.filter === h && (from==='piece' || from==='system') && inCatalog();
      setFilter(h); S.list = h; show('home');
      if (!same) toCatalog(from==='home' && !first);
    } else if (h.indexOf('piece-')===0 && P[h.slice(6)]){
      S.piece = P[h.slice(6)]; buildPiece(S.piece); show('piece'); if (!first) snd('open');
    } else if (h==='story'){ showMark(markAt || ORDER[0]); show('story'); story.scrollTop = 0; }
    else if (POL[h]){ showPolicy(h); show('info'); }
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
      if (menuOpen) openMenu(false); else if (bagOpen) openBag(false); else if (S.view==='piece') go(S.list); else if (S.view==='story' || S.view==='info') go('shop'); else if (S.view==='system') go(S.last);
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

  app.addEventListener('click', function(e){ var b = e.target.closest('.totop'); if (b){ var v = b.closest('.view'); (v.classList.contains('v-home') ? home : v).scrollTo({ top:0, behavior:'smooth' }); } });
  renderBag(); setFilter('shop'); route(); playFilm();
})();
