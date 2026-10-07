import { describe, expect, it } from "vitest";
import { directionsUrl, formatWhatsapp, mailtoUrl, wazeUrl, whatsappUrl } from "@/lib/contact";

describe("contact", () => {
  it("arma el enlace de WhatsApp con mensaje codificado", () => {
    expect(whatsappUrl("573001234567", "Hola, ¿info?")).toBe(
      "https://wa.me/573001234567?text=Hola%2C%20%C2%BFinfo%3F",
    );
  });

  it("arma mailto con asunto", () => {
    expect(mailtoUrl("valle.grupo815@scout.org.co", "Inscripción — Grupo 815")).toBe(
      "mailto:valle.grupo815@scout.org.co?subject=Inscripci%C3%B3n%20%E2%80%94%20Grupo%20815",
    );
  });

  it("arma enlaces de navegación", () => {
    const p = { lat: 3.493053, lng: -76.520585 };
    expect(directionsUrl(p)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=3.493053%2C-76.520585",
    );
    expect(wazeUrl(p)).toBe("https://waze.com/ul?ll=3.493053%2C-76.520585&navigate=yes");
  });

  it("formatea el número para mostrar", () => {
    expect(formatWhatsapp("573001234567")).toBe("+57 300 123 4567");
  });
});
