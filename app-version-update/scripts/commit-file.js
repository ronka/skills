#!/usr/bin/env node

const { execFileSync } = require('child_process');

/**
 * Commit a single file. Uses a pathspec-limited commit so unrelated
 * working-tree changes stay uncommitted. Exits non-zero on failure so the
 * caller's `&& eas ...` never runs on an uncommitted version bump.
 */
function commitFile(filePath, message) {
  const git = (args) =>
    execFileSync('git', args, { cwd: process.cwd(), encoding: 'utf8' });

  try {
    git(['rev-parse', '--is-inside-work-tree']);
  } catch {
    console.log('Not a git repository — skipping commit.');
    return;
  }

  try {
    git(['add', '--', filePath]);
    git(['commit', '-m', message, '--', filePath]);
    console.log(`Committed: ${message}`);
  } catch (error) {
    console.error('Failed to commit:', error.stderr || error.message);
    process.exit(1);
  }
}

module.exports = { commitFile };
