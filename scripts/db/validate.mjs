import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import {
  createRunMetadata,
  repositoryRoot,
  writeAtomicJson,
} from './common.mjs';
import { spawnSync } from 'node:child_process';

const report = {
  ...createRunMetadata('P02_PRISMA_STAGE_GATE'),
  status: 'RUNNING',
  commands: [],
};

const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  report.commands.push({
    command: [command, ...args],
    exitCode: result.status,
    outputSha256: createHash('sha256')
      .update(`${result.stdout}\n${result.stderr}`)
      .digest('hex'),
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    throw Object.assign(new Error(`${command} ${args.join(' ')} failed`), {
      blocked: result.status === 2,
    });
  }
};

const hashGeneratedClient = () => {
  const root = path.join(repositoryRoot, 'libs/server/db/generated');
  const hash = createHash('sha256');
  const visit = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      if (name === 'README.md' || name === '.gitignore' || /query_engine|\.node$/.test(name)) continue;
      const absolutePath = path.join(directory, name);
      const relativePath = path.relative(root, absolutePath);
      if (statSync(absolutePath).isDirectory()) visit(absolutePath);
      else hash.update(relativePath).update('\0').update(readFileSync(absolutePath)).update('\0');
    }
  };
  visit(root);
  return hash.digest('hex');
};

try {
  const placeholderUrl = 'postgresql://p02:p02@127.0.0.1:5432/p02?schema=public';
  run(process.execPath, ['scripts/db/validate-static.mjs']);
  run(process.execPath, ['scripts/db/preflight.mjs', '--contracts']);
  run('npx', ['prisma', 'validate', '--schema', 'prisma/schema.prisma'], { DATABASE_URL: placeholderUrl });
  run('npm', ['run', '--silent', 'prisma:generate'], { DATABASE_URL: placeholderUrl });
  const firstGeneratedHash = hashGeneratedClient();
  run('npm', ['run', '--silent', 'prisma:generate'], { DATABASE_URL: placeholderUrl });
  const secondGeneratedHash = hashGeneratedClient();
  if (firstGeneratedHash !== secondGeneratedHash) throw new Error('Prisma generation is not deterministic');
  run('npm', ['run', '--silent', 'test:db:unit']);
  run('npm', ['run', '--silent', 'test:db:preflight']);
  run('npm', ['run', '--silent', 'test:db:integration']);

  report.status = 'PASS';
  report.generatedClientHash = secondGeneratedHash;
  writeAtomicJson('.reports/db/validation.json', report);
  console.log(JSON.stringify(report));
} catch (error) {
  report.status = error?.blocked ? 'BLOCKED' : 'FAILED';
  report.error = error instanceof Error ? error.message : String(error);
  writeAtomicJson('.reports/db/validation.json', report);
  console.error(JSON.stringify(report));
  process.exitCode = error?.blocked ? 2 : 1;
}
