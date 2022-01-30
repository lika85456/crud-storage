import CRUD, { Identifiable } from "./CRUD";
import { v4 } from "uuid";

export default class LocalStorageCRUD<T> implements CRUD<T>{

    static KEYS_PREFIX = "keys/";
    protected keys: string[] = [];

    constructor(protected prefix: string) {
        this.keys = JSON.parse(localStorage.getItem(this.getKeysId()) || "[]");
    }

    async create(object: T): Promise<string> {
        const id = v4();
        localStorage.setItem(this.prefix + id, JSON.stringify(object));
        this.addKey(id);
        return id;
    }

    async read(id: string): Promise<Identifiable<T> | undefined> {
        const result = localStorage.getItem(this.prefix + id);
        if (!result) {
            return undefined;
        }

        return {
            ...JSON.parse(result),
            id
        };
    }

    async update(id: string, object: T): Promise<void> {
        const copy = { ...object } as any;
        delete copy.id;
        localStorage.setItem(this.prefix + id, JSON.stringify(copy));
    }

    async remove(id: string): Promise<void> {
        this.removeKey(id);
        localStorage.removeItem(this.prefix + id);
    }

    async list(): Promise<string[]> {
        return this.keys;
    }

    async getAll(): Promise<Identifiable<T>[]> {
        return this.keys.map(key => ({
            ...JSON.parse(localStorage.getItem(this.prefix + key) || "null"),
            id: key
        }));
    }

    async count(): Promise<number> {
        return this.keys.length;
    }

    protected addKey(id: string) {
        this.keys.push(id);
        localStorage.setItem(this.getKeysId(), JSON.stringify(this.keys));
    }

    protected removeKey(id: string) {
        this.keys = this.keys.filter(k => k !== id);
        localStorage.setItem(this.getKeysId(), JSON.stringify(this.keys));
    }

    protected getKeysId(): string {
        return LocalStorageCRUD.KEYS_PREFIX + this.prefix;
    }
}