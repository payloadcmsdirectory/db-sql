# PayloadCMS SQL Database Adapter

> **⚠️ ALPHA DEVELOPMENT NOTICE**: This adapter is currently in early alpha development and **NOT INTENDED FOR USE** at the moment. If installed, it will require significant further development to function properly with a native PayloadCMS application. Please check back later for updates.

A SQL database adapter for PayloadCMS that supports MySQL and MariaDB.

## Status

Currently in development (alpha). Not recommended for production use yet.

## Features

- Use MySQL or MariaDB as a backend database for PayloadCMS
- Automatic table creation and schema management
- Support for all PayloadCMS field types
- Simple configuration with sensible defaults

## Installation

```bash
# pnpm
pnpm add @payloadcmsdirectory/db-sql

# npm
npm install @payloadcmsdirectory/db-sql

# yarn
yarn add @payloadcmsdirectory/db-sql
```

## Usage

```typescript
import { sqlAdapter } from "@payloadcmsdirectory/db-sql";
import { buildConfig } from "payload/config";

export default buildConfig({
  // Your PayloadCMS configuration...

  // Use SQL adapter
  db: sqlAdapter({
    host: "localhost",
    user: "root",
    password: "password",
    database: "payload",
    // Optional configuration
    port: 3306,
    tablePrefix: "pl_",
    debug: false,
    dropDatabase: false, // Development only, will drop all tables with prefix
  }),
});
```

## Configuration Options

| Option         | Type    | Required | Default | Description                     |
| -------------- | ------- | -------- | ------- | ------------------------------- |
| `host`         | string  | Yes      | -       | Database hostname               |
| `user`         | string  | Yes      | -       | Database username               |
| `password`     | string  | Yes      | -       | Database password               |
| `database`     | string  | Yes      | -       | Database name                   |
| `port`         | number  | No       | 3306    | Database port                   |
| `tablePrefix`  | string  | No       | ""      | Prefix for all tables           |
| `debug`        | boolean | No       | false   | Enable debug logging            |
| `dropDatabase` | boolean | No       | false   | Drop existing tables (dev only) |

## Development Status

This adapter is currently in alpha status. The following features are implemented:

- [x] Basic CRUD operations
- [x] Automatic table creation from collection schema
- [x] Support for common field types
- [ ] Complete relationship support
- [ ] Migration support
- [ ] Full text search
- [ ] Advanced query filtering
- [ ] Complete versioning support
- [ ] Documentation of table schemas

## Database Structure

The adapter creates tables with the following structure:

- One table per collection, named `{prefix}{collectionSlug}`
- Standard columns include `id`, `createdAt`, and `updatedAt`
- Field columns are named after their field name
- Complex fields (arrays, blocks, etc.) are stored as JSON
- Relationship fields are handled through junction tables

## Known Issues

- Some TypeScript type compatibility issues with PayloadCMS core
- Relationship fields need more complete implementation
- Missing support for advanced query filtering

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
