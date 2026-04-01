# STAC Iceberg Extension

> **Work in Progress** — This extension is under active development. Field names, schema, and the extension URL may change before the first stable release.

- **Title:** Iceberg
- **Identifier:** <https://portolan-sdi.github.io/stac-iceberg-extension/v1.0.0/schema.json>
- **Field Name Prefix:** iceberg
- **Scope:** Collection
- **[Extension Maturity Classification](https://github.com/radiantearth/stac-spec/tree/master/extensions#extension-maturity):** Proposal

This extension adds [Apache Iceberg](https://iceberg.apache.org/) table metadata to STAC Collections, enabling clients to discover and connect to Iceberg tables for querying geospatial data via PyIceberg, DuckDB, Spark, or BigQuery.

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| iceberg:catalog_type | string | Iceberg catalog backend type (`sql`, `rest`, `glue`, `hive`, `dynamodb`) |
| iceberg:catalog_uri | string | Connection URI for the Iceberg catalog |
| iceberg:table_id | string | Fully qualified table identifier (e.g., `portolake.boundaries`) |
| iceberg:format_version | integer | Iceberg format version (1 or 2) |
| iceberg:current_snapshot_id | integer | Current snapshot ID for reproducibility |
| iceberg:partition_spec | \[object\] | Partition fields and transforms (e.g., `[{"field": "geohash_3", "transform": "identity"}]`) |

### Collection Asset

Collections using this extension should include a data asset with `type: "application/x-iceberg"` pointing to the Iceberg table location:

```json
{
  "assets": {
    "data": {
      "href": "gs://bucket/portolake/boundaries",
      "type": "application/x-iceberg",
      "roles": ["data"],
      "description": "Apache Iceberg table — use PyIceberg, DuckDB iceberg_scan(), or Spark to query"
    }
  }
}
```

## Relation to other extensions

This extension is designed to complement the [STAC Table Extension](https://github.com/stac-extensions/table), which provides schema-level metadata (`table:columns`, `table:row_count`, `table:primary_geometry`). The Iceberg Extension adds catalog connectivity and versioning information on top.

## Contributing

This extension is maintained by the [Portolan SDI](https://github.com/portolan-sdi) project. Issues and pull requests are welcome.

## License

Apache-2.0
