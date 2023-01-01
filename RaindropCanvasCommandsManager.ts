import CTB from "main";
import { ItemView } from "obsidian";
import { log } from "utils";
import { CollectionsModal, getCollections, getCollectionIdFromName, getRaindropsInCollection } from "raindrop";

export default class RaindropCanvasCommandsManager {
    collections: any;
    plugin: CTB;

    constructor(plugin: CTB) {
        this.loadCollections(plugin);
    }

    async loadCollections(plugin: CTB) {
        this.collections = await getCollections(plugin.settings.raindropAccessToken);
        log("Collections", this.collections);
    }

    public addCommands() {	
        this.plugin.addCommand({
            id: 'raindrop-add-collection',
            name: 'Add collection',
            hotkeys: [{ modifiers: ["Alt"], key: "c" }],
            checkCallback: (checking: boolean) => {
                if (!checking)
                {
                    const canvasView = plugin.app.workspace.getActiveViewOfType(ItemView);
                    if (plugin.canvasUtilities.viewIsCanvas(canvasView))
                    {
                        // @ts-ignore
                        const canvas = canvasView.canvas;
                        log("canvas view", canvasView);
                        const collectionsModal = new CollectionsModal(plugin, this.collections, (collectionName: string) => {
                            log("Selected collection: " + collectionName);

                            const collectionId = getCollectionIdFromName(collectionName, this.collections);
                            log("Collection ID: " + collectionId);

                            getRaindropsInCollection(collectionId, plugin.settings.raindropAccessToken).then((raindrops) => {
                                log("Raindrops in collection: " + raindrops.length);

                                const numX = 5;
                                let currX = 0;
                                let currY = 0;
                                let i = 0;

                                const width = 500;
                                const height = 750;
                                const padding = 75; 

                                raindrops.forEach((raindrop: any) => {
                                    if (currX > numX) { currX = 0; currY++; }

                                    const currPadding = i == 0 ? 0 : padding;
                                    const yPadding = currY == 0 ? 0 : padding;

                                    plugin.canvasUtilities.createURLNode(canvas, currX*width + currPadding, currY*height + yPadding, width, height, raindrop.link);

                                    currX++;
                                    i++;
                                });
                            });
                        }).open();
                    }
                }
            }
        })
    }
}
