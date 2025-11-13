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
    const { name, email, password } = req.body;

    // 存在チェック
    if (!name || !email || !password) {
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
    if (error.code === 'P2002') { // P2002はPrismaでの「ユニーク制約違反」
      return res.status(400).json({ message: 'こちらのメールアドレスは既に使用されています。別のメールアドレスを入力して下さい。' });
    } else {
      // デバッグ用
      res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

      // 本番環境用
      // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
      // console.error(error);
    }
  }
});

/**
 * ログイン (POST /api/login)
 */
app.post('/api/login', async (req, res) => {
  try {
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
    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
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
    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
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
    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
  }
});

/**
 * [admin] 問題文を全て取得 (GET /api/admin/problems)
 */
app.get('/api/admin/problems', authenticateToken, isAdmin, async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { id: 'asc' },
      include: { genre: true },
    });
    res.json(problems);
  } catch (error) {
    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
  }
});

/**
 * [admin] 問題文を登録 (POST /api/admin/problems)
 */
app.post('/api/admin/problems', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { genre_id, problem_text } = req.body;

    // バリデーション
    if (!genre_id || !problem_text || problem_text.trim() === '') {
      return res.status(400).json({ message: 'ジャンルと問題文、両方入力して下さい。' });
    }

    // 登録
    const newProblem = await prisma.problem.create({
      data: {
        genre_id: Number(genre_id),
        problem_text,
      },
    });

    // 登録成功時、201を返す
    res.status(201).json(newProblem);
  } catch (error) {
    // 存在しない genre_id を指定した場合、400エラー
    if (error.code === 'P2003') {
      return res.status(400).json({ message: '存在しないジャンルが指定されています。' });
    } else {
      // デバッグ用
      res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

      // 本番環境用
      // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
      // console.error(error);
    }
  }
});

/**
 * [admin] ジャンルを更新 (PUT /api/admin/genres/:id)
 */
app.put('/api/admin/genres/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // ジャンル名
    const { name } = req.body;

    // バリデーション
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'ジャンル名を入力して下さい。' });
    }

    // 更新
    const updatedGenre = await prisma.genre.update({
      where: { id: Number(id) }, // この「id」のジャンル
      data: { name },
    });

    // 更新データを返す
    res.json(updatedGenre);
  } catch (error) {
    // 存在しない「id」を指定した場合、404エラー
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'ジャンルが見つかりませんでした。' });
    }
    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
  }
});

/**
 * [admin] ジャンルを削除 (DELETE /api/admin/genres/:id)
 */
app.delete('/api/admin/genres/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // 削除
    await prisma.genre.delete({
      where: { id: Number(id) }, // この「id」のジャンル
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

    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
  }
});

/**
 * [admin] 問題文を更新 (PUT /api/admin/problems/:id)
 */
app.put('/api/admin/problems/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // ジャンルID, 問題文
    const { genre_id, problem_text } = req.body;

    // バリデーション
    if (!genre_id || !problem_text || problem_text.trim() === '') {
      return res.status(400).json({ message: 'ジャンルと問題文、両方入力して下さい。' });
    }

    // 更新
    const updatedProblem = await prisma.problem.update({
      where: { id: Number(id) }, // この「id」の問題文
      data: {
        genre_id: Number(genre_id),
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

    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
  }
});

/**
 * [admin] 問題文を削除 (DELETE /api/admin/problems/:id)
 */
app.delete('/api/admin/problems/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    // URLの「:id」を受け取る
    const { id } = req.params;

    // 削除
    await prisma.problem.delete({
      where: { id: Number(id) }, // この「id」の問題文
    });

    // 削除が成功時、204を返す
    res.status(204).send();
  } catch (error) {
    // 存在しない「id」を指定した場合、404エラー
    if (error.code === 'P2025') {
      return res.status(404).json({ message: '問題文が見つかりませんでした。' });
    }

    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
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
          q: japaneseText, // 受け取った日本語の文字列
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
    // 「日本語の『配列』」を受け取る
    const { texts } = req.body;

    // バリデーション
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ message: '「texts」という名前の「配列」を送信して下さい。' });
    }

    // Promise.allで全てを並列処理し、完了まで待機
    const hiraganas = await Promise.all(
      texts.map(text => getRubyFromYahoo(text))
    );

    // 「ひらがなの『配列』」を返す
    res.json({ hiraganas });

  } catch (error) {
    // デバッグ用
    res.status(500).json({ message: SERVER_ERROR_MESSAGE_500, error: error.message });

    // 本番環境用
    // res.status(500).json({ message: SERVER_ERROR_MESSAGE_500 });
    // console.error(error);
  }
});

/**
 * サーバー起動
 */
app.listen(PORT, () => {
  console.log(`サーバーが ${PORT} 番ポートで待機中`);
});