#!/usr/bin/env node
// Studio UI CLI entry point. Parses argv, runs the command, prints the dense
// operational output, and exits with the command's status code.

import { run } from "../src/run.mjs";

const { code, lines } = run(process.argv.slice(2));
for (const line of lines) console.log(line);
process.exit(code);
