import CRUD from "./CRUD";

/**
 * Used for exposing server side storage to client
 * You can set some boundaries for every client. Such as documents limit, or maximum document size
 * On every request from ClientApiStorage you create a new storage object
 * 
 * @example Express (express-like) route with authorization
 * app.get("clientStorage/*",(req,res)=>{
 *      const action = req.query;
 *      const body = req.body;
 * 
 *      const user = getUser(req);
 *      if(user.authorized("clientStorage")){
 *          const response = await cloudBucketServerApiStorage.request(action,body,"userImages/"+user.id);
 *          res.send(response);
 *      }
 * })
 */
export class ServerApiStorage<T> {

    /**
     * 
     * @param options User restrictions and limits
     * @param options.documentsLimit limit of documents for every user. If exceeded, create action will throw an error. Use 0 for unlimited
     * @param options.maximumDocumentSize size limit for document. If exceeded, create / update actions will throw an error. Use 0 for unlimited
     */
    constructor(protected options: {
        documentsLimit?: number,
        maximumDocumentSize?: number
    }) {
        this.options = {
            documentsLimit: 0,
            maximumDocumentSize: 0,
            ...this.options
        }
    }

    async request(actionType: string, body: string, storage: CRUD<T>): Promise<any> {
        switch (actionType) {
            case "create":
                if (this.options.documentsLimit !== 0 && await storage.count() >= this.options.documentsLimit) {
                    throw new Error("Maximum documents count reached.")
                }

                if (this.options.maximumDocumentSize !== 0 && body.length > this.options.maximumDocumentSize) {
                    throw new Error("Maximum document size reached.");
                }

                return await storage.create(JSON.parse(body));
            case "read":
                return await storage.read(body);
            case "update":
                if (this.options.maximumDocumentSize !== 0 && body.length > this.options.maximumDocumentSize) {
                    throw new Error("Maximum document size reached.");
                }

                const bodyObject = JSON.parse(body);
                const id = bodyObject.id;
                delete bodyObject.id;

                return await storage.update(id, bodyObject);
            case "remove":
                return await storage.remove(body);
            case "list":
                return await storage.list();
            case "getAll":
                return await storage.getAll();
            case "count":
                return await storage.count();
            default:
                throw new Error("Unknown action.");
        }
    }
}