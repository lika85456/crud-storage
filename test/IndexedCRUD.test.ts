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
    it("Has atleast one test", () => {

    })
});