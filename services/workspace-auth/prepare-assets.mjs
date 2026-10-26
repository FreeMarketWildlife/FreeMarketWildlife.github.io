import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const target = fileURLToPath(new URL('./public/', import.meta.url));
execFileSync(process.execPath, [root + 'scripts/build_business_catalog.mjs'], {stdio:'inherit'});
execFileSync(process.execPath, [root + 'scripts/build_blog.mjs', '--check'], {stdio:'inherit'});
await rm(target, {recursive:true, force:true});
await mkdir(target, {recursive:true});
for (const name of ['tutorials','privacy','account','index.html','404.html','assets','portfolio','tanoshi','contact','blog','build-a-business','troy-kearns','troykearns','kat-kai','philip-aram']) {
  await cp(root + name, target + name, {recursive:true});
}
// This config is generated only for the protected Worker build. The Pages preview stays unchanged.
await writeFile(target + 'assets/data/workspace-auth.json', JSON.stringify({enabled:true}));
console.log('Prepared Worker assets. All requests pass through workspace authorization.');

// Never ship the old public workspace chooser in the protected build.
async function cleanDialogs(directory) {
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    const path = directory + '/' + entry.name;
    if(entry.isDirectory()) await cleanDialogs(path);
    else if(entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      await writeFile(path, html.replace(/<dialog class="access-dialog"[^>]*>[\s\S]*?<\/dialog>/g,
        '<dialog class="access-dialog" id="access-dialog" aria-labelledby="access-title"><div class="dialog-panel"><button class="close-button" type="button" data-close-access aria-label="Close sign in">×</button><h2 id="access-title">Sign in</h2><p role="status">Loading…</p></div></dialog>')
        .replace(/(<button[^>]*data-open-access[^>]*><span>)Workspaces(<\/span>)/g, '$1Sign in$2'));
    }
  }
}
await cleanDialogs(target);

// Guide files, post sources, drafts and test fixtures must never be deployed.
for (const name of ['AGENTS.md','blog.md','content','scripts','tests','outputs']) {
  if ((await readdir(target)).includes(name)) throw new Error('Private authoring file in public assets: ' + name);
}
