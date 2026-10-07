# Cómo actualizar la información de un grupo

Todos los datos viven en `src/data/grupos.json`. Cada grupo es un objeto así:

```json
{
  "id": 815,
  "nombre": "Fénix Escarlata",
  "municipio": "Cali",
  "localidad": null,
  "direccion": "Parque del Amor. Avenida 6ta con calle 70",
  "ubicacion": { "lat": 3.493053, "lng": -76.520585 },
  "reunion": { "dia": "sabado", "inicio": "14:00", "fin": "18:00" },
  "ramas": ["lobatos", "scouts", "nomadas", "rovers"],
  "contacto": {
    "email": "valle.grupo815@scout.org.co",
    "whatsapp": null,
    "instagram": "https://www.instagram.com/fenix_escarlata_815",
    "facebook": null,
    "web": null
  },
  "actualizado": "2025-05"
}
```

## Reglas

| Campo                            | Formato                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`                             | Número del grupo. Único.                                                                               |
| `municipio`                      | Uno de los 42 municipios del Valle, escrito igual que en `src/data/region.ts`.                         |
| `localidad`                      | Corregimiento o barrio relevante (p. ej. `"Rozo"`), o `null`.                                          |
| `ubicacion`                      | Coordenadas decimales (clic derecho en Google Maps → copiar). Deben caer dentro del Valle.             |
| `reunion.dia`                    | `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado` o `domingo`.                             |
| `reunion.inicio` / `fin`         | Formato 24 h `HH:mm`. `fin` puede ser `null`.                                                          |
| `ramas`                          | Cualquier combinación de `cachorros`, `lobatos`, `scouts`, `nomadas`, `rovers`.                        |
| `contacto.email`                 | Solo correos `@scout.org.co`, o `null`.                                                                |
| `contacto.whatsapp`              | `57` + 10 dígitos, sin `+` ni espacios (p. ej. `"573001234567"`). **Solo con autorización del grupo.** |
| `instagram` / `facebook` / `web` | URL completa con `https://`, o `null`.                                                                 |
| `actualizado`                    | Mes de la última verificación, `YYYY-MM`.                                                              |

No agregues otros campos (nombres de dirigentes, teléfonos personales…): el build los rechaza.

## Pasos

1. Edita `src/data/grupos.json`.
2. Verifica: `npm test && npm run build`.
3. Commit y push a `main` (o abre un PR para ver una vista previa en Vercel).

Si hay un error, el mensaje dice exactamente qué grupo y qué campo corregir:

```
Datos de grupos inválidos (src/data/grupos.json):
  - grupo 117 (Leones): contacto.email: solo se publican correos @scout.org.co
  - grupo 815 (Fénix Escarlata): ubicacion.lat: Too big: expected number to be <=5.1
```
