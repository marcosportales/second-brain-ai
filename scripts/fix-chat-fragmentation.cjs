/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^['"]|['"]$/g, "");
    }
  }
}

async function main() {
  loadEnvFile();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required in environment or .env");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");

    const { rows: users } = await client.query(`
      SELECT user_id
      FROM chats
      GROUP BY user_id
      HAVING COUNT(*) > 1
    `);

    let affectedUsers = 0;
    let movedMessages = 0;
    let deletedChats = 0;

    for (const { user_id: userId } of users) {
      const { rows: chats } = await client.query(
        `
          SELECT id, title, created_at, updated_at
          FROM chats
          WHERE user_id = $1
          ORDER BY created_at ASC, id ASC
        `,
        [userId],
      );

      if (chats.length <= 1) continue;

      const canonicalChat = chats[0];
      const duplicateChatIds = chats.slice(1).map((chat) => chat.id);

      const { rows: titleRow } = await client.query(
        `
          SELECT title
          FROM chats
          WHERE user_id = $1
            AND title <> 'New chat'
          ORDER BY created_at ASC
          LIMIT 1
        `,
        [userId],
      );

      const mergedTitle = titleRow[0]?.title || canonicalChat.title || "New chat";

      const { rows: movedRows } = await client.query(
        `
          UPDATE messages
          SET chat_id = $1
          WHERE user_id = $2
            AND chat_id = ANY($3::uuid[])
          RETURNING id
        `,
        [canonicalChat.id, userId, duplicateChatIds],
      );
      movedMessages += movedRows.length;

      const { rows: maxUpdatedAtRows } = await client.query(
        `
          SELECT MAX(updated_at) AS max_updated_at
          FROM chats
          WHERE user_id = $1
        `,
        [userId],
      );

      const maxUpdatedAt = maxUpdatedAtRows[0]?.max_updated_at || canonicalChat.updated_at;

      await client.query(
        `
          UPDATE chats
          SET title = $1, updated_at = $2
          WHERE id = $3
        `,
        [mergedTitle, maxUpdatedAt, canonicalChat.id],
      );

      const { rowCount } = await client.query(
        `
          DELETE FROM chats
          WHERE user_id = $1
            AND id = ANY($2::uuid[])
        `,
        [userId, duplicateChatIds],
      );

      deletedChats += rowCount || 0;
      affectedUsers += 1;
    }

    await client.query("COMMIT");

    const { rows: sanityRows } = await client.query(`
      SELECT user_id, COUNT(*)::int AS total
      FROM chats
      GROUP BY user_id
      HAVING COUNT(*) > 1
      ORDER BY total DESC
    `);

    console.log(
      JSON.stringify(
        {
          status: "ok",
          affectedUsers,
          movedMessages,
          deletedChats,
          usersStillFragmented: sanityRows.length,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to fix chat fragmentation:", error);
  process.exit(1);
});
