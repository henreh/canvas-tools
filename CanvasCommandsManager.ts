import CTB from "main";
import { ItemView } from "obsidian";
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
}

export default class CanvasCommandsManager {
	commands: CanvasCommands;
	plugin: CTB;

    constructor(plugin: CTB) {
		this.plugin = plugin;
		this.commands = new CanvasCommands(plugin);
    }

    public addCommands() {	
        log("Setting up commands");
		this.plugin.addCommand({
			id: 'inspect-node',
			name: 'Inspect node',
			hotkeys: [{ modifiers: ["Alt"], key: "i" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{

				}
			}
		})

		this.plugin.addCommand({
			id: 'link-nodes',
			name: 'Link nodes',
			hotkeys: [{ modifiers: ["Alt"], key: "m" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					const canvasView = plugin.app.workspace.getActiveViewOfType(ItemView);
					if (plugin.canvasUtilities.viewIsCanvas(canvasView))
					{
						// @ts-ignore
						const canvas = canvasView.canvas;
						const selectedNodes = plugin.canvasUtilities.getSelectedNodes(canvas);
						if (selectedNodes.length == 2)
						{
							plugin.canvasUtilities.createEdge(selectedNodes[0], selectedNodes[1], canvas);
						}
					}
				}
			}
		});

		this.plugin.addCommand({
			id: 'add-linked-files',
			name: 'Add linked files',
			hotkeys: [{ modifiers: ["Alt"], key: "w" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					const canvasView = plugin.app.workspace.getActiveViewOfType(ItemView);
					if (plugin.canvasUtilities.viewIsCanvas(canvasView))
					{
						// @ts-ignore
						const canvas = canvasView.canvas;
						const selectedNodes = plugin.canvasUtilities.getSelectedNodes(canvas);
						const selectedNode = selectedNodes[0]; 

						const outlinks = Object.keys(plugin.getOutlinks(selectedNode.filePath));

						if (outlinks.length > 0)
						{
							for (let i = 0; i < outlinks.length; i++)
							{
								const newNode = plugin.canvasUtilities.createFileNode(canvas, 
									selectedNode.x + 500, 
									selectedNode.y + (i * selectedNode.height) + (i > 0 ? 1 : 0) * 50, 
									selectedNode.width, 
									selectedNode.height, 
									outlinks[i]);

								plugin.canvasUtilities.createEdge(selectedNode, newNode, canvas);
							}
						}
					}
				}
			}
		})

		this.plugin.addCommand({
			id: 'fan-bullets',
			name: 'Fan bullets out',
			hotkeys: [{ modifiers: ["Alt"], key: "r" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					const canvasView = plugin.app.workspace.getActiveViewOfType(ItemView);
					if (plugin.canvasUtilities.viewIsCanvas(canvasView))
					{
						// @ts-ignore
						const canvas = canvasView.canvas;
						const selectedNodes = plugin.canvasUtilities.getSelectedNodes(canvas);
						const selectedNode = selectedNodes[0]; 

						//Split selected node text by newlines that contain "-" at the start
						const bullets = selectedNode.text.split(/\r?\n/).filter(item => item.startsWith("-")).map(item => `## ${item.replace("-", "").trim()}`);
						log("bullets", bullets);

						if (bullets.length > 0)
						{
							plugin.canvasUtilities.createConnectedFanOut(
								canvas,
								selectedNodes[0],
								bullets,
							)
						}
					}
				}
			}
		}); 

		this.plugin.addCommand({
			id: 'process-web-page',
			name: 'Process web page',
			hotkeys: [{ modifiers: ["Alt"], key: "p" }],
			checkCallback: (checking: boolean) => {
				if (!checking)
				{
					const canvasView = plugin.app.workspace.getActiveViewOfType(ItemView);
					if (plugin.canvasUtilities.viewIsCanvas(canvasView))
					{
						// @ts-ignore
						const canvas = canvasView.canvas;
						const selectedNodes = plugin.canvasUtilities.getSelectedNodes(canvas);
						const selectedNode = selectedNodes[0]; 

						const url = selectedNode.url;
						if (url)
						{
							runCommand("process_web_page", [url], plugin.app, (err, result) => {
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

									let newNode = plugin.canvasUtilities.createNode(
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
		});

		this.plugin.addCommand({
			id: 'follow-link-as-node',
			name: 'Follow link as node',
			hotkeys: [{ modifiers: ["Alt"], key: "f" }],
		})
    }
}