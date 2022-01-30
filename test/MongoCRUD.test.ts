import { Db, MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import CRUD from "../lib/CRUD";
import MongoCRUD from "../lib/MongoCRUD";

describe('MongoCRUD', () => {

    let mongod: any;
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
    it("Has atleast one test", () => {

    })
});