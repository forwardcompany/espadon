/** Identifies a single vessel by one of its unique keys. */
export type VesselIdentifier = { uuid: string } | { mmsi: number | string } | { imo: number | string };

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
export type VesselHistoryParams = VesselIdentifier & ({ days: number } | { from: Date | string; to: Date | string } | {});

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
export type PortParams = { name: string } | { uuid: string } | { unlocode: string } | { lat: number; lon: number; radius?: number };

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

/** Live position of a vessel, as returned inside list endpoints (`/vessel_inradius`, `/vessel_find`, ...). */
export type VesselSummary = {
    uuid: string;
    name: string | null;
    mmsi: number | string | null;
    imo: number | string | null;
    eni: string | null;
    country_iso: string | null;
    type: string | null;
    type_specific: string | null;
    lat: number | null;
    lon: number | null;
    speed: number | null;
    course: number | null;
    heading: number | null;
    navigation_status: string | null;
    destination: string | null;
    last_position_epoch: number | null;
    last_position_UTC: string | null;
};

/** Response of `/vessel_inradius`. */
export type VesselInradiusResponse = {
    total: number;
    next: string | null;
    vessels: VesselSummary[];
};

/** One historical position returned by `/vessel_history`. */
export type VesselHistoryEntry = VesselSummary & {
    eta_epoch: number | null;
    eta_UTC: string | null;
};

/** Response of `/vessel_history`. */
export type VesselHistoryResponse = VesselHistoryEntry[];

/** Response of `/vessel_info` (ship specifications). */
export type VesselInfoResponse = {
    uuid: string;
    name: string | null;
    mmsi: number | string | null;
    imo: number | string | null;
    eni: string | null;
    callsign: string | null;
    country_iso: string | null;
    type: string | null;
    type_specific: string | null;
    current_draught: number | null;
    gross_tonnage: number | null;
    deadweight: number | null;
    teu: number | null;
    liquid_gas_capacity: number | null;
    length: number | null;
    breadth: number | null;
    year_built: number | null;
};

/** One search result of `/vessel_find`. */
export type VesselSearchResult = VesselSummary & {
    gross_tonnage: number | null;
    deadweight: number | null;
    length: number | null;
    breadth: number | null;
    year_built: number | null;
};

/** Response of `/vessel_find`. */
export type VesselFindResponse = {
    total: number;
    next: string | null;
    vessels: VesselSearchResult[];
};

/** One search result of `/port_find`. */
export type PortSummary = {
    uuid: string;
    name: string | null;
    unlocode: string | null;
    country_iso: string | null;
    port_type: string | null;
    lat: number | null;
    lon: number | null;
};

/** Response of `/port_find`. */
export type PortFindResponse = {
    total: number;
    next: string | null;
    ports: PortSummary[];
};

/** One terminal of a port. */
export type PortTerminal = {
    uuid: string;
    name: string | null;
    lat: number | null;
    lon: number | null;
    operator_name: string | null;
};

/** Response of `/port` (port details with its terminals). */
export type PortResponse = PortSummary & {
    terminals: PortTerminal[];
};

/** Response of `/api/ext/route` (sea route). `coordinates` are `[lat, lon]` pairs. */
export type RouteResponse = {
    distance: number | null;
    duration: number | null;
    coordinates: [number, number][];
};

/** Response of `/api/ext/vessel_pro_est` (SAT-E estimated position). */
export type VesselEstimatedResponse = VesselSummary & {
    estimated: boolean;
    dest_port: string | null;
    dest_port_uuid: string | null;
    dest_port_unlocode: string | null;
    eta_epoch: number | null;
    eta_UTC: string | null;
};
