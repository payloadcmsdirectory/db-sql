// A simple test for the MySQL adapter
const { sqlAdapter } = require("../dist/index");

async function runTest() {
  console.log("MySQL test started");

  // Create the adapter with minimal configuration
  const adapter = sqlAdapter({
    pool: {
      host: "localhost",
      user: "root",
      password: "rootpassword",
      database: "payload_test",
      port: 3306,
    },
    prefix: "test_",
  });

  try {
    // Test connection
    console.log("Connecting to MySQL...");
    await adapter.connect();
    console.log("Successfully connected to MySQL");

    // List tables
    const [rows] = await adapter.client.query("SHOW TABLES");
    console.log("Tables:", rows);

    console.log("Test completed successfully");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    // Disconnect
    if (adapter.client) {
      await adapter.disconnect();
      console.log("Disconnected from MySQL");
    }
  }
}

runTest()
  .then(() => console.log("Test finished"))
  .catch((error) => console.error("Unhandled error:", error));
