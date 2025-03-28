# PayloadCMS SQL Database Adapter Changelog

## 0.0.52 - 2025-03-27

### Changed

- Updated the README to correctly reflect versioning and localization as implemented features
- Fixed bug in MySQL adapter initialization

## 0.0.51 - 2025-03-27

### Added

- Dedicated test script for MySQL connection testing
- Added autoIncrement and idType configuration options

### Changed

- Refactored adapter to use MySQL instead of SQLite
- Updated connection handling to use MySQL pool connections
- Fixed execute function to properly handle MySQL queries
- Updated schema initialization to follow PayloadCMS standards
- Improved error handling for MySQL-specific operations

### Fixed

- Type compatibility issues between MySQL adapter and PayloadCMS types
- Connection pool management and proper cleanup
- Default snapshot configuration for MySQL dialect

## 0.0.5 (2025-03-27)

### Added

- Implemented versioning support using @payloadcms/drizzle functions
- Added requireDrizzleKit implementation for better schema management
- Added support for all database adapter features from PayloadCMS
- Synchronized adapter implementation with PayloadCMS database adapters

### Changed

- Refactored adapter to use imported versioning functions directly
- Removed custom implementations in favor of using PayloadCMS provided functions
- Updated dependencies to latest compatible versions
- Improved TypeScript type safety

## 0.0.4 (2025-03-27)

### Added

- Improved TypeScript compatibility throughout the codebase
- Updated requireDrizzleKit implementation using ESM dynamic imports
- Added proper error handling with null checks in all adapter methods
- Better type safety for SQL query operations

### Fixed

- Type errors in the MySQL adapter implementation
- Build process now completes successfully without TypeScript errors
- Corrected indexing implementation for MySQL tables
- Fixed transaction support in execute method

## 0.0.03 (2025-03-27)

### Added

- Transaction support through Drizzle ORM, matching the pattern used in official PayloadCMS adapters
- Improved connection management

### Fixed

- Type definitions for adapter interfaces
- Improved error handling during connection failures

## 0.0.02 (2025-03-27)

### Added

- Initial implementation of MySQL adapter for PayloadCMS
- Support for basic CRUD operations
- Relationship handling with junction tables
- Support for one-to-many relationships
- Basic query builder with filtering
- Connection pooling for better performance

### Known Limitations

- Limited support for advanced PayloadCMS features
- Missing support for versions and localization
- TypeScript build errors need to be addressed
- Currently only basic field types are fully supported

## Future Plans

### High Priority

- Add transaction support for atomic operations
- Fix TypeScript build issues
- Implement versioning support
- Add proper access control integration

### Medium Priority

- Support for all field types:
  - Array fields with nested items
  - Blocks/flex content
  - Rich text and Lexical editors
  - Upload fields
  - Group and tab fields
- Add localization support for multi-language content
- Implement more advanced query features
- Improve error handling and logging

### Low Priority

- Add migration support
- Add admin UI customizations for MySQL-specific features
- Improve performance optimizations
- Add better documentation and examples
- Implement automated testing
