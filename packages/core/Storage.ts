export type WithId<T> = T & { id: string };

export default interface Storage<T extends object> {
    /**
     *
     * @param id Can be empty (undefined) to create new object
     * @param object Data to store, has to be an object
     * @return returns id of the object
     */
    set(id: string | undefined, object: T): Promise<string>;
    get(id: string): Promise<WithId<T> | undefined>;
    remove(id: string): Promise<void>;

    getKeys(): Promise<string[]>;
    where(query?: { key: string; value: string }[]): Promise<WithId<T>[]>;

    count(): Promise<number>;
}
