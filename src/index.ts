import { z } from 'zod/mini';
import { vesselSchema, vesselProSchema, vesselBulkSchema } from './schemas.js';
import { formatDay } from './format.js';
import type {
    VesselIdentifier,
    VesselInradiusParams,
    VesselHistoryParams,
    VesselFindParams,
    PortFindParams,
    PortParams,
    RouteParams,
} from './types.js';

export type { VesselIdentifier, VesselInradiusParams, VesselHistoryParams, VesselFindParams, PortFindParams, PortParams, RouteParams };

export class EspadonClient {
    #apiKey: string = '';
    #baseUrl: string = 'https://api.datalastic.com/api/';
    #version: string = 'v0';
    #validate: boolean = true;
    #debug: boolean = false;
    #timeout: number | null = null;

    /**
     * Internal method to set the API key. Called by the exported setup function.
     */
    setup({ key, baseUrl, version, validate, debug, timeout }: EspadonOptions) {
        if (!key) throw new Error('Datalastic API key must be provided.');
        this.#apiKey = key;
        if (baseUrl !== undefined) this.#baseUrl = baseUrl;
        if (version !== undefined) this.#version = version;
        if (validate !== undefined) this.#validate = validate;
        if (debug !== undefined) this.#debug = debug;
        if (timeout !== undefined) this.#timeout = timeout;
    }

    /**
     * Constructs the full URL for a Datalastic API call.
     */
    #buildUrl(endpoint: string, params: Record<string, any> = {}, prefix?: string): string {
        const url = new URL(this.#baseUrl + (prefix ?? this.#version) + endpoint);
        for (const key in params) {
            if (params[key] !== undefined) {
                url.searchParams.append(key, String(params[key]));
            }
        }
        url.searchParams.append('api-key', this.#apiKey);
        if (this.#debug) console.log('CALLING', url.href);
        return url.toString();
    }

    /**
     * Constructs a URL from an array of [key, value] entries, supporting repeated keys (needed by /vessel_bulk).
     */
    #buildUrlMulti(endpoint: string, entries: [string, string | number][]): string {
        const url = new URL(this.#baseUrl + this.#version + endpoint);
        for (const [key, value] of entries) {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        }
        url.searchParams.append('api-key', this.#apiKey);
        if (this.#debug) console.log('CALLING', url.href);
        return url.toString();
    }

    /**
     * Sends a request and returns the raw JSON body.
     */
    async #fetch(url: string): Promise<any> {
        const response = await fetch(url, {
            signal: this.#timeout ? AbortSignal.timeout(this.#timeout) : undefined,
        });
        if (!response.ok) throw new Error(`Datalastic HTTP Error ${response.status} for ${url}`);
        return response.json();
    }

    /**
     * Calls an endpoint, unwraps `{ data, meta }` and returns only `data`.
     */
    async #callEndpoint<T extends z.ZodMiniType<any>>(
        endpoint: string,
        schema: T | null,
        params: Record<string, any> = {},
        prefix?: string,
    ): Promise<z.infer<T>> {
        const url = this.#buildUrl(endpoint, params, prefix);
        const json = await this.#fetch(url);
        const data = json.data ?? json;
        if (schema && this.#validate) {
            return schema.parse(data);
        }
        return data;
    }

    /**
     * Calls an endpoint with repeated URL keys, unwraps `{ data, meta }`.
     */
    async #callEndpointMulti<T extends z.ZodMiniType<any>>(
        endpoint: string,
        schema: T | null,
        entries: [string, string | number][],
    ): Promise<z.infer<T>> {
        const url = this.#buildUrlMulti(endpoint, entries);
        const json = await this.#fetch(url);
        const data = json.data ?? json;
        if (schema && this.#validate) {
            return schema.parse(data);
        }
        return data;
    }

    /**
     * Calls any endpoint — useful for unsupported or new endpoints.
     */
    async any<T extends z.ZodMiniType<any>>(endpoint: string, schema: T | null = z.any() as unknown as T, params: Record<string, any> = {}) {
        return this.#callEndpoint(endpoint, schema, params);
    }

    /**
     * Basic live vessel tracking (`/vessel`).
     *
     * Returns vessel name, MMSI, IMO, UUID, country, type/subtype, position, speed, course, heading, navigational status, destination, and timestamp.
     */
    async vessel(params: VesselIdentifier | string) {
        const normalized = typeof params === 'string' ? { uuid: params } : params;
        return this.#callEndpoint('/vessel', vesselSchema, normalized);
    }

    /**
     * Pro live vessel tracking (`/vessel_pro`).
     *
     * Everything from basic plus current draught, departure/arrival ports (name + UN/LOCODE), ATD and ETA.
     */
    async vesselPro(params: VesselIdentifier | string) {
        const normalized = typeof params === 'string' ? { uuid: params } : params;
        return this.#callEndpoint('/vessel_pro', vesselProSchema, normalized);
    }

    /**
     * Bulk live vessel tracking (`/vessel_bulk`).
     *
     * Fetches up to 100 vessels in a single call. Accepts an array of identifiers — repeated keys are supported
     */
    async vesselBulk(params: VesselIdentifier[]) {
        const entries: [string, string | number][] = params.flatMap((id) => Object.entries(id) as [string, string | number][]);
        return this.#callEndpointMulti('/vessel_bulk', vesselBulkSchema, entries);
    }

    /**
     * Location traffic tracking (`/vessel_inradius`).
     *
     * Scans an area around a static point (lat/lon, port UUID or UNLOCODE) or a dynamic center (vessel UUID/MMSI/IMO) within a given radius (in nautical miles, max 50 NM).
     */
    async vesselInradius(params: VesselInradiusParams) {
        return this.#callEndpoint('/vessel_inradius', null, params as any);
    }

    /**
     * Historical vessel data (`/vessel_history`).
     *
     * Returns past positions, speed, course, heading, destination, etc.
     * Specify a time range with `{ from, to }` (dates) or `{ days }`. `from` and `to` are formatted to `YYYY-MM-DD` automatically.
     */
    async vesselHistory(params: VesselHistoryParams) {
        const formatted: Record<string, any> = { ...params };
        if ('from' in formatted && formatted.from !== undefined) {
            formatted.from = formatDay(formatted.from);
        }
        if ('to' in formatted && formatted.to !== undefined) {
            formatted.to = formatDay(formatted.to);
        }
        return this.#callEndpoint('/vessel_history', null, formatted);
    }

    /**
     * Ship specs info (`/vessel_info`).
     *
     * Returns detailed vessel specifications: name, IMO, MMSI, UUID, call sign, country, type/subtype, draught, TEU, deadweight, liquid gas capacity, length, breadth, year built, and more.
     */
    async vesselInfo(params: VesselIdentifier | string) {
        const normalized = typeof params === 'string' ? { uuid: params } : params;
        return this.#callEndpoint('/vessel_info', null, normalized);
    }

    /**
     * Vessel finder (`/vessel_find`).
     *
     * Searches vessels by name, type, country, tonnage, deadweight, dimensions, year built, etc. Supports fuzzy name matching and pagination via `next`.
     */
    async vesselFind(params: VesselFindParams) {
        return this.#callEndpoint('/vessel_find', null, params as any);
    }

    /**
     * Port finder (`/port_find`).
     *
     * Searches ports by name, UUID, UNLOCODE, type, country, or geo-coordinates with radius. Supports fuzzy name matching.
     */
    async portFind(params: PortFindParams) {
        return this.#callEndpoint('/port_find', null, params as any);
    }

    /**
     * Port terminals (`/port`).
     *
     * Returns detailed port information including associated terminals, coordinates, operator names, and contact details.
     */
    async port(params: PortParams) {
        return this.#callEndpoint('/port', null, params as any);
    }

    /**
     * Sea routes (`/api/ext/route`).
     *
     * Computes the optimal maritime route between two points.
     * Points can be specified as coordinates (`lat_from`/`lon_from`, `lat_to`/`lon_to`), port UUIDs, or UN/LOCODEs.
     */
    async route(params: RouteParams) {
        return this.#callEndpoint('/route', null, params as any, 'ext');
    }

    /**
     * SAT-E estimated position (`/api/ext/vessel_pro_est`).
     *
     * Returns an estimated vessel position even when the ship is out of AIS range, calculated from the last known location, destination port, and route-based ETA.
     */
    async satellite(params: VesselIdentifier | string) {
        const normalized = typeof params === 'string' ? { uuid: params } : params;
        return this.#callEndpoint('/vessel_pro_est', null, normalized, 'ext');
    }
}

const client = new EspadonClient();

export interface EspadonOptions {
    key: string;
    baseUrl?: string;
    version?: 'v0';
    validate?: boolean;
    debug?: boolean;
    timeout?: number | null;
}

export function Espadon(params: EspadonOptions) {
    client.setup(params);
    return client;
}
