import { ensureTablesExist, getDb, createLocalManagedUser, hasLocalManagementAccount } from "../server/db";

async function testLocalDb() {
  console.log("--- Testing Database Operations ---");
  const db = await getDb();
  if (!db) {
    console.error("❌ getDb() returned null!");
    process.exit(1);
  }
  console.log("✅ getDb() connected successfully.");

  const ok = await ensureTablesExist();
  console.log("✅ ensureTablesExist() returned:", ok);

  const ready = await hasLocalManagementAccount();
  console.log("ℹ️ hasLocalManagementAccount():", ready);

  console.log("--- Database Test Complete ---");
  process.exit(0);
}

testLocalDb().catch(err => {
  console.error("❌ Database Test Error:", err);
  process.exit(1);
});
