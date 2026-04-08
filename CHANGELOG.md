# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.0.0] - 2026-04-07

### Added

- Initial schema definition with fields: `iceberg:catalog_type`, `iceberg:table_id`,
  `iceberg:format_version`, `iceberg:current_snapshot_id`, `iceberg:catalog_uri`,
  `iceberg:partition_spec`.
- Example STAC Collection with BigLake REST catalog.
- GitHub Actions workflows for CI validation and GitHub Pages publishing.
