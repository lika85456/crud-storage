import Storage, { WithId } from "./Storage";
import { v4 } from "uuid";
import { get, set, update, del, getMany } from "idb-keyval";

export default class IndexedStorage<T extends object> implements Storage<T>{

    static KEYS_PREFIX = "indexed-keys";
    protected keys: Promise<string[]> = Promise.resolve([]);

    constructor(protected prefix: string) {
        this.keys = get(this.getKeysId()).then(e => !!e ? JSON.parse(e) : []);
    }

    public async set(id: string | undefined, object: T): Promise<string> {
        let generated = false;
        if (!id) {
            id = v4();
            generated = true;
        }

        const copy = { ...object } as any;
        delete copy.id;
        await update(this.prefix + id, () => JSON.stringify(copy));

        if (generated) {
            this.addKey(id);
        }

        return id;
    }

    public async get(id: string): Promise<WithId<T> | undefined> {
        const result = await get(this.prefix + id);
        if (!result) {
            return undefined;
        }

        return {
            ...JSON.parse(result),
            id
        };
    }

    public async where(query?: { key: string; value: string; }[]): Promise<WithId<T>[]> {
        const keys = (await this.keys).map(x => this.prefix + x);
        const all = (await getMany(keys)).map((x, i) => ({ ...JSON.parse(x), id: keys[i].substring(this.prefix.length) }));

        if (!query) {
            return all;
        }

        return all
            .filter(x => query.every(queryEl => x[queryEl.key] === queryEl.value));
    }

    async remove(id: string): Promise<void> {
        this.removeKey(id);
        del(this.prefix + id);
    }

    async getKeys(): Promise<string[]> {
        return this.keys;
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
        return IndexedStorage.KEYS_PREFIX + this.prefix;
    }
}