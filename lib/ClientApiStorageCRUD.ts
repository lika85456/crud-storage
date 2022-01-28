import CRUD, { Identifiable } from "./CRUD";


export type CrudRequest = {
    actions: { id: string }[];
};

export class ClientApiStorageCRUD<T> implements CRUD<T> {

    /**
     * 
     * @param url Url of the storage API endpoint
     * 
     * @example
     * const storage = new ClientApiStorage<any>("https://example.com/api/clientStorage");
     */
    constructor(protected url: string, protected logger: Console) {

    }

    async create(object: T): Promise<string> {
        const response = await fetch(
            this.url + "/create",
            {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(object)
            });

        if (response.status != 200) {
            this.logger.error("Cannot create object: " + (await response.text()));
            throw new Error("Error while creating an object.");
        }

        return response.text();
    }

    async read(id: string): Promise<Identifiable<T>> {
        const response = await fetch(
            this.url + "/read",
            {
                method: "POST",
                body: id
            });

        if (response.status != 200) {
            this.logger.error("Error while reading object: " + (await response.text()));
            throw new Error("Error while reading object.");
        }

        return response.json();
    }

    async update(id: string, object: T): Promise<void> {
        const response = await fetch(
            this.url + "/update",
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify({
                    id,
                    ...object
                })
            });

        if (response.status != 200) {
            this.logger.error("Error while updating object: " + (await response.text()));
            throw new Error("Error while updating object.");
        }
    }

    async remove(id: string): Promise<void> {
        const response = await fetch(
            this.url + "/remove",
            {
                method: "POST",
                body: id
            });

        if (response.status != 200) {
            this.logger.error("Error while removing object: " + (await response.text()));
            throw new Error("Error while removing object.");
        }
    }

    async list(): Promise<string[]> {
        const response = await fetch(
            this.url + "/list",
            {
                method: "POST",
            });

        if (response.status != 200) {
            this.logger.error("Error while listing object ids: " + (await response.text()));
            throw new Error("Error while listing object ids.");
        }

        return response.json();
    }

    async getAll(): Promise<Identifiable<T>[]> {
        const response = await fetch(
            this.url + "/getAll",
            {
                method: "POST",
            });

        if (response.status != 200) {
            this.logger.error("Error while getting all objects: " + (await response.text()));
            throw new Error("Error while getting all objects.");
        }

        return response.json();
    }

    async count(): Promise<number> {
        const response = await fetch(
            this.url + "/count",
            {
                method: "POST",
            });

        if (response.status != 200) {
            this.logger.error("Error while getting count: " + (await response.text()));
            throw new Error("Error while getting count.");
        }

        return +response.text();
    }

}