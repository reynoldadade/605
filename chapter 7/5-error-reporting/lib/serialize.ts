// Turns whatever was thrown into something JSON can carry. Thrown values
// aren't always Error instances.
export function serialize(e: unknown) {
  if (e instanceof Error) {
    return { name: e.name, message: e.message, stack: e.stack?.split("\n").slice(0, 6).join("\n") };
  }
  return { name: typeof e, message: String(e) };
}
