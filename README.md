# Payload SQL Database Adapter

An SQL database adapter for [PayloadCMS](https://payloadcms.com).

> **Note:** This package is currently in alpha development and should not be used in production.

## Current Version: 0.0.52

### What's New

- Updated the feature list to correctly reflect versioning and localization support
- Fixed bug in MySQL adapter initialization
- Added improvements to the connection handling
- Updated documentation

## Installation

```bash
npm install @payloadcmsdirectory/db-sql
# or
yarn add @payloadcmsdirectory/db-sql
# or
pnpm add @payloadcmsdirectory/db-sql
```

## Usage

```typescript
import { buildConfig } from 'payload/config';
import { mysqlAdapter } from '@payloadcmsdirectory/db-sql/mysql';

export default buildConfig({
  collections: [...],
  db: {
    adapter: mysqlAdapter({
      pool: {
        host: 'localhost',
        port: 3306,
        user: 'user',
        password: 'password',
        database: 'payload'
      }
    }),
  },
});
```

## MySQL Adapter Configuration

| Option   | Type     | Description                   | Default |
| -------- | -------- | ----------------------------- | ------- |
| `pool`   | `Object` | MySQL connection pool options | -       |
| `prefix` | `string` | Table prefix                  | -       |
| `idType` | `string` | Type of ID field (auto, uuid) | auto    |

## Features

Current implementation features:

- ✅ MySQL database support
- ✅ Automatic table and schema management
- ✅ Relationship support
- ✅ Transaction support through Drizzle ORM
- ✅ TypeScript compatibility
- ✅ Basic query filtering
- ✅ Migration foundation
- ✅ Versioning support
- ✅ Localization support
- [ ] Sorting support
- [ ] Full text search

## Supported Field Types

All standard PayloadCMS field types are supported.

## Testing MySQL Connection

```bash
pnpm test:ts
```

## Limitations

- Currently only supports MySQL databases.

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/your-repo.git

# Install dependencies
pnpm install

# Build the package
pnpm build

# Run tests
pnpm test
```

## License

MIT
