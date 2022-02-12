import CRUD, { WithId } from "./Storage";
import { v4 } from "uuid";

export default class MemoryCRUD<T extends object> implements CRUD<T> {
    protected storage: { [id: string]: T } = {};

    public async set(id: string | undefined, object: T): Promise<string> {
        const objectId = id || v4();
        this.storage[objectId] = JSON.parse(JSON.stringify(object));
        return objectId;
    }

    public async get(id: string): Promise<WithId<T> | undefined> {
        // @ts-ignore
        return !!this.storage[id]
            ? {
                  ...this.storage[id],
                  id,
              }
            : undefined;
    }

    public async getKeys(): Promise<string[]> {
        return Object.keys(this.storage);
    }

    public async where(query?: { key: string; value: string }[]): Promise<WithId<T>[]> {
        if (!query) {
            return Object.entries(this.storage).map(x => ({ id: x[0], ...x[1] }));
        }
        return (
            Object.entries(this.storage)
                // @ts-ignore
                .filter(entry => query.every(queryEntry => entry[1][queryEntry.key] === queryEntry.value))
                .map(x => ({ id: x[0], ...x[1] }))
        );
    }

    async remove(id: string): Promise<void> {
        delete this.storage[id];
    }

    async count(): Promise<number> {
        return Object.keys(this.storage).length;
    }
}
