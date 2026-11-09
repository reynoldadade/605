"use client";

// before: the runtime's default locale (server en-US, browser the reader's)
export function PriceTag({ price, currency }: { price: number; currency: string }) {
  return <span className="price">{price.toLocaleString(undefined, {
    style: "currency", currency,
  })}</span>;
}

// after: the server chooses the locale and passes it down
export function LocalizedPriceTag({ price, currency, locale }: {
  price: number; currency: string; locale: string;
}) {
  return <span className="price">
    {new Intl.NumberFormat(locale, { style: "currency", currency }).format(price)}
  </span>;
}
