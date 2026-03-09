/**
 * stdin.js
 *
 * Reads all data from stdin. Returns empty string if stdin is a TTY.
 * Used by the CLI to receive piped input.
 */

export async function readStdin() {
  if (process.stdin.isTTY) return '';

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
