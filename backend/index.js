const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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
          grade: 1,
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
 * サーバー起動
 */
app.listen(PORT, () => {
  console.log(`サーバーが ${PORT} 番ポートで待機中`);
});