const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(output, 'index.html'));
const unusedSourceArt = path.join(root, 'assets', 'Personagem');
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {
  recursive: true,
  filter: source => source !== unusedSourceArt && !source.startsWith(unusedSourceArt + path.sep),
});
console.log(`Static site ready: ${output}`);
