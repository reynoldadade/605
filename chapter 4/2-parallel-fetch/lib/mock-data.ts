// Two independent data sources with distinct, deliberately different
// delays, so a sequential-vs-parallel timing difference is easy to see
// and easy to measure rather than being close enough to call noise.
function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getProduct(id: string) {
  return delay({ id, name: "Mechanical Keyboard", price: 129 }, 300);
}

export async function getReviews(id: string) {
  return delay(
    [
      { id: "r1", text: "Great tactile feel." },
      { id: "r2", text: "Louder than expected, still love it." },
    ],
    500
  );
}
