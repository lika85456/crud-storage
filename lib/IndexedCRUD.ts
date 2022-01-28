import CRUD, { Identifiable } from "./CRUD";
import { v4 } from "uuid";
import { get, set, update, del, getMany } from "idb-keyval";

export default class IndexedCRUD<T> implements CRUD<T>{

    static KEYS_PREFIX = "indexed-keys";
    protected keys: Promise<string[]>;

    constructor(protected prefix: string) {
        this.keys = get(this.getKeysId()).then(e => !!e ? JSON.parse(e) : []);
    }

    async create(object: T): Promise<string> {
        const id = v4();
        await set(this.prefix + id, JSON.stringify(object));
        await this.addKey(id);
        return id;
    }

    async read(id: string): Promise<Identifiable<T> | undefined> {
        const result = await get(this.prefix + id);
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
        await update(this.prefix + id, () => JSON.stringify(copy));
    }

    async remove(id: string): Promise<void> {
        this.removeKey(id);
        del(this.prefix + id);
    }

    async list(): Promise<string[]> {
        return this.keys;
    }

    async getAll(): Promise<Identifiable<T>[]> {
        const keys = (await this.keys).map(x => this.prefix + x);
        return (await getMany(keys)).map((x, i) => ({ ...JSON.parse(x), id: keys[i].substring(this.prefix.length) }));
    }

    async count(): Promise<number> {
        return (await this.keys).length;
    }

    protected async addKey(id: string) {
        let keys = await this.keys;
        keys.push(id);
        set(this.getKeysId(), JSON.stringify(keys));
    }

    protected async removeKey(id: string) {
        const keys = (await this.keys).filter(k => k !== id);
        this.keys = Promise.resolve(keys);
        set(this.getKeysId(), JSON.stringify(keys));
    }

    protected getKeysId(): string {
        return IndexedCRUD.KEYS_PREFIX + this.prefix;
    }
}