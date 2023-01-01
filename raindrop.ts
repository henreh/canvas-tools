import CTB from "main";
import { FuzzySuggestModal } from "obsidian";
import { log } from "utils";

const RAINDROP_API_BASE = "https://api.raindrop.io/rest/v1/";

const callRaindropAPI = async (path: string, accessToken: string) => {
    log("Calling Raindrop API", path);

    const result = await fetch(RAINDROP_API_BASE + path, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const jsonResult = await result.json(); 

    log("Result", jsonResult);
    return jsonResult;
}

export const getCollections = async (accessToken: string) => {
    const collections = await callRaindropAPI("collections", accessToken);

    //Create an object of each collection in the items array using the _id property as key
    const collectionsById = collections.items.reduce((obj, item) => {
        obj[item._id] = item;
        return obj;
    }, {});

    
    //Get all the children collections
    const collectionsWithChildren = await callRaindropAPI("collections/childrens", accessToken);

    //Add the children collections to the collectionsById objects as a "children" array property. If the parent ID is not in the collectionsById object, check for it in the children array and add it as a children array property.
    collectionsWithChildren.items.forEach((collection: any) => {
        const parentKey = collection.parent.$id;
        const currKey = collection._id;

        if (collectionsById[parentKey]) {
            //If parent collection doesn't have a children array, create it
            if (!collectionsById[parentKey].children) {
                collectionsById[parentKey].children = [];
            }
            //Add collection to parent collection children array
            collectionsById[parentKey].children.push(collection);
        } else {
            collectionsWithChildren.items.forEach((otherCollection: any) => {
                //If otherCollection ID is parent of collection, add collection to otherCollection children array
                if (otherCollection._id === parentKey) {
                    //If otherCollection doesn't have a children array, create it
                    if (!otherCollection.children) {
                        otherCollection.children = [];
                    }
                    otherCollection.children.push(collection);
                }
            });
        }
    });

    return collectionsById;
}

export const getRaindropsInCollection = async (collectionId: string, accessToken: string) => {
    const raindrops = await callRaindropAPI(`raindrops/${collectionId}`, accessToken);
    return raindrops.items;
}

const parseCollectionNames = (collections: any) => {
    log("Parsing collection names", collections)
    //Create an array of all collection names, with children listed as "parent > child", recursively for all children
    const collectionNames: string[] = [];

    const addCollectionNames = (collection: any, parentName: string = "") => {
        const collectionName = parentName + collection.title;
        collectionNames.push(collectionName);
        //If collection has children, add their names to the collectionNames array
        if (collection.children) {
            collection.children.forEach((child: any) => {
                addCollectionNames(child, collectionName + " > ");
            });
        }
    };
    
    //Loop through collections object to add to the collectionNames array
    for (const collectionId in collections) {
        addCollectionNames(collections[collectionId]);
    }

 
    return collectionNames;
}

const flattenCollections = (collections: any): any[] => {
    //Flatten the collections object into an array of collections with children at root
    const flattenedCollections: any[] = [];

    const addCollections = (collection: any): void => {

        flattenedCollections.push(collection);

        //If collection has children, add their names to the collectionNames array
        if (collection.children) {
            collection.children.forEach((child: any) => {
                addCollections(child);
            });
        }

    };

    //Loop through collections object to add to the flattenedCollections array
    for (const collectionId in collections) {
        addCollections(collections[collectionId]);
    }

    return flattenedCollections;
}

export const getCollectionIdFromName = (collectionName: string, collections: any): string => {
    //collectionName is in the format "parent > child > child", with 0 or more children
    const collectionNameParts = collectionName.split(" > ");

    //Find the collection ID for the youngest child
    const flatCollections = flattenCollections(collections);
    for (const collection of flatCollections) {
        if (collection.title == collectionNameParts[collectionNameParts.length - 1]) {
            return collection._id;
        }
    }
    //If no collection ID was found, return an empty string
    return "";
}


export class CollectionsModal extends FuzzySuggestModal<string> {
    plugin: CTB;
    callback: (collectionName: string) => void;
    collectionNames: string[];

    constructor(plugin: any, collections: any, callback: (collectionName: string) => void) {
        super(plugin.app);
        this.plugin = plugin;
        this.callback = callback;
        this.collectionNames = parseCollectionNames(collections);
    }

    getItems(): string[] {
        return this.collectionNames;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        this.callback(item);
        this.close();
    }
}