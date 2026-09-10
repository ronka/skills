#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { commitFile } = require('./commit-file');

function incrementUpdateVersion() {
  // Accept a custom settings path as CLI arg, or search common locations
  const customPath = process.argv[2];
  let settingsPath;

  if (customPath) {
    settingsPath = path.resolve(customPath);
  } else {
    // Search common locations for the settings file with UPDATE_VERSION
    const candidates = [
      path.join(process.cwd(), 'app', 'settings.tsx'),
      path.join(process.cwd(), 'src', 'screens', 'settings.tsx'),
      path.join(process.cwd(), 'src', 'screens', 'Settings.tsx'),
      path.join(process.cwd(), 'app', 'Settings.tsx'),
    ];
    settingsPath = candidates.find(p => fs.existsSync(p));
  }

  if (!settingsPath || !fs.existsSync(settingsPath)) {
    console.error('Settings screen not found. Pass the path as an argument: node increment-update-version.js <path>');
    process.exit(1);
  }

  const fileContents = fs.readFileSync(settingsPath, 'utf8');
  const versionPattern = /const UPDATE_VERSION\s*=\s*(\d+)/;
  const match = fileContents.match(versionPattern);

  if (!match) {
    console.error('Could not locate UPDATE_VERSION in', settingsPath);
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
    `const UPDATE_VERSION = ${nextVersion}`
  );

  fs.writeFileSync(settingsPath, updatedContents);

  console.log(`UPDATE_VERSION bumped from ${currentVersion} to ${nextVersion} in ${settingsPath}`);

  commitFile(settingsPath, `chore: bump UPDATE_VERSION to ${nextVersion}`);
}

incrementUpdateVersion();
