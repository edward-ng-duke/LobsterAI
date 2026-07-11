import { spawnSync } from 'node:child_process';

const runGit = (gitRoot, args) =>
  spawnSync('git', args, { cwd: gitRoot, encoding: 'utf8' });

const changedPathsForCommit = (gitRoot, parentSha, commitSha) => {
  const changed = runGit(gitRoot, [
    'diff',
    '--name-status',
    '-z',
    '-M',
    parentSha,
    commitSha,
  ]);
  if (changed.status !== 0) return { error: 'unable to inspect evidence-only commit' };

  const fields = changed.stdout.split('\0');
  if (fields.at(-1) === '') fields.pop();
  const paths = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    const pathCount = status.startsWith('R') || status.startsWith('C') ? 2 : 1;
    if (!status || index + pathCount > fields.length) {
      return { error: 'unable to parse evidence commit name-status' };
    }
    for (let pathIndex = 0; pathIndex < pathCount; pathIndex += 1) {
      paths.push({ status, path: fields[index++] });
    }
  }
  return { paths };
};

export const validateEvidenceOnlyDescendant = ({
  gitRoot,
  sourceSha,
  head = 'HEAD',
  allowedEvidencePath,
}) => {
  const errors = [];
  const history = runGit(gitRoot, ['rev-list', '--first-parent', head]);
  if (history.status !== 0) {
    return ['unable to inspect first-parent evidence history'];
  }
  const firstParentShas = new Set(history.stdout.trim().split(/\r?\n/).filter(Boolean));
  if (!firstParentShas.has(sourceSha)) {
    errors.push('evidence SHA is not on the first-parent history of HEAD');
    return errors;
  }

  const descendants = runGit(gitRoot, [
    'rev-list',
    '--first-parent',
    '--reverse',
    `${sourceSha}..${head}`,
  ]);
  if (descendants.status !== 0) {
    errors.push('unable to inspect first-parent evidence descendants');
    return errors;
  }
  for (const commitSha of descendants.stdout.trim().split(/\r?\n/).filter(Boolean)) {
    const parents = runGit(gitRoot, ['rev-list', '--parents', '-n', '1', commitSha]);
    if (parents.status !== 0) {
      errors.push(`unable to inspect evidence commit parents: ${commitSha}`);
      continue;
    }
    const [, ...parentShas] = parents.stdout.trim().split(/\s+/);
    if (parentShas.length !== 1) {
      errors.push(`merge commit is not allowed in evidence history: ${commitSha}`);
      continue;
    }

    const changed = changedPathsForCommit(gitRoot, parentShas[0], commitSha);
    if (changed.error) {
      errors.push(`${changed.error}: ${commitSha}`);
      continue;
    }
    for (const entry of changed.paths) {
      if (!allowedEvidencePath(entry.path, entry.status)) {
        errors.push(
          `non-evidence change after source SHA: ${entry.status} ${entry.path} (${commitSha})`,
        );
      }
    }
  }
  return errors;
};
