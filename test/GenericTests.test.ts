/**
 * @jest-environment jsdom
 */

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
import { MongoClient, ObjectId } from "mongodb";
import MongoMemoryServer from "mongodb-memory-server-core";
import { v4 } from "uuid";
import CacheStorage from "../lib/CacheStorage";
import Storage from "../lib/Storage";
import IndexedStorage from "../lib/IndexedStorage";
import LocalStorage from "../lib/LocalStorage";
import MemoryStorage from "../lib/MemoryStorage";
import MongoStorage from "../packages/MongoStorage/MongoStorage";
require("fake-indexeddb/auto");


describe.each([
    // MEMORY
    [() => new MemoryStorage<any>(), "MemoryCRUD"],
    // CACHE
    [() => new CacheStorage<any>(new MemoryStorage<any>(), new MemoryStorage<any>(), false), "CacheStorageCRUD"],
    // LOCAL STORAGE
    [() => {
        localStorage.clear();
        jest.clearAllMocks();
        return new LocalStorage<any>(Math.random() + "-test")
    }, "LocalStorageCRUD"],
    // INDEXED DB
    [() => new IndexedStorage<any>("test-collection" + v4()), "IndexedStorageCRUD"],
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
        return new MongoStorage<any>(db, "test-collection");
    }, "MongoCRUD"]
    // @ts-ignore
])(`Generic Storage test: $1`, (generateStorage: () => Promise<Storage<object>> | Storage<object>, name) => {
    it(`should set & get: ${name}`, async () => {
        const Storage = await generateStorage();

        const objectToStore = {
            x: 69
        };

        const id = await Storage.set(undefined, objectToStore);
        console.dir({ id, objectToStore });
        const result = await Storage.get(id);
        console.dir({ id, objectToStore });
        expect(result).toStrictEqual({ ...objectToStore, id });
        objectToStore.x = 420;
        expect(result).not.toStrictEqual({ ...objectToStore, id });
    });

    it(`should read undefined: ${name}`, async () => {
        const Storage = await generateStorage();
        expect(await Storage.get("")).toBeUndefined();
        expect(await Storage.get("eqoiweoguweoguewogu")).toBeUndefined();
        expect(await Storage.get("3H1HF1H3F1IHG40TH19H81HT38FH1%E9H01E8HT1048H0138HG0183HF0813HF")).toBeUndefined();
    });

    it(`should create, update & get: ${name}`, async () => {
        const Storage = await generateStorage();
        const id = await Storage.set(undefined, { x: "100" });
        await Storage.set(id, { x: "200" });
        const result = await Storage.get(id);
        expect(result).toStrictEqual({ id, x: "200" });
    });

    it(`should set, get & remove and get undefined: ${name}`, async () => {
        const Storage = await generateStorage();
        const id = await Storage.set(undefined, { x: "100" });
        let result = await Storage.get(id);
        expect(result).toStrictEqual({ id, x: "100" });
        await Storage.remove(result!.id);
        result = await Storage.get(id);
        expect(result).toBeUndefined();
    });

    it(`should get all: ${name}`, async () => {
        const Storage = await generateStorage();
        let keys = [];
        keys.push(await Storage.set(undefined, { x: "x1" }));
        keys.push(await Storage.set(undefined, { x: "x2" }));
        keys.push(await Storage.set(undefined, { x: "x3" }));
        let all = await Storage.where();
        expect(all).toStrictEqual([
            { id: keys[0], x: "x1" },
            { id: keys[1], x: "x2" },
            { id: keys[2], x: "x3" },
        ]);

        expect(keys).toStrictEqual(await Storage.getKeys());

        await Storage.remove(keys[0]);
        all = await Storage.where();
        expect(all).toStrictEqual([
            { id: keys[1], x: "x2" },
            { id: keys[2], x: "x3" },
        ]);
    });

    it('should return 0 count and empty array of getAll when empty' + ": " + name, async () => {
        const Storage = await generateStorage();
        expect(await Storage.count()).toBe(0);
        expect((await Storage.where()).length).toBe(0);
    });

});
