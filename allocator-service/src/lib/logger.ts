/**
 * Logs an informational message to the console.
 *
 * If `meta` is provided, it is logged as a second argument alongside the message.
 *
 * @param message - The message to log
 * @param meta - Optional additional metadata to include with the message
 */
export function logInfo(message: string, meta?: unknown): void {
  if (meta === undefined) {
    console.info(message);
    return;
  }
  console.info(message, meta);
}
