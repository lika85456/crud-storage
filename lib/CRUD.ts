export type Identifiable<T> = T & { id: string };

export default interface CRUD<T> {
    create(object: T): Promise<string>;
    read(id: string): Promise<Identifiable<T> | undefined>;
    update(id: string, object: T): Promise<void>;
    remove(id: string): Promise<void>;
    list(): Promise<string[]>;
    getAll(): Promise<Identifiable<T>[]>;
    count(): Promise<number>;
}