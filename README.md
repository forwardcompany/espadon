# Espadon for Datalastic

**Espadon** 🐟 is a lightweight 🪽 (~50 kB) universal client for the Datalastic API 🌎, built in Typescript with only 1 dependency, Zod, which formats the data for you ⭐️.

[Report a bug](https://github.com/forwardcompany/espadon/issues) — [Forum](https://github.com/forwardcompany/espadon/discussions/categories/q-a)

## Installation

```sh
npm install espadon
# or
pnpm install espadon
# or
deno install npm:espadon
# ...
```

## Quick usage

```ts
import { Espadon } from 'espadon';

const esp = Espadon({ key: process.env.API_KEY! });

let vessel = await esp.vessel({ imo: 9525338 });
console.log(vessel.name);
```

## Options

The `Espadon` constructor supports the following options.

| Option     | Description                      | Default                           |
| :--------- | :------------------------------- | :-------------------------------- |
| `key`      | Your API secret key              | _None_ (required)                 |
| `baseUrl`  | The base endpoint URL            | `https://api.datalastic.com/api/` |
| `version`  | The API version                  | `v0`                              |
| `validate` | Validates JSON and coerces data  | `true`                            |
| `debug`    | Logs the URL before the request  | `false`                           |
| `timeout`  | Requests timeout in milliseconds | `null`                            |

## Endpoints

This is the list of currently supported endpoints. If yours is not in this list, please [open a request](https://github.com/forwardcompany/espadon/issues).

### Live vessel tracking

```ts
// Basic live tracking by IMO, MMSI or UUID
let data = await esp.vessel({ imo: 9525338 });
let data = await esp.vessel({ mmsi: 566093000 });
let data = await esp.vessel('b8625b67-7142-cfd1-7b85-595cebfe4191');
// Pro live tracking with draught, departure/arrival ports, ATD, ETA
let data = await esp.vesselPro({ imo: 9525338 });
// Bulk with up to 100 vessels in a single call
let data = await esp.vesselBulk([
    { imo: 9525338 },
    { imo: 9249403 },
    { mmsi: 235362000 },
    // ...
]);
```

### Location traffic tracking

```ts
// Scan an area around coordinates or a port
let data = await esp.vesselInradius({ lat: 29.15, lon: -89.25, radius: 3 });
let data = await esp.vesselInradius({ port_unlocode: 'NLRTM', radius: 10, type: 'Cargo' });
// Scan an area around a vessel
let data = await esp.vesselInradius({ mmsi: 566093000, radius: 5 });
```

### Historical vessel data

```ts
// By number of days
let data = await esp.vesselHistory({ imo: 9797058, days: 7 });
// By date range (Date objects or strings, formatted automatically)
let data = await esp.vesselHistory({ imo: 9797058, from: '2025-06-01', to: '2025-06-03' });
```

### Vessel specs info

```ts
// Detailed vessel specifications (draught, TEU, deadweight, dimensions…)
let data = await esp.vesselInfo({ mmsi: 566093000 });
```

### Vessel finder

```ts
// Search vessels by name, type, country, tonnage, dimensions…
let data = await esp.vesselFind({ name: 'eric', fuzzy: 1 });
let data = await esp.vesselFind({ type: 'Cargo', country_iso: 'SG', gross_tonnage_min: 20000 });
```

### Port finder

```ts
// Search ports by name, UNLOCODE, country or coordinates
let data = await esp.portFind({ name: 'rotterdam', fuzzy: 1, port_type: 'port' });
let data = await esp.portFind({ unlocode: 'ESMPG' });
```

### Port terminals

```ts
// Detailed port info with terminals, operators and contact details
let data = await esp.portInfo({ unlocode: 'ESMPG' });
```

### Sea routes

```ts
// Optimal maritime route between two points (coordinates, UUIDs or UN/LOCODEs)
let data = await esp.route({ port_unlocode_from: 'FIHEL', port_unlocode_to: 'EETLL' });
let data = await esp.route({ port_unlocode_from: 'FIHEL', lat_to: 33.7, lon_to: -119 });
```

### Satellite estimated position

```ts
// Estimated vessel position when out of AIS range
let data = await esp.satellite({ imo: 9156462 });
```

### Any

```ts
// Any unsupported endpoint
let data = await esp.any('/unsupported-endpoint', null, { foo: 'bar' });
```

This method allows you to use `espadon` even for unsupported endpoints if an API update occurs. You can also provide a schema to validate the output.
