import { CacheStorageCRUD } from "../lib/CacheStorageCRUD";
import CRUD from "../lib/CRUD";
import MemoryCRUD from "../lib/MemoryCRUD";

describe('CacheStorageCRUD', () => {

    let CRUD: CRUD<{ x: string }>;

    beforeEach(async () => {
        CRUD = new CacheStorageCRUD<{ x: string }>(new MemoryCRUD(), new MemoryCRUD(), false);
    });

    it("Has atleast one test", () => {

    })
});