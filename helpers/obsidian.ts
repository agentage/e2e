import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { TIMEOUTS } from './constants.js';

const CANDIDATE_BIN_PATHS = [
  '/opt/Obsidian/obsidian',
  '/opt/obsidian/obsidian',
  '/usr/bin/obsidian',
  '/Applications/Obsidian.app/Contents/MacOS/Obsidian',
  'C:\\Program Files\\Obsidian\\Obsidian.exe',
];

export const findObsidianBinary = (): string => {
  const fromEnv = process.env['OBSIDIAN_BIN'];
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`OBSIDIAN_BIN does not exist: ${fromEnv}`);
    }
    return fromEnv;
  }
  for (const p of CANDIDATE_BIN_PATHS) {
    if (existsSync(p)) return p;
  }
  throw new Error(
    `Could not locate Obsidian. Set OBSIDIAN_BIN. Snap-confined Obsidian is not usable — install the .deb or extract an AppImage. Searched:\n  ${CANDIDATE_BIN_PATHS.join('\n  ')}`
  );
};

export interface LaunchOptions {
  vault?: string;
  timeoutMs?: number;
  cdpPort?: number;
}

export interface ObsidianApp {
  browser: Browser;
  context: BrowserContext;
  proc: ChildProcess;
  firstWindow(timeoutMs?: number): Promise<Page>;
  close(): Promise<void>;
}

// `_electron.launch` waits for the node inspector Obsidian never opens and
// hangs. Spawn directly, parse the DevTools URL, attach via `connectOverCDP`.
export const launchObsidian = async (opts: LaunchOptions = {}): Promise<ObsidianApp> => {
  const vault = opts.vault ?? process.env['OBSIDIAN_VAULT'];
  const cdpPort = opts.cdpPort ?? 0;
  const timeout = opts.timeoutMs ?? TIMEOUTS.obsidianBoot;

  const args: string[] = [];
  if (vault) args.push(vault);
  args.push(
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--use-gl=swiftshader',
    // The plugin stores creds in app.secretStorage (Electron safeStorage), which
    // needs an OS keyring. Headless CI (root, no libsecret) has none, so safeStorage
    // throws and the plugin's onload aborts — no status icon, no replication. The
    // `basic` backend encrypts with a built-in key instead of the keyring, so
    // secretStorage works without one.
    '--password-store=basic',
    `--remote-debugging-port=${cdpPort}`,
    '--remote-allow-origins=*'
  );

  const proc = spawn(findObsidianBinary(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stdout.on('data', (d: Buffer) => process.stdout.write(`[obsidian] ${d}`));

  const wsUrl = await new Promise<string>((resolve, reject) => {
    const onExit = (code: number | null) =>
      reject(new Error(`Obsidian exited (code=${code}) before DevTools came up`));
    proc.once('exit', onExit);

    const onTimeout = setTimeout(() => {
      proc.off('exit', onExit);
      reject(new Error(`Timed out waiting for Obsidian DevTools URL (${timeout}ms)`));
    }, timeout);

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stderr.write(`[obsidian!] ${text}`);
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(text);
      if (m) {
        clearTimeout(onTimeout);
        proc.off('exit', onExit);
        resolve(m[1]);
      }
    });
  });

  const browser = await chromium.connectOverCDP(wsUrl);
  const context = browser.contexts()[0] ?? (await browser.newContext());

  const firstWindow = async (timeoutMs = TIMEOUTS.obsidianBoot): Promise<Page> => {
    const existing = context.pages().find((p) => p.url() !== 'about:blank' && p.url() !== '');
    if (existing) return existing;
    return new Promise<Page>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error(`No Obsidian window in ${timeoutMs}ms`)),
        timeoutMs
      );
      context.once('page', (page) => {
        clearTimeout(t);
        resolve(page);
      });
    });
  };

  const close = async () => {
    try {
      await browser.close();
    } catch {
      /* ignore */
    }
    if (!proc.killed) proc.kill('SIGTERM');
  };

  return { browser, context, proc, firstWindow, close };
};
