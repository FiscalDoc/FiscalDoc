// Roda antes de build/serve (via os hooks "pre*" do npm — ver package.json) e grava o número
// de commits do repositório como appVersion nos arquivos de environment. Assim a versão
// mostrada no rodapé do menu sempre reflete o estado real do git, sem precisar lembrar de
// bumpar manualmente a cada release.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV_FILES = [
  path.join(__dirname, '..', 'apps', 'web', 'src', 'environments', 'environment.ts'),
  path.join(__dirname, '..', 'apps', 'web', 'src', 'environments', 'environment.prod.ts'),
];

// Sobe diretórios a partir daqui até achar um ".git" — evita depender de quantos níveis existem
// entre este script e a raiz do repo, que muda conforme o contexto (3 níveis localmente, 1 só
// dentro da imagem Docker do frontend, onde só o conteúdo de src/Frontend/ é copiado pra /app).
function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

const REPO_ROOT = findRepoRoot(__dirname);

function commitCount() {
  if (!REPO_ROOT) return null;
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
