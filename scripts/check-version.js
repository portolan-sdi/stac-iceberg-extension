#!/usr/bin/env node
// The package.json version is the single source of truth for the extension
// version, and https://portolan-sdi.github.io/stac-iceberg-extension/v<version>/schema.json
// is the single canonical schema URI. The schema for the current version must
// exist under json-schema/, and every extension schema URI — in the schema
// itself, the README, and the examples — must match the canonical one exactly,
// host included. Released versions stay tracked under json-schema/ and are not
// edited, so a published URL never changes shape under a reader.
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = require('../package.json').version;
const canonical = `https://portolan-sdi.github.io/stac-iceberg-extension/v${version}/schema.json`;
const pattern =
  /https:\/\/portolan-sdi\.github\.io\/stac-iceberg-extension\/v\d+\.\d+\.\d+\/schema\.json/g;

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
