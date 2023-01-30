import * as vscode from "vscode";
import { NpmRunnerProvider, NpmTask } from "./npmRunnerProvider";
import { runTask, stopTask } from "./taskCommands";

export function activate(context: vscode.ExtensionContext): void {
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;

  const npmRunnerProvider: NpmRunnerProvider = new NpmRunnerProvider(rootPath!);

  context.subscriptions.push(
    vscode.commands.registerCommand("npmRunner.runTask", (task: NpmTask) =>
      runTask(task)
    ),

    vscode.commands.registerCommand("npmRunner.stopTask", (task: NpmTask) =>
      stopTask(task)
    ),

    vscode.window.registerTreeDataProvider("npmRunner", npmRunnerProvider),

    vscode.tasks.onDidStartTaskProcess((event) => npmRunnerProvider.refresh()),

    vscode.workspace.onDidSaveTextDocument(
      (document) =>
        document.fileName.includes("package.json") &&
        npmRunnerProvider.refresh()
    )
  );
}
