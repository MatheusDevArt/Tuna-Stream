const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(output, 'index.html'));
const unusedSourceDirs = ['Personagem', 'referencias'].map(name => path.join(root, 'assets', name));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {
  recursive: true,
  filter: source => !unusedSourceDirs.some(directory => source === directory || source.startsWith(directory + path.sep)),
});
console.log(`Static site ready: ${output}`);
