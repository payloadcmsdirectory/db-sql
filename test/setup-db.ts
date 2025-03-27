import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Start the MySQL database using Docker Compose
 */
export async function startDatabase(): Promise<void> {
  console.log("Starting MySQL database...");
  try {
    const { stdout, stderr } = await execAsync("docker-compose up -d");
    if (stderr) {
      console.error("Error starting database:", stderr);
    } else {
      console.log("Database started:", stdout);
    }

    // Wait for the database to be ready
    console.log("Waiting for database to be ready...");
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!isReady && attempts < maxAttempts) {
      try {
        const { stdout: healthOutput } = await execAsync(
          "docker-compose exec -T mysql mysqladmin ping -h localhost -u root -prootpassword"
        );
        if (healthOutput.includes("mysqld is alive")) {
          isReady = true;
          console.log("Database is ready!");
        }
      } catch (error) {
        attempts++;
        console.log(
          `Waiting for database to be ready... (${attempts}/${maxAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!isReady) {
      throw new Error("Database failed to start after multiple attempts");
    }
  } catch (error) {
    console.error("Failed to start database:", error);
    throw error;
  }
}

/**
 * Stop the MySQL database
 */
export async function stopDatabase(): Promise<void> {
  console.log("Stopping database...");
  try {
    const { stdout, stderr } = await execAsync("docker-compose down");
    if (stderr) {
      console.error("Error stopping database:", stderr);
    } else {
      console.log("Database stopped:", stdout);
    }
  } catch (error) {
    console.error("Failed to stop database:", error);
    throw error;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === "start") {
    startDatabase().catch(console.error);
  } else if (command === "stop") {
    stopDatabase().catch(console.error);
  } else {
    console.log("Usage: ts-node setup-db.ts [start|stop]");
  }
}
