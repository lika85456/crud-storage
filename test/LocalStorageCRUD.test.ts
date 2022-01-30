import CRUD from "../lib/CRUD";
import LocalStorageCRUD from "../lib/LocalStorageCRUD";


describe('LocalStorageCRUD', () => {

    let CRUD: CRUD<{ x: string }>;

    beforeEach(async () => {
        localStorage.clear();
        jest.clearAllMocks();
        CRUD = new LocalStorageCRUD<{ x: string }>("test-collection");
    });
    it("Has atleast one test", () => {

    })
});