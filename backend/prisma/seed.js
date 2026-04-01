// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --------------------------------------------------
// 🌸 Step 1: 登録したい初期データをここで定義するよ！
// --------------------------------------------------
const seedData = [
  {
    genreName: "IT用語",
    problems: [
      { text: "じょうほうセキュリティ", hiragana: "じょうほうせきゅりてぃ" },
      { text: "でーたべーす", hiragana: "でーたべーす" },
      { text: "ぷろぐらみんぐ", hiragana: "ぷろぐらみんぐ" },
      { text: "あぷりけーしょん", hiragana: "あぷりけーしょん" },
      { text: "ふろんとえんど", hiragana: "ふろんとえんど" },
    ]
  },
  {
    genreName: "日常の挨拶",
    problems: [
      { text: "おはようございます", hiragana: "おはようございます" },
      { text: "こんにちは", hiragana: "こんにちは" },
      { text: "こんばんは", hiragana: "こんばんは" },
      { text: "ありがとうございます", hiragana: "ありがとうございます" },
      { text: "おつかれさまでした", hiragana: "おつかれさまでした" },
    ]
  }
  // どんどんジャンルと問題を追加できるよっ！♡
];

// --------------------------------------------------
// 🌸 Step 2: データをDBに流し込む魔法の処理！
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

  console.log(`🌸 シード処理がすべて完了しました！お疲れ様っ！♡`);
}

// 実行とエラーハンドリング
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // 終わったらちゃんとDBとの接続を切るよ！
    await prisma.$disconnect();
  });