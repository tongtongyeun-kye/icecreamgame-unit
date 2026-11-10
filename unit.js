/* =====================================================================
   단원별 게임 공용 (7종 공용으로 그대로 복사해서 쓴다)
   사용법:  <script src="unit-data.js"></script>
            <script src="unit.js"></script>
            를 게임 스크립트보다 먼저 넣는다.

   - 주소 끝의 ?unit=3-1 을 읽어 지금 단원을 UNIT.current 로 알려 준다.
     (단원 폴더 3-1/index.html 이 이 주소로 넘겨 준다)
   - 주소에 단원이 없거나 없는 단원이면 UNIT.current = null → 게임은 단원 목록 화면을 보여 준다.
   - 단, unit-data.js 에 단원이 하나뿐이면(CMS 등록용 단원별 zip) 주소 없이도 그 단원으로 연다.
   - UNIT.topicDir('국가와 자연') → 'country_nature' : 주제 폴더의 영문 이름
     (CMS가 한글 경로를 못 읽어 녹음 폴더 이름을 영문으로 바꿨다. 지시서 규칙 5)
   - UNIT.audio('ice cream') → 'unit_audio/ice%20cream.mp3' : 단원별 게임 음성 (없으면 null)
     UNIT.image('glue stick') → 'unit_image/grade3/glue_stick.png' : 단원별 게임 이미지 (지금 단원 학년 기준, 없으면 null)
     목록은 unit-media.js(window.UNIT_MEDIA)에 있다. 이 파일을 안 넣은 게임은 늘 null.
   ===================================================================== */
(function () {
  var data = window.UNIT_DATA || { game: '', units: [] };
  var m = location.search.match(/[?&]unit=([^&#]*)/);
  var requested = m ? decodeURIComponent(m[1]).trim().toLowerCase() : '';
  var current = null;
  data.units.forEach(function (u) { if (u.key === requested) current = u; });
  if (!current && !requested && data.units.length === 1) current = data.units[0];

  var TOPIC_DIR = {
    '국가와 자연': 'country_nature', '동작': 'action', '물건': 'things',
    '사람과 동물': 'people_animals', '숫자·색깔·시간': 'number_color_time',
    '음식과 음료': 'food_drink', '장소·교통·방향': 'place_transport_direction',
    '취미·과목·직업': 'hobby_subject_job', '특징과 감정': 'feature_feeling'
  };
  function topicDir(name) { return TOPIC_DIR[name] || encodeURIComponent(name); }

  // 단원별 게임 음성·이미지 (unit-media.js)
  var media = window.UNIT_MEDIA || { audio: {}, image: {} };
  function audio(en) {
    var f = media.audio[String(en || '').trim().toLowerCase()];
    return f ? 'unit_audio/' + encodeURIComponent(f) + '.mp3' : null;   // 목록에는 확장자 없이 이름만 있다
  }
  function image(en, grade) {
    grade = grade || (current && current.grade);
    var list = media.image[grade] || {};
    var f = list[String(en || '').trim().replace(/\.$/, '').replace(/ /g, '_').toLowerCase()];
    return f ? 'unit_image/grade' + grade + '/' + encodeURIComponent(f) + '.png' : null;
  }

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
    go: go,
    topicDir: topicDir,
    audio: audio,
    image: image
  };
})();
