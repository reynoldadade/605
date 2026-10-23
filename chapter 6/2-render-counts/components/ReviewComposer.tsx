"use client";

export function ReviewComposer({ draft, onDraftChange, rating, onRatingChange }: {
  draft: string;
  onDraftChange: (v: string) => void;
  rating: number;
  onRatingChange: (n: number) => void;
}) {
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <StarPicker value={rating} onChange={onRatingChange} />
      <textarea
        name="text"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
      />
      <CharCount length={draft.length} />
      <SubmitButton disabled={draft.trim().length < 10} />
    </form>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-pressed={n <= value} onClick={() => onChange(n)}>
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export function CharCount({ length }: { length: number }) {
  return <small>{length} / 2000</small>;
}

export function SubmitButton({ disabled }: { disabled: boolean }) {
  return <button type="submit" disabled={disabled}>Post review</button>;
}
