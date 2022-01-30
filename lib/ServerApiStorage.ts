import CRUD from "./CRUD";

type RequestActionType = "create" | "read" | "remove" | "update" | "list" | "getAll" | "count";

type ServerApiStorageOptions = {
    documentsLimit: number,
    maximumDocumentSize: number
}

/**
 * Used for exposing server side storage to client
 * You can set some boundaries for every client. Such as documents limit, or maximum document size
 * On every request from ClientApiStorage you create a new storage object
 * 
 * @example Express (express-like) route with authorization
 * app.post("clientStorage/*",(req,res)=>{
 *      const action = req.query;
 *      const body = req.body;
 * 
 *      const user = getUser(req);
 *      if(user.authorized("clientStorage")){
 *          let log = {action, body, userId:user.id};
 *          try{
 *              const response = await cloudBucketServerApiStorage.request(action,body,"userImages/"+user.id);
 *              res.send(response);          
 *              log.response = response;
 *          } catch(e){
 *              log.error = JSON.stringify(e);
 *          }
 *          logger.log(log);
 *      }
 * })
 */
export class ServerApiStorage<T> {
    protected options!: ServerApiStorageOptions;
    /**
     * 
     * @param options User restrictions and limits
     * @param options.documentsLimit limit of documents for every user. If exceeded, create action will throw an error. Use 0 for unlimited
     * @param options.maximumDocumentSize size limit for document. If exceeded, create / update actions will throw an error. Use 0 for unlimited
     */
    constructor(options: Partial<ServerApiStorageOptions>) {
        this.options = {
            documentsLimit: 0,
            maximumDocumentSize: 0,
            ...options
        }
    }

    /**
     * 
     * @param actionType CRUD action type
     * @param body
     * @param storage Storage (if you want to specify user see ServerApiStorage example)
     * @returns Response (read, count, getAll)
     * @throws When limits are exceeded
     */
    async request(actionType: RequestActionType, body: string | (T & { id?: string }), storage: CRUD<T>): Promise<any> {
        switch (actionType) {
            case "create":
                if (typeof body !== "object")
                    throw new Error("Body of create action is not an object.");

                if (this.options.documentsLimit !== 0 && await storage.count() >= this.options.documentsLimit)
                    throw new Error("Maximum documents count reached.")

                if (this.options.maximumDocumentSize !== 0 && JSON.stringify(body).length > this.options.maximumDocumentSize)
                    throw new Error("Maximum document size reached.");

                return await storage.create(body);

            case "read":
                if (typeof body !== "string" && !body?.id)
                    throw new Error("Read ID not specified");
                return await storage.read(typeof body === "string" ? body : body.id!);

            case "update":
                if (typeof body !== "object")
                    throw new Error("Body of update action is not an object.");

                if (this.options.maximumDocumentSize !== 0 && JSON.stringify(body).length > this.options.maximumDocumentSize)
                    throw new Error("Maximum document size reached.");

                const bodyObject = JSON.parse(JSON.stringify(body));
                const id = bodyObject.id;
                delete bodyObject.id;

                return await storage.update(id, bodyObject);

            case "remove":
                if (typeof body !== "string" && !body?.id)
                    throw new Error("Remove ID not specified");
                return await storage.remove(typeof body === "string" ? body : body.id!);

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