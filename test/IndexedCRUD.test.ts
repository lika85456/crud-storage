/**
 * @jest-environment jsdom
 */
import { v4 } from 'uuid';
import CRUD from "../lib/CRUD";
import IndexedCRUD from "../lib/IndexedCRUD";
require("fake-indexeddb/auto");

describe('LocalStorageCRUD', () => {

    let CRUD: CRUD<{ x: string }>;

    beforeEach(async () => {
        CRUD = new IndexedCRUD<{ x: string }>("test-collection" + v4());
    });

    it('should set & get', async () => {
        const id = await CRUD.create({ x: "100" });
        const result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "100" });
    });

    it('should set twice the same document & get', async () => {
        const id = await CRUD.create({ x: "100" });
        await CRUD.update(id, { x: "200" });
        const result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "200" });
    });

    it('should set, get & remove', async () => {
        const id = await CRUD.create({ x: "100" });
        let result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "100" });
        await CRUD.remove(result!.id);
        result = await CRUD.read(id);
        expect(result).toBeUndefined();
    });

    it('should get all', async () => {
        let keys = [];
        keys.push(await CRUD.create({ x: "x1" }));
        keys.push(await CRUD.create({ x: "x2" }));
        keys.push(await CRUD.create({ x: "x3" }));
        let all = await CRUD.getAll();

        expect(all).toEqual([
            { x: "x1", id: keys[0] },
            { x: "x2", id: keys[1] },
            { x: "x3", id: keys[2] },
        ]);

        expect(keys).toStrictEqual(await CRUD.list());

        await CRUD.remove(keys[0]);
        all = await CRUD.getAll();
        expect(all).toStrictEqual([
            { id: keys[1], x: "x2" },
            { id: keys[2], x: "x3" },
        ]);
    });
});