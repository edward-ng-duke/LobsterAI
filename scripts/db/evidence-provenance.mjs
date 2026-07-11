import { spawnSync } from 'node:child_process';

const runGit = (gitRoot, args) =>
  spawnSync('git', args, { cwd: gitRoot, encoding: 'utf8' });

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

  const changed = runGit(gitRoot, ['diff', '--name-only', `${sourceSha}..${head}`]);
  if (changed.status !== 0) {
    errors.push('unable to inspect evidence-only commits');
    return errors;
  }
  for (const file of changed.stdout.trim().split(/\r?\n/).filter(Boolean)) {
    if (!allowedEvidencePath(file)) errors.push(`non-evidence change after source SHA: ${file}`);
  }
  return errors;
};
