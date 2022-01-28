import { Db, MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import CRUD from "../lib/CRUD";
import MongoCRUD from "../lib/MongoCRUD";

describe('MongoCRUD', () => {

    let mongod;
    let client: MongoClient;
    let db: Db;
    let CRUD: CRUD<{ x: string }>;

    beforeEach(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        client = new MongoClient(uri);
        await client.connect();
        db = client.db("test");
        CRUD = new MongoCRUD<{ x: string }>(db, "test-collection");
    });

    afterEach(async () => {
        await client.close();
        await mongod.stop();
    })

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
        await CRUD.remove(result.id);
        result = await CRUD.read(id);
        expect(result).toBeUndefined();
    });

    it('should get all', async () => {
        let keys = [];
        keys.push(await CRUD.create({ x: "x1" }));
        keys.push(await CRUD.create({ x: "x2" }));
        keys.push(await CRUD.create({ x: "x3" }));
        let all = await CRUD.getAll();
        expect(all).toStrictEqual([
            { id: keys[0], x: "x1" },
            { id: keys[1], x: "x2" },
            { id: keys[2], x: "x3" },
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