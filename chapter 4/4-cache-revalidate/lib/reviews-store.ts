// A mutable in-memory stand-in for a reviews table. Real apps would
// have this behind an actual database; the point this example is
// making doesn't depend on where the rows physically live.
export type Review = { id: string; text: string };

export const reviewsStore: Review[] = [
  { id: "r1", text: "Great tactile feel." },
  { id: "r2", text: "Louder than expected, still love it." },
];
