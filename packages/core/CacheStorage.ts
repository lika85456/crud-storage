import Storage, { WithId } from "./Storage";

/**
 * Used for caching slow storages, such as ApiStorage
 *
 * @example Caching ApiStorage in memory, but also storing it in local storage
 *
 * // this is now persistent storage, but it's fast, because it's also loaded in memory
 * // for big amount of data use IndexedCRUD (IndexedDB)
 * const cachedLocalStorage = new CacheStorageCRUD<any>(new LocalStorageCRUD<any>("my-storage"), new MemoryCRUD<any>(), true);
 *
 * // this is ApiStorage persistently cached in localStorage, but also loaded in memory for fast access
 * // use precacheAll if you want to sync server data
 * const cachedApiStorage = new CacheStorageCRUD<any>(new ClientApiStorageCRUD<any>(...), cachedLocalStorage, true);
 */
export default class CacheStorage<T extends object> implements Storage<T> {
    // indicator for fully loaded cache
    protected cacheLoaded: boolean = false;

    constructor(protected storage: Storage<T>, protected cache: Storage<T>, protected precacheAll: boolean = false) {
        if (precacheAll) {
            storage.where().then(all => {
                all.forEach(async element => {
                    const id = element.id;
                    // @ts-ignore
                    delete element.id;
                    await this.cache.set(id, element);
                });

                this.cacheLoaded = true;
            });
        }
    }

    public async set(id: string | undefined, object: T): Promise<string> {
        id = await this.storage.set(id, object);
        await this.cache.set(id, object);

        return id;
    }

    public async get(id: string): Promise<WithId<T> | undefined> {
        // try to hit cache
        if (this.cacheLoaded || (await this.cache.get(id))) {
            return this.cache.get(id);
        }

        // load the element
        const element = await this.storage.get(id);

        // store it to cache
        if (!!element) {
            const copy = JSON.parse(JSON.stringify(element));
            delete copy.id;
            this.cache.set(id, copy);
        }

        return element;
    }

    public async where(query?: { key: string; value: string }[]): Promise<WithId<T>[]> {
        // hit cache
        if (this.cacheLoaded) {
            return this.cache.where(query);
        }

        const result = await this.storage.where(query);

        // save all to cache
        if (!query) {
            result.forEach(async el => {
                const copy = JSON.parse(JSON.stringify(el));
                delete copy.id;
                await this.cache.set(el.id, copy);
            });

            this.cacheLoaded = true;
        }

        return result;
    }

    async remove(id: string): Promise<void> {
        await this.storage.remove(id);
        await this.cache.remove(id);
    }

    // TODO: cache list response
    getKeys(): Promise<string[]> {
        if (this.cacheLoaded) {
            return this.cache.getKeys();
        }

        return this.storage.getKeys();
    }

    // TODO: cache count
    count(): Promise<number> {
        if (this.cacheLoaded) {
            return this.cache.count();
        }

        return this.storage.count();
    }
}
