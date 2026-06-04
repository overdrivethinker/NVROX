const db = require("./db");

async function testConnection() {
    try {
        await db.raw("SELECT 1");
        console.log("[SUCCESS] CONNECTION SUCCESSFUL");
    } catch (error) {
        console.error("[ERROR] CONNECTION FAILED:", error.message);
    } finally {
        await db.destroy();
    }
}

testConnection();
