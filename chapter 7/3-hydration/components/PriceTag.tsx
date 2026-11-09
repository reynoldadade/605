"use client";

// Before: formats with the runtime's default locale. The server renders
// en-US; a German reader's browser renders de-DE, and hydration mismatches.
export function PriceTag({ price, currency }: { price: number; currency: string }) {
  return <span className="price">{price.toLocaleString(undefined, {
    style: "currency", currency,
  })}</span>;
}

// After: the locale comes from the server, so both sides format alike.
export function FixedPriceTag({ price, currency, locale }: {
  price: number; currency: string; locale: string;
}) {
  const text = new Intl.NumberFormat(locale, { style: "currency", currency }).format(price);
  return <span className="price">{text}</span>;
}
