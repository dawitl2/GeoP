import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const source = await readFile(
    path.join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-shared.mjs"),
    "utf8",
  );
  return new Response(source, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
