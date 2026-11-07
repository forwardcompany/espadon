import { afterEach, describe, expect, it, vi } from 'vitest';
import { Espadon } from '../src/index.js';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('dev mode (mock API)', () => {
    it('returns fake data without any HTTP call', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const esp = Espadon({ key: 'dev-key', dev: true });

        const vessel = await esp.vessel({ imo: 9525338 });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(vessel.uuid).toMatch(/^mock-uuid-/);
        expect(vessel.imo).toBe('9525338');
        expect(vessel.name).toMatch(/^MOCK VESSEL/);
    });

    it('validates and coerces mock data through the zod schemas', async () => {
        const esp = Espadon({ key: 'dev-key', dev: true });

        const pro = await esp.vesselPro({ imo: 9525338 });

        expect(pro.imo).toBe(9525338); // coerced to number by the schema
        expect(pro.timezone).toBe('Europe/Paris');
        expect(pro.eta_epoch).toBeGreaterThan(0);
    });

    it('mocks bulk calls with one fake vessel per identifier', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        const esp = Espadon({ key: 'dev-key', dev: true });

        const bulk = await esp.vesselBulk([{ imo: 9525338 }, { imo: 9249403 }]);

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(bulk.total).toBe(2);
        expect(bulk.vessels).toHaveLength(2);
        expect(bulk.vessels[0]?.imo).toBe(9525338);
        expect(bulk.vessels[1]?.imo).toBe(9249403);

        const byUuid = await esp.vesselBulk([{ uuid: 'mock-uuid-a' }, { uuid: 'mock-uuid-b' }]);
        expect(byUuid.vessels.map((v) => v.uuid)).toEqual(['mock-uuid-a', 'mock-uuid-b']);
    });

    it('mocks the untyped endpoints too', async () => {
        const esp = Espadon({ key: 'dev-key', dev: true });

        const find = await esp.vesselFind({ name: 'mock' });
        expect(find.total).toBeGreaterThan(0);
        expect(find.vessels[0]?.name).toMatch(/^MOCK VESSEL/);

        const ports = await esp.portFind({ name: 'Marseille' });
        expect(ports.ports[0]?.unlocode).toBe('FRMRS');

        const port = await esp.port({ uuid: 'mock-port-uuid-0001' });
        expect(port.terminals).toHaveLength(1);

        const route = await esp.route({ lat_from: 43.3, lon_from: 5.4, lat_to: 36.8, lon_to: -5.4 });
        expect(route.coordinates.length).toBeGreaterThan(0);

        const history = await esp.vesselHistory({ imo: 9797058, days: 7 });
        expect(history.length).toBeGreaterThan(0);

        const est = await esp.satellite({ imo: 9525338 });
        expect(est.estimated).toBe(true);
    });

    it('never mocks when NODE_ENV=production (branch is tree-shaken in prod bundles)', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response(JSON.stringify({ data: { total: 0, next: null, vessels: [] } }), { status: 200 }));
        const previousEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        try {
            const esp = Espadon({ key: 'k', dev: true });
            const res = await esp.vesselInradius({ lat: 43.3, lon: 5.4, radius: 5 });
            expect(fetchSpy).toHaveBeenCalledTimes(1);
            expect(res.total).toBe(0);
        } finally {
            process.env.NODE_ENV = previousEnv;
        }
    });

    it('still performs real HTTP calls when dev mode is not enabled', async () => {
        const fetchSpy = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue(new Response(JSON.stringify({ data: { total: 0, next: null, vessels: [] } }), { status: 200 }));
        const esp = Espadon({ key: 'real-key' });

        const res = await esp.vesselInradius({ lat: 43.3, lon: 5.4, radius: 5 });

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(res.total).toBe(0);
    });
});
