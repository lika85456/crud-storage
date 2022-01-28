import CRUD, { Identifiable } from "./CRUD";
import { v4 } from "uuid";

export default class MemoryCRUD<T> implements CRUD<T>{

    protected storage: { [id: string]: T } = {};

    async create(object: T): Promise<string> {
        const id = v4();
        this.storage[id] = object;
        return id;
    }
    async read(id: string): Promise<Identifiable<T> | undefined> {
        return !!this.storage[id]
            ?
            {
                ...this.storage[id],
                id
            }
            : undefined;
    }

    async update(id: string, object: T): Promise<void> {
        const copy = { ...object } as any;
        delete copy.id;
        this.storage[id] = copy;
    }

    async remove(id: string): Promise<void> {
        delete this.storage[id];
    }

    async list(): Promise<string[]> {
        return Object.keys(this.storage);
    }

    async getAll(): Promise<Identifiable<T>[]> {
        return Object.entries(this.storage).map(c => ({
            id: c[0],
            ...c[1]
        }));
    }

    async count(): Promise<number> {
        return Object.keys(this.storage).length;
    }

}