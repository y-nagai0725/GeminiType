// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --------------------------------------------------
// 登録したい初期データをここで定義
// --------------------------------------------------
const seedData = [
  {
    genreName: "Web用語",
    problems: [
      { text: "HTML", hiragana: "HTML" },
      { text: "CSS", hiragana: "CSS" },
      { text: "JavaScript", hiragana: "JavaScript" },
      { text: "フロントエンド", hiragana: "ふろんとえんど" },
      { text: "バックエンド", hiragana: "ばっくえんど" },
      { text: "データベース", hiragana: "でーたべーす" },
      { text: "サーバー", hiragana: "さーばー" },
      { text: "クライアント", hiragana: "くらいあんと" },
      { text: "ブラウザ", hiragana: "ぶらうざ" },
      { text: "レスポンシブデザイン", hiragana: "れすぽんしぶでざいん" },
      { text: "ユーザーインターフェース", hiragana: "ゆーざーいんたーふぇーす" },
      { text: "アクセシビリティ", hiragana: "あくせしびりてぃ" },
      { text: "ドメイン", hiragana: "どめいん" },
      { text: "ホスティング", hiragana: "ほすてぃんぐ" },
      { text: "デプロイ", hiragana: "でぷろい" },
      { text: "フレームワーク", hiragana: "ふれーむわーく" },
      { text: "ライブラリ", hiragana: "らいぶらり" },
      { text: "API", hiragana: "API" },
      { text: "JSON", hiragana: "JSON" },
      { text: "非同期処理", hiragana: "ひどうきしょり" },
      { text: "セッション", hiragana: "せっしょん" },
      { text: "クッキー", hiragana: "くっきー" },
      { text: "キャッシュ", hiragana: "きゃっしゅ" },
      { text: "ルーティング", hiragana: "るーてぃんぐ" },
      { text: "パフォーマンス", hiragana: "ぱふぉーまんす" },
      { text: "リファクタリング", hiragana: "りふぁくたりんぐ" },
      { text: "オープンソース", hiragana: "おーぷんそーす" },
      { text: "ローカル環境", hiragana: "ろーかるかんきょう" },
      { text: "本番環境", hiragana: "ほんばんかんきょう" },
      { text: "ポートフォリオ", hiragana: "ぽーとふぉりお" }
    ]
  },
  {
    genreName: "北海道の地名",
    problems: [
      { text: "札幌", hiragana: "さっぽろ" },
      { text: "大通公園", hiragana: "おおどおりこうえん" },
      { text: "定山渓温泉", hiragana: "じょうざんけいおんせん" },
      { text: "函館", hiragana: "はこだて" },
      { text: "小樽", hiragana: "おたる" },
      { text: "旭川", hiragana: "あさひかわ" },
      { text: "釧路", hiragana: "くしろ" },
      { text: "帯広", hiragana: "おびひろ" },
      { text: "稚内", hiragana: "わっかない" },
      { text: "富良野", hiragana: "ふらの" },
      { text: "登別", hiragana: "のぼりべつ" },
      { text: "苫小牧", hiragana: "とまこまい" },
      { text: "千歳", hiragana: "ちとせ" },
      { text: "網走", hiragana: "あばしり" },
      { text: "夕張", hiragana: "ゆうばり" },
      { text: "倶知安", hiragana: "くっちゃん" },
      { text: "長万部", hiragana: "おしゃまんべ" },
      { text: "弟子屈", hiragana: "てしかが" },
      { text: "音威子府", hiragana: "おといねっぷ" },
      { text: "占冠", hiragana: "しむかっぷ" },
      { text: "厚岸", hiragana: "あっけし" },
      { text: "美瑛", hiragana: "びえい" },
      { text: "積丹", hiragana: "しゃこたん" },
      { text: "洞爺湖", hiragana: "とうやこ" },
      { text: "ニセコ", hiragana: "にせこ" },
      { text: "標茶", hiragana: "しべちゃ" },
      { text: "留辺蘂", hiragana: "るべしべ" },
      { text: "妹背牛", hiragana: "もせうし" },
      { text: "興部", hiragana: "おこっぺ" },
      { text: "納沙布岬", hiragana: "のさっぷみさき" }
    ]
  },
  {
    genreName: "英文（大文字・記号含む）",
    problems: [
      { text: "Hello, world!", hiragana: "Hello, world!" },
      { text: "I am a student.", hiragana: "I am a student." },
      { text: "Good morning!", hiragana: "Good morning!" },
      { text: "How are you?", hiragana: "How are you?" },
      { text: "Thank you very much.", hiragana: "Thank you very much." },
      { text: "See you tomorrow.", hiragana: "See you tomorrow." },
      { text: "Nice to meet you.", hiragana: "Nice to meet you." },
      { text: "What time is it?", hiragana: "What time is it?" },
      { text: "I love programming.", hiragana: "I love programming." },
      { text: "Let's go home.", hiragana: "Let's go home." },
      { text: "This is an apple.", hiragana: "This is an apple." },
      { text: "Do your best!", hiragana: "Do your best!" },
      { text: "I have a dream.", hiragana: "I have a dream." },
      { text: "Never give up!", hiragana: "Never give up!" },
      { text: "Step by step.", hiragana: "Step by step." },
      { text: "Have a nice day!", hiragana: "Have a nice day!" },
      { text: "Where are you from?", hiragana: "Where are you from?" },
      { text: "I like playing tennis.", hiragana: "I like playing tennis." },
      { text: "He is my brother.", hiragana: "He is my brother." },
      { text: "She is very kind.", hiragana: "She is very kind." },
      { text: "Are you hungry?", hiragana: "Are you hungry?" },
      { text: "Take it easy.", hiragana: "Take it easy." },
      { text: "I can do it!", hiragana: "I can do it!" },
      { text: "What a beautiful day!", hiragana: "What a beautiful day!" },
      { text: "Welcome to Japan.", hiragana: "Welcome to Japan." },
      { text: "Keep on smiling.", hiragana: "Keep on smiling." },
      { text: "Time is money.", hiragana: "Time is money." },
      { text: "Believe in yourself.", hiragana: "Believe in yourself." },
      { text: "Enjoy your life.", hiragana: "Enjoy your life." },
      { text: "You are the best!", hiragana: "You are the best!" }
    ]
  },
  {
    genreName: "プログラミング",
    problems: [
      { text: "console.log();", hiragana: "console.log();" },
      { text: "function init() {", hiragana: "function init() {" },
      { text: "const maxCount = 10;", hiragana: "const maxCount = 10;" },
      { text: "let index = 0;", hiragana: "let index = 0;" },
      { text: "if (isTrue) {", hiragana: "if (isTrue) {" },
      { text: "return false;", hiragana: "return false;" },
      { text: "for (let i=0; i<5; i++)", hiragana: "for (let i=0; i<5; i++)" },
      { text: "while (true) {", hiragana: "while (true) {" },
      { text: "import Vue from 'vue';", hiragana: "import Vue from 'vue';" },
      { text: "export default {", hiragana: "export default {" },
      { text: "document.getElementById", hiragana: "document.getElementById" },
      { text: "window.addEventListener", hiragana: "window.addEventListener" },
      { text: "setTimeout(fn, 1000);", hiragana: "setTimeout(fn, 1000);" },
      { text: "Promise.resolve();", hiragana: "Promise.resolve();" },
      { text: "async function fetch()", hiragana: "async function fetch()" },
      { text: "await api.get('/data');", hiragana: "await api.get('/data');" },
      { text: "class User {", hiragana: "class User {" },
      { text: "constructor() {", hiragana: "constructor() {" },
      { text: "this.name = name;", hiragana: "this.name = name;" },
      { text: "Array.isArray(data);", hiragana: "Array.isArray(data);" },
      { text: "Object.keys(obj);", hiragana: "Object.keys(obj);" },
      { text: "JSON.stringify(data);", hiragana: "JSON.stringify(data);" },
      { text: "Math.random();", hiragana: "Math.random();" },
      { text: "npm install express", hiragana: "npm install express" },
      { text: "git commit -m \"fix\"", hiragana: "git commit -m \"fix\"" },
      { text: "docker-compose up -d", hiragana: "docker-compose up -d" },
      { text: "SELECT * FROM users;", hiragana: "SELECT * FROM users;" },
      { text: "UPDATE users SET name", hiragana: "UPDATE users SET name" },
      { text: "npm run dev", hiragana: "npm run dev" },
      { text: "git push origin main", hiragana: "git push origin main" }
    ]
  },
  {
    genreName: "ビジネスメール",
    problems: [
      { text: "いつもお世話になっております", hiragana: "いつもおせわになっております" },
      { text: "よろしくお願いいたします", hiragana: "よろしくおねがいいたします" },
      { text: "お疲れ様です", hiragana: "おつかれさまです" },
      { text: "ご確認をお願いいたします", hiragana: "ごかくにんをおねがいいたします" },
      { text: "ご返信お待ちしております", hiragana: "ごへんしんおまちしております" },
      { text: "承知いたしました", hiragana: "しょうちいたしました" },
      { text: "取り急ぎお礼まで", hiragana: "とりいそぎおれいまで" },
      { text: "お手数をおかけします", hiragana: "おてすうをおかけします" },
      { text: "申し訳ございません", hiragana: "もうしわけございません" },
      { text: "ありがとうございます", hiragana: "ありがとうございます" },
      { text: "引き続きよろしくお願いいたします", hiragana: "ひきつづきよろしくおねがいいたします" },
      { text: "ご査収のほどお願いいたします", hiragana: "ごさしゅうのほどおねがいいたします" },
      { text: "添付ファイルをご確認ください", hiragana: "てんぷふぁいるをごかくにんください" },
      { text: "ご対応ありがとうございます", hiragana: "ごたいおうありがとうございます" },
      { text: "何卒よろしくお願いいたします", hiragana: "なにとぞよろしくおねがいいたします" },
      { text: "ご教示いただけますでしょうか", hiragana: "ごきょうじいただけますでしょうか" },
      { text: "拝読いたしました", hiragana: "はいどくいたしました" },
      { text: "恐れ入りますが", hiragana: "おそれいりますが" },
      { text: "ご連絡ありがとうございます", hiragana: "ごれんらくありがとうございます" },
      { text: "ご検討のほどお願いいたします", hiragana: "ごけんとうのほどおねがいいたします" },
      { text: "誠に申し訳ございません", hiragana: "まことにもうしわけございません" },
      { text: "ご無沙汰しております", hiragana: "ごぶさたしております" },
      { text: "早速のご返信ありがとうございます", hiragana: "さっそくのごへんしんありがとうございます" },
      { text: "取り急ぎご連絡まで", hiragana: "とりいそぎごれんらくまで" },
      { text: "詳細は添付ファイルをご覧ください", hiragana: "しょうさいはてんぷふぁいるをごらんください" },
      { text: "ご質問等ございましたら", hiragana: "ごしつもんとうございましたら" },
      { text: "遠慮なくお申し付けください", hiragana: "えんりょなくおもうしつけください" },
      { text: "ご不便をおかけして申し訳ありません", hiragana: "ごふべんをおかけしてもうしわけありません" },
      { text: "今後ともよろしくお願いいたします", hiragana: "こんごともよろしくおねがいいたします" },
      { text: "略儀ながらメールにて失礼いたします", hiragana: "りゃくぎながらめーるにてしつれいいたします" }
    ]
  },
  {
    genreName: "四字熟語・ことわざ",
    problems: [
      { text: "一石二鳥", hiragana: "いっせきにちょう" },
      { text: "弱肉強食", hiragana: "じゃくにくきょうしょく" },
      { text: "十人十色", hiragana: "じゅうにんといろ" },
      { text: "以心伝心", hiragana: "いしんでんしん" },
      { text: "温故知新", hiragana: "おんこちしん" },
      { text: "臨機応変", hiragana: "りんきおうへん" },
      { text: "悪戦苦闘", hiragana: "あくせんくとう" },
      { text: "試行錯誤", hiragana: "しこうさくご" },
      { text: "千載一遇", hiragana: "せんざいいちぐう" },
      { text: "自業自得", hiragana: "じごうじとく" },
      { text: "猪突猛進", hiragana: "ちょとつもうしん" },
      { text: "絶体絶命", hiragana: "ぜったいぜつめい" },
      { text: "電光石火", hiragana: "でんこうせっか" },
      { text: "花鳥風月", hiragana: "かちょうふうげつ" },
      { text: "臥薪嘗胆", hiragana: "がしんしょうたん" },
      { text: "犬も歩けば棒に当たる", hiragana: "いぬもあるけばぼうにあたる" },
      { text: "猿も木から落ちる", hiragana: "さるもきからおちる" },
      { text: "石の上にも三年", hiragana: "いしのうえにもさんねん" },
      { text: "鬼に金棒", hiragana: "おににかなぼう" },
      { text: "塵も積もれば山となる", hiragana: "ちりもつもればやまとなる" },
      { text: "豚に真珠", hiragana: "ぶたにしんじゅ" },
      { text: "馬の耳に念仏", hiragana: "うまのみみにねんぶつ" },
      { text: "急がば回れ", hiragana: "いそがばまわれ" },
      { text: "覆水盆に返らず", hiragana: "ふくすいぼんにかえらず" },
      { text: "鉄は熱いうちに打て", hiragana: "てつはあついうちにうて" },
      { text: "情けは人のためならず", hiragana: "なさけはひとのためならず" },
      { text: "泣きっ面に蜂", hiragana: "なきっつらにはち" },
      { text: "どんぐりの背比べ", hiragana: "どんぐりのせいくらべ" },
      { text: "猫に小判", hiragana: "ねこにこばん" },
      { text: "果報は寝て待て", hiragana: "かほうはねてまて" }
    ]
  },
  {
    genreName: "食べ物・料理名",
    problems: [
      { text: "おにぎり", hiragana: "おにぎり" },
      { text: "カレーライス", hiragana: "かれーらいす" },
      { text: "ハンバーグ", hiragana: "はんばーぐ" },
      { text: "オムライス", hiragana: "おむらいす" },
      { text: "スパゲティ", hiragana: "すぱげてぃ" },
      { text: "ラーメン", hiragana: "らーめん" },
      { text: "餃子", hiragana: "ぎょうざ" },
      { text: "豚の生姜焼き", hiragana: "ぶたのしょうがやき" },
      { text: "とんかつ", hiragana: "とんかつ" },
      { text: "天ぷら", hiragana: "てんぷら" },
      { text: "寿司", hiragana: "すし" },
      { text: "刺身", hiragana: "さしみ" },
      { text: "焼き鳥", hiragana: "やきとり" },
      { text: "たこ焼き", hiragana: "たこやき" },
      { text: "お好み焼き", hiragana: "おこのみやき" },
      { text: "グラタン", hiragana: "ぐらたん" },
      { text: "ピザ", hiragana: "ぴざ" },
      { text: "ステーキ", hiragana: "すてーき" },
      { text: "シチュー", hiragana: "しちゅー" },
      { text: "おでん", hiragana: "おでん" },
      { text: "すき焼き", hiragana: "すきやき" },
      { text: "チャーハン", hiragana: "ちゃーはん" },
      { text: "サンドイッチ", hiragana: "さんどいっち" },
      { text: "オムレツ", hiragana: "おむれつ" },
      { text: "フライドポテト", hiragana: "ふらいどぽてと" },
      { text: "ショートケーキ", hiragana: "しょーとけーき" },
      { text: "アイスクリーム", hiragana: "あいすくりーむ" },
      { text: "チョコレート", hiragana: "ちょこれーと" },
      { text: "パンケーキ", hiragana: "ぱんけーき" },
      { text: "プリン", hiragana: "ぷりん" }
    ]
  },
  {
    genreName: "日常の挨拶・会話",
    problems: [
      { text: "おはようございます", hiragana: "おはようございます" },
      { text: "こんにちは", hiragana: "こんにちは" },
      { text: "こんばんは", hiragana: "こんばんは" },
      { text: "おやすみなさい", hiragana: "おやすみなさい" },
      { text: "ありがとうございます", hiragana: "ありがとうございます" },
      { text: "申し訳ありません", hiragana: "もうしわけありません" },
      { text: "いってきます", hiragana: "いってきます" },
      { text: "いってらっしゃい", hiragana: "いってらっしゃい" },
      { text: "ただいま戻りました", hiragana: "ただいまもどりました" },
      { text: "おかえりなさい", hiragana: "おかえりなさい" },
      { text: "いただきます", hiragana: "いただきます" },
      { text: "ごちそうさまでした", hiragana: "ごちそうさまでした" },
      { text: "おじゃまします", hiragana: "おじゃまします" },
      { text: "はじめまして", hiragana: "はじめまして" },
      { text: "よろしくお願いします", hiragana: "よろしくおねがいします" },
      { text: "お元気ですか", hiragana: "おげんきですか" },
      { text: "お久しぶりです", hiragana: "おひさしぶりです" },
      { text: "いい天気ですね", hiragana: "いいてんきですね" },
      { text: "お気をつけて", hiragana: "おきをつけて" },
      { text: "また明日", hiragana: "またあした" },
      { text: "お待たせしました", hiragana: "おまたせしました" },
      { text: "かしこまりました", hiragana: "かしこまりました" },
      { text: "失礼いたします", hiragana: "しつれいいたします" },
      { text: "お気遣いなく", hiragana: "おきづかいなく" },
      { text: "助かります", hiragana: "たすかります" },
      { text: "どういたしまして", hiragana: "どういたしまして" },
      { text: "ごめんください", hiragana: "ごめんください" },
      { text: "いらっしゃいませ", hiragana: "いらっしゃいませ" },
      { text: "お先に失礼します", hiragana: "おさきにしつれいします" },
      { text: "ごきげんよう", hiragana: "ごきげんよう" }
    ]
  },
  {
    genreName: "文学・名言",
    problems: [
      { text: "吾輩は猫である", hiragana: "わがはいはねこである" },
      { text: "名前はまだ無い", hiragana: "なまえはまだない" },
      { text: "少年よ大志を抱け", hiragana: "しょうねんよたいしをいだけ" },
      { text: "春はあけぼの", hiragana: "はるはあけぼの" },
      { text: "月が綺麗ですね", hiragana: "つきがきれいですね" },
      { text: "メロスは激怒した", hiragana: "めろすはげきどした" },
      { text: "雨ニモマケズ風ニモマケズ", hiragana: "あめにもまけずかぜにもまけず" },
      { text: "国境の長いトンネルを抜けると", hiragana: "こっきょうのながいとんねるをぬけると" },
      { text: "雪国であった", hiragana: "ゆきぐにであった" },
      { text: "祇園精舎の鐘の声", hiragana: "ぎおんしょうじゃのかねのこえ" },
      { text: "諸行無常の響きあり", hiragana: "しょぎょうむじょうのひびきあり" },
      { text: "ゆく河の流れは絶えずして", hiragana: "ゆくかわのながれはたえずして" },
      { text: "しかももとの水にあらず", hiragana: "しかももとのみずにあらず" },
      { text: "智に働けば角が立つ", hiragana: "ちにはたらけばかどがたつ" },
      { text: "天は人の上に人を造らず", hiragana: "てんはひとのうえにひとをつくらず" },
      { text: "僕の前に道はない", hiragana: "ぼくのまえにみちはない" },
      { text: "恥の多い生涯を送って来ました", hiragana: "はじのおおいしょうがいをおくってきました" },
      { text: "精神的に向上心のない者はばかだ", hiragana: "せいしんてきにこうじょうしんのないものはばかだ" },
      { text: "汚れっちまった悲しみに", hiragana: "よごれっちまったかなしみに" },
      { text: "親譲りの無鉄砲で損ばかりしている", hiragana: "おやゆずりのむてっぽうでそんばかりしている" },
      { text: "ある日の暮方の事である", hiragana: "あるひのくれがたのことである" },
      { text: "臆病な自尊心と尊大な羞恥心", hiragana: "おくびょうなじそんしんとそんだいなしゅうちしん" },
      { text: "人はパンのみにて生くるものにあらず", hiragana: "ひとはぱんのみにていくるものにあらず" },
      { text: "ローマは一日にして成らず", hiragana: "ろーまはいちにちにしてならず" },
      { text: "賽は投げられた", hiragana: "さいはなげられた" },
      { text: "我思うゆえに我在り", hiragana: "われおもうゆえにわれあり" },
      { text: "健全なる精神は健全なる身体に宿る", hiragana: "けんぜんなるせいしんはけんぜんなるしんたいにやどる" },
      { text: "敵を知り己を知れば百戦危うからず", hiragana: "てきをしりおのれをしればひゃくせんあやうからず" },
      { text: "ペンは剣よりも強し", hiragana: "ぺんはけんよりもつよし" },
      { text: "明日は明日の風が吹く", hiragana: "あしたはあしたのかぜがふく" }
    ]
  },
  {
    genreName: "雑学・一般常識",
    problems: [
      { text: "日本で一番高い山は富士山です", hiragana: "にほんでいちばんたかいやまはふじさんです" },
      { text: "太陽は東から昇って西へ沈む", hiragana: "たいようはひがしからのぼってにしへしずむ" },
      { text: "水は百度で沸騰します", hiragana: "みずはひゃくどでふっとうします" },
      { text: "オリンピックは四年に一度開催される", hiragana: "おりんぴっくはよねんにいちどかいさいされる" },
      { text: "地球は太陽の周りを回っている", hiragana: "ちきゅうはたいようのまわりをまわっている" },
      { text: "一日は二十四時間です", hiragana: "いちにちはにじゅうよじかんです" },
      { text: "一年は三百六十五日です", hiragana: "いちねんはさんびゃくろくじゅうごにちです" },
      { text: "夏の甲子園は高校野球の祭典です", hiragana: "なつのこうしえんはこうこうやきゅうのさいてんです" },
      { text: "日本の首都は東京都です", hiragana: "にほんのしゅとはとうきょうとです" },
      { text: "人間の血液型は四種類あります", hiragana: "にんげんのけつえきがたはよんしゅるいあります" },
      { text: "虹は七色でできています", hiragana: "にじはなないろでできています" },
      { text: "ライト兄弟は飛行機を発明した", hiragana: "らいときょうだいはひこうきをはつめいした" },
      { text: "パンダの好物は笹の葉です", hiragana: "ぱんだのこうぶつはささのはです" },
      { text: "エジソンは蓄音機を発明しました", hiragana: "えじそんはちくおんきをはつめいしました" },
      { text: "犬は人間の最良の友と呼ばれる", hiragana: "いぬはにんげんのさいりょうのともとよばれる" },
      { text: "日本の紙幣には偉人が描かれている", hiragana: "にほんのしへいにはいじんがえがかれている" },
      { text: "月は地球の衛星です", hiragana: "つきはちきゅうのえいせいです" },
      { text: "光の速度は宇宙で一番速い", hiragana: "ひかりのそくどはうちゅうでいちばんはやい" },
      { text: "桜は日本の国花として親しまれている", hiragana: "さくらはにほんのこっかとしてしたしまれている" },
      { text: "富士山は世界文化遺産に登録された", hiragana: "ふじさんはせかいぶんかいさんにとうろくされた" },
      { text: "カメレオンは体の色を変えられる", hiragana: "かめれおんはからだのいろをかえられる" },
      { text: "クジラは海に住む哺乳類です", hiragana: "くじらはうみにすむほにゅうるいです" },
      { text: "世界で一番大きい海は太平洋です", hiragana: "せかいでいちばんおおきいうみはたいへいようです" },
      { text: "四季があるのは日本の特徴です", hiragana: "しきがあるのはにほんのとくちょうです" },
      { text: "人間の骨の数は二百個以上ある", hiragana: "にんげんのほねのかずはにひゃっこいじょうある" },
      { text: "氷が水に浮くのは密度が低いから", hiragana: "こおりがみずにうくのはみつどがひくいから" },
      { text: "ピアノの鍵盤は八十八個あります", hiragana: "ぴあののけんばんははちじゅうはっこあります" },
      { text: "雷の音は光の後に聞こえます", hiragana: "かみなりのおとはひかりのあとにきこえます" },
      { text: "自由の女神はアメリカのシンボルです", hiragana: "じゆうのめがみはあめりかのしんぼるです" },
      { text: "徳川家康は江戸幕府を開いた", hiragana: "とくがわいえやすはえどばくふをひらいた" }
    ]
  },
  {
    genreName: "都道府県名",
    problems: [
      { text: "北海道", hiragana: "ほっかいどう" },
      { text: "青森", hiragana: "あおもり" },
      { text: "岩手", hiragana: "いわて" },
      { text: "宮城", hiragana: "みやぎ" },
      { text: "秋田", hiragana: "あきた" },
      { text: "山形", hiragana: "やまがた" },
      { text: "福島", hiragana: "ふくしま" },
      { text: "茨城", hiragana: "いばらき" },
      { text: "栃木", hiragana: "とちぎ" },
      { text: "群馬", hiragana: "ぐんま" },
      { text: "埼玉", hiragana: "さいたま" },
      { text: "千葉", hiragana: "ちば" },
      { text: "東京", hiragana: "とうきょう" },
      { text: "神奈川", hiragana: "かながわ" },
      { text: "新潟", hiragana: "にいがた" },
      { text: "富山", hiragana: "とやま" },
      { text: "石川", hiragana: "いしかわ" },
      { text: "福井", hiragana: "ふくい" },
      { text: "山梨", hiragana: "やまなし" },
      { text: "長野", hiragana: "ながの" },
      { text: "岐阜", hiragana: "ぎふ" },
      { text: "静岡", hiragana: "しずおか" },
      { text: "愛知", hiragana: "あいち" },
      { text: "三重", hiragana: "みえ" },
      { text: "滋賀", hiragana: "しが" },
      { text: "京都", hiragana: "きょうと" },
      { text: "大阪", hiragana: "おおさか" },
      { text: "兵庫", hiragana: "ひょうご" },
      { text: "奈良", hiragana: "なら" },
      { text: "和歌山", hiragana: "わかやま" },
      { text: "鳥取", hiragana: "とっとり" },
      { text: "島根", hiragana: "しまね" },
      { text: "岡山", hiragana: "おかやま" },
      { text: "広島", hiragana: "ひろしま" },
      { text: "山口", hiragana: "やまぐち" },
      { text: "徳島", hiragana: "とくしま" },
      { text: "香川", hiragana: "かがわ" },
      { text: "愛媛", hiragana: "えひめ" },
      { text: "高知", hiragana: "こうち" },
      { text: "福岡", hiragana: "ふくおか" },
      { text: "佐賀", hiragana: "さが" },
      { text: "長崎", hiragana: "ながさき" },
      { text: "熊本", hiragana: "くまもと" },
      { text: "大分", hiragana: "おおいた" },
      { text: "宮崎", hiragana: "みやざき" },
      { text: "鹿児島", hiragana: "かごしま" },
      { text: "沖縄", hiragana: "おきなわ" }
    ]
  },
];

// --------------------------------------------------
// データをDBに流し込む
// --------------------------------------------------
async function main() {
  console.log(`🌱 シード処理を開始します...`);

  for (const data of seedData) {
    // 1. まずは「ジャンル」を登録（すでに同じ名前があればそれを取得）
    const genre = await prisma.genre.upsert({
      where: { name: data.genreName },
      update: {}, // すでにある場合は何もしない
      create: {
        name: data.genreName,
      },
    });

    console.log(`✨ ジャンル「${genre.name}」を登録/確認しました！`);

    // 2. そのジャンルに紐づく「問題」を順番に登録
    for (const problem of data.problems) {
      await prisma.problem.upsert({
        // 同じ問題文とジャンルIDの組み合わせが既にないかチェック！
        where: {
          genre_id_problem_text: {
            genre_id: genre.id,
            problem_text: problem.text,
          }
        },
        update: {
          // すでにある場合は、念のためひらがなだけ最新情報に更新！
          problem_hiragana: problem.hiragana,
        },
        create: {
          genre_id: genre.id,
          problem_text: problem.text,
          problem_hiragana: problem.hiragana,
        },
      });
    }
    console.log(`  └ 📝 「${genre.name}」に ${data.problems.length} 問の問題を登録しました！`);
  }

  console.log(`🌸 シード処理がすべて完了しました！お疲れ様っ！`);
}

// 実行とエラーハンドリング
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // 終わったらDBとの接続を切る
    await prisma.$disconnect();
  });