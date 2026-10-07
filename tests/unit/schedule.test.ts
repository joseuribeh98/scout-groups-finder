import { describe, expect, it } from "vitest";
import { formatHora, formatReunion } from "@/lib/schedule";

describe("schedule", () => {
  it("formatea horas en 12 h", () => {
    expect(formatHora("14:00", "es")).toBe("2:00 p. m.");
    expect(formatHora("14:00", "en")).toBe("2:00 PM");
    expect(formatHora("10:30", "es")).toBe("10:30 a. m.");
    expect(formatHora("12:00", "en")).toBe("12:00 PM");
    expect(formatHora("00:15", "en")).toBe("12:15 AM");
  });

  it("formatea una reunión con inicio y fin", () => {
    const r = { dia: "sabado", inicio: "14:00", fin: "18:00" } as const;
    expect(formatReunion(r, "es")).toBe("Sábados, 2:00 p. m. – 6:00 p. m.");
    expect(formatReunion(r, "en")).toBe("Saturdays, 2:00 PM – 6:00 PM");
  });

  it("formatea una reunión sin hora de fin", () => {
    const r = { dia: "sabado", inicio: "14:30", fin: null } as const;
    expect(formatReunion(r, "es")).toBe("Sábados, desde las 2:30 p. m.");
    expect(formatReunion(r, "en")).toBe("Saturdays, from 2:30 PM");
  });

  it("formatea domingos", () => {
    expect(formatReunion({ dia: "domingo", inicio: "10:00", fin: "12:30" }, "es")).toBe(
      "Domingos, 10:00 a. m. – 12:30 p. m.",
    );
  });
});
