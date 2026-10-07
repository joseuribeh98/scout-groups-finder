import { z } from "zod";
import { RAMA_IDS, sortRamas } from "@/data/ramas";
import { MUNICIPIOS, VALLE_BOUNDS } from "@/data/region";

export const DIAS = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;
export type Dia = (typeof DIAS)[number];

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "debe tener formato HH:mm (24 h)");
const httpsUrl = z.url({ protocol: /^https$/, error: "debe ser una URL https://" }).nullable();
const texto = z.string().trim().min(1, "no puede estar vacío");

export const reunionSchema = z
  .strictObject({ dia: z.enum(DIAS), inicio: hora, fin: hora.nullable() })
  .refine((r) => r.fin === null || r.fin > r.inicio, {
    message: "debe ser posterior a la hora de inicio",
    path: ["fin"],
  });
export type Reunion = z.output<typeof reunionSchema>;

export const grupoSchema = z.strictObject({
  id: z.number().int().positive(),
  nombre: texto,
  municipio: z.enum(MUNICIPIOS),
  localidad: texto.nullable(),
  direccion: texto,
  ubicacion: z.strictObject({
    lat: z.number().min(VALLE_BOUNDS.latMin).max(VALLE_BOUNDS.latMax),
    lng: z.number().min(VALLE_BOUNDS.lngMin).max(VALLE_BOUNDS.lngMax),
  }),
  reunion: reunionSchema,
  ramas: z
    .array(z.enum(RAMA_IDS))
    .min(1, "debe tener al menos una rama")
    .refine((rs) => new Set(rs).size === rs.length, "tiene ramas repetidas")
    .transform(sortRamas),
  contacto: z.strictObject({
    email: z
      .email("debe ser un correo válido")
      .refine((e) => e.endsWith("@scout.org.co"), "solo se publican correos @scout.org.co")
      .nullable(),
    whatsapp: z
      .string()
      .regex(/^57\d{10}$/, "debe tener formato 57 + 10 dígitos, sin + ni espacios")
      .nullable(),
    instagram: httpsUrl,
    facebook: httpsUrl,
    web: httpsUrl,
  }),
  actualizado: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "debe tener formato YYYY-MM"),
});
export type Grupo = z.output<typeof grupoSchema>;

const gruposSchema = z.array(grupoSchema).superRefine((grupos, ctx) => {
  const vistos = new Set<number>();
  grupos.forEach((g, i) => {
    if (vistos.has(g.id)) {
      ctx.addIssue({ code: "custom", message: `id ${g.id} repetido`, path: [i, "id"] });
    }
    vistos.add(g.id);
  });
});

function etiqueta(raw: unknown, index: PropertyKey | undefined): string {
  if (typeof index !== "number" || !Array.isArray(raw)) return "grupos.json";
  const g: unknown = raw[index];
  if (typeof g === "object" && g !== null && "id" in g && "nombre" in g) {
    return `grupo ${String(g.id)} (${String(g.nombre)})`;
  }
  return `grupo en la posición ${index}`;
}

/** Valida los datos de grupos. Si algo falla, lanza un Error que lista todos los problemas. */
export function parseGrupos(raw: unknown): Grupo[] {
  const result = gruposSchema.safeParse(raw);
  if (result.success) return result.data;

  const lineas = result.error.issues.map((issue) => {
    const [index, ...resto] = issue.path;
    const campo = resto.length > 0 ? resto.map(String).join(".") : "(registro)";
    return `  - ${etiqueta(raw, index)}: ${campo}: ${issue.message}`;
  });
  throw new Error(`Datos de grupos inválidos (src/data/grupos.json):\n${lineas.join("\n")}`);
}
