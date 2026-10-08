import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface Rule {
  source: string;
  headers: { key: string; value: string }[];
}
const { headers } = JSON.parse(readFileSync("vercel.json", "utf8")) as { headers: Rule[] };
const header = (source: string, key: string) =>
  headers.find((r) => r.source === source)?.headers.find((h) => h.key === key)?.value;

describe("vercel.json", () => {
  it("envía por cabecera las directivas de CSP que un <meta> no puede expresar", () => {
    const csp = header("/(.*)", "Content-Security-Policy") ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(header("/(.*)", "X-Frame-Options")).toBe("DENY");
  });

  it("cachea las imágenes estáticas con revalidación", () => {
    const cc = header("/(og/.*|favicon.png|apple-touch-icon.png)", "Cache-Control");
    expect(cc).toBe("public, max-age=86400, stale-while-revalidate=604800");
  });
});
