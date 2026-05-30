/* =====================================================================
   ガリレオ — 合格実績・合格者の声 単一データソース
   ---------------------------------------------------------------------
   このファイルが「正」です。合格実績・合格者の声・集計値・注記は
   すべてここで一元管理し、各ページはこのデータを読み込んで描画します。
   各ページにベタ書きしないこと（表記ゆれ・更新漏れ防止）。

   読み込み方法:
     トップ        : <script src="assets/js/voices-data.js"></script>
     pages/ 配下   : <script src="../assets/js/voices-data.js"></script>

   ※本文は全件「保護者の視点」で書かれているため、合格者の声ページは
     実質「保護者様の声」として機能します。
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---- アセットのベースパス自動判定 ----
     voices-data.js 自身の URL から site ルートを求め、画像等のパスを
     ページ階層（"/" と "/pages/"）に依存せず解決する。
     → 画像パスは常に site ルート相対（例 'img/voices/xxx.jpg'）で書けばOK。 */
  var ASSET_BASE = (function () {
    try {
      var s = (document.currentScript && document.currentScript.src) || '';
      if (!s) {
        var els = document.getElementsByTagName('script');
        for (var i = 0; i < els.length; i++) {
          if (els[i].src && /assets\/js\/voices-data\.js/.test(els[i].src)) { s = els[i].src; break; }
        }
      }
      return s.replace(/assets\/js\/voices-data\.js.*$/, '');
    } catch (e) { return ''; }
  })();
  function asset(p) {
    if (!p) return '';
    if (/^(https?:)?\/\//.test(p) || p.charAt(0) === '/') return p; // 絶対URL/ルート絶対はそのまま
    // 日本語・空白を含むファイル名でも安全なよう相対パスをURLエンコード
    return ASSET_BASE + encodeURI(p.replace(/^\.?\//, ''));
  }

  /* ---- 注記（景品表示法・ステマ規制対応：全箇所共通） ---- */
  // ⚠ 前提: 13件が実在の生徒・保護者で掲載許可を得ていること。
  //   もし一部でも紹介用に構成した事例(composite)の場合は、運営者判断で
  //   NOTE_PERMISSION を NOTE_COMPOSITE に切り替えること。
  var NOTE_PERMISSION = '※合格実績・合格者の声は、ご本人・保護者様の許可を得て掲載しています。';
  var NOTE_COMPOSITE  = '※掲載内容は実例をもとに構成したものです。';
  var NOTE_RESULTS    = '※主な合格実績です。合格者数・最新の実績はLINEよりお問い合わせください。';

  /* ---- 確認済み集計値（これ以外の数値は使わない） ---- */
  var STATS = [
    { num: '200', unit: '名超', label: '累計指導生徒' },
    { num: '約10', unit: '年', label: '理系受験指導歴' },
    { num: '90', unit: '%超', label: '志望校合格率' }
  ];

  // 偏差値+21.5 は「個別の実例」1件のみ確認済み。使う場合は出典を明確化すること。
  // TODO: 出典（在籍生徒1名の実例）の確認。確認が取れない場合は表示しない。
  var INDIVIDUAL_EXAMPLE = { value: '+21.5', label: '偏差値UP（個別の実例）', note: '※在籍生徒1名の個別の実例です。' };

  /* ---- 保護者アンケート画像グリッド ----
     画像を img/voices/ に置き、下の配列に { src, alt } を追加すると、
     ホーム／合格者の声ページに自動でグリッド表示されます（空配列なら非表示）。
     src は site ルート相対（例 'img/voices/survey-01.jpg'）で記載。 */
  var SURVEY_IMAGES = [
    // { src: 'img/voices/survey-01.jpg', alt: '保護者アンケート（東京大学 合格）' },
    // { src: 'img/voices/survey-02.jpg', alt: '保護者アンケート（医学部 合格）' },
  ];

  /* ---- 合格大学（カテゴリー別バッジ） ---- */
  var UNIVERSITY_GROUPS = [
    {
      category: '最難関国公立・医学部',
      universities: ['東京大学', '京都大学', '東京工業大学', '北海道大学', '東京医科歯科大学']
    },
    {
      category: '早慶・難関私立理系',
      universities: ['早稲田大学', '慶應義塾大学', '東京理科大学']
    },
    {
      category: 'MARCH理工系',
      universities: ['明治大学', '青山学院大学', '立教大学', '中央大学', '法政大学']
    }
  ];

  /* ---- 合格者の声 全13件（本文は提供データのまま） ---- */
  var CASES = [
    {
      id: 'case01', no: '01', group: 'A', category: '最難関国公立・医学部',
      university: '東京大学', faculty: '理科一類', initials: 'S.T',
      grade: '高校3年生', year: '2025年度',
      tags: ['全科目バランス', '苦手科目克服', '合格ロードマップ'],
      image: 'img/voices/東京大学 理科一類.jpg',
      q1: '数学と物理は得意でしたが、得意科目に頼りすぎて化学と英語が伸び悩んでいました。東大理一を目指すには全科目のバランスが必要だと感じ、理系専門で戦略的に指導してくれる塾を探してガリレオにたどり着きました。',
      q2: '苦手科目の優先順位を明確にしてもらえたことで、得意な数学・物理に逃げる癖がなくなりました。化学の計算問題が安定し、英語の長文も毎日の演習で読めるようになり、夏以降は全科目で得点が底上げされました。',
      q3: '理系科目に精通した先生が、息子の答案の論理の飛躍まで細かく指摘してくれた点が素晴らしかったです。理系専門だからこその深い指導を実感しました。進捗の共有も丁寧で安心して任せられました。',
      q4: '得意科目があっても、苦手科目が足を引っ張ると難関校には届きません。ガリレオは全体最適の視点で計画を立ててくれます。息子は東大理一に合格できました。理系志望ならぜひ一度相談してみてください。'
    },
    {
      id: 'case02', no: '02', group: 'A', category: '最難関国公立・医学部',
      university: '京都大学', faculty: '工学部', initials: 'T.Y',
      grade: '高校3年生', year: '2025年度',
      tags: ['記述添削', '数学答案', '論理力'],
      image: 'img/voices/京都大学 工学部.jpg',
      q1: '京大工学部を志望していましたが、二次試験の数学の記述で減点が多く、答案の書き方に課題がありました。記述答案を丁寧に添削してくれる理系専門塾を探していたところ、ガリレオの体験指導で的確な指摘を受けて入塾を決めました。',
      q2: '数学の答案で「なぜその式変形をするのか」を言語化する習慣がつき、論理の飛躍がなくなりました。添削の往復で記述力が大きく上達し、京大模試でも安定して得点できるようになりました。',
      q3: '数学の記述という採点者の視点が必要な部分を、これほど丁寧に見てくれる塾は他にないと思います。先生が毎回具体的にどこを直せばいいか示してくれたので、息子も迷わず取り組めていました。',
      q4: '二次の記述に不安があるなら、早めに専門的な添削を受けることをおすすめします。息子は京大の工学部に合格しました。「答案の書き方」は独学では身につきにくい部分です。ぜひ相談してみてください。'
    },
    {
      id: 'case03', no: '03', group: 'A', category: '最難関国公立・医学部',
      university: '東京工業大学', faculty: '', initials: 'E.K',
      grade: '高校3年生', year: '2025年度',
      tags: ['難関理系対策', '物理の本質理解', '配点戦略'],
      image: 'img/voices/東京工業大学.jpg',
      q1: '東工大は数学と理科の配点が非常に高く、ハイレベルな問題に対応できる指導が必要でした。学校の授業や一般的な塾では物足りず、理系に特化して難関理系大学の対策ができる塾を探していました。',
      q2: '難問へのアプローチの仕方を体系的に教えていただき、初見の問題でも手が止まらなくなりました。物理の本質的な理解が深まり、暗記に頼らず原理から考えられるようになったのが大きな変化です。',
      q3: '東工大という特殊な配点に合わせて、数学と理科に重点を置いた計画を立ててもらえた点が良かったです。理系専門だからこそ志望校ごとの対策に精通していて、安心して任せられました。',
      q4: '東工大のようなハイレベルな理系大学には、それに合った専門的な対策が不可欠です。息子はガリレオで力をつけ、見事合格できました。難関理系を目指すお子さんにこそ、専門塾の力を感じてほしいです。'
    },
    {
      id: 'case04', no: '04', group: 'A', category: '最難関国公立・医学部',
      university: '北海道大学', faculty: '理学部', initials: 'K.S',
      grade: '高校3年生', year: '2025年度',
      tags: ['地方在住', 'オンライン指導', '二次記述対策'],
      image: 'img/voices/北海道大学 理学部.jpg',
      q1: '地方在住で、理系専門の塾が近くにありませんでした。北大理学部を目指すための二次対策をオンラインで受けられる塾を探していたところ、ガリレオの体験授業で講師の説明がとても丁寧で、安心して任せられると感じました。',
      q2: '共通テストと二次試験の対策を計画的に並行して進められるようになりました。特に理科の記述対策が積み上がり、添削を重ねるうちに解答の精度が上がっていきました。地方にいながら質の高い指導を受けられました。',
      q3: '地方在住でも、オンラインで首都圏と同じレベルの理系指導を受けられた点が一番ありがたかったです。先生が娘の状況を常に把握して計画を調整してくれたので、遠方でも不安はありませんでした。',
      q4: '地方だから理系の専門指導は受けられない、と諦めないでください。娘は北大の理学部に合格しました。オンラインなら住む場所に関係なく本格的な対策ができます。'
    },
    {
      id: 'case05', no: '05', group: 'A', category: '早慶・難関私立理系',
      university: '早稲田大学', faculty: '先進理工学部', initials: 'W.K',
      grade: '高校3年生', year: '2025年度',
      tags: ['私立理系の傾向対策', '過去問分析', '融合問題'],
      image: 'img/voices/早稲田大学 先進理工学部.jpg',
      q1: '早稲田の先進理工を目指していましたが、私立理系特有の出題傾向への対策が手薄でした。志望校の傾向に合わせて指導してくれる理系専門塾を探し、ガリレオの過去問分析の精度の高さに惹かれて入塾を決めました。',
      q2: '志望学部の出題傾向を踏まえた演習で、効率よく得点力を伸ばせました。物理と化学の融合問題への対応力がつき、過去問の得点率が安定して合格圏に入るようになりました。',
      q3: '私立理系の細かい出題傾向まで把握した上で計画を立ててくれた点が良かったです。先生が「この大学はここが頻出」と具体的に示してくれたので、息子も的を絞って対策できていました。',
      q4: '私立理系は大学ごとに傾向が大きく異なります。ガリレオはその違いを熟知しています。息子は早稲田の先進理工に合格しました。志望校に合わせた対策をしたいなら、専門塾を頼ってみてください。'
    },
    {
      id: 'case06', no: '06', group: 'A', category: '早慶・難関私立理系',
      university: '慶應義塾大学', faculty: '理工学部', initials: 'Y.H',
      grade: '高校3年生', year: '2025年度',
      tags: ['完全個別', '有機化学の克服', '苦手を得意に'],
      image: 'img/voices/慶應義塾大学 理工学部.jpg',
      q1: '慶應理工を目指していましたが、数学と理科のレベルが高く、独学では限界を感じていました。完全個別で一人ひとりに合わせて指導してくれる理系専門塾を探していたとき、ガリレオの体験指導で娘の課題を的確に指摘してもらえました。',
      q2: '苦手だった有機化学を基礎から体系的に教えていただき、得点源に変わりました。完全個別なので娘のペースに合わせて進められ、わからない部分をその場で解消できる環境が大きな変化につながりました。',
      q3: '完全個別で娘の理解度に合わせて進めてくれる点が安心でした。質問しづらいタイプの娘が、先生には遠慮なく聞けるようになったのが印象的でした。理系科目を深く理解させてもらえました。',
      q4: '理系科目でつまずいているなら、完全個別の指導が効果的です。娘は慶應の理工学部に合格しました。一対一でじっくり見てもらえる環境が、苦手を得意に変えてくれますよ。'
    },
    {
      id: 'case07', no: '07', group: 'A', category: '早慶・難関私立理系',
      university: '東京理科大学', faculty: '工学部', initials: 'M.I',
      grade: '高校3年生', year: '2025年度',
      tags: ['毎日課題', '学習習慣', '自己管理サポート'],
      image: 'img/voices/東京理科大 工学部.jpg',
      q1: '理科大の工学部を志望していましたが、本人の自己管理が苦手で学習計画が続きませんでした。毎日の学習を管理してくれて、理系科目をしっかり指導してくれる塾を探していたところ、ガリレオの仕組みに可能性を感じて相談しました。',
      q2: '学習計画を細かく管理してもらえたことで、毎日コンスタントに勉強する習慣がつきました。物理と数学の演習量が確保できるようになり、模試の成績が右肩上がりに伸びていきました。',
      q3: '毎日の進捗を先生が把握して、サボりがちな息子をうまく軌道に乗せてくれた点がありがたかったです。親が口を出さなくても学習が回るようになり、家庭の雰囲気も穏やかになりました。',
      q4: '自己管理が苦手なお子さんにこそ、毎日伴走してくれる塾が向いています。息子は東京理科大の工学部に合格しました。毎日見てくれる先生がいるだけで、お子さんは見違えるように変わります。'
    },
    {
      id: 'case08', no: '08', group: 'A', category: '最難関国公立・医学部',
      university: '東京医科歯科大学', faculty: '医学部', initials: 'N.K',
      grade: '高校3年生', year: '2025年度',
      tags: ['医学部', '高精度演習', '戦略的対策'],
      image: 'img/voices/東京医科歯科大学 医学部.jpg',
      q1: '医学部志望で、共通テストの高得点と二次の理科・数学の両方で高い完成度が求められる状況でした。医学部受験のノウハウを持つ理系専門塾が必要だと感じ、ガリレオの合格実績と指導方針を見て入塾を決めました。',
      q2: '医学部に必要な高い精度の演習を毎日積み重ねられました。ミスを減らす答案作成の習慣がつき、共通テスト・二次ともに安定して高得点を取れるようになりました。最後まで戦略的に対策できたのが大きかったです。',
      q3: '医学部という高い目標に対して、先生が一切妥協せず緻密な計画を立ててくれた点が心強かったです。精神的にも支えてもらい、プレッシャーの大きい医学部受験を最後まで走り切れました。',
      q4: '医学部受験は精度と戦略がすべてです。ガリレオは医学部合格に必要なノウハウを持っています。息子は東京医科歯科大の医学部に合格しました。医学部を目指すお子さんにこそ、ガリレオさんの力を感じてほしいです。'
    },
    {
      id: 'case09', no: '09', group: 'B', category: 'MARCH理工系',
      university: '明治大学', faculty: '理工学部', initials: 'F.U',
      grade: '高校3年生', year: '2025年度',
      tags: ['物理（電磁気）', '原理から理解', '弱点克服'],
      image: 'img/voices/明治大学 理工学部.jpg',
      q1: '明治の理工を志望していましたが、数学は得意な一方で物理の力学・電磁気が苦手で伸び悩んでいました。理系科目に特化して、苦手分野をピンポイントで対策してくれる塾を探していたところ、ガリレオの体験指導で的確に弱点を指摘してもらえました。',
      q2: '苦手だった電磁気を基礎の原理から教えていただき、暗記ではなく理解で解けるようになりました。物理が得点源に変わったことで全体の偏差値が安定し、明治の理工に余裕を持って合格できました。',
      q3: '物理という理解が難しい科目を、原理からかみ砕いて教えてくれた点が素晴らしかったです。理系専門だからこその深い指導で、息子が「物理が面白くなった」と言い出したのが嬉しかったです。',
      q4: '理系科目でつまずいているなら、原理から教えてくれる専門塾がおすすめです。息子は明治の理工学部に合格しました。苦手分野は正しい教え方で必ず得点源に変わります。ぜひ相談してみてはいかがでしょうか。'
    },
    {
      id: 'case10', no: '10', group: 'B', category: 'MARCH理工系',
      university: '青山学院大学', faculty: '理工学部', initials: 'N.H',
      grade: '高校3年生', year: '2025年度',
      tags: ['数III微積', '完全個別', '基礎から積み上げ'],
      image: 'img/voices/青山学院大学 理工学部.jpg',
      q1: '青学の理工を目指していましたが、数学IIIの微積分でつまずき、応用問題に全く手が出ない状態でした。完全個別で数IIIを基礎から丁寧に見てくれる理系専門塾を探し、ガリレオに相談しました。',
      q2: '数IIIの微積分を基礎から段階的に積み上げてもらえたことで、応用問題にも対応できるようになりました。理解できる問題が増えるにつれて娘の自信も回復し、模試で安定して合格圏に入りました。',
      q3: '数IIIという難易度の高い分野を、娘のペースに合わせて根気強く教えてくれた点が安心でした。完全個別なので、わからない部分をその場で何度でも質問できる環境がありがたかったです。',
      q4: '数IIIでつまずいているお子さんへ。基礎からやり直せば必ず追いつけます。娘は青山学院の理工学部に合格しました。完全個別で一つひとつ理解を積み上げる指導が、苦手克服の近道だと思いますよ。'
    },
    {
      id: 'case11', no: '11', group: 'B', category: 'MARCH理工系',
      university: '立教大学', faculty: '理学部', initials: 'K.N',
      grade: '高校3年生', year: '2025年度',
      tags: ['私立理系の傾向対策', '過去問分析', '化学理論'],
      image: 'img/voices/立教大学 理学部.png',
      q1: '立教の理学部を志望していましたが、私立理系の出題傾向への対策が手薄で、過去問で思うように点が取れませんでした。志望校の傾向を踏まえた対策をしてくれる理系専門塾を探していたところ、ガリレオの過去問分析の精度に惹かれました。',
      q2: '志望学部の頻出分野を踏まえた演習で、効率よく得点力を伸ばせました。化学の理論分野が安定し、過去問の得点率が大きく上がって、本番でも落ち着いて取り組めたようです。',
      q3: '私立理系の細かい出題傾向まで把握した上で、的を絞った対策を立ててくれた点が良かったです。「この分野が頻出」と具体的に示してくれたので、息子も無駄なく対策を進められました。',
      q4: '私立理系は大学ごとに傾向が異なります。ガリレオはその違いを熟知しています。息子は立教の理学部に合格しました。'
    },
    {
      id: 'case12', no: '12', group: 'B', category: 'MARCH理工系',
      university: '中央大学', faculty: '理工学部', initials: 'T.Y',
      grade: '高校3年生', year: '2025年度',
      tags: ['毎日課題', '学習習慣', '生活リズム改善'],
      image: 'img/voices/中央大学 理工学部.pdf',
      q1: '中央大学の理工学部を目指していましたが、本人の自己管理が苦手で学習計画が三日坊主になりがちでした。毎日の学習を管理しつつ理系科目をしっかり指導してくれる塾を探し、ガリレオの毎日サポートの仕組みに可能性を感じました。',
      q2: '学習を毎日管理してもらえたことで、コンスタントに勉強する習慣が身につきました。数学と化学の演習量が確保でき、模試の成績が右肩上がりに伸びていきました。また、生活リズムも整いました。',
      q3: '毎日の進捗を先生が把握して、サボりがちな息子をうまく軌道に乗せてくれた点がありがたかったです。親が口出ししなくても学習が回るようになり、家庭の雰囲気も穏やかになりました。',
      q4: '自己管理が苦手なお子さんにこそ、毎日伴走してくれる塾が向いています。息子は中央大学の理工学部に合格しました。一人で頑張らせるのではなく、一緒に走ってくれる存在を見つけてあげてください。'
    },
    {
      id: 'case13', no: '13', group: 'B', category: 'MARCH理工系',
      university: '法政大学', faculty: '生命科学部', initials: 'A.M',
      grade: '高校3年生', year: '2025年度',
      tags: ['複数科目のバランス', '生物の記述対策', '全体最適'],
      image: 'img/voices/法政大学 生命科学部.jpg',
      q1: '法政の生命科学部を志望していましたが、生物と化学のバランスがうまく取れず、どちらも中途半端な状態でした。理系科目を横断的に見て計画を立ててくれる専門塾を探していたところ、ガリレオの戦略的な指導方針に惹かれました。',
      q2: '生物と化学の優先順位を整理してもらえたことで、効率よく両科目を伸ばせました。特に生物の記述対策が積み上がり、添削を重ねるうちに得点が安定して合格圏に入りました。',
      q3: '複数の理系科目を全体最適の視点で計画してくれた点が良かったです。娘がどの科目に時間を割けばいいか迷わなくなり、最後まで無駄なく対策できました。進捗共有も丁寧で安心でした。',
      q4: '複数の理系科目のバランスに悩んでいるなら、全体を見て計画を立ててくれる専門塾がおすすめです。娘は法政の生命科学部に合格しました。戦略的な対策が合格への近道だと実感しました。'
    }
  ];

  /* =====================================================================
     描画ヘルパー（vanilla JS / フレームワーク不使用）
     ===================================================================== */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function uniLabel(c) {
    return c.faculty ? (c.university + ' ' + c.faculty) : c.university;
  }

  function caseById(id) {
    for (var i = 0; i < CASES.length; i++) { if (CASES[i].id === id) return CASES[i]; }
    return null;
  }

  // スクロール表示アニメ用の .visible を即時付与（後挿入要素が opacity:0 で固定されるのを防ぐ）
  function reveal(el) { if (el && el.classList) el.classList.add('visible'); }

  // ケース個別の画像（合格実績等）。未指定/読込失敗なら何も表示しない。PDFはリンク表示。
  function caseImageHTML(c) {
    if (!c.image) return '';
    var src = asset(c.image);
    var label = uniLabel(c) + ' 合格';
    if (/\.pdf(\?|#|$)/i.test(c.image)) { // PDFはインライン表示できないためリンク表示
      return '<div class="voice-photo voice-photo-pdf">' +
        '<a href="' + esc(src) + '" target="_blank" rel="noopener">' +
        '<span class="voice-photo-pdf-ico" aria-hidden="true">PDF</span>' +
        esc(label) + 'の合格実績を見る（PDF）</a></div>';
    }
    return '<div class="voice-photo"><img loading="lazy" src="' + esc(src) +
      '" alt="' + esc(label + '（' + c.initials + ' さん）') +
      '" onerror="this.parentNode.style.display=\'none\'"></div>';
  }

  /* ---- 大学バッジ（カテゴリー別）: ホーム RESULTS / LP 等 ---- */
  function badgesHTML() {
    return UNIVERSITY_GROUPS.map(function (g) {
      var items = g.universities.map(function (u) {
        return '<li class="result-badge">' + esc(u) + '</li>';
      }).join('');
      return '' +
        '<div class="results-cat">' +
        '<h4>' + esc(g.category) + '</h4>' +
        '<ul class="result-badges">' + items + '</ul>' +
        '</div>';
    }).join('');
  }

  function renderResultBadges(el) {
    if (!el) return;
    el.innerHTML = badgesHTML();
  }

  /* ---- 集計値バンド ---- */
  function renderStats(el, opts) {
    if (!el) return;
    opts = opts || {};
    var cells = STATS.map(function (s) {
      return '' +
        '<div class="stat-item">' +
        '<div class="stat-number">' + esc(s.num) + '<span class="stat-accent">' + esc(s.unit) + '</span></div>' +
        '<div class="stat-label">' + esc(s.label) + '</div>' +
        '</div>';
    });
    if (opts.count) {
      cells.unshift('' +
        '<div class="stat-item">' +
        '<div class="stat-number">' + CASES.length + '<span class="stat-accent">名</span></div>' +
        '<div class="stat-label">掲載の合格者の声</div>' +
        '</div>');
    }
    el.innerHTML = cells.join('');
  }

  /* ---- ホーム用 抜粋カード（短い声） ---- */
  function previewCardHTML(c) {
    var tags = (c.tags || []).slice(0, 2).map(function (t) {
      return '<span class="voice-tag">' + esc(t) + '</span>';
    }).join('');
    return '' +
      '<div class="voice-card visible">' +
      '<div class="voice-badge">合格 ' + esc(uniLabel(c)) + '</div>' +
      '<div class="voice-quote">&ldquo;</div>' +
      '<p>' + esc(c.q2) + '</p>' +
      '<div class="voice-tags">' + tags + '</div>' +
      '<div class="voice-author">' + esc(uniLabel(c)) + ' 合格／' + esc(c.initials) + ' さん（保護者様の声）</div>' +
      '</div>';
  }

  function renderPreview(el, ids) {
    if (!el) return;
    var list = (ids && ids.length)
      ? ids.map(caseById).filter(Boolean)
      : CASES.slice(0, 3);
    el.innerHTML = list.map(previewCardHTML).join('');
  }

  /* ---- ホーム用 注目の声（featured） ---- */
  function renderFeatured(el, id) {
    if (!el) return;
    var c = caseById(id) || CASES[0];
    var tags = (c.tags || []).map(function (t) {
      return '<span class="voice-tag">' + esc(t) + '</span>';
    }).join('');
    el.innerHTML = '' +
      '<div class="voice-showcase-badge">合格 ' + esc(uniLabel(c)) + '</div>' +
      '<p class="voice-feature-quote">' + esc(c.q4) + '</p>' +
      '<div class="voice-tags">' + tags + '</div>' +
      '<p class="voice-feature-author">' + esc(uniLabel(c)) + ' 合格／' + esc(c.initials) + ' さん（' + esc(c.grade) + '・' + esc(c.year) + '）保護者様の声</p>';
    reveal(el);
  }

  /* ---- 合格者の声 専用ページ: 全件フルカード（Q1〜Q4） ---- */
  function fullCardHTML(c) {
    var tags = (c.tags || []).map(function (t) {
      return '<span class="voice-tag">' + esc(t) + '</span>';
    }).join('');
    var accId = c.id + '-more';
    return '' +
      '<article class="voice-detail visible" data-category="' + esc(c.category) + '">' +
      '<div class="voice-card-top">' +
      '<div class="voice-card-top-left">' +
      '<div class="voice-avatar">' + esc(c.initials) + '</div>' +
      '<div class="voice-card-top-info">' +
      '<span class="voice-badge">合格 ' + esc(uniLabel(c)) + '</span>' +
      '<div class="voice-detail-meta">' + esc(c.category) + '｜' + esc(c.grade) + '・' + esc(c.year) + '（保護者様の声）</div>' +
      '</div></div>' +
      '<div class="voice-case-no">CASE ' + esc(c.no) + '</div>' +
      '</div>' +
      '<div class="voice-card-body">' +
      '<div class="voice-tags">' + tags + '</div>' +
      caseImageHTML(c) +
      '<div class="voice-qa">' +
      '<p class="voice-q">Q. 入塾前のお悩み</p><p class="voice-a">' + esc(c.q1) + '</p>' +
      '<p class="voice-q">Q. 入塾後の変化</p><p class="voice-a">' + esc(c.q2) + '</p>' +
      '</div>' +
      '<div class="voice-more" id="' + accId + '" hidden>' +
      '<p class="voice-q">Q. 良かった点・安心できた点</p><p class="voice-a">' + esc(c.q3) + '</p>' +
      '<p class="voice-q">Q. これから受験する親御さまへ</p><p class="voice-a">' + esc(c.q4) + '</p>' +
      '</div>' +
      '<button class="voice-toggle" type="button" aria-expanded="false" aria-controls="' + accId + '">' +
      '<span class="voice-toggle-txt">続きを読む（良かった点・親御さまへ）</span>' +
      '<span class="voice-toggle-ico" aria-hidden="true">+</span>' +
      '</button>' +
      '</div>' +
      '</article>';
  }

  function renderFullList(el, group) {
    if (!el) return;
    var list = group ? CASES.filter(function (c) { return c.group === group; }) : CASES;
    el.innerHTML = list.map(fullCardHTML).join('');
  }

  // アコーディオン開閉（委譲）。複数回呼ばれても二重登録しないようフラグ管理。
  function bindAccordions(root) {
    root = root || document;
    if (root.__galileoVoiceBound) return;
    root.__galileoVoiceBound = true;
    root.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.voice-toggle') : null;
      if (!btn) return;
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      var txt = btn.querySelector('.voice-toggle-txt');
      var ico = btn.querySelector('.voice-toggle-ico');
      if (txt) txt.textContent = open ? '続きを読む（良かった点・親御さまへ）' : '閉じる';
      if (ico) ico.textContent = open ? '+' : '−';
    });
  }

  /* ---- 保護者アンケート画像グリッド描画 ---- */
  function renderSurveyGrid(el) {
    if (!el) return;
    var list = (SURVEY_IMAGES || []).filter(function (im) { return im && im.src; });
    if (!list.length) { el.innerHTML = ''; el.hidden = true; return; } // 画像未登録なら枠ごと非表示
    el.hidden = false;
    el.innerHTML = list.map(function (im) {
      return '<figure class="voice-survey-item"><img loading="lazy" src="' + esc(asset(im.src)) +
        '" alt="' + esc(im.alt || '保護者アンケート') +
        '" onerror="this.closest(\'.voice-survey-item\').style.display=\'none\'"></figure>';
    }).join('');
  }

  /* ---- 公開API ---- */
  global.GALILEO_VOICES = {
    cases: CASES,
    stats: STATS,
    individualExample: INDIVIDUAL_EXAMPLE,
    universityGroups: UNIVERSITY_GROUPS,
    notes: { permission: NOTE_PERMISSION, composite: NOTE_COMPOSITE, results: NOTE_RESULTS },
    caseById: caseById,
    uniLabel: uniLabel,
    asset: asset,
    surveyImages: SURVEY_IMAGES,
    renderSurveyGrid: renderSurveyGrid,
    renderResultBadges: renderResultBadges,
    renderStats: renderStats,
    renderPreview: renderPreview,
    renderFeatured: renderFeatured,
    renderFullList: renderFullList,
    bindAccordions: bindAccordions
  };
})(window);
