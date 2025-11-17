const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

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

    //正規なトークンが確認次第、ユーザー情報（userId, name, isAdmin）をリクエストデータに保持する
    req.user = user;

    //認証完了
    next();
  });
};

/**
 * 「管理者」かチェックする (ミドルウェア)
 */
const isAdmin = (req, res, next) => {
  // authenticateTokenの認証時に受け取ったユーザー情報を確認する
  if (req.user && req.user.isAdmin) {
    // isAdminがtrueの場合
    next();
  } else {
    // 管理者ではないので、403エラー
    res.status(403).json({ message: '管理者権限がありません。' });
  }
};

/**
 * ユーザー登録 (POST /api/register)
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * ログイン (POST /api/login)
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
        isAdmin: user.is_admin // 管理者かどうか
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * 認証確認
 */
app.get('/api/me', authenticateToken, (req, res) => {
  // req.userにはユーザー情報（userId, name, isAdmin）が入ってる
  res.json({
    message: '正規なユーザーであることを確認できました。',
    user: req.user // そのまま返す
  });
});

/**
 * [admin] ジャンルを全て取得 (GET /api/admin/genres)
 */
app.get('/api/admin/genres', authenticateToken, isAdmin, async (req, res) => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { id: 'asc' }, // IDの昇順
    });
    res.json(genres);
  } catch (error) {
    // 500エラー
    console.error('API Error (GET /api/admin/genres):', error);
    res.status(500).json({
      message: SERVER_ERROR_MESSAGE_500,
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] ジャンルを登録 (POST /api/admin/genres)
 */
app.post('/api/admin/genres', authenticateToken, isAdmin, async (req, res) => {
  try {
    // ジャンル名
    const { name } = req.body;

    // バリデーション
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'ジャンル名を入力して下さい。' });
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] 問題文を「検索＆ページネーション」で取得 (GET /api/admin/problems)
 */
app.get('/api/admin/problems', authenticateToken, isAdmin, async (req, res) => {
  try {
    // クエリの値を取得
    const { genreId: genreIdQuery, search } = req.query;
    const pageQuery = req.query.page;

    // 1ページに表示する個数
    const pageSize = 10;

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
      where.problem_text = {
        contains: search, // 「問題文に検索キーワードを含む」を条件にする
      };
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] 問題文を登録 (POST /api/admin/problems)
 */
app.post('/api/admin/problems', authenticateToken, isAdmin, async (req, res) => {
  try {
    // ジャンルID、問題文
    const { genre_id, problem_text } = req.body;

    // バリデーション
    if (!genre_id || !problem_text || problem_text.trim() === '') {
      return res.status(400).json({ message: 'ジャンルと問題文、両方入力して下さい。' });
    }

    // ジャンルIDが数字かどうか
    const genreIdNum = parseInt(genre_id, 10);
    if (isNaN(genreIdNum)) {
      return res.status(400).json({ message: 'ジャンルIDに、不正な値が設定されています。' });
    }

    // 登録
    const newProblem = await prisma.problem.create({
      data: {
        genre_id: genreIdNum,
        problem_text,
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] ジャンルを更新 (PUT /api/admin/genres/:id)
 */
app.put('/api/admin/genres/:id', authenticateToken, isAdmin, async (req, res) => {
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] ジャンルを削除 (DELETE /api/admin/genres/:id)
 */
app.delete('/api/admin/genres/:id', authenticateToken, isAdmin, async (req, res) => {
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] 問題文を更新 (PUT /api/admin/problems/:id)
 */
app.put('/api/admin/problems/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // idが数字かどうか
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ message: '問題文IDが、不正な値です。' });
    }

    // ジャンルID, 問題文
    const { genre_id, problem_text } = req.body;

    // バリデーション
    if (!genre_id || !problem_text || problem_text.trim() === '') {
      return res.status(400).json({ message: 'ジャンルと問題文、両方入力して下さい。' });
    }

    // ジャンルIDが数字かどうか
    const genreIdNum = parseInt(genre_id, 10);
    if (isNaN(genreIdNum)) {
      return res.status(400).json({ message: 'ジャンルIDが、不正な値です。' });
    }

    // 更新
    const updatedProblem = await prisma.problem.update({
      where: { id: idNum }, // この「id」の問題文
      data: {
        genre_id: genreIdNum,
        problem_text: problem_text,
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * [admin] 問題文を削除 (DELETE /api/admin/problems/:id)
 */
app.delete('/api/admin/problems/:id', authenticateToken, isAdmin, async (req, res) => {
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

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
      }
    );

    // Yahoo! API から「エラー」が返ってきた場合
    if (response.data.error) {
      throw new Error(`Yahoo! API エラー: ${response.data.error.message}`);
    }

    // ひらがなの単語の配列を取得
    const hiraganaWords = response.data.result.word.map(word => word.furigana || word.surface);

    // 配列を結合して文字列にする
    const hiragana = hiraganaWords.join('');

    // ひらがな文字列を返す
    return hiragana;
  } catch (error) {
    // axios の通信エラーやYahoo! API のエラー
    console.error('Yahoo! API との通信に失敗しました。', error);
    // このエラーを「呼び出し元（/api/get-hiragana）」に伝える
    throw new Error('Yahoo! API との通信に失敗しました。');
  }
};

/**
 * Yahoo! ルビ振り API (POST /api/get-hiragana)
 */
app.post('/api/get-hiragana', authenticateToken, async (req, res) => {
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
      error: error.message // TODO 本番環境では消す
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
    if (isNaN(limit) || limit < 1) {
      limit = 10; // 指定がなければデフォルト「10問」
    }
    // 最大「100問」制限
    if (limit > 100) limit = 100;

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
      error: error.message // TODO 本番環境では消す
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

    // 問題数
    let limit = parseInt(count, 10);
    if (isNaN(limit) || limit < 1) limit = 5; // デフォルト5問
    if (limit > 10) limit = 10; // 最大10問

    // Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // .env からモデル名を取得
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash-preview-05-20";

    // model
    const model = genAI.getGenerativeModel({ model: modelName });

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
    const result = await model.generateContent(promptText);
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * タイピング結果の保存 (POST /api/typing/result)
 */
app.post('/api/typing/result', authenticateToken, async (req, res) => {
  try {
    const {
      session_type,
      genre_id,
      gemini_prompt,
      average_wpm,
      average_accuracy,
      most_missed_key,
      total_types,
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

    // average_wpmは、数字かどうか
    if (typeof average_wpm !== 'number' || isNaN(average_wpm)) {
      return res.status(400).json({ message: 'average_wpm は数字にして下さい。' });
    }

    // average_accuracyは、数字かどうか
    if (typeof average_accuracy !== 'number' || isNaN(average_accuracy)) {
      return res.status(400).json({ message: 'average_accuracy は数字にして下さい。' });
    }

    // total_typesは、数字（整数）かどうか
    if (!Number.isInteger(total_types)) {
      return res.status(400).json({ message: 'total_types は整数にして下さい。' });
    }

    // most_missed_keyは、文字列であるかどうか (空文字はOKとする)
    if (most_missed_key !== null && most_missed_key !== undefined) {
      if (typeof most_missed_key !== 'string') {
        return res.status(400).json({ message: 'most_missed_key は文字列にして下さい。' });
      }
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

      // wpmは、数字かどうか
      if (typeof p.wpm !== 'number' || isNaN(p.wpm)) {
        return res.status(400).json({ message: '個別の結果の wpm は数字にして下さい。' });
      }

      // accuracyは、数字かどうか
      if (typeof p.accuracy !== 'number' || isNaN(p.accuracy)) {
        return res.status(400).json({ message: '個別の結果の accuracy は数字にして下さい。' });
      }

      // missed_keysは、JSONオブジェクトかどうか
      if (typeof p.missed_keys !== 'object' || p.missed_keys === null || Array.isArray(p.missed_keys)) {
        return res.status(400).json({ message: 'missed_keys はオブジェクト形式 例: {"k": 1} にして下さい。' });
      }
    }

    // 登録
    const newSession = await prisma.typingSession.create({
      data: {
        user_id: req.user.userId,
        session_type,
        genre_id: genre_id ? parseInt(genre_id, 10) : null,
        gemini_prompt,
        average_wpm: parseFloat(average_wpm),
        average_accuracy: parseFloat(average_accuracy),
        most_missed_key: most_missed_key || '',
        total_types: parseInt(total_types, 10),

        session_problems: {
          create: problem_results.map(p => ({
            problem_text: p.problem_text,
            wpm: parseFloat(p.wpm),
            accuracy: parseFloat(p.accuracy),
            missed_keys: JSON.stringify(p.missed_keys || {}) // ここで文字列化
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
      error: error.message // TODO 本番環境では消す
    });
  }
});

/**
 * サーバー起動
 */
app.listen(PORT, () => {
  console.log(`サーバーが ${PORT} 番ポートで待機中`);
});