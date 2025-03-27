# PayloadCMS SQL Database Adapter Changelog

## 0.0.03 (2023-10-15)

### Added

- Transaction support through Drizzle ORM, matching the pattern used in official PayloadCMS adapters
- Improved connection management

### Fixed

- Type definitions for adapter interfaces
- Improved error handling during connection failures

## 0.0.02 (2023-10-10)

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
- Add support for hooks (collection-level and field-level)
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
