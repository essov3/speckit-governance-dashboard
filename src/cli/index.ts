#!/usr/bin/env node

import { Command } from 'commander';
import { runGenerate } from './commands/generate.ts';
import { runCheck } from './commands/check.ts';
import { runServe } from './commands/serve.ts';
import { runDoctor } from './commands/doctor.ts';

const program = new Command();
const npmProjectRoot = process.env.npm_config_project_root;
const npmDeterministic = process.env.npm_config_deterministic === 'true';
// npm 11 currently strips unknown dashed script arguments on some platforms
// but leaves the corresponding path as a positional argument.
const npmPositionalProjectRoot = process.argv.slice(3).find((arg) => arg !== 'true' && !arg.startsWith('-'));
const inferredProjectRoot = npmProjectRoot && npmProjectRoot !== 'true' ? npmProjectRoot : npmPositionalProjectRoot;

program
  .name('speckit-governance-dashboard')
  .description('A read-only, Markdown-first visual dashboard for SpecKit projects.')
  .version('0.1.1');

// 1. Generate Command
program
  .command('generate')
  .description('Discover, parse, validate SpecKit artifacts and write snapshot JSON cache.')
  .option('-p, --project-root <path>', 'Path to target SpecKit project root')
  .option('-o, --out <path>', 'Explicit output snapshot path')
  .option('-d, --deterministic', 'Enforce deterministic generation mode (stabilize generatedAt timestamp)')
  .option('-a, --adapter <mode>', 'Adapter mode: auto, vanilla, governance', 'auto')
  .option('-i, --include-unknown', 'Include unknown artifacts in index', false)
  .option('--pretty', 'Format output snapshot JSON nicely')
  .option('-q, --quiet', 'Suppress console log output')
  .action(async (options) => {
    try {
      await runGenerate({ ...options, projectRoot: options.projectRoot ?? inferredProjectRoot, deterministic: options.deterministic || npmDeterministic });
    } catch (err: any) {
      console.error(`CLI execution error: ${err.message}`);
      process.exit(4);
    }
  });

// 2. Check Command
program
  .command('check')
  .description('Validate current SpecKit project status and detect snapshot staleness.')
  .option('-p, --project-root <path>', 'Path to target SpecKit project root')
  .option('-s, --snapshot <path>', 'Path to existing snapshot JSON for comparison')
  .option('--strict', 'Run check in strict validation mode (warnings escalate to errors)', false)
  .option('-d, --deterministic', 'Enforce deterministic generation mode', false)
  .option('-a, --adapter <mode>', 'Adapter mode: auto, vanilla, governance', 'auto')
  .option('--fail-on-warning', 'Exit with non-zero status if warnings exist', false)
  .action(async (options) => {
    try {
      await runCheck({ ...options, projectRoot: options.projectRoot ?? inferredProjectRoot, deterministic: options.deterministic || npmDeterministic });
    } catch (err: any) {
      console.error(`CLI execution error: ${err.message}`);
      process.exit(4);
    }
  });

// 3. Serve Command
program
  .command('serve')
  .description('Start a local web server to display the dashboard UI.')
  .option('-p, --project-root <path>', 'Path to target SpecKit project root')
  .option('--port <number>', 'Server port (default: 5173)', '5173')
  .option('--host <host>', 'Server host (default: localhost)', 'localhost')
  .option('--open', 'Auto-open dashboard in browser', false)
  .option('-d, --deterministic', 'Enforce deterministic snapshot timestamp', false)
  .action(async (options) => {
    try {
      await runServe({ ...options, projectRoot: options.projectRoot ?? inferredProjectRoot, deterministic: options.deterministic || npmDeterministic });
    } catch (err: any) {
      console.error(`CLI serve error: ${err.message}`);
      process.exit(4);
    }
  });

// 4. Doctor Command
program
  .command('doctor')
  .description('Check target folder structure, file health, and report issues.')
  .option('-p, --project-root <path>', 'Path to target SpecKit project root')
  .action(async (options) => {
    try {
      await runDoctor({ ...options, projectRoot: options.projectRoot ?? inferredProjectRoot });
    } catch (err: any) {
      console.error(`CLI doctor error: ${err.message}`);
      process.exit(4);
    }
  });

program.parse(process.argv);
