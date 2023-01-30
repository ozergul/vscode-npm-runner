import * as vscode from "vscode";
import { NpmTask } from "./npmRunnerProvider";

type RunningScripts = Record<string, boolean>;
const runningScripts: RunningScripts = {};

const setRunningScripts = (v: RunningScripts): void => {
  vscode.commands.executeCommand("setContext", "npmRunner.scriptRunning", v);
};

export const runTask: (npmTask: NpmTask) => Promise<void> = async (npmTask) => {
  const allTasks: vscode.Task[] = await vscode.tasks.fetchTasks();
  const task: vscode.Task = allTasks.filter(
    (_task) => _task.definition.script === npmTask.label
  )[0];

  if (!task) {
    return;
  }

  runningScripts[npmTask.contextValue] = true;
  setRunningScripts(runningScripts);

  await vscode.tasks.executeTask(task);
};

export const stopTask: (npmTask: NpmTask) => Promise<void> = async (
  npmTask
) => {
  const executedTask = vscode.tasks.taskExecutions.find(
    (taskExecution) => taskExecution.task.definition.script === npmTask.label
  );

  if (!executedTask) {
    return;
  }

  delete runningScripts[npmTask.contextValue];

  setRunningScripts(runningScripts);

  executedTask.terminate();
};
