// Maps a URL path to the route pattern it was rendered from, so reports
// group by page template and never carry product IDs or query strings.
const patterns: [RegExp, string][] = [
  [/^\/$/, "/"],
  [/^\/product\/[^/]+$/, "/product/[id]"],
];

export function routePattern(pathname: string): string {
  return patterns.find(([re]) => re.test(pathname))?.[1] ?? "other";
}
