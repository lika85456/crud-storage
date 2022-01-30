import {
    Collection, Db, ObjectId, OptionalId
} from 'mongodb';
import CRUD, { Identifiable } from './CRUD';

export default class MongoCRUD<T> implements CRUD<T> {
    protected collection: Collection<T>;

    constructor(protected db: Db, collection: string) {
        this.collection = db.collection<T>(collection);
    }

    public async create(object: T): Promise<string> {
        // @ts-ignore
        return (await this.collection.insertOne(object as OptionalId<T>)).insertedId.toString();
    }

    public async read(id: string): Promise<Identifiable<T> | undefined> {
        let result = await this.collection.findOne({ _id: new ObjectId(id) });
        if (!result) {
            return undefined;
        }
        // @ts-ignore
        result.id = result._id.toString();
        // @ts-ignore
        delete result._id;

        // @ts-ignore
        return result as Identifiable<T>;
    }

    public async update(id: string, object: T): Promise<void> {
        // @ts-ignore
        delete object.id;
        // @ts-ignore
        delete object._id;
        await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: object }, { upsert: true });
    }

    public async remove(id: string): Promise<void> {
        await this.collection.deleteOne({ _id: new ObjectId(id) } as any);
    }

    public async list(): Promise<string[]> {
        return (await (await this.collection
            .find({}, { projection: { _id: 1 } })
            // @ts-ignore
            .map(t => t._id.toString()))
            .toArray());
    }

    public async getAll(): Promise<Identifiable<T>[]> {
        const docs = await (await this.collection.find().toArray()).map(doc => {
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
}
