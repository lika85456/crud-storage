import Storage, { WithId } from "../core/Storage";
import { v4 } from "uuid";

export default class LocalStorage<T extends object> implements Storage<T> {
    static KEYS_PREFIX = "keys/";
    protected keys: string[] = [];

    constructor(protected prefix: string) {
        this.keys = JSON.parse(localStorage.getItem(this.getKeysId()) || "[]");
    }

    public async set(id: string | undefined, object: T): Promise<string> {
        let idGenerated = false;

        if (!id) {
            id = v4();
            idGenerated = true;
        }

        const copy = { ...object } as any;
        delete copy.id;
        localStorage.setItem(this.prefix + id, JSON.stringify(copy));

        if (idGenerated) {
            this.addKey(id);
        }

        return id;
    }

    public async get(id: string): Promise<WithId<T> | undefined> {
        const result = localStorage.getItem(this.prefix + id);

        if (!result) {
            return undefined;
        }

        return {
            ...JSON.parse(result),
            id,
        };
    }

    public async getKeys(): Promise<string[]> {
        return this.keys;
    }

    public async where(query?: { key: string; value: string }[]): Promise<WithId<T>[]> {
        const all = this.keys.map(key => [key, JSON.parse(localStorage.getItem(this.prefix + key) || "null")]);

        if (!query) {
            return all.map(x => ({ id: x[0], ...x[1] }));
        }

        return all
            .filter(entry => query.every(queryEntry => entry[1][queryEntry.key] === queryEntry.value))
            .map(x => ({ id: x[0], ...x[1] }));
    }

    async remove(id: string): Promise<void> {
        localStorage.removeItem(this.prefix + id);
        this.removeKey(id);
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
        return LocalStorage.KEYS_PREFIX + this.prefix;
    }
}
