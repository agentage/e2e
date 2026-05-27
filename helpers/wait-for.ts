export interface WaitForOptions {
  timeout?: number;
  interval?: number;
  label?: string;
}

export const waitFor = async (
  check: () => Promise<boolean>,
  options: WaitForOptions = {}
): Promise<void> => {
  const { timeout = 30_000, interval = 1_000, label = 'condition' } = options;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`Timed out waiting for: ${label} (${timeout}ms)`);
};
