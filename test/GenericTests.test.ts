/**
 * @jest-environment jsdom
 */

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
import bodyParser from "body-parser";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import MongoMemoryServer from "mongodb-memory-server-core";
import { v4 } from "uuid";
import { CacheStorageCRUD } from "../lib/CacheStorageCRUD";
import { ClientApiStorageCRUD } from "../lib/ClientApiStorageCRUD";
import CRUD from "../lib/CRUD";
import IndexedCRUD from "../lib/IndexedCRUD";
import LocalStorageCRUD from "../lib/LocalStorageCRUD";
import MemoryCRUD from "../lib/MemoryCRUD";
import MongoCRUD from "../lib/MongoCRUD";
import { ServerApiStorage } from "../lib/ServerApiStorage";
require("fake-indexeddb/auto");

let expressPort = 3001;

describe.each([
    // MEMORY
    [() => new MemoryCRUD<any>(), "MemoryCRUD"],
    // CACHE
    [() => new CacheStorageCRUD<any>(new MemoryCRUD<any>(), new MemoryCRUD<any>(), false), "CacheStorageCRUD"],
    // LOCAL STORAGE
    [() => {
        localStorage.clear();
        jest.clearAllMocks();
        return new LocalStorageCRUD<any>(Math.random() + "-test")
    }, "LocalStorageCRUD"],
    // INDEXED DB
    [() => new IndexedCRUD<any>("test-collection" + v4()), "IndexedStorageCRUD"],
    // MONGO DB
    [async () => {
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        let client = new MongoClient(uri);
        await client.connect();
        let db = client.db("test");
        setTimeout(async () => {
            await client.close();
            await mongod.stop();
        }, 5000);
        return new MongoCRUD<any>(db, "test-collection");
    }, "MongoCRUD"],
    // EXPRESS API
    [async () => {
        return new Promise(async (resolve) => {
            const app = express();

            app.use(bodyParser.json());

            const serverStorage = new ServerApiStorage({
                documentsLimit: 10,
                maximumDocumentSize: 100
            });

            const memoryStorage = new MemoryCRUD<any>();

            // @ts-ignore
            app.post("/storage/:action", async (req: Request, res: Response) => {
                // @ts-ignore
                const response = await serverStorage.request(req.params.action as any, req.body, memoryStorage);
                // @ts-ignore
                res.json(response);
            });

            const port = expressPort++;

            const CRUD = new ClientApiStorageCRUD<any>(`http://localhost:${port}/storage`, console);

            let server = app.listen(port, () => {
                console.log("Server started!");
                setTimeout(() => server.close(), 5000);
                resolve(CRUD);
            });

        });
    }, "Express API"]
    // @ts-ignore
])(`Generic CRUD test: $1`, (generateCrud: () => Promise<CRUD<object>> | CRUD<object>, name) => {
    it('should set & get', async () => {
        const CRUD = await generateCrud();

        // object
        const id = await CRUD.create({ x: "100" });
        const result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "100" });
    });

    it("should read undefined", async () => {
        const CRUD = await generateCrud();
        const result = await CRUD.read("");
        expect(result).toBeUndefined();
    });

    it('should create, update & get', async () => {
        const CRUD = await generateCrud();
        const id = await CRUD.create({ x: "100" });
        await CRUD.update(id, { x: "200" });
        const result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "200" });
    });

    it('should update non existing document to create it', async () => {
        const CRUD = await generateCrud();
        const id = new ObjectId().toString();
        await CRUD.update(id, { x: "200" });
        const result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "200" });
    });

    it('should set, get & remove and get undefined', async () => {
        const CRUD = await generateCrud();
        const id = await CRUD.create({ x: "100" });
        let result = await CRUD.read(id);
        expect(result).toStrictEqual({ id, x: "100" });
        await CRUD.remove(result!.id);
        result = await CRUD.read(id);
        expect(result).toBeUndefined();
    });

    it('should get all', async () => {
        const CRUD = await generateCrud();
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

    it('should return 0 count and empty array of getAll when empty' + ": " + name, async () => {
        const CRUD = await generateCrud();
        expect(await CRUD.count()).toBe(0);
        expect((await CRUD.getAll()).length).toBe(0);
    });

});
