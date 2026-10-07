/** Los 42 municipios del Valle del Cauca. */
export const MUNICIPIOS = [
  "Alcalá",
  "Andalucía",
  "Ansermanuevo",
  "Argelia",
  "Bolívar",
  "Buenaventura",
  "Buga",
  "Bugalagrande",
  "Caicedonia",
  "Cali",
  "Calima",
  "Candelaria",
  "Cartago",
  "Dagua",
  "El Águila",
  "El Cairo",
  "El Cerrito",
  "El Dovio",
  "Florida",
  "Ginebra",
  "Guacarí",
  "Jamundí",
  "La Cumbre",
  "La Unión",
  "La Victoria",
  "Obando",
  "Palmira",
  "Pradera",
  "Restrepo",
  "Riofrío",
  "Roldanillo",
  "San Pedro",
  "Sevilla",
  "Toro",
  "Trujillo",
  "Tuluá",
  "Ulloa",
  "Versalles",
  "Vijes",
  "Yotoco",
  "Yumbo",
  "Zarzal",
] as const;
export type Municipio = (typeof MUNICIPIOS)[number];

/** Rectángulo aproximado del departamento; sirve para detectar coordenadas erradas. */
export const VALLE_BOUNDS = { latMin: 3.0, latMax: 5.1, lngMin: -77.6, lngMax: -75.6 } as const;
export const VALLE_CENTER = { lat: 3.9, lng: -76.4 } as const;
export const VALLE_ZOOM = 9;

export const REGION = {
  nombre: "Región Valle · Scouts de Colombia",
  web: "https://vallescout.org.co/",
  nacional: "https://scout.org.co/",
} as const;

export const REPO_URL = "https://github.com/joseuribeh98/scout-groups-finder";
