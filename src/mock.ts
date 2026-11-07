type MockParams = Record<string, unknown>;

/** Fixed timestamp so mock responses are deterministic. */
const MOCK_NOW_EPOCH = 1_770_000_000;
const MOCK_NOW_UTC = new Date(MOCK_NOW_EPOCH * 1000).toISOString();
const MOCK_ETA_EPOCH = MOCK_NOW_EPOCH + 172_800;
const MOCK_ETA_UTC = new Date(MOCK_ETA_EPOCH * 1000).toISOString();

function firstValue(params: MockParams, key: string): string | undefined {
    const value = params[key];
    const first = Array.isArray(value) ? value.find((v) => v !== undefined) : value;
    return first === undefined ? undefined : String(first);
}

/** Turns repeated URL keys (`uuid=a&uuid=b&imo=1`) into one params object per identifier. */
function collectIdentifiers(params: MockParams): MockParams[] {
    const keys = ['uuid', 'mmsi', 'imo'];
    const values = keys.map((key) => {
        const value = params[key];
        return Array.isArray(value) ? value : value === undefined ? [] : [value];
    });
    const length = Math.max(0, ...values.map((v) => v.length));
    if (length === 0) return [{}];
    return Array.from({ length }, (_, i) => {
        const id: MockParams = {};
        keys.forEach((key, j) => {
            if (values[j][i] !== undefined) id[key] = values[j][i];
        });
        return id;
    });
}

function mockVessel(params: MockParams, index = 0): Record<string, unknown> {
    return {
        uuid: firstValue(params, 'uuid') ?? `mock-uuid-${String(index + 1).padStart(4, '0')}`,
        name: `MOCK VESSEL ${index + 1}`,
        mmsi: firstValue(params, 'mmsi') ?? '211000000',
        imo: firstValue(params, 'imo') ?? '9000001',
        eni: null,
        country_iso: 'FR',
        type: 'Cargo',
        type_specific: 'Container Ship',
        lat: 43.2965 + index * 0.01,
        lon: 5.3698,
        speed: 12.4,
        course: 180.5,
        heading: 181,
        navigation_status: 'Under way using engine',
        navigational_status: 'Under way using engine',
        destination: 'MOCK PORT',
        last_position_epoch: MOCK_NOW_EPOCH,
        last_position_UTC: MOCK_NOW_UTC,
    };
}

function mockVesselPro(params: MockParams, index = 0): Record<string, unknown> {
    return {
        ...mockVessel(params, index),
        current_draught: 12.5,
        dest_port: 'MOCK PORT DEST',
        dest_port_uuid: 'mock-port-uuid-dest',
        dest_port_unlocode: 'FRMRS',
        dep_port: 'MOCK PORT DEP',
        dep_port_uuid: 'mock-port-uuid-dep',
        dep_port_unlocode: 'NLRTM',
        atd_epoch: MOCK_NOW_EPOCH - 86_400,
        atd_UTC: new Date((MOCK_NOW_EPOCH - 86_400) * 1000).toISOString(),
        eta_epoch: MOCK_ETA_EPOCH,
        eta_UTC: MOCK_ETA_UTC,
        timezone_offset_sec: 3600,
        timezone: 'Europe/Paris',
    };
}

function mockPort(params: MockParams): Record<string, unknown> {
    return {
        uuid: firstValue(params, 'uuid') ?? 'mock-port-uuid-0001',
        name: firstValue(params, 'name') ?? 'MOCK PORT',
        unlocode: firstValue(params, 'unlocode') ?? 'FRMRS',
        country_iso: 'FR',
        port_type: 'Sea',
        lat: 43.3,
        lon: 5.4,
    };
}

/**
 * Returns the fake `data` payload for an endpoint, mimicking the real API.
 */
export function mockEndpoint(endpoint: string, params: MockParams = {}, prefix?: string): unknown {
    switch (endpoint) {
        case '/vessel':
            return mockVessel(params);
        case '/vessel_pro':
            return mockVesselPro(params);
        case '/vessel_bulk': {
            const vessels = collectIdentifiers(params).map((id, i) => ({
                ...mockVessel(id, i),
                eta_epoch: MOCK_ETA_EPOCH,
                eta_UTC: MOCK_ETA_UTC,
            }));
            return { total: vessels.length, vessels };
        }
        case '/vessel_inradius': {
            const vessels = [mockVessel({}, 0), mockVessel({}, 1), mockVessel({}, 2)];
            return { total: vessels.length, next: null, vessels };
        }
        case '/vessel_history':
            return [0, 1, 2].map((i) => ({ ...mockVessel(params, i), eta_epoch: null, eta_UTC: null }));
        case '/vessel_info':
            return {
                ...mockVesselPro(params),
                callsign: 'MOCKCS1',
                gross_tonnage: 52_000,
                deadweight: 61_000,
                teu: 4200,
                liquid_gas_capacity: null,
                length: 299.9,
                breadth: 40.0,
                year_built: 2012,
            };
        case '/vessel_find': {
            const vessels = collectIdentifiers(params).map((id, i) => ({
                ...mockVessel(id, i),
                gross_tonnage: 52_000,
                deadweight: 61_000,
                length: 299.9,
                breadth: 40.0,
                year_built: 2012,
            }));
            return { total: vessels.length, next: null, vessels };
        }
        case '/port_find':
            return { total: 1, next: null, ports: [mockPort(params)] };
        case '/port':
            return {
                ...mockPort(params),
                terminals: [
                    {
                        uuid: 'mock-terminal-uuid-0001',
                        name: 'MOCK TERMINAL 1',
                        lat: 43.31,
                        lon: 5.41,
                        operator_name: 'MOCK OPERATOR',
                    },
                ],
            };
        case '/route':
            return {
                distance: 612.5,
                duration: 3 * 86_400 + 3600,
                coordinates: [
                    [43.2965, 5.3698],
                    [36.8065, -5.3698],
                ],
            };
        case '/vessel_pro_est':
            return { ...mockVesselPro(params), estimated: true };
        default:
            return { mock: true, endpoint, prefix: prefix ?? null, params };
    }
}
