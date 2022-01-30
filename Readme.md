# CRUD-STORAGE
Small library with different storage implementations, but the same CRUD interface.
There are implementations for persistent (both client and server) and non persistent storages as well some utilities like cache, or API connectors.

## CRUD Interface

```export default interface CRUD<T> {
    create(object: T): Promise<string>;
    read(id: string): Promise<Identifiable<T> | undefined>;
    update(id: string, object: T): Promise<void>;
    remove(id: string): Promise<void>;
    list(): Promise<string[]>;
    getAll(): Promise<Identifiable<T>[]>;
    count(): Promise<number>;
}
```

## Warning!
Use objects for storage. Primitive types are not supported!

### Create
Used for creating an object without specifying id.

**Warning: Creating objects this way is preferred. Mongo implementation uses rules for ObjectIds. If you want to specify an id, use update**

### Read
Reads object with unique id. Returns the object with id added as a prop to it, or returns undefined if not found.

### Update
**Rewrites** object with id. Do not use `null` or `undefined` values, instead use remove.
This method can be used for creating an object with specific id, but **it is not the recommended way. See create method**

### Remove
Removes object with an id.

### List
Returns all object ids. If no objects are stored, then returns empty array.

### GetAll
Returns all stored objects enriched with its ids.

### Count
Returns count of stored objects. If no objects are stored returns 0.


## Storages

### MemoryCRUD
Pure memory storage.

### IndexedCRUD
IndexedDB Storage, can be only used on client and is persistent. Define storage name in the constructor.
Use for big amount of data such as images, videos or files. For small data rather use LocalStorageCRUD.
```
const clientStorage = new IndexedCRUD<object>("custom-name");
```

### LocalStorageCRUD
Local storage, can be only used on client and is persistent. Define storage name in the constructor.
Use for small amount of data such as dark mode preference. For images or files rather use IndexedCRUD.

### MongoCRUD
Mongo connector, can be used only on server and is persistent. Define storage name (the collection it will use) in the constructor.

## Storage utilities

### CacheStorageCRUD
Used for caching slow storages. 
You can specify the type of cache storage as CRUD storage. This way you can persist data from server in local storage and also have it in memory for fast access. Synchronization requires custom storage though.
Use `precacheAll=true` for loading the whole storage into cache storage.
```js
// this is now persistent local storage, but it's fast, because it's also cached in memory
// for big amount of data use IndexedCRUD (IndexedDB)
const cachedLocalStorage = new CacheStorageCRUD<any>(new LocalStorageCRUD<any>("my-storage"), new MemoryCRUD<any>(), true);

// this is ApiStorage persistently cached in localStorage, but also loaded in memory for fast access
// use precacheAll if you want to sync server data
const cachedApiStorage = new CacheStorageCRUD<any>(new ClientApiStorageCRUD<any>(...), cachedLocalStorage, true);
```

### ServerApiStorage and ClientApiStorage
HTTP Protocol connectors with user limits. 
At server side you can specify storage for every user, so they can be independent of other users (it's also a neat safety feature).
In the constructor you can also specify the maximum amount of documents for every user and maximum document size in bytes.

```js
// server.ts

const app = express();
// do not forget body parser
app.use(bodyParser.json());

// api connector
const serverStorage = new ServerApiStorage({
    documentsLimit: 10,
    maximumDocumentSize: 100 // 100 bytes
});

// create route for storage
app.post("/storage/:action", async (req: Request, res: Response) => {
    // you can use cached storage with preloading here (not suitable for serverless)
    const userStorage = new MongoCRUD<any>("userStorage/"+getUserId(req));
    const response = await serverStorage.request(req.params.action as any, req.body, userStorage);
    res.json(response);
});

server = app.listen(3000, () => {
    console.log("Server started!");
});

// client.ts
const clientApiStorage = new ClientApiStorageCRUD<any>("http://localhost:3000/storage");
// but preferably use cached storage
const myStorage = new CacheStorageCRUD<any>(clientApiStorage, new MemoryCRUD(),false);
```