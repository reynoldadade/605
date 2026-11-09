export function routePattern(pathname: string) {
  return pathname.replace(/\/product\/[^/]+$/, "/product/[id]");
}
