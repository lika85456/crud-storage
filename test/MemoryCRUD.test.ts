import CRUD from "../lib/CRUD";
import MemoryCRUD from "../lib/MemoryCRUD";


describe('LocalStorageCRUD', () => {

    let CRUD: CRUD<{ x: string }>;

    beforeEach(async () => {
        CRUD = new MemoryCRUD<{ x: string }>();
    });
    it("Has atleast one test", () => {

    })
});