import CTB from "main";
import { FuzzySuggestModal, ItemView, Notice } from "obsidian";
import { log } from "utils";
import { runCommand } from "python";

class CanvasCommands {
	plugin: CTB;

	constructor(plugin: CTB) {
		this.plugin = plugin;
	}

	inspectNode() { 
		/*
		* Logs the selected node
		*/
		const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
		if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
		{
			// @ts-ignore
			const canvas = canvasView.canvas;
			const selectedNodes = this.plugin.canvasUtilities.getSelectedNodes(canvas);
			if (selectedNodes.length == 1)
			{
				log("selectedNodes", selectedNodes);
			}
		}
	}	

	addLinkedFiles() { 
		const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
		if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
		{
			// @ts-ignore
			const canvas = canvasView.canvas;
			const selectedNodes = this.plugin.canvasUtilities.getSelectedNodes(canvas);
			const selectedNode = selectedNodes[0]; 

			const outlinks = Object.keys(this.plugin.getOutlinks(selectedNode.filePath));

			if (outlinks.length > 0)
			{
				for (let i = 0; i < outlinks.length; i++)
				{
					const newNode = this.plugin.canvasUtilities.createFileNode(canvas, 
					selectedNode.x + 500, 
					selectedNode.y + (i * selectedNode.height) + (i > 0 ? 1 : 0) * 50, 
					selectedNode.width, 
					selectedNode.height, 
					outlinks[i]);

					this.plugin.canvasUtilities.createEdge(selectedNode, newNode, canvas);
				}
			}
		}
	}

	fanBulletsOut() {
		const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
		if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
		{
			// @ts-ignore
			const canvas = canvasView.canvas;
			const selectedNodes = this.plugin.canvasUtilities.getSelectedNodes(canvas);
			const selectedNode = selectedNodes[0]; 

			//Split selected node text by newlines that contain "-" at the start
			const bullets = selectedNode.text.split(/\r?\n/).filter(item => item.startsWith("-")).map(item => `## ${item.replace("-", "").trim()}`);
			log("bullets", bullets);

			if (bullets.length > 0)
			{
				this.plugin.canvasUtilities.createConnectedFanOut(
					canvas,
					selectedNodes[0],
					bullets,
				)
			}
		}
	}
}

class WebCanvasCommands {
	plugin: CTB;

	constructor(plugin: CTB) {
		this.plugin = plugin;
	}

	getLinksFromWebPage(url: string, callback: (links:any[]) => void):void {

		runCommand('links_from_webpage', [url], this.plugin.app, (err, result) => {
			if (err)
			{
				log("err", err);
			}
			else
			{
				//Join result array into one string
				const resultString = result.join("\n");
				const data = JSON.parse(resultString);
				callback(data);
			}
		});
	}

	copyWebNodeURL() {
		const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
		if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
		{
			// @ts-ignore
			const canvas = canvasView.canvas;
			const selectedNodes = this.plugin.canvasUtilities.getSelectedNodes(canvas);
			const selectedNode = selectedNodes[0]; 
			
			const url = selectedNode.url;
			if (url)
			{
				//Copy URL to clipboard
				navigator.clipboard.writeText(url);
				//Display notice
				new Notice("URL copied to clipboard");
			}
		}
	}

	extractWebpageNode() {
		const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
		if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
		{
			// @ts-ignore
			const canvas = canvasView.canvas;
			const selectedNodes = this.plugin.canvasUtilities.getSelectedNodes(canvas);
			const selectedNode = selectedNodes[0]; 

			const url = selectedNode.url;
			if (url)
			{
				runCommand("process_web_page", [url], this.plugin.app, (err, result) => {
					if (err)
					{
						log("err", err);
					}
					else
					{
						
						//Join result array into one string
						const resultString = result.join("\n\n");
						log("result", resultString);

						const data = JSON.parse(resultString);
						const text = data.maintext;

						//Replace all \n in text with 2 newlines
						const textWithNewlines = text.replace(/\n/g, "\n\n");

						const title = data.title;
						const description = data.description;
						const url = data.url;
						const image = data.image_url;

						let newNode = this.plugin.canvasUtilities.createNode(
							canvas,
							selectedNode.x + 500,
							selectedNode.y,
							selectedNode.width,
							750,
								`# ${title} \n` + 
								`## ${description} \n` +
								`### ${url} \n` + 
								`![${title}|300](${image}) \n` +
								`${textWithNewlines}`
						)
					}
				});
			}
		}
	}
}

export default class CanvasCommandsManager {
	commands: CanvasCommands;
	webCommands: WebCanvasCommands;
	plugin: CTB;

    constructor(plugin: CTB) {
		this.plugin = plugin;
		this.commands = new CanvasCommands(plugin);
		this.webCommands = new WebCanvasCommands(plugin);
    }

    public addCommands() {	
        log("Setting up commands");
		this.plugin.addCommand({
			id: 'copy-web-node-url',
			name: 'Canvas Toolbox > Copy web node URL',
			hotkeys: [{ modifiers: ["Alt"], key: "c" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					this.webCommands.copyWebNodeURL();
				}
			}
		})

		this.plugin.addCommand({
			id: 'inspect-node',
			name: 'Canvas Toolbox > Inspect node',
			hotkeys: [{ modifiers: ["Alt"], key: "i" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					this.commands.inspectNode();
				}
			}
		})

		this.plugin.addCommand({
			id: 'add-linked-files',
			name: 'Canvas Toolbox > Add linked files',
			hotkeys: [{ modifiers: ["Alt"], key: "w" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					this.commands.addLinkedFiles();
				}
			}
		})

		this.plugin.addCommand({
			id: 'fan-bullets',
			name: 'Canvas Toolbox > Fan bullets out',
			hotkeys: [{ modifiers: ["Alt"], key: "r" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					this.commands.fanBulletsOut();
				}
			}
		}); 

		this.plugin.addCommand({
			id: 'process-web-page',
			name: 'Canvas Toolbox > Process web page',
			hotkeys: [{ modifiers: ["Alt"], key: "p" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					this.webCommands.extractWebpageNode();
				}
			}
		});

		this.plugin.addCommand({
			id: 'follow-link-as-node',
			name: 'Canvas Toolbox > Follow link as node',
			hotkeys: [{ modifiers: ["Alt"], key: "f" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					const canvasView = this.plugin.app.workspace.getActiveViewOfType(ItemView);
					if (this.plugin.canvasUtilities.viewIsCanvas(canvasView))
					{
						// @ts-ignore
						const canvas = canvasView.canvas;
						const selectedNodes = this.plugin.canvasUtilities.getSelectedNodes(canvas);
						const selectedNode = selectedNodes[0]; 
			
						const url = selectedNode.url;
						if (url)
						{
							this.webCommands.getLinksFromWebPage(url, (links) => {
								log("links", links);
								const modal = new LinksModal(this.plugin, links, (selectedItem) => {
									log("selectedItem", selectedItem);
									const newNode = this.plugin.canvasUtilities.createURLNode(canvas, 0, 0, 500, 750, selectedItem.href);
									this.plugin.canvasUtilities.createEdge(selectedNode, newNode, canvas);
								}).open();
							});
						}
					}
				}
			}
		})
    }
}



export class LinksModal extends FuzzySuggestModal<string> {
    plugin: CTB;
    callback: (selectedItem: any) => void;
    links: any[];

    constructor(plugin: any, links: any, callback: (selectedItem: any) => void) {
        super(plugin.app);
        this.plugin = plugin;
        this.callback = callback;
		this.links = links;
    }

    getItems(): string[] {
        return this.links;
    }

    getItemText(item: string): string {
        return item.text;
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        this.callback(item);
        this.close();
    }
}