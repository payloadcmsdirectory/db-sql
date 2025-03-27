# Payload SQL Database Adapter

A SQL database adapter for PayloadCMS, with support for MySQL.

> **Alpha Development**: This package is in active development and should not be used in production.

## Features

- ✅ MySQL database support
- ✅ Automatic table and schema management
- ✅ Relationship support with junction tables
- ✅ Transaction support
- ✅ TypeScript compatibility
- ✅ Basic query filtering
- ⬜ Migration support
- ⬜ Sorting support
- ⬜ Full text search
- ⬜ Localization support
- ⬜ Versioning

## Installation

```bash
npm install @payloadcmsdirectory/db-sql
```

## Usage

```typescript
import { sqlAdapter } from "@payloadcmsdirectory/db-sql";
import { buildConfig } from "payload/config";

const config = buildConfig({
  // Your PayloadCMS configuration
  collections: [
    /* your collections */
  ],

  // Configure the MySQL adapter
  db: sqlAdapter({
    pool: {
      host: "localhost",
      user: "username",
      password: "password",
      database: "payload_db",
      port: 3306, // optional, defaults to 3306
    },
    prefix: "pl_", // optional table prefix
  }),
});

export default config;
```

## Configuration Options

The MySQL adapter accepts the following options:

| Option          | Type   | Description                                    |
| --------------- | ------ | ---------------------------------------------- |
| `pool`          | Object | MySQL connection configuration                 |
| `pool.host`     | String | MySQL host                                     |
| `pool.user`     | String | MySQL username                                 |
| `pool.password` | String | MySQL password                                 |
| `pool.database` | String | MySQL database name                            |
| `pool.port`     | Number | MySQL port (optional, defaults to 3306)        |
| `prefix`        | String | Table prefix (optional, defaults to no prefix) |

## Transactions

The adapter supports MySQL transactions through Drizzle ORM to ensure data consistency. Transactions are handled internally by the adapter when needed for operations that require atomic changes across multiple tables.

The transaction support is seamlessly integrated with PayloadCMS operations, following the same pattern as the official SQLite and PostgreSQL adapters. No additional configuration is required to enable transaction support.

## Supported Field Types

The adapter supports the following PayloadCMS field types:

- text
- textarea
- number
- email
- date
- checkbox
- relationship (including hasMany relationships)

## Limitations

- Currently only supports MySQL databases
- Some advanced PayloadCMS features like versions and localization are not yet supported

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/payloadcmsdirectory/db-sql.git
cd payload-sql
npm install
```

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## License

MIT
