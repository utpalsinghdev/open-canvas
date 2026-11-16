import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = {
  'packages/document': ['zod'],
  'packages/engine': ['@open-cavas/document', 'zustand/vanilla'],
  'packages/mcp': ['@open-cavas/document', '@open-cavas/engine', 'zod'],
};

async function sources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sources(file) : /\.tsx?$/.test(file) ? [file] : [];
  }));
  return files.flat();
}

let errors = 0;
for (const group of ['packages', 'apps']) {
  for (const entry of await readdir(path.join(root, group), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const owner = `${group}/${entry.name}`;
    const directory = path.join(root, owner);
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
    const dependencies = Object.keys(manifest.dependencies ?? {});
    const permitted = allowed[owner] ?? dependencies;
    for (const file of await sources(path.join(directory, 'src'))) {
      const source = await readFile(file, 'utf8');
      for (const { fileName: specifier } of ts.preProcessFile(source, true, true).importedFiles) {
        const relative = specifier.startsWith('.');
        const target = path.resolve(path.dirname(file), specifier);
        const internal = target.startsWith(`${directory}${path.sep}`);
        const runtimeSettings = owner === 'apps/local-service' && target === path.join(root, 'scripts/runtime-settings.mjs');
        const declared = dependencies.some((name) => specifier === name || specifier.startsWith(`${name}/`));
        const supported = permitted.some((name) => specifier === name || specifier.startsWith(`${name}/`));
        const builtin = owner === 'apps/local-service' && specifier.startsWith('node:');
        if (relative ? internal || runtimeSettings : builtin || declared && supported) continue;
        process.stderr.write(`${path.relative(root, file)}: forbidden dependency ${specifier}\n`);
        errors++;
      }
    }
  }
}
if (errors) process.exitCode = 1;
else process.stdout.write('Workspace import boundaries passed.\n');
