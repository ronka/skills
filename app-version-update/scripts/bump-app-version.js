#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { commitFile } = require('./commit-file');

function bumpAppVersion() {
  const appJsonPath = path.join(process.cwd(), 'app.json');

  if (!fs.existsSync(appJsonPath)) {
    console.error('Unable to find app.json at', appJsonPath);
    process.exit(1);
  }

  const fileContents = fs.readFileSync(appJsonPath, 'utf8');
  const versionPattern = /"version"\s*:\s*"(\d+)\.(\d+)\.(\d+)"/;
  const match = fileContents.match(versionPattern);

  if (!match) {
    console.error('Could not locate Expo version inside app.json');
    process.exit(1);
  }

  const [major, minor, patch] = match.slice(1).map(Number);

  if ([major, minor, patch].some(Number.isNaN)) {
    console.error('Version is not in a valid semantic format:', match.slice(1).join('.'));
    process.exit(1);
  }

  const nextVersion = `${major}.${minor}.${patch + 1}`;
  const updatedContents = fileContents.replace(
    versionPattern,
    `"version": "${nextVersion}"`
  );

  fs.writeFileSync(appJsonPath, updatedContents);

  console.log(`Expo version bumped from ${major}.${minor}.${patch} to ${nextVersion}`);

  commitFile(appJsonPath, `chore: bump app version to ${nextVersion}`);
}

bumpAppVersion();
