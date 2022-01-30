import CRUD, { Identifiable } from "./CRUD";

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
export class CacheStorageCRUD<T> implements CRUD<T>{

    // indicator for fully loaded cache
    protected cacheLoaded: boolean = false;

    constructor(
        protected storage: CRUD<T>,
        protected cache: CRUD<T>,
        protected precacheAll: boolean = false
    ) {
        if (precacheAll) {
            storage.getAll().then(all => {
                all.forEach(async element => {
                    const id = element.id;
                    // @ts-ignore
                    delete element.id;
                    await this.cache.update(id, element);
                });

                this.cacheLoaded = true;
            })
        }
    }

    async create(object: T): Promise<string> {
        const id = await this.storage.create(object);

        await this.cache.update(id, object);
        return id;
    }

    async read(id: string): Promise<Identifiable<T> | undefined> {
        if (this.cacheLoaded || await this.cache.read(id)) {
            return this.cache.read(id);
        }

        // load the element
        const element = await this.storage.read(id);

        // store it to cache
        if (!!element) {
            const copy = JSON.parse(JSON.stringify(element));
            delete copy.id;
            this.cache.update(id, copy);
        }


        return element;
    }

    async update(id: string, object: T): Promise<void> {
        await this.cache.update(id, object);
        await this.storage.update(id, object);
    }

    async remove(id: string): Promise<void> {
        await this.cache.remove(id);
        await this.storage.remove(id);
    }

    // TODO: cache list response
    list(): Promise<string[]> {
        if (this.cacheLoaded) {
            return this.cache.list();
        }

        return this.storage.list();
    }

    async getAll(): Promise<Identifiable<T>[]> {
        if (this.cacheLoaded) {
            return this.cache.getAll();
        }

        const all = await this.storage.getAll();
        all.forEach(async element => {
            const copy = JSON.parse(JSON.stringify(element));
            const id = copy.id;
            // @ts-ignore
            delete copy.id;
            await this.cache.update(id, copy);
        });

        this.cacheLoaded = true;

        return all;
    }

    // TODO: cache count
    count(): Promise<number> {
        if (this.cacheLoaded) {
            return this.cache.count();
        }

        return this.storage.count();
    }

}