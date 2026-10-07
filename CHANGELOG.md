# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
for releases from v2.0.0.

**The 1.x line can break.** This extension is a proposal, and no public catalog
depends on v1.0.0. A 1.x release may therefore change the schema in a way that
rejects a document an earlier 1.x release accepted. Each such change is marked
**BREAKING** below. From v2.0.0 the usual rules apply, and a breaking change
takes a major version.

## [v1.1.0] - 2026-10-07

### Added

- `iceberg:format_version` now allows `3`. Version 3 is the first Iceberg format
  version with native geometry/geography types and CRS, so geospatial tables
  described by this extension are v3 or later.
- `iceberg:metadata_location` for the direct URL of a table's `metadata.json`.
- `iceberg:rest_prefix` and `iceberg:authorization_type` to describe how to
  connect to a static or remote REST catalog.
- `static` value for `iceberg:catalog_type`, for serverless catalogs on object
  storage.
- `iceberg:metadata_location` is now required when `iceberg:catalog_type` is
  `static`. A static catalog has no server to resolve the current metadata.
- A second example, `examples/portolan-collection.json`, for the Portolan
  convention. The GeoParquet file keeps the `data` role and the Iceberg metadata
  asset carries the `metadata` role alone.
- `npm run check-version` keeps `json-schema/schema.json` in step with the
  `package.json` version. A git tag keeps each release, which is
  the path format `portolan-spec` pins, one path for every version.
- `npm run check-version` fails when the `package.json` version, the schema
  `$id`, and the schema URIs in the README and the examples disagree.

### Changed

- The canonical schema URI is now
  `https://schemas.portolan-sdi.org/incubating/iceberg/v1.1.0/schema.json`.
  portolan-spec pins and publishes every portolan-sdi extension schema under
  that host, next to the Portolan profile. This repository no longer deploys a
  site. The retired `portolan-sdi.github.io/stac-iceberg-extension/v1.0.0` URL
  keeps serving the 2026-04-07 schema, which the `v1.0.0` git tag keeps.
- **BREAKING.** `iceberg:current_snapshot_id` is now a string. Iceberg snapshot
  IDs are 64-bit and lose precision when serialized as a JSON number. A document
  that carries the v1.0.0 integer form no longer validates.
- Connection guidance now depends on `iceberg:catalog_type`. A static catalog
  carries an Iceberg asset of type `application/vnd.apache.iceberg+json` pointing
  at the fetchable `metadata.json` (was `application/x-iceberg`). A managed
  catalog (rest, glue, hive, sql, dynamodb) carries no metadata-file asset and is
  reached through the connection fields.
- The extension no longer re-declares the underlying GeoParquet data asset. The
  data files belong to the base Collection and the Table extension.
- **BREAKING.** `iceberg:partition_spec` now mirrors the real Iceberg partition
  field shape (`name`, `transform`, optional `source-id` and `field-id`) and
  documents the parameterized `bucket[N]` and `truncate[W]` transforms. The
  previous `field`/`transform` shape was lossy and could not carry transform
  parameters. An item keyed `field` no longer validates.
- Field descriptions now state plainly that `static` and `authorization_type:
  none` are Portolan conventions, not Iceberg-defined values, and that the
  `application/vnd.apache.iceberg+json` media type is unregistered and not used
  by query engines for dispatch.
- Documented engine reality: `iceberg:metadata_location` is the field that
  connects DuckDB, PyIceberg, and BigQuery, the `static` pattern is not
  consumable by Spark or Trino without a catalog server, consumers may need to
  rewrite the `https://` location to a `gs://` scheme, and v3 geometry read
  support still varies by engine.
- Added a "why not reuse `table:storage_options` / `storage:schemes` /
  `table:tables`" note explaining why connection metadata lives in `iceberg:`.
- Example collection updated to a live v3 table (Finnish municipalities). The
  geometry column is typed `geometry` (was `binary`) to match the v3 native
  geometry type, and the metadata asset carries `roles: ["data", "metadata"]`.

## [v1.0.0] - 2026-04-07

### Added

- Initial schema definition with fields: `iceberg:catalog_type`, `iceberg:table_id`,
  `iceberg:format_version`, `iceberg:current_snapshot_id`, `iceberg:catalog_uri`,
  `iceberg:partition_spec`.
- Example STAC Collection with BigLake REST catalog.
- GitHub Actions workflows for CI validation and GitHub Pages publishing.
