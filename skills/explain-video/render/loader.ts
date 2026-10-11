/**
 * Node-side loading of the project's videowright.config.ts and timeline.ts (and the audio track module
 * the timeline imports). Replaces tsx: Node strips types itself; this resolve hook adds the rest.
 *
 * - `import ... from "videowright"` resolves to this package's runtime (no node_modules needed)
 * - extensionless imports and `./x.js` imports resolve to `./x.ts`
 * - CSS, fonts, images and other browser assets resolve to an empty module (only the browser uses them)
 */

import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RUNTIME_INDEX = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), "runtime", "index.ts")).href;

const HOOKS = `
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
let runtimeIndex;
export function initialize(data) { runtimeIndex = data.runtimeIndex; }
const ASSET = /\\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|avif|ico|woff2?|eot|ttf|otf|mp3|wav|mp4)(\\?.*)?$/i;
export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'videowright') return { url: runtimeIndex, shortCircuit: true };
  if (ASSET.test(specifier)) return { url: 'asset-noop:' + specifier, shortCircuit: true };
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if ((specifier.startsWith('.') || specifier.startsWith('/')) && context.parentURL) {
      const p = fileURLToPath(new URL(specifier, context.parentURL));
      const candidates = [];
      if (p.endsWith('.js')) candidates.push(p.slice(0, -3) + '.ts');
      candidates.push(p + '.ts', p + '/index.ts');
      for (const c of candidates) if (existsSync(c)) return nextResolve(pathToFileURL(c).href, context);
    }
    throw err;
  }
}
export async function load(url, context, nextLoad) {
  if (url.startsWith('asset-noop:')) return { format: 'module', source: 'export default {};', shortCircuit: true };
  return nextLoad(url, context);
}
`;

let registered = false;

/** Import a project TypeScript module in Node. Returns the module namespace. */
export async function loadModule(modulePath: string): Promise<Record<string, unknown>> {
	if (!registered) {
		register(`data:text/javascript,${encodeURIComponent(HOOKS)}`, {
			parentURL: import.meta.url,
			data: { runtimeIndex: RUNTIME_INDEX },
		});
		registered = true;
	}
	return (await import(pathToFileURL(modulePath).href)) as Record<string, unknown>;
}
