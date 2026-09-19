#!/usr/bin/env node
// The package.json version is the single source of truth for the extension
// version, and https://schemas.portolan-sdi.org/incubating/iceberg/v<version>/schema.json
// is the single canonical schema URI. portolan-spec pins each version of this
// schema and serves it under that host. The schema for the current version must
// exist under json-schema/, and every extension schema URI — in the schema
// itself, the README, and the examples — must match the canonical one exactly,
// host included. The pattern also matches the retired portolan-sdi.github.io
// host, so a stale reference to it fails here instead of reaching a reader.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = require('../package.json').version;
const canonical = `https://schemas.portolan-sdi.org/incubating/iceberg/v${version}/schema.json`;
const pattern =
  /https:\/\/(?:schemas\.portolan-sdi\.org\/incubating\/iceberg|portolan-sdi\.github\.io\/stac-iceberg-extension)\/v\d+\.\d+\.\d+\/schema\.json/g;

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`✗ ${msg}`);
};

const schemaPath = path.join(root, 'json-schema', `v${version}`, 'schema.json');
if (!fs.existsSync(schemaPath)) {
  fail(`json-schema/v${version}/schema.json not found (package.json version is ${version})`);
} else {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  if (schema.$id !== `${canonical}#`) {
    fail(`json-schema/v${version}/schema.json $id is ${schema.$id}, expected ${canonical}#`);
  }
}

const files = [
  schemaPath,
  path.join(root, 'README.md'),
  ...fs
    .readdirSync(path.join(root, 'examples'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(root, 'examples', f)),
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(pattern)) {
    if (match[0] !== canonical) {
      const line = text.slice(0, match.index).split('\n').length;
      fail(`${rel}:${line} references ${match[0]}, expected ${canonical}`);
    }
  }
}

if (!failed) console.log(`✓ all extension schema URI references match ${canonical}`);
process.exit(failed ? 1 : 0);
