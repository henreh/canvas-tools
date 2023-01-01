import CTB from "main";
import { ItemView } from "obsidian";
import { log } from "utils";
import { CollectionsModal, getCollections, getCollectionIdFromName, getRaindropsInCollection } from "raindrop";

export default class RaindropCanvasCommandsManager {
    collections: any;
    plugin: CTB;

    constructor(plugin: CTB) {
        this.plugin = plugin; 
        this.loadCollections();
    }

    async loadCollections() {
        this.collections = await getCollections(this.plugin.settings.raindropAccessToken);
    }

    public addCommands() {	
        this.plugin.addCommand({
            id: 'raindrop-add-collection',
            name: 'Canvas Toolbox > Raindrop > Add collection',
            hotkeys: [{ modifiers: ["Alt"], key: "c" }],
            checkCallback: (checking: boolean) => {
                if (!checking)
                {
                    const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
                    if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
                    {
                        // @ts-ignore
                        const canvas = canvasView.canvas;
                        log("canvas view", canvasView);
                        const collectionsModal = new CollectionsModal(this.plugin, this.collections, (collectionName: string) => {
                            log("Selected collection: " + collectionName);

                            const collectionId = getCollectionIdFromName(collectionName, this.collections);
                            log("Collection ID: " + collectionId);

                            getRaindropsInCollection(collectionId, this.plugin.settings.raindropAccessToken).then((raindrops) => {
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

                                    this.plugin.canvasUtilities.createURLNode(canvas, currX*width + currPadding, currY*height + yPadding, width, height, raindrop.link);

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
