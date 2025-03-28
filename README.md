# Payload SQL Database Adapter

An SQL database adapter for [PayloadCMS](https://payloadcms.com).

> **Note:** This package is currently in alpha development and should not be used in production.

## Current Version: 0.0.53

### What's New

- Updated the feature list to correctly reflect versioning and localization support
- Fixed bug in MySQL adapter initialization
- Added improvements to the connection handling
- Updated documentation
- Added integration test suite with full PayloadCMS API testing
- Improved documentation for testing approaches
- Added comprehensive test coverage for adapter functionality
- Updated testing scripts with dedicated integration test command

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

## Testing

The adapter includes comprehensive Jest-based test suites to verify functionality:

```bash
# Run all tests
pnpm test

# Run individual test suites
pnpm test:connection   # Basic connection functionality
pnpm test:relationship # Relationship management
pnpm test:sorting      # Sorting capabilities
pnpm test:fulltext     # Full-text search functionality
pnpm test:adapter      # Complete adapter functionality
```

To run the tests, you need a MySQL server with the following configuration:

- Host: localhost
- Port: 3306
- User: root
- Password: rootpassword
- Database: payload_test

You can modify these settings in the test files if needed.

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
