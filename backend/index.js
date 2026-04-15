// =========================================================================
// パッケージ・モジュールの読み込み
// =========================================================================

// --- Webサーバー・ミドルウェア ---
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// --- データベース ---
const { PrismaClient } = require('@prisma/client');

// --- 認証・セキュリティ ---
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 外部API通信 (Yahoo API, Gemini API) ---
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- 環境変数・ローカルデータ ---
require('dotenv').config();

/**
 * タイピングゲーム用 ローマ字入力マッピング辞書
 * * 【概要】
 * ひらがなのパターン（Pattern）に対して、ユーザーが入力可能な
 * ローマ字の組み合わせ（TypePattern）を定義したJSONデータ。
 * * 【用途】
 * ユーザーが登録したひらがなが正しいかどうかのバリデーション
 */
const romajiMapData = require('./romajiDictionary.json');

// =========================================================================
// アプリケーションの初期設定
// =========================================================================

/**
 * データベース操作用クライアント
 */
const prisma = new PrismaClient();

/**
 * Expressアプリケーション本体
 */
const app = express();

/**
 * ミドルウェア設定: CORSの許可 (別ドメインからのAPI呼び出しを許可)
 */
app.use(cors());

/**
 * ミドルウェア設定: JSON形式のリクエストボディを解析する
 */
app.use(express.json());

// =========================================================================
// APIアクセス制限 (Rate Limit)
// =========================================================================

/**
 * APIアクセス制限のルール（全体用）
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分間
  max: 60, // 60回
  message: { message: 'アクセスが集中しています。少し時間をおいてから再度お試しください。' },
});
app.use('/api/', apiLimiter); // 全APIに適用

/**
 * Gemini専用APIアクセス制限のルール
 */
const geminiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,// 1分間
  max: 10,// 10回
  message: { message: 'AIの呼び出し回数が上限に達しました。1分ほど待ってからお試しください。' },
});
app.use('/api/typing/gemini', geminiLimiter);
app.use('/api/typing/ai-comment', geminiLimiter);

// =========================================================================
// Gemini関連設定
// =========================================================================

/**
 * Gemini用ジェネレーター
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * geminiのモデル名
 */
const modelName = process.env.GEMINI_MODEL_NAME || "gemini-3.1-flash-lite-preview";

/**
 * geminiモデル：アプリ起動時に1回だけ作って使い回す
 */
const geminiModel = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    thinkingConfig: {
      thinkingLevel: "low",
    },
  }
});

// =========================================================================
// 各種定数設定
// =========================================================================

/**
 * Gemini APIのタイムアウト時間（ミリ秒）
 */
const GEMINI_TIMEOUT_MS = 15000;

/**
 * Yahoo APIのタイムアウト時間（ミリ秒）
 */
const YAHOO_TIMEOUT_MS = 10000;

/**
 * ページネーションの1ページあたりの表示件数
 */
const PAGE_SIZE = 10;

/**
 * 問題生成のデフォルト数
 */
const DEFAULT_PROBLEM_COUNT = 5;

/**
 * 問題生成の最大数
 */
const MAX_PROBLEM_COUNT = 30;

/**
 * ジャンル名の最大文字数
 */
const MAX_GENRE_NAME_LENGTH = 15;

/**
 * 問題の最大文字数
 */
const MAX_PROBLEM_TEXT_LENGTH = 25;

/**
 * （問題の）ひらがなの最大文字数
 */
const MAX_PROBLEM_HIRAGANA_LENGTH = 50;

/**
 * geminiの問題生成のプロンプトの最大文字数
 */
const MAX_GEMINI_PROMPT_LENGTH = 20;

/**
 * スコア上限値
 */
const MAX_SCORE = 350;

/**
 * ランク判定用のスコア閾値
 */
const RANK_THRESHOLDS = {
  S: Math.round(MAX_SCORE * 0.95), // 333
  A: Math.round(MAX_SCORE * 0.75), // 263
  B: Math.round(MAX_SCORE * 0.6),  // 210
};

/**
 * Yahoo web APIのURL
 */
const YAHOO_API_URL = 'https://jlp.yahooapis.jp/FuriganaService/V2/furigana';

/**
 * ポート番号
 */
const PORT = process.env.PORT || 3002;

/**
 * 500エラーメッセージ
 */
const SERVER_ERROR_MESSAGE_500 = 'サーバーにてエラーが発生しています。時間を空けてもう一度試してください。';

// =========================================================================
// 共通データ・ユーティリティ関数
// =========================================================================

/**
 * 問題登録のひらがなで許可する文字
 */
const allowedChars = new Set(romajiMapData.map(item => item.Pattern));

/**
 * 入力された文字列が、辞書にある文字だけで構成されているかチェックする関数
 * @param {String} text チェック対象の文字列
 * @returns {Boolean} OKならtrue
 */
const isValidReading = (text) => {
  for (const char of text) {
    if (!allowedChars.has(char)) {
      return false;
    }
  }
  return true;
};

/**
 * 漢数字・大字（だいじ）などをひらがなに一括置換する関数
 * (Yahoo! APIが苦手な単独の漢数字などを補完)
 * @param {String} text 一括置換したいテキスト
 * @returns {String} ひらがなに置換したテキスト
 */
const replaceKanjiNumbers = (text) => {
  // 置換したい漢字と読みの対応表
  const kanjiMap = {
    '〇': 'ぜろ',
    '一': 'いち',
    '二': 'に',
    '三': 'さん',
    '四': 'よん',
    '五': 'ご',
    '六': 'ろく',
    '七': 'なな',
    '八': 'はち',
    '九': 'きゅう',
    '十': 'じゅう',
    '百': 'ひゃく',
    '千': 'せん',
    '万': 'まん',
    '億': 'おく',
    '兆': 'ちょう',

    // 大字（だいじ）
    '壱': 'いち',
    '弐': 'に',
    '参': 'さん',
    '拾': 'じゅう',
    '零': 'ぜろ',
  };

  // 正規表現で対象の文字を探して、対応表の読みに置き換える
  return text.replace(/[〇一二三四五六七八九十百千万億兆壱弐参拾零]/g, (match) => {
    return kanjiMap[match];
  });
};

/**
 * 「日本語の文字列」を受け取って、「ひらがなの文字列」を返す
 * @param {String} japaneseText 日本語の文字列
 * @returns {String} ひらがなの文字列
 */
const getRubyFromYahoo = async (japaneseText) => {
  // .envからClientIdを読み込む
  const YAHOO_ID = process.env.YAHOO_CLIENT_ID;

  // .envにClientIdがなかったら、エラーとする
  if (!YAHOO_ID) {
    throw new Error('Yahoo! クライアントIDが設定されていません。');
  }

  try {
    // Yahoo! APIに送信
    const response = await axios.post(
      YAHOO_API_URL,
      {
        id: '1234-1',
        jsonrpc: '2.0',
        method: 'jlp.furiganaservice.furigana',
        params: {
          q: japaneseText, // 日本語の文字列
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `Yahoo AppID: ${YAHOO_ID}`,
        },
        timeout: YAHOO_TIMEOUT_MS
      }
    );

    // Yahoo! API から「エラー」が返ってきた場合
    if (response.data.error) {
      throw new Error(`Yahoo! API エラー: ${response.data.error.message}`);
    }

    // ひらがなの単語の配列を取得
    const hiraganaWords = response.data.result.word.map(word => word.furigana || word.surface);

    // 結合した文字列に対して、漢数字の置換を行う
    const rawHiragana = hiraganaWords.join('');
    return replaceKanjiNumbers(rawHiragana);
  } catch (error) {
    // axios の通信エラーやYahoo! API のエラー
    console.error('Yahoo! API との通信に失敗しました。', error);
    // このエラーを「呼び出し元（/api/get-hiragana）」に伝える
    throw new Error('Yahoo! API との通信に失敗しました。');
  }
};

// =========================================================================
// カスタムミドルウェア (認証・権限チェック)
// =========================================================================

/**
 * JWT認証 (ミドルウェア)
 */
const authenticateToken = (req, res, next) => {
  // リクエストの「Authorization」ヘッダー
  const authHeader = req.headers['authorization'];

  // 「Bearer トークン」形式から、「トークン」だけ取り出す
  const token = authHeader && authHeader.split(' ')[1];

  // トークンがない場合、401エラー
  if (token == null) {
    return res.sendStatus(401);
  }

  // JWT認証
  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    //期限切れ or 正規なトークンではない場合、401エラー
    if (error) {
      return res.sendStatus(401);
    }

    //正規なトークンが確認次第、ユーザー情報（userId, name, role）をリクエストデータに保持する
    req.user = user;

    //認証完了
    next();
  });
};

/**
 * 「管理者・ゲスト管理者」のアクセス権限をチェックする (ミドルウェア)
 */
const checkAdminAccess = (req, res, next) => {
  // トークンから復元したユーザーの権限を取得
  const userRole = req.user && req.user.role;

  // フル権限の管理者（ADMIN）はすべての操作(GET, POST, PUT, DELETE)が可能
  if (userRole === 'ADMIN') {
    return next();
  }

  // ゲスト管理者（GUEST_ADMIN）はデータの「閲覧(GET)」のみ可能
  if (userRole === 'GUEST_ADMIN') {
    if (req.method === 'GET') {
      // GETリクエストなら通す
      return next();
    } else {
      // 追加・編集・削除をしようとしたら専用のエラーを返す
      return res.status(403).json({ message: 'ゲスト権限ではこの操作（追加・更新・削除）は許可されていません。' });
    }
  }

  // 一般ユーザー(USER)や権限不明の場合は一律で弾く
  return res.status(403).json({ message: '管理者権限がありません。' });
};

// =========================================================================
// API ルーティング
// =========================================================================

/**
 * [public] ユーザー登録 (POST /api/register)
 */
app.post('/api/register', async (req, res) => {
  try {
    // ユーザー名、メールアドレス、パスワード
    const { name, email, password } = req.body;

    // 存在チェック
    if (!name || name.trim() === '' || !email || !password) {
      return res.status(400).json({ message: '全ての項目を入力して下さい。' });
    }

    // ユーザー名チェック (10文字以内)
    if (name.length > 10) {
      return res.status(400).json({ message: 'ユーザー名は10文字以内にして下さい。' });
    }

    // メールアドレスチェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'メールアドレスの形式が正しくありません。' });
    }

    // パスワードチェック (4文字以上)
    if (password.length < 4) {
      return res.status(400).json({ message: 'パスワードは4文字以上にして下さい。' });
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー登録
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 登録成功時、201を返す
    res.status(201).json({ message: 'ユーザー登録完了', userId: user.id });
  } catch (error) {
    // 「メールアドレス」が既に登録されていたら
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'こちらのメールアドレスは既に使用されています。別のメールアドレスを入力して下さい。' });
    }

    // 500エラー
    console.error('API Error (POST /api/register):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [public] ログイン (POST /api/login)
 */
app.post('/api/login', async (req, res) => {
  try {
    // メールアドレス、パスワード
    const { email, password } = req.body;

    // 存在チェック
    if (!email || !password) {
      return res.status(400).json({ message: 'メールアドレスとパスワードを入力して下さい。' });
    }

    // メールアドレスでユーザーを探す
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // ユーザーが存在しない場合、401エラー
    if (!user) {
      return res.status(401).json({ message: 'メールアドレスかパスワードが違います。' });
    }

    // パスワードをチェック
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // パスワードが違う場合、401エラー
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'メールアドレスかパスワードが違います。' });
    }

    // JWT発行
    const token = jwt.sign(
      {
        userId: user.id, // ユーザーID
        name: user.name, // ユーザー名
        role: user.role // 権限情報（"USER" or "ADMIN" or "GUEST_ADMIN"）
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // 期限は24時間
    );

    // ログイン成功、トークンを返す
    res.json({ message: 'ログイン成功', token: token });

  } catch (error) {
    // 500エラー
    console.error('API Error (POST /api/login):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * 認証確認
 */
app.get('/api/me', authenticateToken, (req, res) => {
  // req.userにはユーザー情報（userId, name, role）が入ってる
  res.json({
    message: '正規なユーザーであることを確認できました。',
    user: req.user // そのまま返す
  });
});

/**
 * [admin] ジャンルを全て取得 (GET /api/admin/genres)
 */
app.get('/api/admin/genres', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { id: 'asc' }, // IDの昇順
      include: {
        _count: {
          select: { problems: true } // problemsの「数」だけを取得
        }
      }
    });
    res.json(genres);
  } catch (error) {
    // 500エラー
    console.error('API Error (GET /api/admin/genres):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] ジャンルを登録 (POST /api/admin/genres)
 */
app.post('/api/admin/genres', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // ジャンル名
    const { name } = req.body;

    // バリデーション
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'ジャンル名を入力して下さい。' });
    }

    // ジャンル名の文字数チェック
    if (name.length > MAX_GENRE_NAME_LENGTH) {
      return res.status(400).json({ message: `ジャンル名は${MAX_GENRE_NAME_LENGTH}文字以内にして下さい。` });
    }

    // 登録
    const newGenre = await prisma.genre.create({
      data: {
        name,
      },
    });

    // 登録成功時、201を返す
    res.status(201).json(newGenre);
  } catch (error) {
    // ジャンル名の重複エラー
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'その「ジャンル名」は既に登録されています。' });
    }

    // 500エラー
    console.error('API Error (POST /api/admin/genres):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] ジャンルを更新 (PUT /api/admin/genres/:id)
 */
app.put('/api/admin/genres/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // idが数字かどうか
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ message: 'ジャンルIDが、不正な値です。' });
    }

    // ジャンル名
    const { name } = req.body;

    // バリデーション
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'ジャンル名を入力して下さい。' });
    }

    // ジャンル名の文字数チェック
    if (name.length > MAX_GENRE_NAME_LENGTH) {
      return res.status(400).json({ message: `ジャンル名は${MAX_GENRE_NAME_LENGTH}文字以内にして下さい。` });
    }

    // 更新
    const updatedGenre = await prisma.genre.update({
      where: { id: idNum },
      data: { name },
    });

    // 更新データを返す
    res.json(updatedGenre);
  } catch (error) {
    // 存在しない「id」を指定した場合、404エラー
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'ジャンルが見つかりませんでした。' });
    }

    // 重複エラー、400エラー
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'その「ジャンル名」は、既に登録されています。' });
    }

    // 500エラー
    console.error('API Error (PUT /api/admin/genres/:id):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] ジャンルを削除 (DELETE /api/admin/genres/:id)
 */
app.delete('/api/admin/genres/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // idが数字かどうか
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ message: 'ジャンルIDが、不正な値です。' });
    }

    // 削除
    await prisma.genre.delete({
      where: { id: idNum },
    });

    // 削除成功時、204を返す
    res.status(204).send();
  } catch (error) {
    // 存在しない「id」を指定した場合、404エラー
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'ジャンルが見つかりませんでした。' });
    }

    // 削除対象のジャンルに「問題文」が存在している場合、400エラー
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'そのジャンルにはまだ問題文が存在している為、削除できません。' });
    }

    // 500エラー
    console.error('API Error (DELETE /api/admin/genres/:id):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] 問題文を「検索＆ページネーション」で取得 (GET /api/admin/problems)
 */
app.get('/api/admin/problems', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // クエリの値を取得
    const { genreId: genreIdQuery, search } = req.query;
    const pageQuery = req.query.page;

    // 1ページ当たりの件数
    const pageSize = PAGE_SIZE;

    // 取得ページ
    let page = parseInt(pageQuery, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    // スキップ数（取得開始index）
    const skip = (page - 1) * pageSize;

    // 絞り込み条件（where）
    const where = {};

    // 「ジャンルID」のクエリがある場合
    if (genreIdQuery) {
      const genreIdNum = parseInt(genreIdQuery, 10);
      if (!isNaN(genreIdNum)) {
        where.genre_id = genreIdNum;
      }
    }

    // 「検索キーワード」のクエリがある場合
    if (search) {
      where.OR = [
        { problem_text: { contains: search } },
        { problem_hiragana: { contains: search } }
      ];
    }

    // 条件に合う問題を1ページ分取得
    const problems = await prisma.problem.findMany({
      where: where,
      include: { genre: true }, // ジャンル情報も取得
      orderBy: { id: 'desc' }, // 新しい順
      skip: skip, // 取得開始位置
      take: pageSize, // 取得個数
    });

    // 条件に合う問題の合計数
    const totalProblems = await prisma.problem.count({
      where: where,
    });

    // 全部のページ数を計算
    const totalPages = Math.ceil(totalProblems / pageSize);

    // 「今のページのデータ」と「全部のページ数」を返す
    res.json({
      problems,
      totalPages,
    });

  } catch (error) {
    // 500エラー
    console.error('API Error (GET /api/admin/problems):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] 問題文を登録 (POST /api/admin/problems)
 */
app.post('/api/admin/problems', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // ジャンルID、問題文
    const { genre_id, problem_text, problem_hiragana } = req.body;

    // バリデーション
    if (!genre_id || !problem_text || !problem_hiragana || problem_text.trim() === '' || problem_hiragana.trim() === '') {
      return res.status(400).json({ message: 'ジャンル、問題文、ひらがな、全て入力して下さい。' });
    }

    // ジャンルIDが数字かどうか
    const genreIdNum = parseInt(genre_id, 10);
    if (isNaN(genreIdNum)) {
      return res.status(400).json({ message: 'ジャンルIDに、不正な値が設定されています。' });
    }

    // 問題文の文字数チェック
    if (problem_text.length > MAX_PROBLEM_TEXT_LENGTH) {
      return res.status(400).json({ message: `問題文は${MAX_PROBLEM_TEXT_LENGTH}文字以内にして下さい。` });
    }

    // ひらがなの文字数チェック
    if (problem_hiragana.length > MAX_PROBLEM_HIRAGANA_LENGTH) {
      return res.status(400).json({ message: `ひらがなは${MAX_PROBLEM_HIRAGANA_LENGTH}文字以内にして下さい。` });
    }

    // ひらがなチェック
    if (!isValidReading(problem_hiragana)) {
      return res.status(400).json({
        message: 'ひらがなに不正な文字が含まれています。（辞書に定義されていない文字は登録できません）'
      });
    }

    // 登録
    const newProblem = await prisma.problem.create({
      data: {
        genre_id: genreIdNum,
        problem_text,
        problem_hiragana,
      },
    });

    // 登録成功時、201を返す
    res.status(201).json(newProblem);
  } catch (error) {
    // 「問題文」「ジャンルID」の複合ユニークエラーの場合、400エラー
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'その「問題文」は、その「ジャンル」に既に登録されています。' });
    }

    // 存在しない genre_id を指定した場合、400エラー
    if (error.code === 'P2003') {
      return res.status(400).json({ message: '存在しないジャンルが指定されています。' });
    }

    // 500エラー
    console.error('API Error (POST /api/admin/problems):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] 問題文を更新 (PUT /api/admin/problems/:id)
 */
app.put('/api/admin/problems/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // idが数字かどうか
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ message: '問題文IDが、不正な値です。' });
    }

    // ジャンルID, 問題文
    const { genre_id, problem_text, problem_hiragana } = req.body;

    // バリデーション
    if (!genre_id || !problem_text || !problem_hiragana || problem_text.trim() === '' || problem_hiragana.trim() === '') {
      return res.status(400).json({ message: 'ジャンル、問題文、ひらがな、全て入力して下さい。' });
    }

    // ジャンルIDが数字かどうか
    const genreIdNum = parseInt(genre_id, 10);
    if (isNaN(genreIdNum)) {
      return res.status(400).json({ message: 'ジャンルIDが、不正な値です。' });
    }

    // 問題文の文字数チェック
    if (problem_text.length > MAX_PROBLEM_TEXT_LENGTH) {
      return res.status(400).json({ message: `問題文は${MAX_PROBLEM_TEXT_LENGTH}文字以内にして下さい。` });
    }

    // ひらがなの文字数チェック
    if (problem_hiragana.length > MAX_PROBLEM_HIRAGANA_LENGTH) {
      return res.status(400).json({ message: `ひらがなは${MAX_PROBLEM_HIRAGANA_LENGTH}文字以内にして下さい。` });
    }

    // ひらがなチェック
    if (!isValidReading(problem_hiragana)) {
      return res.status(400).json({
        message: 'ひらがなに不正な文字が含まれています。（辞書に定義されていない文字は登録できません）'
      });
    }

    // 更新
    const updatedProblem = await prisma.problem.update({
      where: { id: idNum }, // この「id」の問題文
      data: {
        genre_id: genreIdNum,
        problem_text: problem_text,
        problem_hiragana: problem_hiragana,
      },
    });

    // 更新した問題文を返す
    res.json(updatedProblem);
  } catch (error) {
    // 存在しない「id」を指定した場合、404エラー
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '問題文が見つかりませんでした。' });
    }

    // 存在しない「genre_id」を指定した場合、400エラー
    if (error.code === 'P2003') {
      return res.status(400).json({ message: '存在しないジャンルが指定されています。' });
    }

    // 「問題文」「ジャンルID」の複合ユニークのエラー、400エラー
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'その「問題文」は、その「ジャンル」に既に登録されています。' });
    }

    // 500エラー
    console.error('API Error (PUT /api/admin/problems/:id):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [admin] 問題文を削除 (DELETE /api/admin/problems/:id)
 */
app.delete('/api/admin/problems/:id', authenticateToken, checkAdminAccess, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // idが数字かどうか
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ message: '問題文IDが、不正な値です。' });
    }

    // 削除
    await prisma.problem.delete({
      where: { id: idNum }, // この「id」の問題文
    });

    // 削除が成功時、204を返す
    res.status(204).send();
  } catch (error) {
    // 存在しない「id」を指定した場合、404エラー
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '問題文が見つかりませんでした。' });
    }

    // 500エラー
    console.error('API Error (DELETE /api/admin/problems/:id):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [public] Yahoo! ルビ振り API (POST /api/get-hiragana)
 */
app.post('/api/get-hiragana', async (req, res) => {
  try {
    // 日本語の「配列」を受け取る
    const { texts } = req.body;

    // バリデーション
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ message: '「texts」という名前の「配列」を送信して下さい。' });
    }

    // Promise.allで全てを並列処理し、完了まで待機
    const hiraganas = await Promise.all(
      texts.map(text => getRubyFromYahoo(text))
    );

    // ひらがなの「配列」を返す
    res.json({ hiraganas });
  } catch (error) {
    // 500エラー
    console.error('API Error (POST /api/get-hiragana):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [public] ジャンルを全て取得 (GET /api/genres)
 */
app.get('/api/genres', async (req, res) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(genres);
  } catch (error) {
    console.error('API Error (GET /api/genres):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [public] タイピング用・DB問題取得 (GET /api/typing/db)
 */
app.get('/api/typing/db', async (req, res) => {
  try {
    // クエリを受け取る (count: 問題数, genreId: ジャンル絞り込み)
    const { count, genreId } = req.query;

    // バリデーション (count)
    let limit = parseInt(count, 10);
    if (isNaN(limit) || limit < 1) limit = DEFAULT_PROBLEM_COUNT;
    if (limit > MAX_PROBLEM_COUNT) limit = MAX_PROBLEM_COUNT;

    // 検索条件 (where)
    const where = {};

    // genreId が指定されていれば条件に追加
    if (genreId) {
      const gId = parseInt(genreId, 10);
      if (!isNaN(gId)) {
        where.genre_id = gId;
      }
    }

    // 「ID」だけを全部取得
    const allIds = await prisma.problem.findMany({
      where: where,
      select: { id: true } // IDのみ
    });

    // 問題が1個もない場合
    if (allIds.length === 0) {
      return res.json([]); // 空の配列を返す
    }

    // シャッフル
    const shuffled = allIds.sort(() => 0.5 - Math.random());

    // 指定数だけ取り出す (IDの配列を作る)
    const selectedIds = shuffled.slice(0, limit).map(item => item.id);

    // 選ばれたIDの「詳細データ」を取得
    const problems = await prisma.problem.findMany({
      where: {
        id: { in: selectedIds } // このIDリストに該当するもの
      },
      include: { genre: true } // ジャンル名も含める
    });

    // 問題データを返す
    res.json(problems);

  } catch (error) {
    console.error('API Error (GET /api/typing/db):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [public] Geminiによる問題生成 (GET /api/typing/gemini)
 */
app.get('/api/typing/gemini', async (req, res) => {
  try {
    const { count, prompt } = req.query;

    // バリデーション
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ message: 'どんな問題を作ってほしいか（お題）を入力して下さい。' });
    }

    // お題の文字数チェック
    if (prompt.length > MAX_GEMINI_PROMPT_LENGTH) {
      return res.status(400).json({ message: `お題は${MAX_GEMINI_PROMPT_LENGTH}文字以内にして下さい。` });
    }

    // 問題数
    let limit = parseInt(count, 10);
    if (isNaN(limit) || limit < 1) limit = DEFAULT_PROBLEM_COUNT;
    if (limit > MAX_PROBLEM_COUNT) limit = MAX_PROBLEM_COUNT;

    // プロンプト作成
    const promptText = `
      あなたはタイピング練習ゲームの問題作成係です。
      ユーザーの指定したテーマ「${prompt}」に基づいて、
      短めの日本語の文章または単語（テーマによってはアルファベットの文章や単語のみ）を ${limit} 個作成してください。

      【条件】
      - 難しい漢字や記号はなるべく避けて、読みやすい文章にすること。
      - 句読点（、や。）はたまに含めること。
      - 1文は20文字以内が目安。
      - 箇条書きの記号（・や1.など）は付けないこと。
      - 結果は、各文章を「改行」で区切って出力すること。
      - 余計な挨拶や説明は一切不要。問題文だけを出力すること。
    `;

    // Geminiによる問題生成
    const result = await geminiModel.generateContent(promptText, { timeout: GEMINI_TIMEOUT_MS });
    const responseText = result.response.text();

    // 結果を加工する (改行で分割、空白を除去、空行を消す)
    const sentences = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    // オブジェクトの配列に変換
    const problems = sentences.map(text => ({
      problem_text: text
    }));

    // 作成した問題オブジェクト配列を返す
    res.json(problems);
  } catch (error) {
    console.error('API Error (GET /api/typing/gemini):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [public] Geminiによる結果へのコメント生成 (POST /api/typing/ai-comment)
 */
app.post('/api/typing/ai-comment', async (req, res) => {
  try {
    const { kpm, accuracy, missedKeys, specialModeInfo } = req.body;

    // kpm のチェック (0〜2000くらいの常識的な範囲にする)
    if (typeof kpm !== 'number' || isNaN(kpm) || kpm < 0 || kpm > 2000) {
      return res.status(400).json({ message: 'KPMの値が不正です。' });
    }

    // accuracy のチェック (0〜100の間)
    if (typeof accuracy !== 'number' || isNaN(accuracy) || accuracy < 0 || accuracy > 100) {
      return res.status(400).json({ message: '正確率の値が不正です。' });
    }

    // missedKeys のチェック (オブジェクトであること)
    if (typeof missedKeys !== 'object' || missedKeys === null || Array.isArray(missedKeys)) {
      return res.status(400).json({ message: 'missedKeysの形式が不正です。' });
    }

    // missedKeysの中身が異常に多くないかチェック（50個以上のキーデータは弾く）
    if (Object.keys(missedKeys).length > 50) {
      return res.status(400).json({ message: 'ミスしたキーのデータが多すぎます。' });
    }

    // スコア計算式 (KPM * (正確率 / 100)^3)
    const score = Math.round(kpm * ((accuracy / 100) ** 3));

    // ランクの判定
    let rank = "C";
    if (score >= RANK_THRESHOLDS.S) rank = "S";
    else if (score >= RANK_THRESHOLDS.A) rank = "A";
    else if (score >= RANK_THRESHOLDS.B) rank = "B";

    // 苦手キーの情報を整理（Top 3を教える）
    // missedKeys は { "a": 2, "k": 1 } みたいなオブジェクト
    const missedKeyText = Object.entries(missedKeys || {})
      .sort((a, b) => b[1] - a[1]) // 回数多い順
      .slice(0, 3) // Top 3
      .map(([key, count]) => `${key}(${count}回)`)
      .join(', ');

    let systemInstruction = `
    あなたはタイピング練習ゲームのコーチです。
    あなたは「妹キャラ」です。
    ユーザーのタイピング結果に対して、可愛く、励ましや称賛のコメントをしてください。

    【条件】
    - 160文字以内。
    - 口調は「〜だね！」「〜だよ！」のように親しみやすく、敬語は使いすぎないこと。
    - 「妹キャラ」で話すことが大事ですが、ユーザーの性別は固定ではないので「お兄ちゃん」や「お姉ちゃん」は使わないようにすること。

    【スコア・ランクのルール】
    - スコア算出式： KPM * (正確率 / 100)^3
    - 各ランクのしきい値（ボーダーライン）：
      - Sランク：${RANK_THRESHOLDS.S}点以上
      - Aランク：${RANK_THRESHOLDS.A}点以上
      - Bランク：${RANK_THRESHOLDS.B}点以上
      - Cランク：${RANK_THRESHOLDS.B}点未満

    【コメントの指針】
    - 今回の成績の「ランク (S, A, B, C)」に応じたリアクションを必ず入れること：
      - ランクS: 大絶賛して、最高に褒めちぎる。
      - ランクA: すごく褒めつつ、Sランクまであと一歩だと熱く励ます。
      - ランクB: 頑張りをねぎらいつつ、さらに上を目指すよう応援する。
      - ランクC: 落ち込まないように優しく慰め、まずは正確さを意識して打つようにアドバイスする。
    - 渡されたスコアとしきい値を比較して、しきい値付近のスコアの場合(-15点くらい)は「あと何点でAランクだね！惜しいっ！」のように、次のランクへの具体的なアドバイスをしてください。
    - 正確率が低い（特に95%未満）ユーザーには、「スピードを少し落としてでも正確に打つと、スコアが爆伸びするよ！」といった、計算式の特性に基づいた助言をしてください。
    - ミスしたキーがあれば、具体的な練習のアドバイスを含める。
    - 絵文字を1〜2個使って可愛くすること。
    `;

    // 状況説明を作る
    let statusDescription = `
    【今回の成績】
    - スコア: ${score}
    - ランク: ${rank}
    - KPM (1分間の打鍵数): ${kpm}
    - 正確率: ${accuracy}%
    - ミスしたキーTOP3: ${missedKeyText || 'なし（完璧！）'}`;

    // 特殊モードの場合の情報を追加
    if (specialModeInfo && specialModeInfo.config.mode !== 'normal') {
      const { config, result } = specialModeInfo;

      if (config.mode === 'time_limit') {
        statusDescription += `\n- プレイモード: 制限時間モード (${config.timeLimit}秒以内)`;
        if (result.isClear) {
          statusDescription += `\n- 結果: クリア成功！ (残り時間: ${result.remainingTime}秒)`;
        } else {
          statusDescription += `\n- 結果: 時間切れで失敗… (${result.solvedCount}/${config.problemCount}問 正解)`;
        }
      } else if (config.mode === 'sudden_death') {
        statusDescription += `\n- プレイモード: サドンデスモード (許容ミス: ${config.missLimit}回)`;
        if (result.isClear) {
          statusDescription += `\n- 結果: クリア成功！ (残りライフ: ${result.remainingLives})`;
        } else {
          statusDescription += `\n- 結果: ミス回数オーバーで失敗… (${result.solvedCount}/${config.problemCount}問 正解)`;
        }
      }
    }

    // プロンプト
    const prompt = `
    成績に応じたコメントをください。以下今回の成績です。
    ${statusDescription}`;

    // Geminiでコメント生成
    const result = await geminiModel.generateContent([systemInstruction, prompt], { timeout: GEMINI_TIMEOUT_MS });
    const comment = result.response.text();

    res.json({ comment });
  } catch (error) {
    console.error('API Error (POST /api/typing/ai-comment):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [要ログイン] タイピング結果の保存 (POST /api/typing/result)
 */
app.post('/api/typing/result', authenticateToken, async (req, res) => {
  try {
    const {
      session_type,
      genre_id,
      gemini_prompt,
      average_kpm,
      average_accuracy,
      most_missed_key,
      total_types,
      total_miss_count,
      problem_results
    } = req.body;

    //---親データ(typing_sessionsテーブル)のバリデーション---

    // session_typeは、'db' or 'gemini'かどうか
    if (session_type !== 'db' && session_type !== 'gemini') {
      return res.status(400).json({ message: 'session_type は "db" か "gemini" を指定して下さい。' });
    }

    // genre_idは、session_typeが'db'の時は、数字かどうか
    if (session_type === 'db') {
      if (typeof genre_id !== 'number' || isNaN(genre_id)) {
        return res.status(400).json({ message: 'DBモードの時は、genre_id(数字)が必要です。' });
      }
    }

    // gemini_promptは、session_typeが'gemini'の時は、空ではない事
    if (session_type === 'gemini') {
      if (!gemini_prompt || typeof gemini_prompt !== 'string' || gemini_prompt.trim() === '') {
        return res.status(400).json({ message: 'Geminiモードの時は、gemini_prompt(文字)が必要です。' });
      }
    }

    // average_kpmは、数字かどうか
    if (typeof average_kpm !== 'number' || isNaN(average_kpm)) {
      return res.status(400).json({ message: 'average_kpm は数字にして下さい。' });
    }

    // average_accuracyは、数字かどうか
    if (typeof average_accuracy !== 'number' || isNaN(average_accuracy)) {
      return res.status(400).json({ message: 'average_accuracy は数字にして下さい。' });
    }

    // most_missed_keyは、文字列であるかどうか (空文字はOKとする)
    if (most_missed_key !== null && most_missed_key !== undefined) {
      if (typeof most_missed_key !== 'string') {
        return res.status(400).json({ message: 'most_missed_key は文字列にして下さい。' });
      }
    }

    // total_typesは、数字（整数）かどうか
    if (!Number.isInteger(total_types)) {
      return res.status(400).json({ message: 'total_types は整数にして下さい。' });
    }

    // total_miss_countは、数字（整数）かどうか
    if (!Number.isInteger(total_miss_count)) {
      return res.status(400).json({ message: 'total_miss_count は整数にして下さい。' });
    }

    // ---子データ(session_problemsテーブル)のバリデーション---

    // problem_resultsは、配列である、且つ、長さが0ではないこと
    if (!Array.isArray(problem_results) || problem_results.length === 0) {
      return res.status(400).json({ message: 'problem_results は配列である必要があります。' });
    }

    // 結果配列の中身のチェック
    for (const p of problem_results) {
      // problem_textは、空ではない事
      if (!p.problem_text || typeof p.problem_text !== 'string') {
        return res.status(400).json({ message: '個別の結果には problem_text が必要です。' });
      }

      // problem_hiraganaは、空ではない事
      if (!p.problem_hiragana || typeof p.problem_hiragana !== 'string') {
        return res.status(400).json({ message: '個別の結果には problem_hiragana が必要です。' });
      }

      // kpmは、数字かどうか
      if (typeof p.kpm !== 'number' || isNaN(p.kpm)) {
        return res.status(400).json({ message: '個別の結果の kpm は数字にして下さい。' });
      }

      // accuracyは、数字かどうか
      if (typeof p.accuracy !== 'number' || isNaN(p.accuracy)) {
        return res.status(400).json({ message: '個別の結果の accuracy は数字にして下さい。' });
      }

      // missed_keysは、JSONオブジェクトかどうか
      if (typeof p.missed_keys !== 'object' || p.missed_keys === null || Array.isArray(p.missed_keys)) {
        return res.status(400).json({ message: 'missed_keys はオブジェクト形式 例: {"k": 1} にして下さい。' });
      }

      // miss_countは、数字（整数）かどうか
      if (!Number.isInteger(p.miss_count)) {
        return res.status(400).json({ message: '個別の miss_count は数字にしてね！' });
      }

      // romaji_textは、空ではない事
      if (!p.romaji_text || typeof p.romaji_text !== 'string') {
        return res.status(400).json({ message: '個別の結果には romaji_text が必要です。' });
      }
    }

    // 登録
    const newSession = await prisma.typingSession.create({
      data: {
        user_id: req.user.userId,
        session_type,
        genre_id: genre_id ? parseInt(genre_id, 10) : null,
        gemini_prompt,
        average_kpm: parseFloat(average_kpm),
        average_accuracy: parseFloat(average_accuracy),
        most_missed_key: most_missed_key || '',
        total_types: parseInt(total_types, 10),
        total_miss_count: parseInt(total_miss_count, 10),

        session_problems: {
          create: problem_results.map(p => ({
            problem_text: p.problem_text,
            problem_hiragana: p.problem_hiragana,
            romaji_text: p.romaji_text,
            kpm: parseFloat(p.kpm),
            accuracy: parseFloat(p.accuracy),
            miss_count: parseInt(p.miss_count, 10),
            missed_keys: JSON.stringify(p.missed_keys || {}),
          }))
        }
      }
    });

    // 登録成功時、201を返す
    res.status(201).json({ message: '結果を保存しました！', sessionId: newSession.id });
  } catch (error) {
    console.error('API Error (POST /api/typing/result):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [要ログイン] マイページ統計情報取得 (GET /api/mypage/stats)
 */
app.get('/api/mypage/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 統計データ（総タイプ数、平均KPM、平均正確率、初回・最新プレイ日時）を集計
    const aggregations = await prisma.typingSession.aggregate({
      where: { user_id: userId },
      _sum: {
        total_types: true, // 総タイプ数の合計
      },
      _avg: {
        average_kpm: true, // KPMの平均
        average_accuracy: true, // 正確率の平均
      },
      _min: {
        created_at: true, // 一番古い日時:初回プレイ
      },
      _max: {
        created_at: true, // 一番新しい日時:最新プレイ
      }
    });

    // ユーザーの「全て」のセッションの「詳細データ(session_problems)」から
    // 「missed_keys」だけを全部取得
    const allProblems = await prisma.sessionProblem.findMany({
      where: {
        session: {
          user_id: userId // 親(session)を経由してユーザーを特定
        }
      },
      select: {
        missed_keys: true // JSON文字列だけ取得
      }
    });

    // ミスキーを集計する
    const totalMissedKeys = {};
    allProblems.forEach(problem => {
      // DBには文字列で入ってるから、オブジェクトに戻す
      const keys = problem.missed_keys ? JSON.parse(problem.missed_keys) : {};

      for (const [key, count] of Object.entries(keys)) {
        totalMissedKeys[key] = (totalMissedKeys[key] || 0) + count;
      }
    });

    // ランキング作成 (回数が多い順に並べて、Top 5を抽出)
    const missedKeysRanking = Object.entries(totalMissedKeys)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // レスポンス作成
    res.json({
      total_types: aggregations._sum.total_types || 0,
      average_kpm: Math.round(aggregations._avg.average_kpm || 0), // 整数に丸める
      average_accuracy: Math.round(aggregations._avg.average_accuracy || 0), // 整数に丸める
      missed_keys_ranking: missedKeysRanking,
      first_play_at: aggregations._min.created_at || null,
      latest_play_at: aggregations._max.created_at || null
    });

  } catch (error) {
    console.error('API Error (GET /api/mypage/stats):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [要ログイン] マイページ履歴一覧取得 (GET /api/mypage/sessions)
 */
app.get('/api/mypage/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1 } = req.query;

    // 1ページ当たりの件数
    const pageSize = PAGE_SIZE;

    // ページ番号のバリデーション
    let pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    const skip = (pageNum - 1) * pageSize;

    // 履歴を取得
    const sessions = await prisma.typingSession.findMany({
      where: { user_id: userId },
      include: { genre: true }, // ジャンル名も含める
      orderBy: { created_at: 'desc' }, // 新しい順
      skip: skip,
      take: pageSize,
    });

    // 総件数を取得 (ページネーション用)
    const totalCount = await prisma.typingSession.count({
      where: { user_id: userId },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      sessions,
      totalPages,
      totalCount,
      currentPage: pageNum
    });

  } catch (error) {
    console.error('API Error (GET /api/mypage/sessions):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * [要ログイン] マイページ履歴詳細取得 (GET /api/mypage/sessions/:id)
 */
app.get('/api/mypage/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessionId = parseInt(req.params.id, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({ message: 'セッションIDが不正です。' });
    }

    // セッションを取得
    const session = await prisma.typingSession.findUnique({
      where: { id: sessionId },
      include: {
        genre: true,
        session_problems: true // 子データ（内訳）も取得
      }
    });

    // 存在チェック
    if (!session) {
      return res.status(404).json({ message: 'データが見つかりませんでした。' });
    }

    // 他人のデータを見れないように、持ち主を確認する
    if (session.user_id !== userId) {
      return res.status(403).json({ message: 'このデータを見る権限がありません。' });
    }

    res.json(session);

  } catch (error) {
    console.error('API Error (GET /api/mypage/sessions/:id):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
    });
  }
});

/**
 * サーバー起動
 */
app.listen(PORT, () => {
  console.log(`サーバーが ${PORT} 番ポートで待機中`);
});