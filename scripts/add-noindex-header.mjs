// Marks a built site as not-for-indexing by adding `X-Robots-Tag: noindex, nofollow`
// to globalHeaders in dist/staticwebapp.config.json.
// Run only by the dev deploy (deploy-app-dev.yml), after `pnpm build`: dev and prod
// ship the same build, and only production should appear in search results.
//
// robots.txt is left allowing crawls on purpose: a crawler blocked by robots.txt never
// fetches the page, so it never sees this header and already-indexed URLs linger.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CONFIG = resolve(import.meta.dirname, '../dist/staticwebapp.config.json');

const config = JSON.parse(readFileSync(CONFIG, 'utf8'));
config.globalHeaders = { ...config.globalHeaders, 'X-Robots-Tag': 'noindex, nofollow' };

writeFileSync(CONFIG, `${JSON.stringify(config, null, 2)}\n`);
console.log('staticwebapp.config.json: X-Robots-Tag noindex header added');
