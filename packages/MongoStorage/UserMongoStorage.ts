import { Db } from "mongodb";
import MongoCRUD from "./MongoStorage";
import { WithId } from "../../lib/Storage";

type StorageAction = "set" | "get" | "remove" | "getKeys" | "where" | "count"
export type StorageActionMiddleware = (action: StorageAction, data?: object) => boolean;

type UserMongoStorageOptions = {
    // used for authorization or logging
    actionMiddleware?: StorageActionMiddleware;
    maxDocumentSize: number;
    maxDocumentsCount: number;
}

export class UserMongoStorage<T extends object & { userId: string }> extends MongoCRUD<T> {

    protected options: UserMongoStorageOptions;

    constructor(db: Db, collection: string, protected userId: string, options?: Partial<UserMongoStorageOptions>) {
        super(db, collection, { userId: ["userId"] });

        if (!options) {
            this.options = {
                maxDocumentSize: Number.MAX_SAFE_INTEGER,
                maxDocumentsCount: Number.MAX_SAFE_INTEGER,
            };
        } else {
            // @ts-ignore
            this.options = options;
        }

        if (!this.options.maxDocumentSize) {
            this.options.maxDocumentSize = Number.MAX_SAFE_INTEGER;
        }

        if (!this.options.maxDocumentsCount) {
            this.options.maxDocumentsCount = Number.MAX_SAFE_INTEGER;
        }
    }

    public async set(id: string | undefined, object: T): Promise<string> {
        // middleware
        if (this.options.actionMiddleware && !this.options.actionMiddleware("set", object)) {
            throw new Error("Not authorized.");
        }

        // check document size
        if (JSON.stringify(object).length > this.options.maxDocumentSize) {
            throw new Error("Document size is too large");
        }

        // if creating check limit
        if (!id && await this.count() >= this.options.maxDocumentsCount) {
            throw new Error("Documents limit reached.");
        }

        if (id) {
            const result = await super.get(id);

            // if object doesn't exist or it belongs to the user
            if (!result || result?.userId === this.userId) {
                return await super.set(id, object);
            }

            throw new Error("Not authorized.");
        }

        return await super.set(id, object);
    }

    public async get(id: string): Promise<WithId<T> | undefined> {
        // middleware
        if (this.options.actionMiddleware && !this.options.actionMiddleware("get", { id })) {
            throw new Error("Not authorized.");
        }

        const result = await super.get(id);

        if (result && result?.userId !== this.userId) {
            throw new Error("Not authorized.");
        }

        // @ts-ignore
        delete result.userId;

        return result;
    }

    public async remove(id: string): Promise<void> {
        // middleware
        if (this.options.actionMiddleware && !this.options.actionMiddleware("remove", { id })) {
            throw new Error("Not authorized.");
        }

        const result = await super.get(id);

        if (result && result?.userId !== this.userId) {
            throw new Error("Not authorized.");
        }

        return super.remove(id);
    }

    public async getKeys(): Promise<string[]> {
        return (await (await this.collection
            // @ts-ignore
            .find({ userId: this.userId }, { projection: { _id: 1 } })
            // @ts-ignore
            .map(t => t._id.toString()))
            .toArray());
    }

    public async where(query?: { key: string, value: string }[]): Promise<WithId<T>[]> {
        return super.where([...(query || []), { key: "userId", value: this.userId }]);
    }

    public async count(): Promise<number> {
        // @ts-ignore
        return this.collection.find({ userId: this.userId }).count();
    }
}