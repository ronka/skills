#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { commitFile } = require('./commit-file');

function incrementUpdateVersion() {
  const versionPath = path.join(__dirname, '..', 'constants', 'version.ts');

  if (!fs.existsSync(versionPath)) {
    console.error('Version file not found at', versionPath);
    process.exit(1);
  }

  const fileContents = fs.readFileSync(versionPath, 'utf8');
  const versionPattern = /export const UPDATE_VERSION\s*=\s*(\d+)/;
  const match = fileContents.match(versionPattern);

  if (!match) {
    console.error('Could not locate UPDATE_VERSION in', versionPath);
    process.exit(1);
  }

  const currentVersion = Number(match[1]);

  if (Number.isNaN(currentVersion)) {
    console.error('UPDATE_VERSION is not a number:', match[1]);
    process.exit(1);
  }

  const nextVersion = currentVersion + 1;
  const updatedContents = fileContents.replace(
    versionPattern,
    `export const UPDATE_VERSION = ${nextVersion}`
  );

  fs.writeFileSync(versionPath, updatedContents);

  console.log(`UPDATE_VERSION bumped from ${currentVersion} to ${nextVersion}`);

  commitFile(versionPath, `chore: bump UPDATE_VERSION to ${nextVersion}`);
}

incrementUpdateVersion();
