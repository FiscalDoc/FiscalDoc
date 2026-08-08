// Roda antes de build/serve (via os hooks "pre*" do npm — ver package.json) e grava o número
// de commits do repositório como appVersion nos arquivos de environment. Assim a versão
// mostrada no rodapé do menu sempre reflete o estado real do git, sem precisar lembrar de
// bumpar manualmente a cada release.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const ENV_FILES = [
  path.join(__dirname, '..', 'apps', 'web', 'src', 'environments', 'environment.ts'),
  path.join(__dirname, '..', 'apps', 'web', 'src', 'environments', 'environment.prod.ts'),
];

function commitCount() {
  try {
    return execSync('git rev-list --count HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const count = commitCount();
if (!count) {
  console.warn('[generate-version] git indisponível — mantendo appVersion atual dos arquivos de environment.');
  process.exit(0);
}

const version = `v${count}`;

for (const file of ENV_FILES) {
  const content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(/appVersion:\s*'[^']*'/, `appVersion: '${version}'`);
  fs.writeFileSync(file, updated);
}

console.log(`[generate-version] appVersion = ${version}`);
