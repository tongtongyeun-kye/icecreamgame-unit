/* =====================================================================
   공통 효과음 (아나그램 · 아이스크림 공용 — 두 폴더에 같은 파일을 둔다)
   사용법:  게임 스크립트보다 먼저
              <script src="sfx.js"></script>
            효과음 <audio> 를 이름으로 등록하고         GameSfx.add('au-drag', 'au-drag', { volume: 0.5 });
            틀 때                                      GameSfx.play('au-drag');
            앞부분을 건너뛰고 틀 때                    GameSfx.play('au-hint', { offset: 0.9 });
            멈출 때                                    GameSfx.stop(['au-correct', 'au-wrong']);  /  GameSfx.stopAll();

   왜 <audio> 를 바로 틀지 않는가
   - 아이패드(사파리·크롬 모두 같은 엔진)는 짧은 소리를 <audio> 로 되감아 자주 틀면
     어느 순간부터 소리가 났다 안 났다 한다. 소리 파일을 메모리에서 내려 버리거나,
     화면 잠금·다른 앱에 다녀온 뒤 소리 출력이 끊긴 채로 남기 때문이다. 새로고침하면 돌아온다.
   - 그래서 효과음은 처음에 한 번 받아서 풀어 둔 뒤(Web Audio) 그 데이터를 바로 튼다.
     파일을 다시 읽지 않으니 끊기지 않고, 여러 번 겹쳐 눌러도 소리가 씹히지 않는다.
   - 아이패드는 소리 출력이 화면 터치 안에서만 열린다. 화면을 가렸다가 돌아오면
     출력이 막혀 있으므로, 돌아온 뒤 첫 터치 때 출력을 새로 만들어 연다 (= 새로고침과 같은 효과).
   - 파일을 더블클릭해 연 경우(file://)나 아직 받는 중일 때는 예전처럼 <audio> 로 튼다.
     배경음악과 단어 발음은 길어서 그대로 <audio> 로 둔다.
   ===================================================================== */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var canDecode = !!(AC && window.fetch && location.protocol !== 'file:');
  var sounds = {};          // 이름 → { el, url, volume, buffer, failed, playing }
  var ctx = null;           // 지금 쓰는 소리 출력
  var stale = false;        // 화면을 가렸다가 돌아옴 → 다음 터치 때 출력을 새로 만든다
  var tick = { t: -1, at: 0 };   // 출력 시계가 멈췄는지 보려고 마지막으로 본 시각
  var pageLoaded = document.readyState === 'complete';

  // 아이패드 무음 모드에서도 배경음악(<audio>)처럼 효과음이 들리게 한다 (사파리 16.4 이상)
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) { }

  function quiet(p) { if (p && p.catch) p.catch(function () { }); }

  function newContext() {
    if (ctx && ctx.close) { try { quiet(ctx.close()); } catch (_) { } }
    ctx = null;
    try { ctx = new AC(); } catch (_) { ctx = null; }
    tick = { t: -1, at: 0 };
    return ctx;
  }

  // 'running' 이라고 하면서 시계가 0.5초 넘게 그대로면 출력이 죽은 것이다 (아이패드에서 가끔 생김)
  function isStuck() {
    if (!ctx || ctx.state !== 'running') return false;
    var now = Date.now(), t = ctx.currentTime;
    if (t !== tick.t) { tick = { t: t, at: now }; return false; }
    return now - tick.at > 500;
  }

  // 화면을 누를 때마다 부른다. 출력이 막혀 있으면 이 터치 안에서 다시 연다
  function wake() {
    if (!canDecode) return;
    var fresh = false;
    if (!ctx || stale || isStuck()) { stale = false; fresh = !!newContext(); }
    if (!ctx) return;
    if (ctx.state !== 'running') {
      try { quiet(ctx.resume()); } catch (_) { }
      fresh = true;
    }
    if (fresh) {
      // 들리지 않는 아주 짧은 소리를 한 번 내야 아이패드가 출력을 열어 준다
      try {
        var s = ctx.createBufferSource();
        s.buffer = ctx.createBuffer(1, 1, 22050);
        s.connect(ctx.destination);
        s.start(0);
      } catch (_) { }
    }
    loadAll();
  }
  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown'].forEach(function (type) {
    document.addEventListener(type, wake, { capture: true, passive: true });
  });

  function srcOf(el) {
    if (el.currentSrc) return el.currentSrc;
    if (el.src) return el.src;
    var source = el.querySelector('source');
    return source ? source.src : '';
  }

  function load(s) {
    if (s.buffer || s.failed || s.loading) return;
    if (!canDecode || !s.url) { s.failed = true; return; }
    var c = ctx || newContext();
    if (!c) { s.failed = true; return; }
    s.loading = true;
    fetch(s.url)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (data) {
        return new Promise(function (ok, no) {
          var p = c.decodeAudioData(data, ok, no);   // 옛 사파리는 콜백만 받는다
          if (p && p.then) p.then(ok, no);
        });
      })
      .then(function (buf) { s.buffer = buf; s.loading = false; },
        function () { s.failed = true; s.loading = false; });   // 이후로는 <audio> 로 튼다
  }

  // 첫 화면이 뜨는 것을 방해하지 않도록, 다 뜬 뒤에(또는 첫 터치 때) 받는다
  function loadAll() {
    if (!pageLoaded) return;
    Object.keys(sounds).forEach(function (k) { load(sounds[k]); });
  }
  window.addEventListener('load', function () { pageLoaded = true; loadAll(); });

  function playElement(s, offset) {
    var a = s.el;
    if (!a) return;
    var go = function () {
      try { a.currentTime = offset; } catch (_) { }   // 아직 길이를 모르면 처음부터라도 재생
      quiet(a.play());
    };
    if (!offset || a.readyState >= 1) go();
    else a.addEventListener('loadedmetadata', go, { once: true });
  }

  function startBuffer(c, s, offset) {
    var src = c.createBufferSource();
    src.buffer = s.buffer;
    var g = c.createGain();
    g.gain.value = s.volume;
    src.connect(g);
    g.connect(c.destination);
    src.onended = function () {
      var i = s.playing.indexOf(src);
      if (i >= 0) s.playing.splice(i, 1);
    };
    s.playing.push(src);
    src.start(0, Math.min(offset, Math.max(0, s.buffer.duration - 0.01)));
  }

  function play(name, opt) {
    var s = sounds[name];
    if (!s) return;
    var offset = (opt && opt.offset) || 0;
    var c = ctx;
    if (!s.buffer || !c) { playElement(s, offset); return; }
    if (c.state === 'running') {
      try { startBuffer(c, s, offset); } catch (_) { playElement(s, offset); }
      return;
    }
    // 출력이 잠들어 있다 → 깨워 보고, 잠깐 안에 안 깨어나면 <audio> 로라도 낸다
    var done = false;
    var fallback = setTimeout(function () {
      if (done) return;
      done = true;
      playElement(s, offset);
    }, 250);
    try {
      quiet(Promise.resolve(c.resume()).then(function () {
        if (done || c.state !== 'running') return;
        done = true;
        clearTimeout(fallback);
        try { startBuffer(c, s, offset); } catch (_) { playElement(s, offset); }
      }));
    } catch (_) { }
  }

  function stopOne(s) {
    s.playing.splice(0).forEach(function (src) { try { src.stop(0); } catch (_) { } });
    var a = s.el;
    if (a && !a.paused) { a.pause(); a.currentTime = 0; }
  }

  function stop(names) {
    (names || []).forEach(function (n) { if (sounds[n]) stopOne(sounds[n]); });
  }

  function stopAll() { stop(Object.keys(sounds)); }

  function add(name, elementId, opt) {
    var el = document.getElementById(elementId);
    if (!el) return;
    var volume = opt && opt.volume != null ? opt.volume : 1;
    el.volume = volume;   // <audio> 로 틀 때도 같은 크기
    sounds[name] = { el: el, url: srcOf(el), volume: volume, buffer: null, failed: false, loading: false, playing: [] };
    loadAll();
  }

  // 화면을 가리면 나던 효과음을 끊고, 돌아오면 다음 터치 때 출력을 새로 연다
  function onHidden() { stopAll(); stale = true; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) onHidden(); });
  window.addEventListener('pagehide', onHidden);

  window.GameSfx = { add: add, play: play, stop: stop, stopAll: stopAll };
})();
