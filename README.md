# MySQL Database Adapter for PayloadCMS

This package provides a MySQL database adapter for PayloadCMS, allowing you to use MySQL as your database backend instead of MongoDB.

## Features

- Full CRUD operations for PayloadCMS collections
- Support for relationships between collections
- Compatible with PayloadCMS 3.x

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
- Some advanced PayloadCMS features like versions are not yet supported

## Testing

```bash
npm run test
```

## License

MIT
