import { Notice } from "obsidian";
import { log } from "utils";


export default class CanvasUtilities {
    viewIsCanvas(canvasView: any): boolean {
        return canvasView?.getViewType() === "canvas";
    }

    createEntityId(): string {
        //Return a random 16 character string
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    getSelectedNodes(canvas: any): any[] {
        const selection = canvas.selection;
        const selectedNodes = Array.from(selection);
        return selectedNodes;
    }

    createEdge(fromNode: any, toNode: any, canvas: any)
    {
        //This is to get the prototype...TODO redo when API is fixed
		const edge = canvas.edges.get(canvas.getData().edges.first()?.id);
        if (!edge) { new Notice("Add an edge first to use this command..."); return;  }

        
        const tempEdge = new edge.constructor(canvas, this.createEntityId(), {side: "right", node: fromNode}, {side: "left", node: toNode});
        canvas.addEdge(tempEdge);
        tempEdge.attach();
        tempEdge.render();       
        return tempEdge;
    }

    createNode(canvas: any, x: number, y: number, width: number, height: number, text: string)
    {
        const n = canvas.createTextNode({x: x, y: y, width: width, height: height, text: text}, this.createEntityId(), true);
        log("node", n);
        n.setText(text);
        canvas.addNode(n);
        n.attach();
        n.render();
        return n; 
    }

    createURLNode(canvas: any, x: number, y: number, width: number, height: number, url: string)
    {
        const n = canvas.createLinkNode(url, {x: x, y: y, width: width, height: height}, true);
        log("node", n);
        canvas.addNode(n);
        n.attach();
        n.render();
        return n; 
    }

    createFileNode(canvas: any, x: number, y: number, width: number, height: number, filepath: string)
    {
        const n = canvas.createFileNode(app.vault.getAbstractFileByPath(filepath), "", {x: x, y: y, width: width, height: height}, true);
        canvas.addNode(n);
        n.attach();
        n.render();
        return n;
    }

    createConnectedFanOut(canvas: any, sourceNode: any, texts: string[])
    {
        //For each text, create a node and connect it to the source node
        for (let i = 0; i < texts.length; i++)
        {
            const text = texts[i];
            const node = this.createNode(canvas, sourceNode.x + 500, sourceNode.y + (i * 100), 350, 50, text);
            this.createEdge(sourceNode, node, canvas);
        }
    }
}