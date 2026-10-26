/* =====================================================================
   단원별 게임 공용 (7종 공용으로 그대로 복사해서 쓴다)
   사용법:  <script src="unit-data.js"></script>
            <script src="unit.js"></script>
            를 게임 스크립트보다 먼저 넣는다.

   - 주소 끝의 ?unit=3-1 을 읽어 지금 단원을 UNIT.current 로 알려 준다.
     (단원 폴더 3-1/index.html 이 이 주소로 넘겨 준다)
   - 주소에 단원이 없거나 없는 단원이면 UNIT.current = null → 게임은 단원 목록 화면을 보여 준다.
   ===================================================================== */
(function () {
  var data = window.UNIT_DATA || { game: '', units: [] };
  var m = location.search.match(/[?&]unit=([^&#]*)/);
  var requested = m ? decodeURIComponent(m[1]).trim().toLowerCase() : '';
  var current = null;
  data.units.forEach(function (u) { if (u.key === requested) current = u; });

  // "Lesson 1. Hi, I'm Olly" → { lesson: "Lesson 1", name: "Hi, I'm Olly" }
  function splitTitle(u) {
    var t = u.title.match(/^(Lesson\s*\d+)\.\s*(.*)$/i);
    return t ? { lesson: t[1], name: t[2] } : { lesson: 'ABC', name: u.title };
  }

  function grades() {
    var seen = {};
    return data.units.map(function (u) { return u.grade; })
      .filter(function (g) { return seen[g] ? false : (seen[g] = true); })
      .sort(function (a, b) { return a - b; });
  }

  function unitsOf(grade) {
    return data.units.filter(function (u) { return u.grade === grade; });
  }

  // 단원으로 이동 — 게임을 이 단원으로 새로 연다
  function go(key) {
    location.href = location.pathname + '?unit=' + encodeURIComponent(key);
  }

  function label(u) {
    u = u || current;
    return u ? u.grade + '학년 ' + u.title : '';
  }

  // 지금 단원의 영어 단어 / 뜻
  var words = current ? current.words.map(function (w) { return w.en; }) : [];
  var meanings = {};
  if (current) current.words.forEach(function (w) { meanings[w.en.toLowerCase()] = w.ko; });

  // 다른 단원 주소로 들어왔는데 이 게임에 없는 단원이면 알려 준다
  if (requested && !current) {
    window.addEventListener('load', function () {
      alert('이 게임에는 "' + requested + '" 단원이 없어요. 단원 목록에서 골라 주세요.');
    });
  }

  if (current) document.title = document.title + ' · ' + label(current);

  window.UNIT = {
    game: data.game,
    units: data.units,
    current: current,
    words: words,
    meaning: function (en) { return meanings[(en || '').toLowerCase()] || ''; },
    grades: grades,
    unitsOf: unitsOf,
    splitTitle: splitTitle,
    label: label,
    go: go
  };
})();
