/** Identifies a single vessel by one of its unique keys. */
export type VesselIdentifier =
    | { uuid: string }
    | { mmsi: number | string }
    | { imo: number | string };

/** Parameters for the `/vessel_inradius` endpoint (static or dynamic center). */
export type VesselInradiusParams = {
    radius: number;
    type?: string;
    type_specific?: string;
    exclude?: string;
    empty?: boolean;
    nav_status?: number;
    next?: string;
} & (
    | { lat: number; lon: number }
    | { port_uuid: string }
    | { port_unlocode: string }
    | { uuid: string }
    | { mmsi: number | string }
    | { imo: number | string }
);

/** Parameters for the `/vessel_history` endpoint. */
export type VesselHistoryParams = VesselIdentifier &
    ({ days: number } | { from: Date | string; to: Date | string } | {});

/** Parameters for the `/vessel_find` endpoint. */
export type VesselFindParams = {
    name?: string;
    fuzzy?: 0 | 1;
    type?: string;
    type_specific?: string;
    empty?: boolean;
    country_iso?: string;
    gross_tonnage_min?: number;
    gross_tonnage_max?: number;
    deadweight_min?: number;
    deadweight_max?: number;
    length_min?: number;
    length_max?: number;
    breadth_min?: number;
    breadth_max?: number;
    year_built_min?: number;
    year_built_max?: number;
    next?: string;
};

/** Parameters for the `/port_find` endpoint. */
export type PortFindParams = {
    name?: string;
    uuid?: string;
    fuzzy?: 0 | 1;
    port_type?: string;
    country_iso?: string;
    unlocode?: string;
    lat?: number;
    lon?: number;
    radius?: number;
};

/** Parameters for the `/port` (port terminals) endpoint. */
export type PortParams =
    | { name: string }
    | { uuid: string }
    | { unlocode: string }
    | { lat: number; lon: number; radius?: number };

/** Parameters for the `/api/ext/route` (sea routes) endpoint. */
export type RouteParams = {
    lat_from?: number;
    lon_from?: number;
    lat_to?: number;
    lon_to?: number;
    port_uuid_from?: string;
    port_unlocode_from?: string;
    port_uuid_to?: string;
    port_unlocode_to?: string;
};
