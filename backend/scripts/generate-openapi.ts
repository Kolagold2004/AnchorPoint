/**
 * Generates the OpenAPI spec and writes it to docs/openapi.json (#1336).
 *
 * With `--baseline <file>`, compares the generated spec against a previous
 * spec and exits non-zero when an existing path or operation was removed.
 *
 * Usage (from backend/): npm run generate:openapi [-- --baseline <file>]
 */
import fs from 'fs';
import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from '../src/config/swagger';

type Spec = { paths?: Record<string, Record<string, unknown>> };

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const OUTPUT_PATH = path.resolve(__dirname, '../docs/openapi.json');

function operations(spec: Spec): Set<string> {
  const ops = new Set<string>();
  for (const [route, item] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(item)) {
      if (HTTP_METHODS.includes(method)) ops.add(`${method.toUpperCase()} ${route}`);
    }
  }
  return ops;
}

function main(): void {
  const spec = swaggerJsdoc({ ...swaggerOptions, failOnErrors: true }) as Spec;
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(spec, null, 2)}\n`);
  console.log(`OpenAPI spec written to ${OUTPUT_PATH}`);

  const flagIndex = process.argv.indexOf('--baseline');
  if (flagIndex === -1) return;

  const baselinePath = process.argv[flagIndex + 1];
  if (!baselinePath || !fs.existsSync(baselinePath) || fs.statSync(baselinePath).size === 0) {
    console.log('No baseline spec found; skipping breaking-change check.');
    return;
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as Spec;
  const current = operations(spec);
  const removed = [...operations(baseline)].filter((op) => !current.has(op));

  if (removed.length > 0) {
    console.error('Breaking changes detected — operations removed from the OpenAPI spec:');
    removed.forEach((op) => console.error(`  - ${op}`));
    process.exit(1);
  }
  console.log('No breaking changes against baseline.');
}

main();
