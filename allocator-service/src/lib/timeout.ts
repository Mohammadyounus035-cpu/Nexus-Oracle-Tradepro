/**
 * Race an operation against a millisecond timeout and ensure the timer is cleared when complete.
 *
 * @param p - The operation to wait for
 * @param ms - Timeout duration in milliseconds
 * @returns The fulfillment value of `p`
 * @throws Error("REQUEST_TIMEOUT") if the operation does not settle within `ms` milliseconds
 */
export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), ms);
  });

  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
