import { allProducts } from "@/lib/catalog";

// Before: a Route Handler that exists only so the client page can fetch
// the whole catalogue after its JavaScript has loaded.
export async function GET() {
  return Response.json(allProducts);
}
