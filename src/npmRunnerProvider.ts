import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

const pathsToExclude = ["/node_modules", "/dist", "/build", "/out"];

export type NpmRunnerTreeItem = BaseItem | NpmTask;

export class BaseItem extends vscode.TreeItem {
  children: NpmTask[];

  constructor(
    label: string,
    projectName: string,
    children: NpmTask[],
    expanded: boolean = true
  ) {
    super(
      label,
      expanded
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.children = children;
    this.description = projectName;
  }

  iconPath = vscode.ThemeIcon.Folder;
}

export class NpmRunnerProvider
  implements vscode.TreeDataProvider<NpmRunnerTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<NpmRunnerTreeItem | null> =
    new vscode.EventEmitter<NpmRunnerTreeItem | null>();
  readonly onDidChangeTreeData: vscode.Event<NpmRunnerTreeItem | null> =
    this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  getTreeItem(element: NpmRunnerTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: NpmRunnerTreeItem): Thenable<NpmRunnerTreeItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No NpmTask in empty workspace");
      return Promise.resolve([]);
    }

    if (element instanceof BaseItem) {
      return Promise.resolve(element.children);
    }

    return Promise.resolve(this.getBaseItems());
  }

  private getPackageJsonPath(folder: string): string {
    return path.join(folder, "package.json");
  }

  private getBaseItems(): BaseItem[] {
    const baseItems: BaseItem[] = [];

    const files = glob
      .sync(this.workspaceRoot + "/**/package.json", {
        ignore: "node_modules",
      })
      .filter((file) => !pathsToExclude.some((path) => file.includes(path)));

    files.forEach((filePath) => {
      const { name, tasks } = this.getPackageJsonNameAndTasks(filePath);

      if (!tasks.length) {
        return;
      }

      const relativePath = path
        .relative(this.workspaceRoot, filePath)
        .replace("/package.json", "");

      baseItems.push(new BaseItem(relativePath, name, tasks, false));
    });

    return baseItems;
  }

  private getPackageJsonNameAndTasks(packageJsonPath: string): {
    name: string;
    tasks: NpmTask[];
  } {
    if (!this.pathExists(packageJsonPath)) {
      return {
        name: "",
        tasks: [],
      };
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

    const scripts = Object.keys(packageJson.scripts || {});

    if (!scripts.length) {
      return {
        tasks: [],
        name: "",
      };
    }

    const toNpmTask = (commandName: string): NpmTask => {
      return new NpmTask(commandName, packageJson.name);
    };

    return {
      tasks: scripts.map(toNpmTask),
      name: packageJson.name,
    };
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

export class NpmTask extends vscode.TreeItem {
  constructor(
    public readonly commandName: string,
    public readonly commandPath: string
  ) {
    super(commandName);
  }

  contextValue: string = `${this.commandPath}_${this.commandName}`;
}
