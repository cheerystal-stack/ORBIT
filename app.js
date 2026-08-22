const KEY='orbit_v01'; // keep the same key so existing ORBIT data survives
const APP_VERSION='0.16.0';
const BUNDLED_PROFILE_VERSION='0.8.0';
const IMPORT_ROLLBACK_KEY='orbit_v01_import_rollback';

const FOURPILLARS_MASTER_BASE='./data/fourpillars/';
const FOURPILLARS_MASTER_FILES={
  engine:'fourpillars_engine_v1.json',
  chiaki:'chiaki_monthly_2026_2033.json',
  naoya:'partner_n_monthly_2026_2033.json',
  cross:'cross_monthly_2026_2033.json',
  audit:'AUDIT.json'
};
let fourPillarsMaster={loaded:false,error:null,engine:null,chiaki:null,naoya:null,cross:null,audit:null};

const WESTERN_MASTER_URL='./data/western/orbit_western_master_2026_2033.json';
let westernMaster={loaded:false,error:null,data:null};

// v0.12 — Western Engine display dictionary.
// Calculation/master data stays untouched; only the UI translation layer lives here.
const WESTERN_BODIES={
  Sun:{ja:'太陽',symbol:'☉'}, Moon:{ja:'月',symbol:'☽'}, Mercury:{ja:'水星',symbol:'☿'},
  Venus:{ja:'金星',symbol:'♀'}, Mars:{ja:'火星',symbol:'♂'}, Jupiter:{ja:'木星',symbol:'♃'},
  Saturn:{ja:'土星',symbol:'♄'}, Uranus:{ja:'天王星',symbol:'♅'}, Neptune:{ja:'海王星',symbol:'♆'},
  Pluto:{ja:'冥王星',symbol:'♇'}
};
const WESTERN_ASPECTS={
  conjunction:{ja:'コンジャンクション',en:'CONJUNCTION',short:'CONJ',symbol:'☌'},
  sextile:{ja:'セクスタイル',en:'SEXTILE',short:'SEXTILE',symbol:'✶'},
  square:{ja:'スクエア',en:'SQUARE',short:'SQUARE',symbol:'□'},
  trine:{ja:'トライン',en:'TRINE',short:'TRINE',symbol:'△'},
  opposition:{ja:'オポジション',en:'OPPOSITION',short:'OPPOSITION',symbol:'☍'}
};



// v0.15 — RELATIONSHIP BASE: fixed natal compatibility layer.
// Time-dependent material is deliberately excluded. N's birth time is unknown,
// so angle/house contacts are kept as reference-only and are not used in the synthesis.
const RELATIONSHIP_BASE={
  id:'chiaki-naoya',a:'chiaki',b:'naoya',title:'Chiaki × N',status:'FIXED BASE',
  principle:'希望を結論にせず、調和・緊張・反復テーマを同じ重さで観測する。',
  synastry:[
['Sun','sextile','Mercury','2°49′'],['Sun','sextile','Mars','2°28′'],['Sun','conjunction','Saturn','2°10′'],['Sun','sextile','Uranus','0°13′'],['Sun','trine','Pluto','3°09′'],['Sun','opposition','Ascendant','4°58′','time'],['Sun','square','MC','5°03′','time'],['Moon','sextile','Venus','2°11′'],['Mercury','sextile','Mercury','1°50′'],['Mercury','sextile','Mars','1°29′'],['Mercury','conjunction','Saturn','3°09′'],['Mercury','sextile','Uranus','0°45′'],['Mercury','trine','Pluto','2°10′'],['Mercury','opposition','Ascendant','3°59′','time'],['Mercury','square','MC','4°04′','time'],['Venus','square','Uranus','3°19′'],['Mars','sextile','Sun','2°34′'],['Mars','sextile','Venus','4°23′'],['Mars','square','Neptune','5°29′'],['Jupiter','opposition','Moon','2°48′'],['Jupiter','trine','Saturn','4°27′'],['Saturn','square','Uranus','0°58′'],['Saturn','square','Neptune','5°51′'],['Saturn','trine','MC','3°51′','time'],['Uranus','opposition','Moon','4°40′'],['Uranus','trine','Saturn','2°36′'],['Neptune','opposition','Sun','4°55′'],['MC','sextile','Sun','3°51′','time'],['MC','sextile','Venus','3°06′','time'],['Neptune','square','Ascendant','0°04′','time'],['Neptune','opposition','MC','0°00′','time'],['Pluto','trine','Sun','4°30′'],['Pluto','square','Uranus','5°14′'],['Pluto','square','Neptune','1°35′'],['Ascendant','sextile','Jupiter','1°38′','time'],['Pluto','trine','MC','0°24′','time']
  ],
  compositeHighlights:[
    ['Sun','opposition','Pluto','0°40′'],['Sun','trine','Neptune','1°04′'],['Moon','trine','Pluto','1°39′'],['Mars','trine','Neptune','1°27′'],['Neptune','sextile','Pluto','1°44′']
  ],
  fourPillars:{
    basis:'確定している三柱同士を使用。Nの時柱は出生時刻不明のため除外。',
    signals:[
      {type:'三合',label:'亥・卯・未',note:'Chiakiの亥・卯とNの日支未で木局の三合が成立。結合テーマとして採用。'},
      {type:'冲',label:'子・午',note:'Chiakiの日支子とNの月支午。引力と同時に方向差・揺さぶりを示す固定緊張。'},
      {type:'害',label:'子・未',note:'Chiakiの日支子とNの日支未。噛み合いにくさや見えにくい摩擦の補助シグナル。'}
    ]
  },
  synthesis:{
    headline:'強い刺激と結合が同居する、静的ではない関係',
    summary:'西洋では会話・行動を動かす調和角と、天王星・海王星・土星を介した不安定さ／理想化／制約が同居。Compositeの確認済み主要角にも冥王星・海王星が強く、関係そのものに変容性と理想化のテーマが重なる。四柱推命でも三合による結合と、冲・害による緊張が同時に成立するため、「強い縁＝安定」とはせず、結びつきと揺れの両方をBASEとして扱う。',
    tags:['CONNECTION','STIMULATION','TRANSFORMATION','IDEALIZATION','FRICTION'],
    verdict:'特徴的な結合シグナルは複数ある。一方、安定性を自動的に保証する配置ではない。'
  }
};

const MONTHLY_GUIDE=[
  {id:'pcc',label:'PCC',source:'Astro-Seek',system:'Western Astrology',method:'PCC',defaultPerson:'focus',why:'ふたりの関係そのものが、今どんなフェーズにいるかを見る。',how:'Partner relationship horoscopes → Progressed Composite Chart を開き、対象月の日付に設定。',capture:'「Progressed Composite (PCC)」タブ内の PCC Main aspects。必要に応じて PCC Other aspects も撮る。',dontNeed:'チャート円だけの画像は補助。アスペクト一覧が読めるスクショを優先。'},
  {id:'psyn',label:'Progressed Synastry',source:'Astro-Seek',system:'Western Astrology',method:'Progressed Synastry',defaultPerson:'focus',why:'ふたりそれぞれの進行図を重ね、今の噛み合い方や動きやすいテーマを見る。',how:'Partner relationship horoscopes → Progressed Synastry Chart を開き、対象月の日付に設定。',capture:'「Aspects」タブ。Birth A × Progr B / Progr A × Birth B / Progr A × Progr B の一覧が入るように撮る。',dontNeed:'チャート円だけではなく、orbが読めるアスペクト一覧を優先。'},
  {id:'tpcc',label:'Transits × PCC',source:'Astro-Seek',system:'Western Astrology',method:'Transits × PCC',defaultPerson:'focus',why:'その月、関係性に外からどんな刺激が入りやすいかを見る。',how:'Progressed Composite Chart → 「Transits × PCC」タブを開き、対象日を設定。',capture:'下へスクロールして「Transits × PCC: / Transits / Aspect / PCC / Orb」の表を撮る。',dontNeed:'「Chart × PCC」は今回の保存用では不要。'},
  {id:'personal',label:'Personal Transits',source:'Astro-Seek',system:'Western Astrology',method:'Personal Transits',defaultPerson:'chiaki',why:'自分自身が今どんな時期にいて、恋愛以外も含め何が刺激されているかを見る。',how:'Astro-Seek → Predictive Astrology / Personal Prognoses → Transit Chart。自分の出生データを入力し、Transit chart の日付を対象月に設定 → 「Aspects」を開く。',capture:'「Main planet aspects」の Transit planet × Birth planet 一覧。まず冥王星・海王星・天王星・土星・木星などの長期天体と、太陽・月・水星・金星・火星へのタイトな角度を優先して撮る。',dontNeed:'円チャートだけの画像は補助。出生時刻が分かる本人ならASC/MC・ハウスも参考にできるが、月テーマ保存ではMain planet aspectsを優先。'},
  {id:'shichu',label:'四柱推命',source:'命式 / ChatGPT',system:'四柱推命',method:'大運・流年・月運',defaultPerson:'chiaki',why:'大運・流年・月運を重ねて、今の長期・中期・短期サイクルを確認。',how:'命式を開き、大運 → 流年 → 対象月の月運の順に確認。',capture:'大運・流年・月運の干支や通変星など、ChatGPTが読み取れる表を撮る。',dontNeed:'画面全体より、対象期間と項目名・値が読める部分を優先。'},
]



// 2026 monthly cycle data captured from the user's KINOTO monthly table.
// BASE / 大運 / 流年 remain sourced from the imported 大久保定気法 JSON.
const BUNDLED_MONTHLY_FOUR_PILLARS={
  chiaki:{
    '2026-01':{ganzhi:'己丑',tsuhensei:'正官',branchTsuhensei:'正官',junishi_un:'衰',range:'2026-01-05〜2026-02-03',note:'日支:六合 / 月天中殺(年)',source:'KINOTO RESEARCH'},
    '2026-02':{ganzhi:'庚寅',tsuhensei:'偏印',branchTsuhensei:'食神',junishi_un:'病',range:'2026-02-04〜2026-03-04',note:'年支:六合 / 月天中殺(日)',source:'KINOTO RESEARCH'},
    '2026-03':{ganzhi:'辛卯',tsuhensei:'印綬',branchTsuhensei:'傷官',junishi_un:'死',range:'2026-03-05〜2026-04-04',note:'日支:刑 / 月運中殺(日)',source:'KINOTO RESEARCH'},
    '2026-04':{ganzhi:'壬辰',tsuhensei:'比肩',branchTsuhensei:'偏官',junishi_un:'墓',range:'2026-04-05〜2026-05-04',note:'月支:害',source:'KINOTO RESEARCH'},
    '2026-05':{ganzhi:'癸巳',tsuhensei:'劫財',branchTsuhensei:'偏財',junishi_un:'絶',range:'2026-05-05〜2026-06-05',note:'年支:沖',source:'KINOTO RESEARCH'},
    '2026-06':{ganzhi:'甲午',tsuhensei:'食神',branchTsuhensei:'正財',junishi_un:'胎',range:'2026-06-06〜2026-07-06',note:'日支:沖',source:'KINOTO RESEARCH'},
    '2026-07':{ganzhi:'乙未',tsuhensei:'傷官',branchTsuhensei:'正官',junishi_un:'養',range:'2026-07-07〜2026-08-06',note:'日支:害',source:'KINOTO RESEARCH'},
    '2026-08':{ganzhi:'丙申',tsuhensei:'偏財',branchTsuhensei:'偏印',junishi_un:'長生',range:'2026-08-07〜2026-09-06',note:'年支:害',source:'KINOTO RESEARCH'},
    '2026-09':{ganzhi:'丁酉',tsuhensei:'正財',branchTsuhensei:'印綬',junishi_un:'沐浴',range:'2026-09-07〜2026-10-07',note:'月支:沖',source:'KINOTO RESEARCH'},
    '2026-10':{ganzhi:'戊戌',tsuhensei:'偏官',branchTsuhensei:'偏官',junishi_un:'冠帯',range:'2026-10-08〜2026-11-06',note:'月支:六合',source:'KINOTO RESEARCH'},
    '2026-11':{ganzhi:'己亥',tsuhensei:'正官',branchTsuhensei:'比肩',junishi_un:'建禄',range:'2026-11-07〜2026-12-06',note:'年支:刑',source:'KINOTO RESEARCH'},
    '2026-12':{ganzhi:'庚子',tsuhensei:'偏印',branchTsuhensei:'劫財',junishi_un:'帝旺',range:'2026-12-07〜2026-12-31',note:'月支:刑 / 月運中殺(年)',source:'KINOTO RESEARCH'}
  }
};

const BUNDLED_FOUR_PILLARS={"chiaki":{"source":"大久保占い研究室 (Ookubo Uranai Laboratory)","calendarMethod":"定気法（真黄経）","schema":"senjutsu-integrated/0.21.44","bundledVersion":"0.8.0","importedAt":"2026-08-20T19:48:50.914Z","dayMaster":{"stem":"壬","yinyang":"陽","wuxing":"水"},"kubou":["寅","卯"],"fourPillars":{"year":{"label":"年柱","ganzhi":"癸亥","stem":"癸","branch":"亥","tsuhensei":"劫財","zoukan":["壬","甲"],"zoukan_tsuhensei":["比肩","食神"],"junishi_un":"建禄","kubou":false},"month":{"label":"月柱","ganzhi":"乙卯","stem":"乙","branch":"卯","tsuhensei":"傷官","zoukan":["乙"],"zoukan_tsuhensei":["傷官"],"junishi_un":"死","kubou":true},"day":{"label":"日柱","ganzhi":"壬子","stem":"壬","branch":"子","tsuhensei":null,"zoukan":["癸"],"zoukan_tsuhensei":["劫財"],"junishi_un":"帝旺","kubou":false},"hour":{"label":"時柱","ganzhi":"辛亥","stem":"辛","branch":"亥","tsuhensei":"印綬","zoukan":["壬","甲"],"zoukan_tsuhensei":["比肩","食神"],"junishi_un":"建禄","kubou":false}},"daiun":{"direction":"順行","start_age":3.62,"list":[{"index":1,"age_start":3.62,"age_end":13.620000000000001,"ganzhi":"丙辰","tsuhensei":"偏財","junishi_un":"墓","kubou":false},{"index":2,"age_start":13.620000000000001,"age_end":23.62,"ganzhi":"丁巳","tsuhensei":"正財","junishi_un":"絶","kubou":false},{"index":3,"age_start":23.62,"age_end":33.62,"ganzhi":"戊午","tsuhensei":"偏官","junishi_un":"胎","kubou":false},{"index":4,"age_start":33.62,"age_end":43.62,"ganzhi":"己未","tsuhensei":"正官","junishi_un":"養","kubou":false},{"index":5,"age_start":43.62,"age_end":53.62,"ganzhi":"庚申","tsuhensei":"偏印","junishi_un":"長生","kubou":false},{"index":6,"age_start":53.62,"age_end":63.62,"ganzhi":"辛酉","tsuhensei":"印綬","junishi_un":"沐浴","kubou":false},{"index":7,"age_start":63.62,"age_end":73.62,"ganzhi":"壬戌","tsuhensei":"比肩","junishi_un":"冠帯","kubou":false},{"index":8,"age_start":73.62,"age_end":83.62,"ganzhi":"癸亥","tsuhensei":"劫財","junishi_un":"建禄","kubou":false}]},"ryunen":[{"year":2026,"age":43,"ganzhi":"丙午","tsuhensei":"偏財","junishi_un":"胎","kubou":false},{"year":2027,"age":44,"ganzhi":"丁未","tsuhensei":"正財","junishi_un":"養","kubou":false},{"year":2028,"age":45,"ganzhi":"戊申","tsuhensei":"偏官","junishi_un":"長生","kubou":false},{"year":2029,"age":46,"ganzhi":"己酉","tsuhensei":"正官","junishi_un":"沐浴","kubou":false},{"year":2030,"age":47,"ganzhi":"庚戌","tsuhensei":"偏印","junishi_un":"冠帯","kubou":false},{"year":2031,"age":48,"ganzhi":"辛亥","tsuhensei":"印綬","junishi_un":"建禄","kubou":false},{"year":2032,"age":49,"ganzhi":"壬子","tsuhensei":"比肩","junishi_un":"帝旺","kubou":false},{"year":2033,"age":50,"ganzhi":"癸丑","tsuhensei":"劫財","junishi_un":"衰","kubou":false},{"year":2034,"age":51,"ganzhi":"甲寅","tsuhensei":"食神","junishi_un":"病","kubou":false},{"year":2035,"age":52,"ganzhi":"乙卯","tsuhensei":"傷官","junishi_un":"死","kubou":false}],"ryugetsu":[{"ganzhi":"丙申","term":"立秋","start":"2026-08-07T11:43Z","tsuhensei":"偏財","junishi_un":"長生","kubou":false},{"ganzhi":"丁酉","term":"白露","start":"2026-09-07T14:42Z","tsuhensei":"正財","junishi_un":"沐浴","kubou":false},{"ganzhi":"戊戌","term":"寒露","start":"2026-10-08T06:30Z","tsuhensei":"偏官","junishi_un":"冠帯","kubou":false},{"ganzhi":"己亥","term":"立冬","start":"2026-11-07T09:53Z","tsuhensei":"正官","junishi_un":"建禄","kubou":false},{"ganzhi":"庚子","term":"大雪","start":"2026-12-07T02:53Z","tsuhensei":"偏印","junishi_un":"帝旺","kubou":false},{"ganzhi":"辛丑","term":"小寒","start":"2027-01-05T14:10Z","tsuhensei":"印綬","junishi_un":"衰","kubou":false},{"ganzhi":"壬寅","term":"立春","start":"2027-02-04T01:46Z","tsuhensei":"比肩","junishi_un":"病","kubou":true},{"ganzhi":"癸卯","term":"啓蟄","start":"2027-03-05T19:39Z","tsuhensei":"劫財","junishi_un":"死","kubou":true},{"ganzhi":"甲辰","term":"清明","start":"2027-04-05T00:17Z","tsuhensei":"食神","junishi_un":"墓","kubou":false},{"ganzhi":"乙巳","term":"立夏","start":"2027-05-05T17:25Z","tsuhensei":"傷官","junishi_un":"絶","kubou":false},{"ganzhi":"丙午","term":"芒種","start":"2027-06-05T21:25Z","tsuhensei":"偏財","junishi_un":"胎","kubou":false},{"ganzhi":"丁未","term":"小暑","start":"2027-07-07T07:37Z","tsuhensei":"正財","junishi_un":"養","kubou":false},{"ganzhi":"戊申","term":"立秋","start":"2027-08-07T17:26Z","tsuhensei":"偏官","junishi_un":"長生","kubou":false},{"ganzhi":"己酉","term":"白露","start":"2027-09-07T20:28Z","tsuhensei":"正官","junishi_un":"沐浴","kubou":false},{"ganzhi":"庚戌","term":"寒露","start":"2027-10-08T12:17Z","tsuhensei":"偏印","junishi_un":"冠帯","kubou":false},{"ganzhi":"辛亥","term":"立冬","start":"2027-11-07T15:39Z","tsuhensei":"印綬","junishi_un":"建禄","kubou":false},{"ganzhi":"壬子","term":"大雪","start":"2027-12-07T08:38Z","tsuhensei":"比肩","junishi_un":"帝旺","kubou":false},{"ganzhi":"癸丑","term":"小寒","start":"2028-01-05T19:55Z","tsuhensei":"劫財","junishi_un":"衰","kubou":false},{"ganzhi":"甲寅","term":"立春","start":"2028-02-04T07:31Z","tsuhensei":"食神","junishi_un":"病","kubou":true},{"ganzhi":"乙卯","term":"啓蟄","start":"2028-03-05T01:25Z","tsuhensei":"傷官","junishi_un":"死","kubou":true},{"ganzhi":"丙辰","term":"清明","start":"2028-04-04T06:03Z","tsuhensei":"偏財","junishi_un":"墓","kubou":false},{"ganzhi":"丁巳","term":"立夏","start":"2028-05-04T23:12Z","tsuhensei":"正財","junishi_un":"絶","kubou":false},{"ganzhi":"戊午","term":"芒種","start":"2028-06-05T03:16Z","tsuhensei":"偏官","junishi_un":"胎","kubou":false},{"ganzhi":"己未","term":"小暑","start":"2028-07-06T13:30Z","tsuhensei":"正官","junishi_un":"養","kubou":false}],"input":{"birth_date":"1983-03-25","birth_time":"21:03","gender":"女性","birthplace":"東京都"},"birthTimeWarning":""},"naoya":{"source":"大久保占い研究室 (Ookubo Uranai Laboratory)","calendarMethod":"定気法（真黄経／時憲暦・天保暦系・GB/T 33661準拠）","schema":"sizhu-meishiki/2","importedAt":"2026-08-20T11:45:00.000Z","dayMaster":{"stem":"癸","yinyang":"陰","wuxing":"水"},"kubou":["申","酉"],"fourPillars":{"year":{"label":"年柱","ganzhi":"丙子","stem":"丙","stem_wuxing":"火","branch":"子","branch_wuxing":"水","tsuhensei":"正財","zoukan":["癸"],"zoukan_tsuhensei":["比肩"],"junishi_un":"建禄","kubou":false},"month":{"label":"月柱","ganzhi":"甲午","stem":"甲","stem_wuxing":"木","branch":"午","branch_wuxing":"火","tsuhensei":"傷官","zoukan":["丁","己"],"zoukan_tsuhensei":["偏財","偏官"],"junishi_un":"絶","kubou":false},"day":{"label":"日柱","ganzhi":"癸未","stem":"癸","stem_wuxing":"水","branch":"未","branch_wuxing":"土","tsuhensei":null,"zoukan":["己","丁","乙"],"zoukan_tsuhensei":["偏官","偏財","食神"],"junishi_un":"墓","kubou":false},"hour":{"label":"時柱","ganzhi":"壬子","stem":"壬","stem_wuxing":"水","branch":"子","branch_wuxing":"水","tsuhensei":"劫財","zoukan":["癸"],"zoukan_tsuhensei":["比肩"],"junishi_un":"建禄","kubou":false}},"daiun":{"direction":"順行","start_age":7.4,"list":[{"index":1,"age_start":7.4,"age_end":17.4,"ganzhi":"乙未","tsuhensei":"食神","junishi_un":"墓","kubou":false},{"index":2,"age_start":17.4,"age_end":27.4,"ganzhi":"丙申","tsuhensei":"正財","junishi_un":"死","kubou":true},{"index":3,"age_start":27.4,"age_end":37.4,"ganzhi":"丁酉","tsuhensei":"偏財","junishi_un":"病","kubou":true},{"index":4,"age_start":37.4,"age_end":47.4,"ganzhi":"戊戌","tsuhensei":"正官","junishi_un":"衰","kubou":false},{"index":5,"age_start":47.4,"age_end":57.4,"ganzhi":"己亥","tsuhensei":"偏官","junishi_un":"帝旺","kubou":false},{"index":6,"age_start":57.4,"age_end":67.4,"ganzhi":"庚子","tsuhensei":"印綬","junishi_un":"建禄","kubou":false},{"index":7,"age_start":67.4,"age_end":77.4,"ganzhi":"辛丑","tsuhensei":"偏印","junishi_un":"冠帯","kubou":false},{"index":8,"age_start":77.4,"age_end":87.4,"ganzhi":"壬寅","tsuhensei":"劫財","junishi_un":"沐浴","kubou":false}]},"ryunen":[{"year":2026,"age":30,"ganzhi":"丙午","tsuhensei":"正財","junishi_un":"絶","kubou":false},{"year":2027,"age":31,"ganzhi":"丁未","tsuhensei":"偏財","junishi_un":"墓","kubou":false},{"year":2028,"age":32,"ganzhi":"戊申","tsuhensei":"正官","junishi_un":"死","kubou":true},{"year":2029,"age":33,"ganzhi":"己酉","tsuhensei":"偏官","junishi_un":"病","kubou":true},{"year":2030,"age":34,"ganzhi":"庚戌","tsuhensei":"印綬","junishi_un":"衰","kubou":false},{"year":2031,"age":35,"ganzhi":"辛亥","tsuhensei":"偏印","junishi_un":"帝旺","kubou":false},{"year":2032,"age":36,"ganzhi":"壬子","tsuhensei":"劫財","junishi_un":"建禄","kubou":false},{"year":2033,"age":37,"ganzhi":"癸丑","tsuhensei":"比肩","junishi_un":"冠帯","kubou":false},{"year":2034,"age":38,"ganzhi":"甲寅","tsuhensei":"傷官","junishi_un":"沐浴","kubou":false},{"year":2035,"age":39,"ganzhi":"乙卯","tsuhensei":"食神","junishi_un":"長生","kubou":false}],"shinsatsu":{"year":["桃花(日)","将星(年)","月徳貴人"],"month":[],"day":["華蓋(日)"],"hour":["桃花(日)","将星(年)"]},"kankei":[{"type":"冲","pillars":["年柱","月柱"],"ganzhi":"子午"},{"type":"害","pillars":["年柱","日柱"],"ganzhi":"子未"},{"type":"天干の冲","pillars":["年柱","時柱"],"ganzhi":"丙壬","note":"立てない流派も多い","reference":true},{"type":"支合","pillars":["月柱","日柱"],"ganzhi":"午未","note":"化気は火とされる"},{"type":"冲","pillars":["月柱","時柱"],"ganzhi":"午子"},{"type":"害","pillars":["日柱","時柱"],"ganzhi":"未子"}],"input":{"birth_date":"1996-06-15","birth_time":"00:00","gender":"男性","birthplace":"福島県","longitude_deg":140.4673,"zoukan_method":"standard","time_correction":"apparent"},"birthTimeWarning":"出生時刻不明のため、時柱は参考扱い。","bundledVersion":"0.7.2"}};

const defaultData={
  people:[
    {id:'chiaki',name:'Chiaki',birthDate:'1983-03-25',birthTime:'21:03',birthTimeStatus:'exact',birthPlace:'Tokyo, Japan',memo:'ORBIT owner'},
    {id:'naoya',name:'N',birthDate:'1996-06-15',birthTime:'',birthTimeStatus:'unknown',birthTimeHypothesis:'06:00',birthPlace:'Fukushima, Japan',memo:''}
  ],
  settings:{focusPersonId:'naoya'},
  months:{},
  month:{period:'2026-08',title:'2026 AUG',summary:'再構築と関係調整の月',theme:'REBUILDING',focus:'RELATIONSHIP',systems:[
    {name:'Western Astrology',summary:'REBUILDING / COMMUNICATION'},
    {name:'四柱推命',summary:'長期運・流年・月運を観測'},
  ],overlap:['RELATIONSHIP','PATIENCE','CHANGE']},
  cycles:[
    {system:'Western Astrology',summary:'進行図・長期トランジットの現在テーマ'},
    {system:'四柱推命',summary:'大運 / 流年 / 月運'},
  ],
  readings:[
    {id:'r1',personId:'naoya',createdAt:'2026-08-19',targetPeriod:'2026-08',system:'Western Astrology',method:'PCC',title:'2026年8月 Progressed Composite',summary:'衝突を経て関係を再構築する月',brief:'価値観の違いが表面化しやすい一方、関係を切るより調整しながら維持する流れ。',aspects:['Sun conjunct Venus','Moon trine Saturn','Mercury opposite Jupiter'],interpretation:'価値観の違いが表面化しやすい一方、関係を切るより調整しながら維持する流れ。',observationPoint:'会話だけでなく、実際に会う・動くことが関係を進めるか観察。',tags:['REBUILDING','COMMUNICATION','DEEPENING']},
    {id:'r2',personId:'naoya',createdAt:'2026-08-19',targetPeriod:'2026-09',system:'Western Astrology',method:'Progressed Synastry',title:'2026年9月 Progressed Synastry',summary:'会話と行動で関係を馴染ませる時期',brief:'関係を現実の行動に落とし込み、理解を育てる流れ。',aspects:['Mercury sextile Sun','Mars sextile Sun'],interpretation:'関係を現実の行動に落とし込み、理解を育てる流れ。',observationPoint:'連絡・会う予定・実際の行動が安定化につながるか観察。',tags:['STABILIZING','MEETING']}
  ],
  realityLogs:[{id:'e1',personId:'naoya',date:'2026-08-18',title:'再会・泊まり',description:'話し合いと未読期間の後に再会。ご飯、アイス、泊まり。',tags:['MEETING','RECONCILIATION'],relatedReadingIds:['r1']}],
  timeline:[
    {id:'t1',period:'2026 AUG',title:'REBUILDING',summary:'衝突を経て関係を再構築'},
    {id:'t2',period:'2026 SEP',title:'STABILIZING',summary:'戻った関係を実生活に馴染ませる'},
    {id:'t3',period:'2026 OCT',title:'UNDERSTANDING',summary:'理解が進み、少し力を抜いて関わる'},
    {id:'t4',period:'2033',title:'LONG-TERM FOCUS',summary:'成熟・安定テーマを長期観測'}
  ],
  projects:[{id:'p2033',title:'2033 PROJECT',personId:'naoya',targetPeriod:'2033',status:'OBSERVING',systems:['Western Astrology','四柱推命'],summary:'東西の長期サイクルを重ねて観測する重要ポイント',note:'早期実現歓迎'}],
  fourPillars:{profiles:JSON.parse(JSON.stringify(BUNDLED_FOUR_PILLARS)),monthly:{}},
  monthlyChecks:{}
};

function cloneDefault(){return JSON.parse(JSON.stringify(defaultData))}
function migrate(d){
  d=d||cloneDefault();
  d.people=d.people||cloneDefault().people;
  d.settings=d.settings||{focusPersonId:'naoya'};
  d.month=d.month||cloneDefault().month;
  d.months=d.months||{};
  if(d.month?.period && !d.months[d.month.period]) d.months[d.month.period]=JSON.parse(JSON.stringify(d.month));
  d.month.theme=d.month.theme||'REBUILDING';
  d.month.focus=d.month.focus||'RELATIONSHIP';
  d.monthlyChecks=d.monthlyChecks||{};
  d.relationshipBase=d.relationshipBase||{reading:'',updatedAt:''};
  d.fourPillars=d.fourPillars||{profiles:{},monthly:{}};
  d.fourPillars.profiles=d.fourPillars.profiles||{}; d.fourPillars.monthly=d.fourPillars.monthly||{};
  Object.entries(BUNDLED_FOUR_PILLARS).forEach(([id,profile])=>{
    if(!d.fourPillars.profiles[id]) d.fourPillars.profiles[id]=JSON.parse(JSON.stringify(profile));
    // v0.8: enrich the bundled Chiaki profile with the precise 3.62-year cycle and 24 months of ryugetsu.
    // Keep user-added metadata and manual monthly notes intact.
    if(id==='chiaki' && d.fourPillars.profiles[id]?.input?.birth_date==='1983-03-25'){
      const existing=d.fourPillars.profiles[id];
      existing.daiun=JSON.parse(JSON.stringify(profile.daiun));
      existing.ryunen=JSON.parse(JSON.stringify(profile.ryunen));
      existing.ryugetsu=JSON.parse(JSON.stringify(profile.ryugetsu||[]));
      existing.bundledVersion=BUNDLED_PROFILE_VERSION;
      existing.source=profile.source; existing.calendarMethod=profile.calendarMethod;
    }
  });
  d.month.systems=(d.month.systems||[]).filter(x=>x.name!=='六星占術');
  d.cycles=(d.cycles||[]).filter(x=>x.system!=='六星占術');
  (d.projects||[]).forEach(p=>p.systems=(p.systems||[]).filter(x=>x!=='六星占術'));
  d.readings=d.readings||[];
  d.readings.forEach(r=>{r.brief=r.brief||'';r.observationPoint=r.observationPoint||''});
  // v0.3 stored monthly check values as booleans. Upgrade them to 3-state objects.
  Object.keys(d.monthlyChecks).forEach(period=>{
    const row=d.monthlyChecks[period]||{};
    Object.keys(row).forEach(id=>{
      if(typeof row[id]==='boolean') row[id]=row[id]?{status:'checked'}:{status:'unchecked'};
      if(typeof row[id]==='string') row[id]={status:row[id]};
    });
  });
  return d;
}
function load(){try{return migrate(JSON.parse(localStorage.getItem(KEY))||cloneDefault())}catch{return migrate(cloneDefault())}}
let data=load();
function save(){if(data.month?.period){data.months=data.months||{};data.months[data.month.period]=JSON.parse(JSON.stringify(data.month))}localStorage.setItem(KEY,JSON.stringify(data));renderAll()}

const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function esc(v=''){return String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function personName(id){return data.people.find(p=>p.id===id)?.name||'—'}
function focus(){return data.people.find(p=>p.id===data.settings.focusPersonId)||data.people[0]}
function todayISO(){return new Date().toISOString().slice(0,10)}
function currentCheckKey(){return data.month.period||data.month.title||'current'}
function checkEntry(id){return (data.monthlyChecks[currentCheckKey()]||{})[id]||{status:'unchecked'}}
function statusClass(s){return s==='saved'?'saved':s==='checked'?'checked':''}
function statusIcon(s){return s==='saved'?'✓':s==='checked'?'◐':'○'}
function statusLabel(s){return s==='saved'?'SAVED':s==='checked'?'CHECKED':'TO CHECK'}
function guideDefaultPerson(g){return g.defaultPerson==='chiaki'?(data.people.find(p=>p.id==='chiaki')?.id||data.people[0]?.id):focus().id}
function masterDatasetForPerson(personId){return fourPillarsMaster?.[personId]||null}
function masterRecord(personId,period){return masterDatasetForPerson(personId)?.records?.find(x=>x.period===period)||null}
function masterCrossRecord(period){return fourPillarsMaster?.cross?.records?.find(x=>x.period===period)||null}
function masterReady(){return !!fourPillarsMaster.loaded}
function masterRange(){return fourPillarsMaster?.chiaki?.range||null}
function masterShiftForYear(personId,year){
  const ds=masterDatasetForPerson(personId);if(!ds?.records)return null;
  const rec=ds.records.find(x=>String(x.period||'').startsWith(`${year}-`)&&x.major_luck?.transition_in_this_gregorian_month);
  if(!rec)return null;const tr=rec.major_luck.transition_in_this_gregorian_month;
  const before=rec.major_luck?.before_transition||{},after=rec.major_luck?.after_transition||{};return {period:rec.period,from:{ganzhi:tr.from,tsuhensei:before.ten_god||'',junishi_un:before.twelve_stage||''},to:{ganzhi:tr.to,tsuhensei:after.ten_god||rec.major_luck?.ten_god||'',junishi_un:after.twelve_stage||rec.major_luck?.twelve_stage||''},precision:tr.precision||'month_only',at:null,record:rec};
}
function shiftLabel(shift){
  if(!shift)return'';
  if(shift.precision==='month_only'||!shift.at)return `${periodLabel(shift.period||data.month.period)} · 月精度`;
  return `${fmtShortDate(shift.at)}頃`;
}
function fmtMasterRange(rec){
  if(!rec)return'';
  const f=s=>{if(!s)return'';const d=new Date(s);return `${d.getMonth()+1}/${d.getDate()}`};
  return `${f(rec.period_start_jst)}〜${f(rec.period_end_jst)}`;
}
function fpRawPrompt(personId,period){
  const rec=masterRecord(personId,period);if(!rec)return '';
  const lines=[]; const person=personName(personId);
  lines.push(`【四柱推命マスター・${person}】`);
  lines.push(`対象期間: ${period} (${fmtMasterRange(rec)})`);
  lines.push(`月運: ${rec.month_luck?.ganzhi||'—'}｜${rec.month_luck?.ten_god||'—'}｜${rec.month_luck?.twelve_stage||'—'}`);
  lines.push(`歳運: ${rec.annual_luck?.ganzhi||'—'}｜${rec.annual_luck?.ten_god||'—'}｜${rec.annual_luck?.twelve_stage||'—'}`);
  lines.push(`大運: ${rec.major_luck?.ganzhi||'—'}｜${rec.major_luck?.ten_god||'—'}｜${rec.major_luck?.twelve_stage||'—'}`);
  const tr=rec.major_luck?.transition_in_this_gregorian_month;if(tr)lines.push(`大運切替: ${tr.from} → ${tr.to}（${tr.precision==='month_only'?'月精度・月内日付は推定しない':tr.precision||'精度不明'}）`);
  const pairs=rec.interactions?.month_to_natal?.pairwise||[];
  if(pairs.length){lines.push('月運→原局:');pairs.forEach(x=>lines.push(`- ${x.pillar}柱 ${x.pillar_ganzhi}: ${[...(x.stem_relations||[]),...(x.branch_relations||[])].join(' / ')||'作用なし'}`));}
  const multi=rec.interactions?.month_to_natal?.multi_branch||[];if(multi.length)lines.push(`多支関係(補助判定含む): ${multi.map(x=>`${x.type} ${x.name} [${(x.branches||[]).join('・')}]`).join(' / ')}`);
  const ann=[...(rec.interactions?.month_to_annual?.stem_relations||[]),...(rec.interactions?.month_to_annual?.branch_relations||[])];if(ann.length)lines.push(`月運→歳運: ${ann.join(' / ')}`);
  const maj=[...(rec.interactions?.month_to_major?.stem_relations||[]),...(rec.interactions?.month_to_major?.branch_relations||[])];if(maj.length)lines.push(`月運→大運: ${maj.join(' / ')}`);
  return lines.join('\n');
}
function crossRawPrompt(period){
  const c=masterCrossRecord(period);if(!c)return'';
  const lines=['【CROSS機械トリガー】',`月干支: ${c.month_ganzhi||'—'}`];
  if((c.shared_branch_relation_types||[]).length)lines.push(`共通支関係: ${c.shared_branch_relation_types.join(' / ')}`);else lines.push('共通支関係: なし');
  if(c.chiaki_major_transition)lines.push(`Chiaki大運切替: ${c.chiaki_major_transition.from} → ${c.chiaki_major_transition.to}（月精度）`);
  if(c.naoya_major_transition)lines.push(`N大運切替: ${c.naoya_major_transition.from} → ${c.naoya_major_transition.to}（月精度）`);
  lines.push('※CROSSは機械的トリガーのみ。関係性の意味づけはデータに焼き込まれていません。');
  return lines.join('\n');
}
function aiPrompt(g){
  const pointLabel=g.system==='四柱推命'?'主要ポイント／命式・運気':'主要ポイント／アスペクト';
  const base=`${data.month.title}の${g.label}を見ます。画像または配置をもとに、ORBITへ保存しやすい形式で整理してください。\n\n① 一行結論：30〜50字\n② 要約：100〜150字\n③ ${pointLabel}：箇条書き\n④ 詳細解釈：300〜500字\n⑤ キーワード：3〜5個（英語＋日本語訳を併記）\n⑥ 今月の観察ポイント：100〜200字\n\nORBITへの保存用なので、見出し名と順番を変更せず出力してください。断定ではなく、占術上のテーマ・可能性として読んでください。`;
  if(g.system!=='四柱推命'||!masterReady())return base;
  const pid=guideDefaultPerson(g);const raw=fpRawPrompt(pid,data.month.period),cross=crossRawPrompt(data.month.period);
  return `${data.month.title}の四柱推命を見ます。以下はORBIT FourPillars Engine v1の機械計算済みマスターデータです。画像よりこのデータを優先し、記載のない事実を補完しないでください。半会など流派差のある補助判定は強く断定しないでください。\n\n${raw}${cross?`\n\n${cross}`:''}\n\n① 一行結論：30〜50字\n② 要約：100〜150字\n③ 主要ポイント／命式・運気：箇条書き\n④ 詳細解釈：300〜500字\n⑤ キーワード：3〜5個（英語＋日本語訳を併記）\n⑥ 今月の観察ポイント：100〜200字\n\nORBITへの保存用なので、見出し名と順番を変更せず出力してください。計算データと解釈を分け、未来や関係性を事実として断定しないでください。`;
}


const TSUHEN_MEANINGS={
  '比肩':'自分軸・独立・主体性。自分の意思で動き、同等の相手や競争も意識しやすい。',
  '劫財':'仲間・競争・突破力。人との関わりの中で自分の取り分や自由を守ろうとする力。',
  '食神':'表現・楽しみ・創造・余裕。自然体で外へ生み出す力。',
  '傷官':'感受性・批評・言語化・独自性。違和感を見抜き、自分の形に変える力。',
  '偏財':'交流・機会・柔軟な現実対応。人や情報を広く動かす力。',
  '正財':'安定・管理・積み上げ。現実的に守り育てる力。',
  '偏官':'決断・緊張感・行動力。負荷のある状況で突破する力。',
  '正官':'責任・秩序・社会的役割。信頼や形を整えていく力。',
  '偏印':'独自の学び・ひらめき・再構成。既存の枠を外して理解する力。',
  '印綬':'学習・理解・保護・蓄積。知識を吸収し、意味として整理する力。'
};
const JUNISHI_MEANINGS={
  '長生':'新しい流れが育ち始める。吸収・成長・立ち上がり。','沐浴':'価値観や環境が揺れ動き、試しながら変化する。','冠帯':'自信や社会性が育ち、外へ打ち出しやすい。','建禄':'自立性と実行力が高まり、自分の足で進む。','帝旺':'エネルギーが強く出やすいピーク。主導権と勢い。','衰':'勢いを整理し、成熟した判断へ移る。','病':'内側を見直し、無理を減らして調整する。','死':'一区切りをつけ、古い形を手放す。','墓':'蓄積・内省・収束。いったん内側へしまい整える。','絶':'既存の流れが切り替わり、ゼロから組み直す。','胎':'まだ形にならない可能性が芽生える。','養':'次の段階に向けて育て、準備する。'
};
async function loadFourPillarsMaster(){
  try{
    const entries=await Promise.all(Object.entries(FOURPILLARS_MASTER_FILES).map(async([key,file])=>{
      const res=await fetch(`${FOURPILLARS_MASTER_BASE}${file}`,{cache:'no-store'});if(!res.ok)throw new Error(`${file}: ${res.status}`);return [key,await res.json()];
    }));
    const loaded=Object.fromEntries(entries);
    const counts=['chiaki','naoya','cross'].map(k=>loaded[k]?.records?.length||0);
    if(counts.some(n=>n!==96))throw new Error(`record count mismatch: ${counts.join('/')}`);
    fourPillarsMaster={loaded:true,error:null,...loaded};
    renderAll();
  }catch(err){
    fourPillarsMaster={...fourPillarsMaster,loaded:false,error:String(err?.message||err)};
    console.warn('ORBIT FourPillars master load failed',err);
  }
}
async function loadWesternMaster(){
  try{
    const res=await fetch(WESTERN_MASTER_URL,{cache:'no-store'});if(!res.ok)throw new Error(`western master: ${res.status}`);
    const master=await res.json();
    if(!Array.isArray(master?.months)||master.months.length!==96)throw new Error(`record count mismatch: ${master?.months?.length||0}`);
    westernMaster={loaded:true,error:null,data:master};renderAll();
  }catch(err){westernMaster={loaded:false,error:String(err?.message||err),data:null};console.warn('ORBIT Western master load failed',err);renderAll()}
}
function westernMonth(period){return westernMaster.data?.months?.find(x=>x.month===period)||null}
function westernBodyKey(v=''){return String(v).replace(/^[ptn]/,'')}
function westernBodyMeta(v=''){const key=westernBodyKey(v);return {key,...(WESTERN_BODIES[key]||{ja:key,symbol:'•'})}}
function westernAspectMeta(v=''){const key=String(v||'').toLowerCase();return {key,...(WESTERN_ASPECTS[key]||{ja:key,en:key.toUpperCase(),short:key.toUpperCase(),symbol:'·'})}}
function westernAspectLine(a){
  const from=westernBodyMeta(a.source),to=westernBodyMeta(a.target),asp=westernAspectMeta(a.aspect);
  return `${from.symbol} ${from.ja} ${asp.symbol} ${to.symbol} ${to.ja} · ${a.orb}`;
}
function westernAspectEnglish(a){
  const from=westernBodyMeta(a.source),to=westernBodyMeta(a.target),asp=westernAspectMeta(a.aspect);
  return `${from.key} ${asp.en} ${to.key}`;
}
const WESTERN_THEME_RULES={Sun:'自己・方向性',Moon:'感情・安心',Mercury:'思考・コミュニケーション',Venus:'愛情・価値観',Mars:'行動・欲求',Jupiter:'拡大・可能性',Saturn:'現実化・責任',Uranus:'変化・自由',Neptune:'感受性・理想',Pluto:'根本変容'};
const WESTERN_ASPECT_TONE={conjunction:'intense',sextile:'flow',trine:'flow',square:'friction',opposition:'friction'};
function westernInterpretation(items=[]){
 const score=new Map(),tones={flow:0,friction:0,intense:0};
 items.forEach(a=>{const w=a.strength==='strong'?3:1;[westernBodyKey(a.source),westernBodyKey(a.target)].forEach(k=>score.set(k,(score.get(k)||0)+w));const tone=WESTERN_ASPECT_TONE[a.aspect];if(tone)tones[tone]+=w});
 const themes=[...score.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k])=>WESTERN_THEME_RULES[k]).filter(Boolean);
 const strongCount=items.filter(a=>a.strength==='strong').length;const topTone=Object.entries(tones).sort((a,b)=>b[1]-a[1])[0]?.[0]||'intense';
 const toneText=topTone==='flow'?'流れを活かしやすい':topTone==='friction'?'調整を通して動きが生まれやすい':'テーマが濃く意識されやすい';
 const lead=strongCount?`1°以内の強いアスペクトが${strongCount}件。`:'タイトなアスペクトは少なめ。';
 return {themes,strongCount,summary:`${lead}${themes.join(' × ')||'長期テーマ'}が重なり、${toneText}配置です。`};
}
function westernInterpretationHTML(items,label){const r=westernInterpretation(items);if(!items.length)return '';return `<div class="western-orbit-read"><div class="western-read-head"><span>✦ ORBIT READ</span><small>${esc(label)}</small></div><p>${esc(r.summary)}</p><div class="western-read-chips">${r.themes.map(t=>`<span>${esc(t)}</span>`).join('')}</div><small class="western-read-note">天体・アスペクト・orbから自動整理した象徴テーマ。未来の出来事を断定するものではありません。</small></div>`;}

function westernAspectHTML(a,{compact=false}={}){
  const from=westernBodyMeta(a.source),to=westernBodyMeta(a.target),asp=westernAspectMeta(a.aspect),strong=a.strength==='strong';
  if(compact)return `<span class="western-compact-line"><b>${esc(from.symbol)} ${esc(from.ja)}</b><i>${esc(asp.symbol)}</i><b>${esc(to.symbol)} ${esc(to.ja)}</b><em>${esc(a.orb)}</em></span>`;
  return `<div class="western-aspect ${strong?'strong':''}"><div class="western-aspect-main"><span class="western-glyph">${esc(from.symbol)}</span><div><strong>${esc(from.ja)} <span>${esc(asp.symbol)}</span> ${esc(to.ja)}</strong><small>${esc(asp.ja)} · ${esc(a.orb)}</small><small class="western-en">${esc(westernAspectEnglish(a))}</small></div></div><span class="western-strength">${strong?'STRONG ≤1°':'STANDARD'}</span></div>`;
}
function renderWesternSnapshot(){
  const host=$('#westernSnapshot');if(!host)return;const m=westernMonth(data.month.period);
  if(westernMaster.error){host.innerHTML=`<div class="western-state">WESTERN MASTER LOAD ERROR<br><small>${esc(westernMaster.error)}</small></div>`;return}
  if(!westernMaster.loaded){host.innerHTML='<div class="western-state">LOADING WESTERN MASTER…</div>';return}
  if(!m){host.innerHTML='<div class="western-state">この月のWesternデータはありません</div>';return}
  const pa=m.progressions?.aspects_to_natal||[],ta=m.long_transits?.aspects_to_natal||[];
  const preview=items=>items.slice(0,2).map(a=>westernAspectHTML(a,{compact:true})).join('')||'<span class="western-empty">主要アスペクトなし</span>';
  const combined=westernInterpretation([...pa,...ta]);
  host.innerHTML=`<button type="button" class="western-summary" data-western-detail><div class="western-home-read"><small>✦ ORBIT READ</small><p>${esc(combined.summary)}</p><span>${combined.themes.map(t=>`<b>${esc(t)}</b>`).join('')}</span></div><div><small>PROGRESSIONS × NATAL</small><strong>プログレス × ネイタル <b>${pa.length}</b></strong><span class="western-preview">${preview(pa)}</span></div><div><small>LONG TRANSITS × NATAL</small><strong>長期トランジット × ネイタル <b>${ta.length}</b></strong><span class="western-preview">${preview(ta)}</span></div><em>詳しく見る ›</em></button>`;
}
function viewWesternDetail(){
  const m=westernMonth(data.month.period);if(!m)return;const pa=m.progressions?.aspects_to_natal||[],ta=m.long_transits?.aspects_to_natal||[];
  const rows=(items,label,jaLabel)=>`<div class="fp-section western-detail-section"><span class="kicker">${label}</span><h3>${jaLabel}<small>${items.length} ASPECTS</small></h3>${items.length?items.map(a=>westernAspectHTML(a)).join(''):'<p class="modal-copy">3°以内の主要アスペクトなし</p>'}</div>`;
  openModal(`<span class="kicker">WESTERN ENGINE · MONTHLY SNAPSHOT</span><h2>${esc(periodLabel(m.month))}</h2><p class="modal-copy western-detail-note">毎月15日12:00 JSTのスナップショット。プログレスと木星〜冥王星の長期トランジットを、ネイタルへの主要アスペクト3°以内で表示します。<br><small>記号と英語名も学習用に併記しています。STRONGはorb 1°以内。</small></p>${westernInterpretationHTML([...pa,...ta],'MONTHLY SYNTHESIS')}${westernInterpretationHTML(pa,'PROGRESSIONS')}${rows(pa,'PROGRESSIONS × NATAL','プログレス × ネイタル')}${westernInterpretationHTML(ta,'LONG TRANSITS')}${rows(ta,'LONG TRANSITS × NATAL','長期トランジット × ネイタル')}<div class="fp-source"><small>SOURCE</small><span>${esc(westernMaster.data.engine)} · ${esc(westernMaster.data.status)} · ${esc(westernMaster.data.rules?.monthly_snapshot||'')}</span></div><div class="form-actions"><button type="button" class="save-btn" data-close-modal>Close</button></div>`)
}
function fpProfile(personId){return data.fourPillars?.profiles?.[personId]||null}
function ageAt(date,birthDate){if(!birthDate)return 0;const b=new Date(birthDate+'T12:00:00');return (date-b)/(365.2425*86400000)}
function targetDateForPeriod(period){const now=new Date(),d=periodToDate(period);return (now.getFullYear()===d.getFullYear()&&now.getMonth()===d.getMonth())?now:new Date(d.getFullYear(),d.getMonth(),15,12)}
function dateAtDecimalAge(birthDate,age){if(!birthDate||!Number.isFinite(Number(age)))return null;const b=new Date(birthDate+'T12:00:00');return new Date(b.getTime()+Number(age)*365.2425*86400000)}
function fmtMonth(date){return date?`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`:''}
function fmtShortDate(date){return date?`${date.getMonth()+1}/${date.getDate()}`:''}
function daiunBounds(personId,item){const p=data.people.find(x=>x.id===personId);return {start:dateAtDecimalAge(p?.birthDate,Number(item?.age_start)),end:dateAtDecimalAge(p?.birthDate,Number(item?.age_end))}}
function activeDaiun(profile,personId,date){
  if(!profile?.daiun?.list)return null;
  // Decimal ages are fractions of a year (43.62 ≠ 43y6m). Convert each boundary to a real date.
  return profile.daiun.list.find(x=>{const b=daiunBounds(personId,x);return b.start&&b.end&&date>=b.start&&date<b.end})||null;
}
function daiunShiftForPeriod(profile,personId,period){
  if(!profile?.daiun?.list)return null;
  const d=periodToDate(period),start=new Date(d.getFullYear(),d.getMonth(),1),end=new Date(d.getFullYear(),d.getMonth()+1,1);
  for(const x of profile.daiun.list.slice(1)){
    const at=daiunBounds(personId,x).start;
    if(at&&at>=start&&at<end){const prev=profile.daiun.list[profile.daiun.list.indexOf(x)-1];return {at,from:prev,to:x};}
  }
  return null;
}
function daiunShiftForYear(profile,personId,year){
  if(!profile?.daiun?.list)return null;
  for(const x of profile.daiun.list.slice(1)){
    const at=daiunBounds(personId,x).start;
    if(at&&at.getFullYear()===Number(year)){const prev=profile.daiun.list[profile.daiun.list.indexOf(x)-1];return {at,from:prev,to:x};}
  }
  return null;
}
function yearLuck(profile,year){return profile?.ryunen?.find(x=>Number(x.year)===Number(year))||null}
function fpMeaning(star,un){return [star&&TSUHEN_MEANINGS[star],un&&JUNISHI_MEANINGS[un]].filter(Boolean).join(' ')}
function normalizeIntegratedSizhu(raw,personId){
  const d=raw?.sizhu_bazi?.dingqi;if(!d)return null;
  const zou=d.zoukanAll||{},mk=(label,x,z)=>({label,ganzhi:x?.gzStr||'',stem:(x?.gzStr||'')[0]||'',branch:(x?.gzStr||'')[1]||'',tsuhensei:label==='日柱'?null:x?.tsuhensei,zoukan:z?.standard||[],zoukan_tsuhensei:z?.standardTenGods||[],junishi_un:x?.junishiUn||'',kubou:(d.kubou||[]).includes((x?.gzStr||'')[1])});
  return {source:raw?.__data_provenance?.publisher||'大久保占い研究室',calendarMethod:'定気法（真黄経）',schema:raw?._meta?.tool?.version?`senjutsu-integrated/${raw._meta.tool.version}`:'senjutsu-integrated',importedAt:new Date().toISOString(),dayMaster:{stem:d.dayStem,yinyang:d.dayYinyang,wuxing:d.dayWuxing},kubou:d.kubou||[],fourPillars:{year:mk('年柱',d.year,zou.year),month:mk('月柱',d.month,zou.month),day:mk('日柱',d.day,zou.day),hour:mk('時柱',d.hour,zou.hour)},daiun:{direction:d.daiun?.forward?'順行':'逆行',start_age:d.daiun?.startAge,list:(d.daiun?.daiuns||[]).map(x=>({index:x.index,age_start:x.ageStart,age_end:x.ageEnd,ganzhi:x.gzStr,tsuhensei:x.tsuu,junishi_un:x.jun,kubou:false}))},ryunen:(d.ryunen||[]).map(x=>({year:x.year,age:x.age,ganzhi:x.gzStr,tsuhensei:x.tsuu,junishi_un:x.jun,kubou:false})),ryugetsu:(raw?.sizhu_bazi?.ryugetsu||[]).map(x=>({ganzhi:x.gzStr,term:x.term,start:x.start,tsuhensei:x.tsuu,junishi_un:x.jun,kubou:x.kubou})),input:{birth_date:raw?.input?.date,birth_time:raw?.input?.time,gender:raw?.input?.genderLabel||'',birthplace:raw?.input?.prefName||raw?.input?.placeName||''},birthTimeWarning:(data.people.find(p=>p.id===personId)?.birthTimeStatus!=='exact')?'出生時刻不明のため、時柱は参考扱い。':''};
}
function normalizeSizhu(raw,personId){
  const integrated=normalizeIntegratedSizhu(raw,personId);if(integrated)return integrated;
  return {source:raw?.__data_provenance?.publisher||'Imported 四柱推命 JSON',calendarMethod:raw?.calendar_method||'',schema:raw?.schema||'',importedAt:new Date().toISOString(),dayMaster:raw?.day_master||{},kubou:raw?.kubou||[],fourPillars:raw?.four_pillars||{},daiun:raw?.daiun||{list:[]},ryunen:raw?.ryunen||[],ryugetsu:raw?.ryugetsu||[],shinsatsu:raw?.shinsatsu||{},kankei:raw?.kankei||[],input:raw?.input||{},birthTimeWarning:(data.people.find(p=>p.id===personId)?.birthTimeStatus!=='exact')?'出生時刻不明のため、時柱は参考扱い。':''};
}
function bundledMonthly(personId,period){return BUNDLED_MONTHLY_FOUR_PILLARS?.[personId]?.[period]||null}
function profileMonthly(profile,period){
  const list=profile?.ryugetsu||[];if(!list.length)return null;
  const target=targetDateForPeriod(period);let found=null,next=null;
  for(let i=0;i<list.length;i++){const st=new Date(list[i].start);if(st<=target){found=list[i];next=list[i+1]||null}else break;}
  if(!found)return null;
  const st=new Date(found.start),en=next?new Date(new Date(next.start).getTime()-60000):null;
  return {...found,range:en?`${fmtShortDate(st)}〜${fmtShortDate(en)}`:`${fmtShortDate(st)}〜`,source:'大久保占い研究室',startDate:st,endDate:en};
}
function monthlyLuck(personId,period){
  const profile=fpProfile(personId),fromProfile=profileMonthly(profile,period),saved=data.fourPillars?.monthly?.[personId]?.[period],bundled=bundledMonthly(personId,period);
  // Authoritative calendar data comes from the imported profile; KINOTO/manual data can enrich branch star / relation notes.
  return (fromProfile||saved||bundled)?{...bundled,...saved,...fromProfile}:null;
}
function readingThemeFor(system,period,fallback){
  const rs=data.readings.filter(r=>r.system===system&&r.targetPeriod===period);
  if(!rs.length)return fallback;
  const tags=rs.flatMap(r=>r.tags||[]).map(x=>String(x).replace(/（.*?）|\(.*?\)/g,'').split(/[｜|]/)[0].trim()).filter(Boolean);
  if(!tags.length)return fallback;
  const counts={};tags.forEach(t=>counts[t]=(counts[t]||0)+1);
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0].toUpperCase()).join(' / ');
}
function aspectCardHTML(text,index){
  const raw=String(text||'').trim();
  const orb=(raw.match(/(?:orb\s*[:=]?\s*)?([0-9]+(?:\.[0-9]+)?°(?:\s*[0-9]+[′']?)?)/i)||[])[0]||'';
  const clean=orb?raw.replace(orb,'').replace(/\s*[·|｜—-]\s*$/,'').trim():raw;
  return `<div class="aspect-card aspect-card-rich"><span class="aspect-no">${String(index+1).padStart(2,'0')}</span><div><strong>${esc(clean||raw)}</strong>${orb?`<small>${esc(orb)}</small>`:''}</div></div>`;
}
function fourPillarSummary(personId,period){
  const profile=fpProfile(personId); if(!profile)return null;
  const rec=masterRecord(personId,period);
  if(rec){
    const mapLuck=x=>x?{ganzhi:x.ganzhi,tsuhensei:x.ten_god,junishi_un:x.twelve_stage,source_start_month:x.source_start_month}:null;
    const tr=rec.major_luck?.transition_in_this_gregorian_month;
    const before=rec.major_luck?.before_transition||{},after=rec.major_luck?.after_transition||{};const shift=tr?{period,from:{ganzhi:tr.from,tsuhensei:before.ten_god||'',junishi_un:before.twelve_stage||''},to:{ganzhi:tr.to,tsuhensei:after.ten_god||rec.major_luck?.ten_god||'',junishi_un:after.twelve_stage||rec.major_luck?.twelve_stage||''},precision:tr.precision||'month_only',at:null,record:rec}:null;
    const m={...mapLuck(rec.month_luck),term:rec.start_solar_term?.name||'',range:fmtMasterRange(rec),source:'ORBIT FourPillars Engine v1',hidden_stems:rec.month_luck?.hidden_stems||[],hidden_ten_gods:rec.month_luck?.hidden_ten_gods||[],interactions:rec.interactions};
    return {profile,d:mapLuck(rec.major_luck),y:mapLuck(rec.annual_luck),m,year:Number(String(period).slice(0,4)),shift,master:true,record:rec,cross:masterCrossRecord(period)};
  }
  const dt=targetDateForPeriod(period), year=dt.getFullYear(),d=activeDaiun(profile,personId,dt),y=yearLuck(profile,year),m=monthlyLuck(personId,period);
  return {profile,d,y,m,year,shift:daiunShiftForPeriod(profile,personId,period),master:false,record:null,cross:null};
}
function cycleRowsHTML(){
  const rows=[`<div class="cycle-row"><span>Western Astrology</span><strong>進行図・長期トランジットの現在テーマ</strong></div>`];
  const fp=fourPillarSummary('chiaki',data.month.period);
  if(fp){
    const parts=[]; if(fp.d)parts.push(`大運 ${fp.d.ganzhi}｜${fp.d.tsuhensei}｜${fp.d.junishi_un}`); if(fp.y)parts.push(`流年 ${fp.y.ganzhi}｜${fp.y.tsuhensei}｜${fp.y.junishi_un}`); if(fp.m)parts.push(`流月 ${fp.m.ganzhi||'—'}｜${fp.m.tsuhensei||'—'}｜${fp.m.junishi_un||'—'}`);
    rows.push(`<button class="cycle-row cycle-row-button" data-fp-cycle="chiaki"><span>四柱推命${fp.shift?'<b class="shift-mini">MAJOR SHIFT</b>':''}${fp.master?'<b class="master-mini">MASTER</b>':''}</span><strong>${(parts.length?parts.map(esc).join('<br>'):'BASE登録済み')}</strong><em>${fp.master?'96-MONTH DB · ':''}意味を見る ›</em></button>`)
  }else rows.push(`<button class="cycle-row cycle-row-button" data-fp-import="chiaki"><span>四柱推命</span><strong>BASE命式を登録</strong><em>JSON IMPORT ›</em></button>`);
  return rows.join('');
}
function pillarMini(label,x){if(!x)return'';return `<div class="fp-pillar"><small>${label}</small><strong>${esc(x.ganzhi||'—')}</strong><span>${esc(x.tsuhensei||'日主')} · ${esc(x.junishi_un||'—')}</span></div>`}
function fpInteractionHTML(fp,personId){
  if(!fp?.master||!fp.record)return'';
  const rec=fp.record,items=[];
  (rec.interactions?.month_to_natal?.pairwise||[]).forEach(x=>{const rel=[...(x.stem_relations||[]),...(x.branch_relations||[])];if(rel.length)items.push(`<span class="fp-signal"><b>${esc(x.pillar)}柱</b> ${esc(rel.join(' · '))}</span>`)});
  const ann=[...(rec.interactions?.month_to_annual?.stem_relations||[]),...(rec.interactions?.month_to_annual?.branch_relations||[])];if(ann.length)items.push(`<span class="fp-signal"><b>歳運</b> ${esc(ann.join(' · '))}</span>`);
  const maj=[...(rec.interactions?.month_to_major?.stem_relations||[]),...(rec.interactions?.month_to_major?.branch_relations||[])];if(maj.length)items.push(`<span class="fp-signal"><b>大運</b> ${esc(maj.join(' · '))}</span>`);
  const multi=(rec.interactions?.month_to_natal?.multi_branch||[]).map(x=>`<span class="fp-signal auxiliary"><b>${esc(x.type)}</b> ${esc(x.name)}</span>`);
  const cross=fp.cross,cr=(cross?.shared_branch_relation_types||[]).map(x=>`<span class="fp-signal cross"><b>CROSS</b> ${esc(x)}</span>`);
  return `<div class="fp-raw"><span class="kicker">RAW SIGNALS · ENGINE v1</span><div class="fp-signals">${items.join('')||'<span class="fp-signal quiet">主要な二者作用なし</span>'}${cr.join('')}</div>${multi.length?`<details class="fp-aux"><summary>補助判定を見る</summary><div class="fp-signals">${multi.join('')}</div><small>半会などは流派差があるため補助的に扱います。</small></details>`:''}</div>`;
}
function viewFourPillars(personId){
  const p=data.people.find(x=>x.id===personId),fp=fourPillarSummary(personId,data.month.period); if(!p)return;
  if(!fp){return openModal(`<span class="kicker">FOUR PILLARS</span><h2>${esc(p.name)}</h2><p class="modal-copy">まだ命式JSONが登録されていません。</p><div class="form-actions"><button type="button" class="secondary-btn" data-fp-import="${p.id}">JSON IMPORT</button></div>`)}
  const pr=fp.profile,dm=pr.dayMaster||{},pill=pr.fourPillars||{};
  openModal(`<span class="kicker">FOUR PILLARS · BASE CHART</span><h2>${esc(p.name)}</h2><div class="fp-core"><small>DAY MASTER</small><strong>${esc(dm.stem||'—')} · ${esc(dm.yinyang||'')} ${esc(dm.wuxing||'')}</strong><span>${esc(pr.calendarMethod||'')}</span></div>${pr.birthTimeWarning?`<div class="fp-warning">△ ${esc(pr.birthTimeWarning)}</div>`:''}<div class="fp-pillars">${pillarMini('YEAR',pill.year)}${pillarMini('MONTH',pill.month)}${pillarMini('DAY',pill.day)}${pillarMini('HOUR',pill.hour)}</div><div class="fp-section"><span class="kicker">CURRENT CYCLE · ${esc(data.month.title)}</span>${fp.shift?`<div class="shift-banner"><span>✦ MAJOR SHIFT</span><strong>大運切替 · ${esc(fp.shift.from.ganzhi)} → ${esc(fp.shift.to.ganzhi)}</strong><small>${esc(shiftLabel(fp.shift))} · 10年サイクルの転換点</small></div>`:''}${fp.d?`<button class="fp-luck" data-fp-meaning="${esc(fp.d.tsuhensei)}" data-fp-un="${esc(fp.d.junishi_un)}"><small>大運 / 10 YEAR${daiunBounds(p.id,fp.d).start?` · ${esc(fmtMonth(daiunBounds(p.id,fp.d).start))}〜`:''}</small><strong>${esc(fp.d.ganzhi)}｜${esc(fp.d.tsuhensei)}｜${esc(fp.d.junishi_un)}</strong><p>${esc(fpMeaning(fp.d.tsuhensei,fp.d.junishi_un))}</p></button>`:''}${fp.y?`<button class="fp-luck" data-fp-meaning="${esc(fp.y.tsuhensei)}" data-fp-un="${esc(fp.y.junishi_un)}"><small>流年 / ${fp.year}</small><strong>${esc(fp.y.ganzhi)}｜${esc(fp.y.tsuhensei)}｜${esc(fp.y.junishi_un)}</strong><p>${esc(fpMeaning(fp.y.tsuhensei,fp.y.junishi_un))}</p></button>`:''}${fp.m?`<button class="fp-luck" data-fp-meaning="${esc(fp.m.tsuhensei||'')}" data-fp-un="${esc(fp.m.junishi_un||'')}"><small>流月 / ${esc(data.month.title)}${fp.m.term?` · ${esc(fp.m.term)}`:''}${fp.m.range?` · ${esc(fp.m.range)}`:''}</small><strong>${esc(fp.m.ganzhi||'—')}｜${esc([fp.m.tsuhensei,fp.m.branchTsuhensei].filter(Boolean).join('・')||'—')}｜${esc(fp.m.junishi_un||'—')}</strong><p>${esc([fpMeaning(fp.m.tsuhensei,fp.m.junishi_un),fp.m.note].filter(Boolean).join(' '))}</p></button>`:`<button class="fp-add-month" data-fp-month="${p.id}">＋ この年の月運データを追加 / 編集</button>`}</div>${fpInteractionHTML(fp,p.id)}<div class="fp-source"><small>SOURCE</small><span>${esc(fp.master?'ORBIT FourPillars Engine v1 · FourPillars NEXT master':`${pr.source} · ${pr.calendarMethod}`)}</span></div><div class="form-actions split-actions"><button type="button" class="secondary-btn" data-fp-import="${p.id}">RE-IMPORT JSON</button><button type="button" class="save-btn" data-close-modal>Close</button></div>`)
}
function editFourPillarMonth(personId){const old=data.fourPillars?.monthly?.[personId]?.[data.month.period]||{};openModal(`<span class="kicker">FOUR PILLARS · MONTHLY</span><h2>${esc(personName(personId))} · ${esc(data.month.title)}</h2><input type="hidden" name="personId" value="${esc(personId)}"><label>干支</label><input name="ganzhi" value="${esc(old.ganzhi||'')}" placeholder="丙申"><label>天干通変星</label><input name="tsuhensei" value="${esc(old.tsuhensei||'')}" placeholder="偏財"><label>地支通変星</label><input name="branchTsuhensei" value="${esc(old.branchTsuhensei||'')}" placeholder="偏印"><label>十二運</label><input name="junishi_un" value="${esc(old.junishi_un||'')}" placeholder="長生"><label>期間</label><input name="range" value="${esc(old.range||'')}" placeholder="8/7〜9/6"><label>命式との関係 / メモ</label><textarea name="note" placeholder="害・冲・合など。サイトの表示をそのまま記録">${esc(old.note||'')}</textarea><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="fp-month">SAVE MONTH</button></div>`)}
function keywordPairsFromReading(r){
  const out=[];
  (r?.tags||[]).forEach(raw=>{
    const text=String(raw||'').trim(); if(!text)return;
    const re=/(?:^|\*)\s*([^*\n—–|｜]+?)\s*(?:—|–|\||｜)\s*([^*\n]+?)(?=\s*\*|$)/g;
    let m,matched=false;
    while((m=re.exec(text))){matched=true;out.push({en:m[1].replace(/^[-•*\s]+/,'').trim(),ja:m[2].trim()})}
    if(!matched){
      text.split(/\s*[,/]\s*/).map(x=>x.trim()).filter(Boolean).forEach(x=>{
        const mm=x.match(/^(.+?)[（(](.+?)[）)]$/);out.push(mm?{en:mm[1].trim(),ja:mm[2].trim()}:{en:x,ja:''});
      });
    }
  });
  return out;
}
const THEME_ALIASES={
  REBUILDING:'RESTRUCTURING',RECONSTRUCTION:'RESTRUCTURING',RESTRUCTURING:'RESTRUCTURING',REDEFINITION:'RESTRUCTURING',
  TRANSFORMATION:'TRANSFORMATION',RENEWAL:'RENEWAL',INNOVATION:'RENEWAL','NEW DIRECTION':'RENEWAL',
  AFFECTION:'AFFECTION','DEEP BONDING':'AFFECTION',ATTRACTION:'AFFECTION',
  COMMITMENT:'COMMITMENT',RESPONSIBILITY:'COMMITMENT',
  INTEGRATION:'STABILIZATION',STABILIZATION:'STABILIZATION',STABILITY:'STABILIZATION','NEW STABILITY':'STABILIZATION',CONSOLIDATION:'STABILIZATION',
  EXPANSION:'EXPANSION',BREAKTHROUGH:'BREAKTHROUGH',COMMUNICATION:'COMMUNICATION','CONSTRUCTIVE COMMUNICATION':'COMMUNICATION','DIRECT COMMUNICATION':'COMMUNICATION',TRUTH:'COMMUNICATION',
  CHANGE:'CHANGE','SUSTAINABLE CHANGE':'CHANGE',FREEDOM:'FREEDOM',MATURITY:'MATURITY',ACTION:'ACTION',ACTIVATION:'ACTION'
};
function canonicalTheme(label){const k=String(label||'').toUpperCase().replace(/^[*•\-\s]+|[\s]+$/g,'');return THEME_ALIASES[k]||k}
function projectReadings(p,year){
  return data.readings.filter(r=>String(r.targetPeriod||'').startsWith(`${year}-`)).sort((a,b)=>(a.targetPeriod||'').localeCompare(b.targetPeriod||'')||(a.method||'').localeCompare(b.method||''));
}
function projectOverlap(readings){
  const perTheme=new Map();
  readings.forEach(r=>{
    const seen=new Set();
    keywordPairsFromReading(r).forEach(k=>{
      const c=canonicalTheme(k.en);if(!c||seen.has(c))return;seen.add(c);
      if(!perTheme.has(c))perTheme.set(c,{theme:c,count:0,methods:new Set(),systems:new Set(),labels:[]});
      const x=perTheme.get(c);x.count++;x.methods.add(r.method||r.system);x.systems.add(r.system);if(k.ja&&!x.labels.includes(k.ja))x.labels.push(k.ja);
    });
  });
  return [...perTheme.values()].sort((a,b)=>b.methods.size-a.methods.size||b.count-a.count||a.theme.localeCompare(b.theme));
}
function projectCrossPrompt(p,year,readings){
  const lines=[`${p.title}の保存済み観測を横断分析してください。`, '',
    'ORBITに保存した観測データだけを根拠に、個別の占いを並べるだけでなく、時期・テーマ・関係性の変化を統合してください。',
    '未来を事実として断定せず、占術上の長期観測仮説として扱ってください。', '',
    '【分析してほしいこと】','① 同じ西洋占星術内で複数手法に重なるテーマ','② 月ごとの違いと時系列の変化','③ 四柱推命とのCROSS-SYSTEMの重なりと相違（データがある範囲のみ）','④ 特に重なりが強いシグナルと、その根拠','⑤ 反対方向・矛盾する示唆','⑥ 今後追加すると有用な観測時期','⑦ 総合所見（断定ではなく仮説）',''];
  data.people.forEach(person=>{const pr=fpProfile(person.id);if(!pr)return;const july=fourPillarSummary(person.id,`${year}-07`),d=july?.d,y=july?.y,shift=masterShiftForYear(person.id,year)||daiunShiftForYear(pr,person.id,year);lines.push(`【四柱推命・${person.name}】`);lines.push(`日主: ${pr.dayMaster?.stem||'—'} ${pr.dayMaster?.wuxing||''}`);if(d)lines.push(`大運: ${d.ganzhi}｜${d.tsuhensei}｜${d.junishi_un}`);if(shift)lines.push(`大運切替: ${shiftLabel(shift)} ${shift.from.ganzhi} → ${shift.to.ganzhi}`);if(y)lines.push(`流年: ${y.ganzhi}｜${y.tsuhensei}｜${y.junishi_un}`);lines.push('')});
  const months=[...new Set(readings.map(r=>r.targetPeriod))].sort();
  months.forEach(period=>{lines.push(`【${periodLabel(period)}】`);['chiaki','naoya'].forEach(pid=>{const raw=fpRawPrompt(pid,period);if(raw){lines.push(raw);lines.push('')}});const cross=crossRawPrompt(period);if(cross){lines.push(cross);lines.push('')}readings.filter(r=>r.targetPeriod===period).forEach(r=>{lines.push(`■ ${r.system} / ${r.method} / ${personName(r.personId)}`);lines.push(`一行結論: ${r.summary||'—'}`);if(r.brief)lines.push(`要約: ${r.brief}`);const kws=keywordPairsFromReading(r).map(k=>`${k.en}${k.ja?`（${k.ja}）`:''}`);if(kws.length)lines.push(`キーワード: ${kws.join(' / ')}`);if((r.aspects||[]).length)lines.push(`主要ポイント:\n${r.aspects.slice(0,10).map(x=>`- ${x}`).join('\n')}`);if(r.observationPoint)lines.push(`観察ポイント: ${r.observationPoint}`);lines.push('')});});
  return lines.join('\n');
}
function projectMonthHTML(period,readings){
  const overlaps=projectOverlap(readings).filter(x=>x.methods.size>=2).slice(0,6);
  const strength=readings.length>=3&&overlaps.some(x=>x.methods.size>=3)?'STRONG OVERLAP':overlaps.length?'OVERLAP':'OBSERVING';
  return `<section class="project-month"><div class="project-month-head"><div><span class="kicker">WESTERN OBSERVATION</span><h3>${esc(periodLabel(period))}</h3></div><span class="overlap-grade ${strength==='STRONG OVERLAP'?'strong':''}">${esc(strength)}</span></div>${overlaps.length?`<div class="project-overlap"><small>OVERLAPPING THEMES</small><div class="chips">${overlaps.map(x=>`<span class="chip">${esc(x.theme)} <b>×${x.methods.size}</b></span>`).join('')}</div></div>`:''}<div class="project-reading-list">${readings.map(r=>`<button type="button" class="project-reading-row" data-reading="${esc(r.id)}"><span>${esc(r.method||r.system)}</span><strong>${esc(r.summary||'保存済み観測')}</strong><em>›</em></button>`).join('')}</div></section>`;
}
function viewProject(id){
  const p=data.projects.find(x=>x.id===id);if(!p)return;
  const year=Number(String(p.targetPeriod||'').match(/\d{4}/)?.[0]);
  const readings=year?projectReadings(p,year):[];
  const periods=[...new Set(readings.map(r=>r.targetPeriod))].sort();
  const overlaps=projectOverlap(readings);
  const western=readings.filter(r=>r.system==='Western Astrology');
  const systems=new Set(readings.map(r=>r.system));
  const strongWestern=projectOverlap(western).filter(x=>x.methods.size>=3).slice(0,6);
  const people=data.people.map(person=>{const pr=fpProfile(person.id);if(!pr||!year)return'';const july=fourPillarSummary(person.id,`${year}-07`),d=july?.d,y=july?.y,shift=masterShiftForYear(person.id,year)||daiunShiftForYear(pr,person.id,year);const daiunText=shift?`${shift.from.ganzhi}｜${shift.from.tsuhensei}｜${shift.from.junishi_un} → ${shift.to.ganzhi}｜${shift.to.tsuhensei}｜${shift.to.junishi_un}`:(d?`${d.ganzhi}｜${d.tsuhensei}｜${d.junishi_un}`:'—');return `<div class="project-person"><span>${esc(person.name)}</span><strong>${esc(pr.dayMaster?.stem||'—')} ${esc(pr.dayMaster?.wuxing||'')}</strong><p>大運　${esc(daiunText)}</p>${shift?`<small class="project-shift">✦ ${esc(shiftLabel(shift))} 大運切替</small>`:''}${y?`<p>流年　${esc(y.ganzhi)}｜${esc(y.tsuhensei)}｜${esc(y.junishi_un)}</p>`:'<p>流年　—</p>'}</div>`}).join('');
  const monthBlocks=periods.map(period=>projectMonthHTML(period,readings.filter(r=>r.targetPeriod===period))).join('');
  const crossStatus=systems.size>=2?'CROSS-SYSTEM DATA':'WESTERN + FOUR PILLARS CYCLE';
  openModal(`<span class="kicker">LONG RANGE PROJECT</span><h2>${esc(p.title)}</h2><p class="lead">${esc(p.summary)}</p>${year?`<div class="project-year">${year}</div>`:''}<div class="project-compare">${people||'<p class="modal-copy">四柱推命BASEを登録すると、人物ごとの大運・流年をここで比較できます。</p>'}</div><div class="project-dashboard"><div><small>SAVED OBSERVATIONS</small><strong>${readings.length}</strong></div><div><small>OBSERVED MONTHS</small><strong>${periods.length}</strong></div><div><small>MODE</small><strong>${esc(crossStatus)}</strong></div></div>${strongWestern.length?`<div class="cross-signal"><span>✦ STRONG OVERLAP · WESTERN</span><p>${strongWestern.map(x=>x.theme).join(' / ')}</p><small>3種類以上の西洋占星術観測で共通キーワード系統が確認されています。これは「的中確率」ではなく、保存済みReadingの重なり度です。</small></div>`:''}${monthBlocks||'<div class="empty">この年のReadingはまだありません ✦</div>'}<div class="watch-card"><span>🛰 CROSS OBSERVATION</span><p>このPROJECTは、${year}年に保存した観測を月別に集め、同一体系内の重なりと、四柱推命など別体系との重なりを分けて検討する研究室です。新しい月を登録すると自動で増えます。</p></div><div class="ai-box project-ai"><div class="ai-head"><strong>ChatGPTに横断観測を依頼</strong><button type="button" class="copy-btn" data-copy-project="${esc(p.id)}">COPY</button></div><p>${readings.length?`${readings.length}件のReading＋${year}年の四柱推命サイクルを、時系列・共通テーマ・相違点ごとにまとめて相談できます。`:'Readingを保存すると相談用データが自動で集まります。'}</p></div><div class="form-actions"><button type="button" class="save-btn" data-close-modal>Close</button></div>`)
}



const ORBIT_CANONICAL_LABELS={SELF:'自己・方向性',EMOTION:'感情・安心',COMMUNICATION:'思考・対話',VALUES:'愛情・価値観',ACTION:'行動・欲求',EXPANSION:'拡大・可能性',RESPONSIBILITY:'現実化・責任',CHANGE:'変化・刷新',SENSITIVITY:'感受性・理想',TRANSFORMATION:'根本変容',LEARNING:'学び・内省',EXPRESSION:'表現・創造',CONNECTION:'結びつき・統合'};
const WESTERN_CANONICAL={Sun:'SELF',Moon:'EMOTION',Mercury:'COMMUNICATION',Venus:'VALUES',Mars:'ACTION',Jupiter:'EXPANSION',Saturn:'RESPONSIBILITY',Uranus:'CHANGE',Neptune:'SENSITIVITY',Pluto:'TRANSFORMATION'};
const FP_TENGOD_CANONICAL={'比肩':'SELF','劫財':'SELF','食神':'EXPRESSION','傷官':'EXPRESSION','偏財':'VALUES','正財':'VALUES','偏官':'RESPONSIBILITY','正官':'RESPONSIBILITY','偏印':'LEARNING','印綬':'LEARNING'};
const FP_STAGE_CANONICAL={'長生':'EXPANSION','沐浴':'CHANGE','冠帯':'SELF','建禄':'SELF','帝旺':'SELF','衰':'RESPONSIBILITY','病':'SENSITIVITY','死':'TRANSFORMATION','墓':'LEARNING','絶':'CHANGE','胎':'EXPANSION','養':'LEARNING'};
function addWeighted(map,key,w=1){if(key)map.set(key,(map.get(key)||0)+w)}
function topCanonical(map,n=3){return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([key,score])=>({key,label:ORBIT_CANONICAL_LABELS[key]||key,score}))}
function westernCanonicalForMonth(period){
  const m=westernMonth(period),score=new Map();if(!m)return {themes:[],source:null};
  const items=[...(m.progressions?.aspects_to_natal||[]),...(m.long_transits?.aspects_to_natal||[])];
  items.forEach(a=>{const w=a.strength==='strong'?3:1;[westernBodyKey(a.source),westernBodyKey(a.target)].forEach(k=>addWeighted(score,WESTERN_CANONICAL[k],w))});
  return {themes:topCanonical(score,4),source:m};
}
function collectRelationWords(obj,out=[]){
  if(obj==null)return out;if(typeof obj==='string'){if(/干合|支合|六合|三合|方合|半会|冲|沖|破|刑|害/.test(obj))out.push(obj);return out}
  if(Array.isArray(obj)){obj.forEach(x=>collectRelationWords(x,out));return out}
  if(typeof obj==='object')Object.values(obj).forEach(x=>collectRelationWords(x,out));return out;
}
function fourPillarsCanonicalForMonth(period){
  const rec=masterRecord('chiaki',period),score=new Map();if(!rec)return {themes:[],record:null,relations:[]};
  const tg=[rec.month_luck?.ten_god,rec.annual_luck?.ten_god,rec.major_luck?.ten_god];
  tg.forEach((x,i)=>addWeighted(score,FP_TENGOD_CANONICAL[x],i===0?3:i===1?2:1));
  const stages=[rec.month_luck?.twelve_stage,rec.annual_luck?.twelve_stage,rec.major_luck?.twelve_stage];
  stages.forEach((x,i)=>addWeighted(score,FP_STAGE_CANONICAL[x],i===0?2:1));
  const relations=[...new Set(collectRelationWords(rec.interactions||rec))];
  if(relations.some(x=>/冲|沖|破|刑|害/.test(x)))addWeighted(score,'CHANGE',3);
  if(relations.some(x=>/合|会/.test(x)))addWeighted(score,'CONNECTION',2);
  return {themes:topCanonical(score,4),record:rec,relations};
}
function orbitThisMonthModel(period){
  const w=westernCanonicalForMonth(period),fp=fourPillarsCanonicalForMonth(period),cross=masterCrossRecord(period);
  const wk=new Set(w.themes.map(x=>x.key)),fk=new Set(fp.themes.map(x=>x.key));
  const overlap=[...wk].filter(k=>fk.has(k)).map(k=>({key:k,label:ORBIT_CANONICAL_LABELS[k]}));
  const merged=new Map();w.themes.forEach((x,i)=>addWeighted(merged,x.key,4-i));fp.themes.forEach((x,i)=>addWeighted(merged,x.key,4-i));overlap.forEach(x=>addWeighted(merged,x.key,4));
  const top=topCanonical(merged,3);
  const lead=overlap.length?`${overlap.slice(0,2).map(x=>x.label).join('・')}が、四柱推命とWesternの両方で重なる観測テーマ。`:`${top.slice(0,2).map(x=>x.label).join('・')}を中心に、東西それぞれの観測テーマが並ぶ月。`;
  const summary=`${lead} ${top[2]?`${top[2].label}も含め、今月の動きを観察します。`:'今月の動きを観察します。'}`;
  const fpRec=fp.record,monthLuck=fpRec?.month_luck;
  const fpLine=monthLuck?`${monthLuck.ganzhi||'—'}｜${monthLuck.ten_god||'—'}｜${monthLuck.twelve_stage||'—'}`:'マスター読込待ち';
  const wLine=w.themes.length?w.themes.slice(0,3).map(x=>x.label).join(' / '):'マスター読込待ち';
  const crossTypes=cross?.shared_branch_relation_types||[];
  const crossLine=cross?`${crossTypes.length?crossTypes.join('・'):'共通支関係なし'}${cross.chiaki_major_transition||cross.naoya_major_transition?' / 大運切替あり':''}`:'CROSSデータ読込待ち';
  return {western:w,fourPillars:fp,cross,overlap,top,summary,fpLine,wLine,crossLine};
}
function renderThisMonthV2(){
  const host=$('#thisMonthV2');if(!host)return;const m=orbitThisMonthModel(data.month.period);
  const tags=(m.overlap.length?m.overlap:m.top.slice(0,3)).map(x=>`<span class="chip">${esc(x.label)}</span>`).join('');
  host.innerHTML=`<div class="tm-synthesis"><span>✦ ORBIT SYNTHESIS</span><p>${esc(m.summary)}</p><div class="chips">${tags}</div><small>計算済みマスターをルールベースで整理した観測要約です。</small></div><div class="tm-systems"><div class="tm-system"><small>FOUR PILLARS</small><strong>${esc(m.fpLine)}</strong><span>${esc(m.fourPillars.themes.slice(0,3).map(x=>x.label).join(' / ')||'—')}</span></div><div class="tm-system"><small>WESTERN</small><strong>${esc(m.wLine)}</strong><span>Progressions + Long Transits</span></div><div class="tm-system"><small>CROSS SIGNAL</small><strong>${esc(m.crossLine)}</strong><span>機械的トリガー。関係性の意味は自動付与しません。</span></div></div><div class="tm-overlap"><small>OVERLAP · EAST × WEST</small><div class="chips">${m.overlap.length?m.overlap.map(x=>`<span class="chip overlap-hit">${esc(x.label)}</span>`).join(''):'<span class="tm-none">今月は共通分類なし</span>'}</div></div>`;
}

function relationshipAspectHTML(x){
  const [a,aspect,b,orb,flag]=x,meta=WESTERN_ASPECTS[aspect]||{symbol:'·',ja:aspect};
  return `<div class="rb-aspect ${flag==='time'?'reference':''}"><span>${esc(a)}</span><b>${meta.symbol}</b><span>${esc(b)}</span><small>${esc(orb)}${flag==='time'?' · TIME DEP.':''}</small></div>`;
}
function renderRelationshipBase(){
  const host=$('#relationshipBase');if(!host)return;const r=RELATIONSHIP_BASE;
  host.innerHTML=`<button type="button" class="rb-open" data-relationship-base><div><span class="kicker">THE BOND · FIXED BASE</span><h2>${esc(r.title)}</h2><p>${esc(r.synthesis.headline)}</p><div class="chips">${r.synthesis.tags.slice(0,4).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><span class="rb-arrow">›</span></button>`;
}
function relationshipBasePrompt(){const r=RELATIONSHIP_BASE;return `ORBIT RELATIONSHIP BASEを再評価してください。\n\n【原則】\n希望的観測にも悲観にも寄せず、強い結合と安定性を混同しない。ツインレイ等を前提にしない。出生時刻不明側のASC/MC/ハウスは判定根拠から除外する。\n\n【Synastry】\n${r.synastry.filter(x=>x[4]!=='time').map(x=>`${x[0]} ${x[1]} ${x[2]} (${x[3]})`).join('\n')}\n\n【Composite・確認済み主要角】\n${r.compositeHighlights.map(x=>`${x[0]} ${x[1]} ${x[2]} (${x[3]})`).join('\n')}\n\n【四柱推命・固定CROSS】\n${r.fourPillars.signals.map(x=>`${x.type} ${x.label}: ${x.note}`).join('\n')}\n\n次の順で出力：①一行結論 ②強い結合 ③安定性 ④摩擦・リスク ⑤東西で重なるテーマ ⑥宿縁的と表現されやすい特徴の有無（断定禁止） ⑦総合所見。`;}
function viewRelationshipBase(){const r=RELATIONSHIP_BASE, saved=data.relationshipBase?.reading||'';openModal(`<span class="kicker">RELATIONSHIP BASE · FIXED</span><h2>${esc(r.title)}</h2><div class="rb-verdict"><strong>${esc(r.synthesis.headline)}</strong><p>${esc(r.synthesis.summary)}</p><small>${esc(r.synthesis.verdict)}</small></div><div class="rb-section"><span class="kicker">CORE THEMES</span><div class="chips">${r.synthesis.tags.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><div class="rb-section"><span class="kicker">WESTERN · SYNASTRY</span><p class="rb-note">36 aspects captured · 時刻依存のASC/MC接触はREFERENCE表示で総合判定から除外。</p><div class="rb-aspects">${r.synastry.map(relationshipAspectHTML).join('')}</div></div><div class="rb-section"><span class="kicker">WESTERN · COMPOSITE</span><p class="rb-note">今回確認できた主要角。固定Compositeの関係性テーマとして使用。</p><div class="rb-aspects">${r.compositeHighlights.map(relationshipAspectHTML).join('')}</div></div><div class="rb-section"><span class="kicker">FOUR PILLARS · NATAL CROSS</span><p class="rb-note">${esc(r.fourPillars.basis)}</p>${r.fourPillars.signals.map(x=>`<div class="rb-signal"><b>${esc(x.type)} · ${esc(x.label)}</b><p>${esc(x.note)}</p></div>`).join('')}</div><div class="ai-box"><div class="ai-head"><strong>忖度なし BASE READING</strong><button type="button" class="copy-btn" data-copy-base>COPY</button></div><p>固定データだけを使い、希望と現実を分けて再評価するためのプロンプト。</p></div><div class="rb-section"><span class="kicker">SAVED BASE READING</span><textarea id="rbReading" class="large-textarea" placeholder="ChatGPTで一度だけ総合解析した結果をここへ保存">${esc(saved)}</textarea></div><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Close</button><button type="button" class="save-btn" data-save-base>SAVE BASE</button></div>`);}

function renderHome(){
  $('#monthTitle').textContent=data.month.title;
  renderThisMonthV2();
  renderRelationshipBase();
  renderMonthlyChecks();
  renderWesternSnapshot();
  $('#cycleRows').innerHTML=cycleRowsHTML();
  const recent=[...data.readings].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,4);
  $('#recentReadings').innerHTML=recent.length?recent.map(readingItem).join(''):empty();
  const f=focus(); $('#focusName').textContent=f.name; $('#focusBirthTime').textContent=f.birthTimeStatus==='exact'?(f.birthTime||'—'):'UNKNOWN'; $('#focusHypothesis').textContent=f.birthTimeHypothesis||'—';
  const fr=data.readings.find(r=>r.personId===f.id); $('#focusTheme').textContent=fr?.tags?.[0]||'OBSERVING';
  const p=data.projects[0]; $('#featuredProject').innerHTML=p?`<button type="button" class="project-hero-hit" data-project="${esc(p.id)}" aria-label="${esc(p.title)}を開く"></button><span class="project-badge">✦ LONG RANGE</span><h2>${esc(p.title)} · ${esc(p.status)}</h2><p>${esc(p.summary)}</p><div class="chips">${p.systems.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>`:'';
  const timelineRows=derivedTimeline(); $('#timelinePreview').innerHTML=(timelineRows.length?timelineRows.slice(0,4).map(timelineItem).join(''):empty());
}

function renderMonthlyChecks(){
  if($('#guideMonthLabel')) $('#guideMonthLabel').textContent=data.month.title;
  const state=data.monthlyChecks[currentCheckKey()]||{};
  const saved=MONTHLY_GUIDE.filter(x=>(state[x.id]?.status||'unchecked')==='saved').length;
  const touched=MONTHLY_GUIDE.filter(x=>['checked','saved'].includes(state[x.id]?.status)).length;
  $('#monthlyProgress').textContent=`${saved} saved · ${touched}/${MONTHLY_GUIDE.length}`;
  $('#monthlyChecks').innerHTML=MONTHLY_GUIDE.map(g=>{
    const s=state[g.id]?.status||'unchecked';
    return `<button class="check-row ${statusClass(s)}" data-guide="${g.id}"><span class="check-dot">${statusIcon(s)}</span><span><strong>${esc(g.label)}</strong><small>${esc(g.source)} · ${statusLabel(s)}</small></span><span class="check-arrow">›</span></button>`;
  }).join('');
}

function viewGuide(id){
  const g=MONTHLY_GUIDE.find(x=>x.id===id); if(!g)return;
  const entry=checkEntry(id), prompt=aiPrompt(g);
  openModal(`<span class="kicker">MONTHLY CHECK · ${esc(data.month.title)}</span><div class="guide-modal-title"><div><h2>${esc(g.label)}</h2><p class="guide-source">${esc(g.source)}</p></div><span class="status-badge ${statusClass(entry.status)}">${statusLabel(entry.status)}</span></div>
    <label>WHY</label><p class="modal-copy">${esc(g.why)}</p>
    <label>HOW TO FIND</label><p class="modal-copy">${esc(g.how)}</p>
    <div class="capture-guide"><div><span>📷 WHAT TO CAPTURE</span><p>${esc(g.capture)}</p></div><div><span>− DON'T NEED</span><p>${esc(g.dontNeed)}</p></div></div>
    <div class="ai-box"><div class="ai-head"><strong>ChatGPTに相談するとき</strong><button type="button" class="copy-btn" data-copy-prompt="${g.id}">COPY</button></div><p>${esc(prompt).replace(/\n/g,'<br>')}</p></div>
    ${entry.readingId?`<button type="button" class="linked-reading" data-reading="${entry.readingId}">✦ 保存したReadingを開く</button>`:''}
    <div class="form-actions guide-actions"><button type="button" class="text-btn" data-close-modal>Close</button><button type="button" class="secondary-btn" data-mark-checked="${g.id}">${entry.status==='unchecked'?'MARK CHECKED':'CHECKED ✓'}</button><button type="button" class="save-btn" data-guide-reading="${g.id}">${entry.status==='saved'?'EDIT READING':'＋ SAVE READING'}</button></div>`);
}

function readingItem(r){return `<div class="list-item" data-reading="${r.id}"><div><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p></div><div class="list-meta"><small>${esc(r.method||r.system)}</small><span>›</span></div></div>`}
function monthSortKey(p){const m=/^(\d{4})-(\d{2})$/.exec(p||'');return m?Number(m[1])*100+Number(m[2]):999999}
function topReadingTags(period){const tags=data.readings.filter(r=>r.targetPeriod===period).flatMap(r=>r.tags||[]).map(x=>String(x).replace(/（.*?）|\(.*?\)/g,'').split(/[｜|]/)[0].trim().toUpperCase()).filter(Boolean),c={};tags.forEach(x=>c[x]=(c[x]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);}
function derivedTimeline(){
  const periods=new Set([...Object.keys(data.months||{}),...data.readings.map(r=>r.targetPeriod).filter(p=>/^\d{4}-\d{2}$/.test(p||''))]);
  const ownerProfile=fpProfile('chiaki');
  (ownerProfile?.daiun?.list||[]).slice(1).forEach(x=>{const at=daiunBounds('chiaki',x).start;if(at&&at.getFullYear()>=2026&&at.getFullYear()<=2035)periods.add(`${at.getFullYear()}-${String(at.getMonth()+1).padStart(2,'0')}`)});
  const out=[];
  [...periods].sort((a,b)=>monthSortKey(a)-monthSortKey(b)).forEach(period=>{
    const rs=data.readings.filter(r=>r.targetPeriod===period),month=data.months?.[period],fp=fourPillarSummary('chiaki',period),tags=topReadingTags(period);
    if(!rs.length && !month?.summary && !fp?.shift)return;
    const theme=(month?.theme&&month.theme!=='OBSERVING')?month.theme:(tags[0]||'OBSERVING');
    const summary=month?.summary||rs[0]?.summary||`${rs.length}件の観測を保存`;
    out.push({id:`month-${period}`,period:periodLabel(period),periodKey:period,title:theme,summary,kind:'month',saved:rs.length,shift:fp?.shift||null});
  });
  // Long-range projects are true hypothesis markers, not fake monthly predictions.
  (data.projects||[]).forEach(p=>out.push({id:`project-${p.id}`,period:String(p.targetPeriod||''),title:p.title,summary:p.summary,kind:'project',projectId:p.id,status:p.status}));
  return out.sort((a,b)=>{const ay=parseInt(a.period)||9999,by=parseInt(b.period)||9999;if(ay!==by)return ay-by;return (a.periodKey||'99').localeCompare(b.periodKey||'99')});
}
function timelineItem(t){return `<button type="button" class="timeline-item timeline-button ${t.shift?'timeline-shift':''}" ${t.kind==='month'?`data-timeline-month="${esc(t.periodKey)}"`:`data-project="${esc(t.projectId||'')}"`}><div class="timeline-period">${esc(t.period)}</div><div class="timeline-line"></div><div class="timeline-copy">${t.shift?'<span class="timeline-badge">✦ MAJOR SHIFT</span>':t.kind==='project'?'<span class="timeline-badge long">◎ LONG RANGE</span>':''}<strong>${esc(t.title)}</strong><p>${esc(t.summary)}</p>${t.saved?`<small>${t.saved} SAVED OBSERVATION${t.saved>1?'S':''}</small>`:''}${t.shift?`<small>大運 ${esc(t.shift.from.ganzhi)} → ${esc(t.shift.to.ganzhi)} · ${esc(shiftLabel(t.shift))}</small>`:''}</div></button>`}
function empty(){return $('#emptyTpl').innerHTML}
function renderPeople(){
  $('#peopleGrid').innerHTML=data.people.map(p=>`<article class="person-card" data-person="${p.id}"><div class="mini-planet"></div><h3>${esc(p.name)}</h3>${fpProfile(p.id)?'<span class="fp-badge">四柱 BASE ✓</span>':''}<p>${esc(p.birthDate||'Birth date unknown')}</p><p>${p.birthTimeStatus==='exact'?`Birth time ${esc(p.birthTime)}`:`Birth time UNKNOWN${p.birthTimeHypothesis?` · Hyp. ${esc(p.birthTimeHypothesis)}`:''}`}</p></article>`).join('')+`<article class="person-card" data-action="add-person"><div class="mini-planet" style="display:grid;place-items:center;font-size:36px">＋</div><h3>Add Person</h3><p>新しい観測対象を追加</p></article>`;
}
function renderReadings(){
  const pf=$('#readingPersonFilter'),sf=$('#readingSystemFilter'); const currentP=pf.value,currentS=sf.value;
  pf.innerHTML='<option value="">All people</option>'+data.people.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  const systems=[...new Set(data.readings.map(r=>r.system))]; sf.innerHTML='<option value="">All systems</option>'+systems.map(s=>`<option>${esc(s)}</option>`).join(''); if([...pf.options].some(o=>o.value===currentP))pf.value=currentP;if([...sf.options].some(o=>o.value===currentS))sf.value=currentS;
  const rows=data.readings.filter(r=>(!pf.value||r.personId===pf.value)&&(!sf.value||r.system===sf.value)); $('#readingsList').innerHTML=rows.length?rows.map(readingItem).join(''):empty();
}
function renderTimeline(){const rows=derivedTimeline();$('#timelineFull').innerHTML=rows.length?rows.map(timelineItem).join(''):empty()}
function renderProjects(){
  $('#projectsList').innerHTML=data.projects.length?data.projects.map(p=>`<article class="project-card" data-project="${p.id}"><span class="project-badge">✦ ${esc(p.status)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="chips">${(p.systems||[]).map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div><p>${esc(p.note||'')}</p></article>`).join(''):empty();
  const transfer=$('#dataTransferPanel');
  if(transfer)transfer.innerHTML=`<div class="transfer-head"><div><span class="kicker">DATA TRANSFER</span><h3>iPhone ↔ iPad</h3></div><span class="transfer-version">v${APP_VERSION}</span></div><p>ORBITのPeople・Readings・MONTHLY CHECK・Reality Log・Projectsなどを、1つのバックアップファイルで移動できます。</p><div class="transfer-actions"><button type="button" class="save-btn" data-action="export-data">⇧ EXPORT</button><button type="button" class="secondary-btn" data-action="import-data">⇩ IMPORT</button></div><small>EXPORTした <b>.orbit.json</b> をAirDrop / Filesなどで別端末へ渡し、IMPORTしてください。これはライブ同期ではなく「その時点のスナップショット」です。</small>`;
}
function renderAll(){renderHome();renderPeople();renderReadings();renderTimeline();renderProjects()}
function showView(name){$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.go===name));window.scrollTo({top:0,behavior:'smooth'})}
function openModal(html){
  const dialog=$('#modal'), card=$('#modalForm');
  $('#modalBody').innerHTML=html;
  // A dialog/form element keeps its previous scrollTop in iOS Safari.
  // Reset it every time so a newly opened card/project always starts at its header.
  if(card) card.scrollTop=0;
  if(dialog) dialog.scrollTop=0;
  if(!dialog.open) dialog.showModal();
  requestAnimationFrame(()=>{
    if(card) card.scrollTop=0;
    if(dialog) dialog.scrollTop=0;
  });
}
function personOptions(selected=''){return data.people.map(p=>`<option value="${p.id}" ${p.id===selected?'selected':''}>${esc(p.name)}</option>`).join('')}
function personForm(p=null){
  const isEdit=!!p, status=p?.birthTimeStatus||'unknown';
  return `<h2>${isEdit?'Edit Person':'New Person'}</h2>${isEdit?`<input type="hidden" name="personId" value="${esc(p.id)}">`:''}
  <label>Name</label><input name="name" required value="${esc(p?.name||'')}">
  <label>Birth date</label><input name="birthDate" type="date" value="${esc(p?.birthDate||'')}">
  <label>Birth time</label><input name="birthTime" type="time" value="${esc(p?.birthTime||'')}">
  <label>Status</label><select name="status"><option value="unknown" ${status==='unknown'?'selected':''}>Unknown</option><option value="estimated" ${status==='estimated'?'selected':''}>Estimated</option><option value="exact" ${status==='exact'?'selected':''}>Exact</option></select>
  <label>Birth time hypothesis</label><input name="hypothesis" type="time" value="${esc(p?.birthTimeHypothesis||'')}">
  <label>Birth place</label><input name="birthPlace" value="${esc(p?.birthPlace||'')}">
  <label>Memo</label><textarea name="memo">${esc(p?.memo||'')}</textarea>
  <div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="${isEdit?'person-edit':'person'}">${isEdit?'Update':'Save'}</button></div>`;
}
function addPerson(){openModal(personForm())}
function editPerson(id){const p=data.people.find(x=>x.id===id);if(p)openModal(personForm(p))}

function readingForm(r=null,guideId=''){
  const g=MONTHLY_GUIDE.find(x=>x.id===guideId);
  const isEdit=!!r;
  const selectedPerson=r?.personId||(g?guideDefaultPerson(g):focus().id);
  const target=r?.targetPeriod||(g?data.month.period:'');
  const system=r?.system||g?.system||'Western Astrology';
  const method=r?.method||g?.method||'';
  const title=r?.title||(g?`${data.month.title} · ${g.label}`:'');
  return `<span class="kicker">${g?'MONTHLY OBSERVATION':'READING'}</span><h2>${isEdit?'Edit Observation':'New Observation'}</h2>
  ${isEdit?`<input type="hidden" name="readingId" value="${esc(r.id)}">`:''}<input type="hidden" name="guideId" value="${esc(guideId||r?.guideId||'')}">
  <label>Person / Focus</label><select name="personId">${personOptions(selectedPerson)}</select>
  <label>Target period</label><input name="targetPeriod" value="${esc(target)}" placeholder="2026-09 / 2033">
  <label>System</label><select name="system">${['Western Astrology','四柱推命','算命学','九星気学','宿曜','数秘術','Other'].map(s=>`<option ${s===system?'selected':''}>${s}</option>`).join('')}</select>
  <label>Method</label><input name="method" value="${esc(method)}" placeholder="PCC / Composite / 大運 / 年運 ...">
  <label>Title</label><input name="title" value="${esc(title)}">
  <label>① 一行結論 <small>30〜50字</small></label><input name="summary" value="${esc(r?.summary||'')}" placeholder="HOMEや一覧で思い出せる短い結論">
  <label>② 要約 <small>100〜150字</small></label><textarea name="brief" placeholder="ChatGPTの短い要約を貼る">${esc(r?.brief||'')}</textarea>
  <label>③ ${system==='四柱推命'?'主要ポイント / 命式・運気':'主要ポイント / アスペクト'}</label><textarea name="aspects" placeholder="1行に1つ">${esc((r?.aspects||[]).join('\n'))}</textarea>
  <label>④ 詳細解釈 <small>300〜500字</small></label><textarea name="interpretation" class="large-textarea" placeholder="ChatGPTの詳しい解釈を貼る">${esc(r?.interpretation||'')}</textarea>
  <label>⑤ キーワード <small>英語＋日本語 / カンマ区切り</small></label><input name="tags" value="${esc((r?.tags||[]).join(', '))}" placeholder="REBUILDING（再構築）, COMMUNICATION（対話）">
  <label>⑥ 今月の観察ポイント <small>100〜200字</small></label><textarea name="observationPoint" placeholder="現実で何を見ていく？">${esc(r?.observationPoint||'')}</textarea>
  ${g?`<button type="button" class="prompt-strip" data-copy-prompt="${g.id}">✦ ChatGPT相談用プロンプトをコピー</button>`:''}
  <div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="${isEdit?'reading-edit':'reading'}">${isEdit?'Update':'SAVE READING'}</button></div>`;
}
function addReading(guideId=''){openModal(readingForm(null,guideId))}
function editReading(id){const r=data.readings.find(x=>x.id===id);if(r)openModal(readingForm(r,r.guideId||''))}
function addTimeline(){openModal(`<h2>Timeline Entry</h2><label>Period</label><input name="period" placeholder="2026 NOV"><label>Theme</label><input name="title"><label>Summary</label><textarea name="summary"></textarea><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="timeline">Save</button></div>`)}
function addProject(){openModal(`<h2>Long-term Project</h2><label>Title</label><input name="title"><label>Person</label><select name="personId">${personOptions()}</select><label>Target period</label><input name="targetPeriod" placeholder="2033"><label>Status</label><input name="status" value="OBSERVING"><label>Systems</label><input name="systems" placeholder="Western Astrology, 四柱推命"><label>Summary</label><textarea name="summary"></textarea><label>Note</label><input name="note"><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="project">Save</button></div>`)}
function editMonth(){openModal(`<h2>This Month</h2><label>Title</label><input name="title" value="${esc(data.month.title)}"><label>Theme</label><input name="theme" value="${esc(data.month.theme||'REBUILDING')}"><label>Focus</label><input name="focus" value="${esc(data.month.focus||'RELATIONSHIP')}"><label>Detail (secondary)</label><input name="summary" value="${esc(data.month.summary)}"><label>Overlap tags</label><input name="overlap" value="${esc(data.month.overlap.join(', '))}"><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="month">Save</button></div>`)}
function viewReading(id){const r=data.readings.find(x=>x.id===id);if(!r)return;const p=data.people.find(x=>x.id===r.personId);const reality=(data.realityLogs||[]).filter(x=>(x.relatedReadingIds||[]).includes(r.id));openModal(`<div class="reading-meta"><span>${esc(r.system)}</span><span>${esc(r.method)}</span><span>${esc(r.targetPeriod)}</span><span>${esc(personName(r.personId))}</span>${p?.birthTimeStatus!=='exact'&&p?.birthTimeHypothesis?`<span>Hyp. ${esc(p.birthTimeHypothesis)}</span>`:''}</div><h2>${esc(r.title)}</h2><p class="lead">${esc(r.summary)}</p><div class="chips">${(r.tags||[]).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div>${r.brief?`<label>② 要約</label><p class="modal-copy">${esc(r.brief)}</p>`:''}<label>③ ${r.system==='四柱推命'?'主要ポイント / 命式・運気':'主要ポイント / アスペクト'}</label><div class="aspect-stack">${(r.aspects||[]).length?(r.aspects||[]).map((a,i)=>aspectCardHTML(a,i)).join(''):'<div class="aspect-card">—</div>'}</div><label>④ 詳細解釈</label><p class="modal-copy">${esc(r.interpretation||'')}</p>${r.observationPoint?`<div class="watch-card"><span>🔭 WHAT TO WATCH</span><p>${esc(r.observationPoint)}</p></div>`:''}<div class="reality-card"><div><span class="kicker">REALITY CHECK</span><strong>${reality.length?`${reality.length}件の現実ログ`:'まだ記録されていません'}</strong></div><button type="button" class="secondary-btn" data-add-reality="${r.id}">＋ ADD</button></div>${reality.map(x=>`<div class="reality-item"><small>${esc(x.date)}</small><strong>${esc(x.title)}</strong><p>${esc(x.description)}</p></div>`).join('')}<div class="form-actions split-actions"><button type="button" class="danger-btn" data-delete-reading="${r.id}">Delete</button><button type="button" class="secondary-btn" data-edit-reading="${r.id}">Edit</button><button type="button" class="save-btn" data-close-modal>Close</button></div>`)}
function viewPerson(id){const p=data.people.find(x=>x.id===id);if(!p)return;openModal(`<span class="kicker">PERSON</span><h2>${esc(p.name)}</h2><p>${esc(p.birthDate||'')}</p><p>Birth time: ${p.birthTimeStatus==='exact'?esc(p.birthTime):'UNKNOWN'}</p><p>Hypothesis: ${esc(p.birthTimeHypothesis||'—')}</p><p>Birth place: ${esc(p.birthPlace||'—')}</p>${p.memo?`<p class="person-memo">${esc(p.memo)}</p>`:''}<div class="person-tools"><button type="button" class="secondary-btn" data-fp-view="${p.id}">☯ FOUR PILLARS</button><button type="button" class="secondary-btn" data-fp-import="${p.id}">⇩ IMPORT JSON</button></div><div class="form-actions split-actions"><button type="button" class="text-btn" data-edit-person="${p.id}">Edit</button><button type="button" class="save-btn" data-focus="${p.id}">Set as Focus</button></div>`)}

function periodToDate(period){const m=/^(\d{4})-(\d{2})$/.exec(period||'');return m?new Date(Number(m[1]),Number(m[2])-1,1):new Date()}
function periodLabel(period){const d=periodToDate(period);return `${d.getFullYear()} ${d.toLocaleString('en',{month:'short'}).toUpperCase()}`}
function ensureMonth(period){data.months=data.months||{};if(!data.months[period])data.months[period]={period,title:periodLabel(period),summary:'',theme:'OBSERVING',focus:'',systems:JSON.parse(JSON.stringify(defaultData.month.systems)),overlap:[]};data.month=data.months[period]}
function shiftMonth(delta){const d=periodToDate(data.month.period);d.setMonth(d.getMonth()+delta);ensureMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);save()}
function chooseMonth(){openModal(`<h2>観測する月</h2><label>Month</label><input name="monthPick" type="month" value="${esc(data.month.period)}"><p class="modal-copy">来月でも、未来の気になる月でもOK。MONTHLY CHECKは月ごとに独立して保存されます。</p><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="choose-month">OPEN MONTH</button></div>`)}
function addReality(readingId){const r=data.readings.find(x=>x.id===readingId);if(!r)return;openModal(`<span class="kicker">REALITY CHECK</span><h2>${esc(r.title)}</h2><input type="hidden" name="readingId" value="${esc(r.id)}"><label>Date</label><input name="date" type="date" value="${todayISO()}"><label>Title</label><input name="title" placeholder="再会・連絡・話し合い…"><label>What happened?</label><textarea name="description" placeholder="実際に起きたことを記録"></textarea><label>Tags</label><input name="tags" placeholder="MEETING, RECONCILIATION"><div class="form-actions"><button type="button" class="text-btn" data-close-modal>Cancel</button><button type="button" class="save-btn" data-save="reality">SAVE REALITY</button></div>`)}


function exportFileName(){
  const d=new Date();
  const pad=n=>String(n).padStart(2,'0');
  return `ORBIT_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.orbit.json`;
}
function exportPayload(){
  return {app:'ORBIT',version:APP_VERSION,exportedAt:new Date().toISOString(),storageKey:KEY,data:JSON.parse(JSON.stringify(data))};
}
async function exportData(){
  // Make sure the latest in-memory data is also persisted before exporting.
  localStorage.setItem(KEY,JSON.stringify(data));
  const json=JSON.stringify(exportPayload(),null,2);
  const file=new File([json],exportFileName(),{type:'application/json'});
  try{
    if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({title:'ORBIT backup',text:'ORBITのバックアップデータ',files:[file]});
      toast('ORBITデータを書き出しました ✦');
      return;
    }
  }catch(err){
    if(err?.name==='AbortError')return;
  }
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  toast('バックアップを保存しました ✦');
}
function openImportPicker(){
  const input=$('#orbitImportFile');
  if(input){input.value='';input.click()}
}
function looksLikeOrbitData(x){return !!(x&&typeof x==='object'&&Array.isArray(x.people)&&Array.isArray(x.readings))}
async function importDataFile(file){
  if(!file)return;
  let parsed;
  try{parsed=JSON.parse(await file.text())}catch{return toast('JSONファイルを読み込めませんでした')}
  const incoming=parsed?.app==='ORBIT'&&parsed?.data?parsed.data:parsed;
  if(!looksLikeOrbitData(incoming))return toast('ORBITデータとして認識できませんでした');
  const label=parsed?.exportedAt?new Date(parsed.exportedAt).toLocaleString('ja-JP'):'日時不明';
  if(!confirm(`この端末のORBITデータを、選択したバックアップで置き換えます。\n\nバックアップ日時：${label}\n\n現在のデータは復元用に端末内へ1世代だけ退避します。続けますか？`))return;
  try{
    localStorage.setItem(IMPORT_ROLLBACK_KEY,JSON.stringify({savedAt:new Date().toISOString(),data}));
    data=migrate(JSON.parse(JSON.stringify(incoming)));
    localStorage.setItem(KEY,JSON.stringify(data));
    renderAll();
    showView('home');
    toast('IMPORT完了 ✦ ORBITを更新しました');
  }catch{toast('IMPORTに失敗しました')}
}
function restoreImportRollback(){
  try{
    const raw=JSON.parse(localStorage.getItem(IMPORT_ROLLBACK_KEY)||'null');
    if(!raw?.data)return toast('復元できる直前データがありません');
    if(!confirm('最後のIMPORT直前のデータへ戻しますか？'))return;
    data=migrate(raw.data);localStorage.setItem(KEY,JSON.stringify(data));renderAll();showView('home');toast('IMPORT前の状態へ戻しました ✦');
  }catch{toast('復元に失敗しました')}
}

async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true}catch{
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;
  }
}
function toast(message){let t=$('#orbitToast');if(!t){t=document.createElement('div');t.id='orbitToast';t.className='toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1800)}
function setCheck(id,status,readingId=''){
  const key=currentCheckKey();data.monthlyChecks[key]=data.monthlyChecks[key]||{};data.monthlyChecks[key][id]={status,readingId:readingId||data.monthlyChecks[key][id]?.readingId||''};
}
function markGuideSaved(guideId,readingId){if(guideId)setCheck(guideId,'saved',readingId)}

function saveReadingFromForm(fd,existing=null){
  const record=existing||{id:'r'+Date.now(),createdAt:todayISO()};
  record.personId=fd.get('personId');record.targetPeriod=fd.get('targetPeriod');record.system=fd.get('system');record.method=fd.get('method');record.title=fd.get('title')||'Untitled observation';record.summary=fd.get('summary');record.brief=fd.get('brief');record.aspects=String(fd.get('aspects')||'').split('\n').map(s=>s.trim()).filter(Boolean);record.interpretation=fd.get('interpretation');record.observationPoint=fd.get('observationPoint');record.tags=String(fd.get('tags')||'').split(',').map(s=>s.trim()).filter(Boolean);record.guideId=fd.get('guideId')||record.guideId||'';
  if(!existing)data.readings.unshift(record);
  markGuideSaved(record.guideId,record.id);
  return record;
}

document.addEventListener('click',async e=>{
  const go=e.target.closest('[data-go]'); if(go){showView(go.dataset.go);return}
  if(e.target.closest('[data-relationship-base]')){viewRelationshipBase();return}
  if(e.target.closest('[data-copy-base]')){const ok=await copyText(relationshipBasePrompt());toast(ok?'BASEプロンプトをコピーしました ✦':'コピーできませんでした');return}
  if(e.target.closest('[data-save-base]')){data.relationshipBase=data.relationshipBase||{};data.relationshipBase.reading=$('#rbReading')?.value||'';data.relationshipBase.updatedAt=new Date().toISOString();save();$('#modal').close();toast('RELATIONSHIP BASEを保存しました ✦');return}
  const a=e.target.closest('[data-action]'); if(a){({"add-person":addPerson,"add-reading":()=>addReading(),"add-timeline":addTimeline,"add-project":addProject,"edit-month":editMonth,"choose-month":chooseMonth,"export-data":exportData,"import-data":openImportPicker,"restore-import":restoreImportRollback}[a.dataset.action]||(()=>{}))();return}
  const shift=e.target.closest('[data-month-shift]');if(shift){shiftMonth(Number(shift.dataset.monthShift));return}
  const ar=e.target.closest('[data-add-reality]');if(ar){addReality(ar.dataset.addReality);return}
  const guide=e.target.closest('[data-guide]');if(guide){viewGuide(guide.dataset.guide);return}
  const mark=e.target.closest('[data-mark-checked]');if(mark){const id=mark.dataset.markChecked;const current=checkEntry(id);setCheck(id,current.status==='unchecked'?'checked':'unchecked');save();viewGuide(id);return}
  const guideReading=e.target.closest('[data-guide-reading]');if(guideReading){const id=guideReading.dataset.guideReading;const entry=checkEntry(id);if(entry.readingId){$('#modal').close();editReading(entry.readingId)}else{setCheck(id,'checked');save();$('#modal').close();addReading(id)}return}
  const copy=e.target.closest('[data-copy-prompt]');if(copy){const g=MONTHLY_GUIDE.find(x=>x.id===copy.dataset.copyPrompt);if(g){const ok=await copyText(aiPrompt(g));toast(ok?'プロンプトをコピーしました ✦':'コピーできませんでした')}return}
  const cp=e.target.closest('[data-copy-project]');if(cp){const p=data.projects.find(x=>x.id===cp.dataset.copyProject);const year=Number(String(p?.targetPeriod||'').match(/\d{4}/)?.[0]);if(p&&year){const ok=await copyText(projectCrossPrompt(p,year,projectReadings(p,year)));toast(ok?'CROSS OBSERVATIONプロンプトをコピーしました ✦':'コピーできませんでした')}return}
  const rr=e.target.closest('[data-reading]');if(rr){viewReading(rr.dataset.reading);return}
  const pp=e.target.closest('[data-person]');if(pp){viewPerson(pp.dataset.person);return}
  const close=e.target.closest('[data-close-modal]');if(close){$('#modal').close();return}
  const edit=e.target.closest('[data-edit-person]');if(edit){editPerson(edit.dataset.editPerson);return}
  const er=e.target.closest('[data-edit-reading]');if(er){editReading(er.dataset.editReading);return}
  const fpv=e.target.closest('[data-fp-view],[data-fp-cycle]');if(fpv){viewFourPillars(fpv.dataset.fpView||fpv.dataset.fpCycle);return}
  const fpi=e.target.closest('[data-fp-import]');if(fpi){window.__orbitFpImportPerson=fpi.dataset.fpImport;const input=$('#sizhuImportFile');if(input){input.value='';input.click()}return}
  const fpm=e.target.closest('[data-fp-month]');if(fpm){editFourPillarMonth(fpm.dataset.fpMonth);return}
  const tm=e.target.closest('[data-timeline-month]');if(tm){ensureMonth(tm.dataset.timelineMonth);save();showView('home');return}
  const proj=e.target.closest('[data-project]');if(proj){viewProject(proj.dataset.project);return}
  const saveBtn=e.target.closest('[data-save]');if(saveBtn){const f=$('#modalForm'),fd=new FormData(f),kind=saveBtn.dataset.save;
    if(kind==='person'){const name=(fd.get('name')||'').trim();if(!name)return;data.people.push({id:'p'+Date.now(),name,birthDate:fd.get('birthDate'),birthTime:fd.get('birthTime'),birthTimeStatus:fd.get('status'),birthTimeHypothesis:fd.get('hypothesis'),birthPlace:fd.get('birthPlace'),memo:fd.get('memo')})}
    if(kind==='person-edit'){const p=data.people.find(x=>x.id===fd.get('personId'));const name=(fd.get('name')||'').trim();if(!p||!name)return;p.name=name;p.birthDate=fd.get('birthDate');p.birthTime=fd.get('birthTime');p.birthTimeStatus=fd.get('status');p.birthTimeHypothesis=fd.get('hypothesis');p.birthPlace=fd.get('birthPlace');p.memo=fd.get('memo')}
    if(kind==='reading')saveReadingFromForm(fd);
    if(kind==='reading-edit'){const r=data.readings.find(x=>x.id===fd.get('readingId'));if(r)saveReadingFromForm(fd,r)}
    if(kind==='timeline'){data.timeline.push({id:'t'+Date.now(),period:fd.get('period'),title:fd.get('title'),summary:fd.get('summary')})}
    if(kind==='project'){data.projects.push({id:'p'+Date.now(),title:fd.get('title'),personId:fd.get('personId'),targetPeriod:fd.get('targetPeriod'),status:fd.get('status'),systems:String(fd.get('systems')||'').split(',').map(s=>s.trim()).filter(Boolean),summary:fd.get('summary'),note:fd.get('note')})}
    if(kind==='month'){data.month.title=fd.get('title');data.month.theme=fd.get('theme');data.month.focus=fd.get('focus');data.month.summary=fd.get('summary');data.month.overlap=String(fd.get('overlap')||'').split(',').map(s=>s.trim()).filter(Boolean);data.months[data.month.period]=JSON.parse(JSON.stringify(data.month))}
    if(kind==='choose-month'){const period=fd.get('monthPick');if(period)ensureMonth(period)}
    if(kind==='fp-month'){const pid=fd.get('personId');data.fourPillars.monthly[pid]=data.fourPillars.monthly[pid]||{};data.fourPillars.monthly[pid][data.month.period]={ganzhi:fd.get('ganzhi'),tsuhensei:fd.get('tsuhensei'),branchTsuhensei:fd.get('branchTsuhensei'),junishi_un:fd.get('junishi_un'),range:fd.get('range'),note:fd.get('note'),source:'manual'}}
    if(kind==='reality'){const rid=fd.get('readingId');data.realityLogs=data.realityLogs||[];data.realityLogs.unshift({id:'e'+Date.now(),personId:data.readings.find(r=>r.id===rid)?.personId||focus().id,date:fd.get('date'),title:fd.get('title')||'Reality Log',description:fd.get('description'),tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),relatedReadingIds:[rid]})}
    save();$('#modal').close();toast(kind.startsWith('reading')?'Readingを保存しました ✦':'保存しました ✦');return}
  const del=e.target.closest('[data-delete-reading]');if(del){const id=del.dataset.deleteReading;data.readings=data.readings.filter(r=>r.id!==id);Object.values(data.monthlyChecks||{}).forEach(row=>Object.values(row||{}).forEach(x=>{if(x?.readingId===id){x.status='checked';x.readingId=''}}));save();$('#modal').close();return}
  const foc=e.target.closest('[data-focus]');if(foc){data.settings.focusPersonId=foc.dataset.focus;save();$('#modal').close();showView('home');return}
});

document.addEventListener('click',e=>{if(e.target.closest('[data-western-detail]'))viewWesternDetail()});

$('#sizhuImportFile')?.addEventListener('change',async e=>{const file=e.target.files?.[0],pid=window.__orbitFpImportPerson;if(!file||!pid)return;try{const raw=JSON.parse(await file.text());if(!(raw?.four_pillars&&raw?.day_master) && !raw?.sizhu_bazi?.dingqi)throw new Error('bad');data.fourPillars.profiles[pid]=normalizeSizhu(raw,pid);save();$('#modal').close();toast(`${personName(pid)}の四柱推命BASEを登録しました ✦`);setTimeout(()=>viewFourPillars(pid),80)}catch{toast('四柱推命JSONとして読み込めませんでした')}});
$('#orbitImportFile')?.addEventListener('change',e=>importDataFile(e.target.files?.[0]));
$('#readingPersonFilter').addEventListener('change',renderReadings);$('#readingSystemFilter').addEventListener('change',renderReadings);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
renderAll();
loadFourPillarsMaster();
loadWesternMaster();
// v0.16 — turn the existing HOME synthesis into a quiet monthly cover.
// All astrology words are reused from the app's current rendered data.
function applyOrbitCover(){
 const card=document.querySelector('#monthSynthesis,.month-synthesis,.synthesis-card');
 if(!card||card.dataset.coverApplied==='1')return;
 const raw=(card.innerText||'').trim(); if(!raw)return;
 const pills=[...card.querySelectorAll('.pill,.tag,.chip,.badge')].map(x=>(x.textContent||'').trim()).filter(Boolean);
 const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean).filter(x=>!/ORBIT SYNTHESIS|計算済み|ルールベース|観測要約/i.test(x));
 const theme=pills[0]||lines.find(x=>x.length<=22)||lines[0]||'今月の軌道';
 const tags=[...new Set(pills)].slice(0,4);
 const cover=document.createElement('section'); cover.className='orbit-cover-message';
 cover.innerHTML=`<div class="orbit-cover-kicker">MESSAGE FROM THE ORBIT</div>
 <h2 class="orbit-cover-title">${theme}</h2>
 <div class="orbit-cover-subtitle">Observe the pattern · Follow the timing</div>
 ${tags.length?`<div class="orbit-cover-tags">${tags.map(t=>`<span class="pill">${t}</span>`).join('')}</div>`:''}`;
 const details=document.createElement('details'); details.className='orbit-synthesis-details';
 details.innerHTML='<summary>ORBIT SYNTHESIS</summary>';
 const original=document.createElement('div'); original.className='orbit-synthesis-original';
 while(card.firstChild)original.appendChild(card.firstChild);
 details.appendChild(original); card.appendChild(cover); card.appendChild(details); card.dataset.coverApplied='1';
}
const coverObserver=new MutationObserver(applyOrbitCover);
document.addEventListener('DOMContentLoaded',()=>{applyOrbitCover();coverObserver.observe(document.body,{childList:true,subtree:true})});
