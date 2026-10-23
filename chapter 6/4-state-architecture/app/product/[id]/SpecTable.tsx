// Server Component: rendered on the server and passed into Disclosure as
// children. It never runs in the browser.
const specs = [
  ["Weight", "280 g"], ["Drop", "6 mm"], ["Upper", "Engineered mesh"],
  ["Outsole", "Sticky rubber, 4 mm lugs"], ["Width", "Regular"],
];

export function SpecTable({ productId }: { productId: string }) {
  return (
    <table data-product={productId}>
      <tbody>
        {specs.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
      </tbody>
    </table>
  );
}
