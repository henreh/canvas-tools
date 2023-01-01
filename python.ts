import { FileSystemAdapter } from "obsidian";
import {PythonShell} from "python-shell";
import {log} from "utils";

//https://github.com/kometenstaub/linked-data-helper/blob/f18e160f091f0a0bd81c5f9a109334bcf74ffadc/src/methods/methods-loc.ts#L26
const getAbsolutePath = (app: any, fileName: string): string => {
    let basePath;
    let relativePath;

    // base path
    if (app.vault.adapter instanceof FileSystemAdapter) {
        basePath = app.vault.adapter.getBasePath();
    } else {
        throw new Error('Cannot determine base path.');
    }
    // relative path
    relativePath = `${app.vault.configDir}/plugins/canvas-toolbox/${fileName}`;
    // absolute path
    return `${basePath}/${relativePath}`;
}


export const runCommand = (command: string, args: string[], app: any, callback: (err: any, results: any) => void) => {
    // Append current directory to command string
    // This is necessary because the python scripts are in the same directory as this file
    command = getAbsolutePath(app, command + ".py");
    log("Running command", command)
    
    const options = {
        mode: "text",
        scriptPath: "",
        args: args
    };

    PythonShell.run(command, options, callback);
}