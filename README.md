# STAC Iceberg Extension

> **Work in Progress** — This extension is under active development. Field names, schema, and the extension URL may change before the first stable release.

- **Title:** Iceberg
- **Identifier:** <https://schemas.portolan-sdi.org/incubating/iceberg/v1.1.0/schema.json>
- **Field Name Prefix:** iceberg
- **Scope:** Collection
- **[Extension Maturity Classification](https://github.com/radiantearth/stac-spec/tree/master/extensions#extension-maturity):** Proposal

This extension adds [Apache Iceberg](https://iceberg.apache.org/) table metadata to STAC Collections, enabling clients to discover and connect to Iceberg tables for querying geospatial data via PyIceberg, DuckDB, Spark, or BigQuery.

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| iceberg:catalog_type | string | Iceberg catalog backend type (`sql`, `rest`, `glue`, `hive`, `dynamodb`, `static`). Use `static` for a serverless catalog on object storage |
| iceberg:catalog_uri | string | Connection URI for the Iceberg catalog. For a static REST surface, the base URL the REST endpoints are served under |
| iceberg:rest_prefix | string | REST catalog prefix (the `v1/config` `prefix` override) needed to ATTACH a prefixed catalog, e.g. `sdi` |
| iceberg:authorization_type | string | Authorization mode a client should use (`none`, `oauth2`, `sigv4`). A publicly readable static catalog uses `none` |
| iceberg:table_id | string | Fully qualified table identifier (e.g., `portolan.boston_open_space`). On a static REST surface it also addresses the table document under `v1/{prefix}/namespaces/{namespace}/tables/{table}` |
| iceberg:metadata_location | string | URL of the table's current `metadata.json`, usable directly with `iceberg_scan()` or PyIceberg `StaticTable`. Required when `iceberg:catalog_type` is `static`. May be relative to the Collection |
| iceberg:format_version | integer | Iceberg format version (`1`, `2`, or `3`). Version 3 is the first with native geometry/geography types and CRS, so geospatial tables are v3 or later. Engine support for the v3 geometry type still varies, see the note below |
| iceberg:current_snapshot_id | string | Current snapshot ID for reproducibility. A string, because Iceberg IDs are 64-bit and lose precision as a JSON number |
| iceberg:partition_spec | \[object\] | Partition fields mirroring the table's partition spec. Each entry has `name` and `transform` (required) plus optional `source-id` and `field-id`, e.g. `[{"name": "geohash_3", "transform": "identity", "source-id": 5, "field-id": 1000}]`. The `transform` uses Iceberg names, including the parameterized `bucket[N]` and `truncate[W]`. Omit for unpartitioned tables |

### Connecting to the table

How a consumer reaches the table depends on `iceberg:catalog_type`, and the asset (if any) follows from that. The extension does not re-declare the underlying data files, those belong to the base Collection and the [Table Extension](https://github.com/stac-extensions/table), they are not repeated here.

**Static catalog** (`iceberg:catalog_type: "static"`). The `metadata.json` is a real, fetchable document, so include an Iceberg asset pointing at it with media type `application/vnd.apache.iceberg+json`. A reader can pass that URL straight to DuckDB `iceberg_scan()` or PyIceberg `StaticTable` with no catalog server.

```json
{
  "assets": {
    "iceberg": {
      "href": "https://storage.googleapis.com/example-bucket/finland/data/v3/kunta_2025/metadata/v1.metadata.json",
      "type": "application/vnd.apache.iceberg+json",
      "roles": ["data", "metadata"],
      "description": "Apache Iceberg v3 table metadata. Read directly with DuckDB iceberg_scan() or PyIceberg StaticTable, or ATTACH the static REST surface at iceberg:catalog_uri."
    }
  }
}
```

Use `"roles": ["metadata"]` when the Collection also publishes the GeoParquet files as a `data` asset. The Iceberg metadata document is then a second way to reach bytes the Collection already declares, and it holds no data itself. Use `"roles": ["data", "metadata"]` only when the Iceberg table is the sole distribution, so the asset is the only handle a reader has on the data. The `examples/portolan-collection.json` file shows the first case and `examples/collection.json` shows the second.

A static catalog must carry `iceberg:metadata_location`, and the schema requires it. There is no server to resolve the current metadata, so the location is the whole connection. The field may hold a relative path when the Collection is served next to its table, as `examples/portolan-collection.json` does. A reader resolves it against the Collection's `self` link, the same way it resolves an asset `href`.

**Managed catalog** (`iceberg:catalog_type` of `rest`, `glue`, `hive`, `sql`, `dynamodb`). There is no static metadata file to fetch, the current metadata is resolved dynamically by the catalog server, so do not add a metadata-file asset. The connection is carried by the fields `iceberg:catalog_uri`, `iceberg:table_id`, and where relevant `iceberg:rest_prefix` and `iceberg:authorization_type`. A client uses those to load the table, for example DuckDB `ATTACH '<catalog_uri>' (TYPE iceberg, ...)`.

`iceberg:metadata_location` is the single field that connects the most consumers. DuckDB `iceberg_scan('<metadata.json>')`, PyIceberg `StaticTable.from_metadata(...)`, and BigQuery external tables (`uris = ['<metadata.json>']`) all read it directly. The other fields support the ATTACH path against a managed or static REST surface. Note that Spark and Trino do not have a metadata-file entry point, they need a managed catalog (REST, Hive, Glue, JDBC), and Trino in particular rejects the sequential `vN.metadata.json` naming a filesystem-style table uses. So the `static` pattern is consumable by DuckDB, PyIceberg, and BigQuery, not by Spark or Trino without a catalog server.

A consumer note on URI scheme. `iceberg:metadata_location` and the asset `href` use the `https://` form, which DuckDB httpfs reads directly. PyIceberg and BigQuery expect the object-store scheme (`gs://`, `s3://`), so a client may need to rewrite the host to the bucket form.

There is no IANA-registered media type for Iceberg. `application/vnd.apache.iceberg+json` is an unregistered vendor media type we use for the metadata document, it is more correct than the `application/x-iceberg` earlier drafts used (RFC 6838 discourages the `x-` tree). Query engines do not dispatch on it, they key off the `iceberg_scan` / `StaticTable` call or a `format = 'ICEBERG'` option, so the media type is a hint for STAC clients only.

### v3 geometry support today

The v3 geometry type is young in the consuming engines. As of mid 2026, DuckDB 1.5.3+ reads the Iceberg `geometry` type, but not `geography` or `unknown` (expected in DuckDB 2.0). PyIceberg reads v3 metadata, with geometry read support still maturing. Treat `iceberg:format_version: 3` as a capability flag, not a guarantee that any given engine can read the geometry column yet.

A geometry column is reported in `table:columns` with `"type": "geometry"`, which is the logical type. Physically it is a Parquet `BYTE_ARRAY` (binary) holding ISO WKB, the same payload Iceberg v3, Parquet 2.11+, and GeoParquet all use. We list the logical type, not the `binary` storage primitive, for the same reason a decimal column is not listed as `fixed_len_byte_array`. CRS travels separately, in `proj:code` and in the Iceberg type parameter `geometry(C)`, defaulting to `OGC:CRS84`.

The two type strings are different things and do not have to match character for character. `table:columns` reports the logical type `geometry`. The Iceberg table schema reports the parameterized form, written unquoted as `geometry(EPSG:4326)`. Unquoted is the form the Iceberg spec, the Java implementation and DuckDB use. PyIceberg 0.12 diverges: it writes `geometry('EPSG:4326')` with quotes and parses only the quoted form, so it cannot load a table written by DuckDB or Java, and DuckDB reads the PyIceberg quotes as part of the CRS. Do not copy either type string into `table:columns`.

## Relation to other extensions

This extension is designed to complement the [STAC Table Extension](https://github.com/stac-extensions/table), which provides schema-level metadata (`table:columns`, `table:row_count`, `table:primary_geometry`). The Iceberg Extension adds catalog connectivity and versioning information on top.

### Why not reuse `table:storage_options`, `storage:schemes`, or `table:tables`

A fair question is whether the connection fields belong in existing extensions. The Table extension has `table:storage_options` (an fsspec-style keyword bag) and `table:tables` (named tables on a Collection), and the [Storage Extension](https://github.com/stac-extensions/storage) has `storage:schemes` for where asset files physically live. We defer schema and file-location metadata to those, and we do not re-declare the underlying data files. But none of them can express the Iceberg-specific facts a client needs to open a table, the catalog type, the REST prefix, the format version, the current snapshot id, and the partition spec. Keeping these in a single `iceberg:` block gives one coherent connect-block rather than scattering Iceberg semantics across a generic storage bag.

### Where the schema is published

portolan-spec publishes this schema. It pins each released version in `stac/portolan-extensions.json` and serves it at <https://schemas.portolan-sdi.org/incubating/iceberg/v1.1.0/schema.json>, next to the Portolan profile and the other portolan-sdi extensions. This repository holds the source and does not deploy a site of its own.

Version 1.0.0 was published under the retired host `portolan-sdi.github.io/stac-iceberg-extension`. That URL still serves the 2026-04-07 schema, which this repository tracks at `json-schema/v1.0.0/schema.json`. Use the `schemas.portolan-sdi.org` URI for new work.

## Building and Testing

This repository uses [stac-node-validator](https://github.com/stac-utils/stac-node-validator) to validate examples against the schema:

```bash
npm install
npm test
```

## Reference Implementation

The [Portolan CLI](https://github.com/portolan-sdi/portolan-cli) writes static Iceberg v3 tables over published GeoParquet with PyIceberg, and emits STAC Collections carrying these fields. The convention it follows is recorded in the [Portolan specification](https://github.com/portolan-sdi/portolan-spec) under `specs/incubating/iceberg.md`.

Both example files use placeholder identifiers. `examples/portolan-collection.json` shows the Portolan convention, a GeoParquet `data` asset with the Iceberg table beside it. `examples/collection.json` shows an Iceberg-only distribution reached through absolute URLs.

## Contributing

This extension is maintained by the [Portolan SDI](https://github.com/portolan-sdi) project. Issues and pull requests are welcome.

## License

Apache-2.0
