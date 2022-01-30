import bodyParser from 'body-parser';
import { ServerApiStorage } from './../lib/ServerApiStorage';
import { ClientApiStorageCRUD } from './../lib/ClientApiStorageCRUD';
import CRUD from "../lib/CRUD";
import express, { Request, Response } from "express";
import MemoryCRUD from '../lib/MemoryCRUD';

describe.only('ApiStorageCRUD', () => {

    let CRUD: CRUD<{ x: string }>;
    let serverStorage: ServerApiStorage<{ x: string }>;
    let app: any;
    let server: any;
    let memoryStorage: CRUD<{ x: string }>;

    beforeAll((done) => {
        app = express();

        app.use(bodyParser.json());

        serverStorage = new ServerApiStorage({
            documentsLimit: 10,
            maximumDocumentSize: 100
        });

        memoryStorage = new MemoryCRUD();

        app.post("/storage/:action", async (req: Request, res: Response) => {
            const response = await serverStorage.request(req.params.action as any, req.body, memoryStorage);
            res.json(response);
        });


        CRUD = new ClientApiStorageCRUD<{ x: string }>("http://localhost:3001/storage", console);

        server = app.listen(3001, () => {
            console.log("Server started!");
            done();
        });
    })

    beforeEach(() => {
        memoryStorage = new MemoryCRUD();
    })

    afterAll(() => {
        server.close();
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