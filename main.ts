import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, FuzzySuggestModal, TFile, ItemView } from 'obsidian';
import { log } from "utils";
import CanvasUtilities from "canvasUtilities";
import CanvasCommandsManager from "CanvasCommandsManager";
import RaindropCanvasCommandsManager from "RaindropCanvasCommandsManager";

interface CTBSettings {
  raindropAccessToken: string;
}

const DEFAULT_SETTINGS: CTBSettings = {
  raindropAccessToken: "",
}

export default class CTB extends Plugin {
	settings: CTBSettings;
	canvasUtilities: CanvasUtilities;

	getOutlinks(filepath: string) {
		return app.metadataCache.resolvedLinks[filepath];
	}

	async onload() {
		log("Hello");
		this.canvasUtilities = new CanvasUtilities();
		await this.loadSettings();

		(new CanvasCommandsManager(this)).addCommands();
		(new RaindropCanvasCommandsManager(this)).addCommands();

		log("Loaded");

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CTBSettings(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CTBSettings extends PluginSettingTab {
	plugin: CTB;

	constructor(app: App, plugin: CTB) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Canvas Toolbox.'});

		new Setting(containerEl)
		.setName("Raindrop API Token")
		.setDesc("API access token used to authenticate with Raindrop.io")
		.addText((text) =>
			text
			.setPlaceholder("")
			.setValue(this.plugin.settings.raindropAccessToken)
			.onChange(async (value) => {
				this.plugin.settings.raindropAccessToken = value;
				await this.plugin.saveSettings();
			})
		);
	}
}
