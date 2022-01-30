import { ServerApiStorage } from './lib/ServerApiStorage';
import MemoryCRUD from "./lib/MemoryCRUD";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const serverStorage = new ServerApiStorage({
    documentsLimit: 100,
    maximumDocumentSize: 10000
});

const memory = new MemoryCRUD();

const app = express();
app.use(bodyParser.json());
app.post("/storage/:action", async (req: Request, res: Response) => {
    try {
        const response = await serverStorage.request(req.params.action as any, req.body, memory);
        res.json(response);
    }
    catch (e) {
        console.log(e);
        res.status(500).json(e);
    }
});

app.listen(3000, () => {
    console.log("Server started!");
});