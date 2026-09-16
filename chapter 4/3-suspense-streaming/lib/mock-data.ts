function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getProduct(id: string) {
  return delay({ id, name: "Mechanical Keyboard" }, 100);
}

export async function getReviews(id: string) {
  return delay(["Great tactile feel.", "Louder than expected."], 500);
}

export async function getRecommendations(id: string) {
  return delay(["Keycap set", "Wrist rest", "USB-C cable"], 1200);
}
