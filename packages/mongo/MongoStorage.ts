import {
    Collection, Db, ObjectId, OptionalUnlessRequiredId
} from 'mongodb';
import crypto from "crypto";
import Storage, { WithId } from '../core/Storage';

export default class MongoStorage<T extends object> implements Storage<T> {
    protected collection: Collection<T>;

    constructor(protected db: Db, collection: string, indexes?: { [key: string]: string[] }) {
        this.collection = db.collection<T>(collection);

        // assert indexes
        if (indexes) {
            const indexNames = Object.keys(indexes);
            if (!this.collection.indexExists(indexNames)) {
                // create index definition object
                const mongoIndexes: any = {};
                Object.entries(indexes).forEach(index => {
                    mongoIndexes[index[0]] = Object.fromEntries(index[1].map(indexProp => [indexProp, 1]));
                });

                this.collection.createIndexes(mongoIndexes);
            }
        }

    }

    public async set(id: string | undefined, object: T & { id?: string, _id?: string }): Promise<string> {
        // purge object from ids
        delete object.id;
        delete object._id;

        object = JSON.parse(JSON.stringify(object));

        // create new
        if (!id) {
            return (await this.collection.insertOne(object as OptionalUnlessRequiredId<T>)).insertedId.toString();
        }

        // update
        const objectId = MongoStorage.getObjectId(id);

        await this.collection.updateOne({ _id: objectId } as any, { $set: object }, { upsert: true });

        return id;
    }

    public async get(id: string): Promise<WithId<T> | undefined> {
        let objectId = MongoStorage.getObjectId(id);

        if (!id) {
            return undefined;
        }

        let queryResult = await this.collection.findOne({ _id: objectId } as any) as any;
        if (!queryResult) {
            return undefined;
        }

        let returnValue: any = {
            ...queryResult,
            id: queryResult._id.toString()
        };

        delete returnValue._id;
        return returnValue;
    }

    public async getKeys(): Promise<string[]> {
        return (await (await this.collection
            // project ids only
            .find({}, { projection: { _id: 1 } })
            // @ts-ignore
            .map(t => t._id.toString()))
            .toArray());
    }

    public async remove(id: string): Promise<void> {
        await this.collection.deleteOne({ _id: new ObjectId(id) } as any);
    }

    public async where(query?: { key: string, value: string }[]): Promise<WithId<T>[]> {
        // create query
        const mongoQuery: any = {};
        query?.forEach(queryProp => {
            mongoQuery[queryProp.key] = queryProp.value;
        })

        const docs = await (await this.collection.find(mongoQuery).toArray()).map((doc: any) => {
            // @ts-ignore
            doc.id = doc._id.toString();
            // @ts-ignore
            delete doc._id;
            return doc;
        });
        return docs as any[];
    }

    public async count(): Promise<number> {
        return this.collection.countDocuments();
    }

    protected static getObjectId(id: string): ObjectId {
        try {
            return new ObjectId(id);
        }
        catch (e) {
            return new ObjectId(crypto.createHash("md5").update(id).digest("hex").substr(0, 24));
        }
    }
}
