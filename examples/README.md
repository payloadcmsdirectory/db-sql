# SQL Adapter Examples

This directory contains examples demonstrating how to use the SQL adapter with PayloadCMS.

## Basic Usage

The `basic-usage.ts` file shows how to configure PayloadCMS to use the SQL adapter.

To use this example in your PayloadCMS project:

1. Install the SQL adapter:

   ```bash
   pnpm install payload-sql
   ```

2. Configure your PayloadCMS project similar to `basic-usage.ts`:

   ```typescript
   import { sqlAdapter } from "payload-sql";
   import { buildConfig } from "payload/config";

   export default buildConfig({
     collections: [
       // Your collections
     ],

     // Use the SQL adapter
     db: sqlAdapter({
       host: "localhost",
       user: "your-username",
       password: "your-password",
       database: "your-database",
       tablePrefix: "pl_",
     }),

     // Other PayloadCMS config
   });
   ```

3. Start your PayloadCMS application and the adapter will:
   - Create tables for all your collections
   - Create relationship tables for relationship fields
   - Handle all CRUD operations with the MySQL database

## Notes

- The adapter automatically creates tables based on your collection configuration
- Relationship fields are supported, including `hasMany` relationships
- Set `dropDatabase: true` only for development/testing to reset database state

## Testing with Docker

If you want to test with a fresh MySQL instance, you can use Docker:

```bash
# Start MySQL
docker run --name payload-mysql -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=payload -p 3306:3306 -d mysql:8.0

# Stop and remove when done
docker stop payload-mysql
docker rm payload-mysql
```
