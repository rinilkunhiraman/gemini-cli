/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const integrationTestsDir = join(rootDir, '.integration-tests');
let runDir = ''; // Make runDir accessible in teardown

export async function setup() {
  const runId = `vitest-run-${Date.now()}`;
  runDir = join(integrationTestsDir, runId);

  // Clean up old test runs, but keep the latest few for debugging
  try {
    const testRuns = glob.sync('vitest-run-*', { cwd: integrationTestsDir });
    if (testRuns.length > 5) {
      const oldRuns = testRuns.sort().slice(0, testRuns.length - 5);
      for (const oldRun of oldRuns) {
        rmSync(join(integrationTestsDir, oldRun), {
          recursive: true,
          force: true,
        });
      }
    }
  } catch (e) {
    console.error('Error cleaning up old test runs:', e);
  }

  mkdirSync(runDir, { recursive: true });

  // Replicate environment variables from run-tests.js
  process.env.INTEGRATION_TEST_FILE_DIR = runDir;
  process.env.GEMINI_CLI_INTEGRATION_TEST = 'true';
  process.env.TELEMETRY_LOG_FILE = join(runDir, 'telemetry.log');

  // Support KEEP_OUTPUT and VERBOSE for debugging
  if (process.env.KEEP_OUTPUT) {
    console.log(`Keeping output for test run in: ${runDir}`);
  }
  process.env.VERBOSE = process.env.VERBOSE ?? 'false';

  console.log(`
Integration test output directory: ${runDir}`);
}

export async function teardown() {
  // Cleanup the test run directory unless KEEP_OUTPUT is set
  if (process.env.KEEP_OUTPUT !== 'true' && runDir) {
    rmSync(runDir, { recursive: true, force: true });
  }
}
