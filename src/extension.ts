// extension.ts
import * as vscode from "vscode";
import { t } from "./i18n";
import { ChatMonitor, ChatMonitorConfig } from "./chatMonitor";

let treeDataProvider: GoAutoContinueTreeProvider;
let chatMonitor: ChatMonitor;

export function activate(context: vscode.ExtensionContext) {
  console.log(t("extension.activated"));

  // Получаем настройки для ChatMonitor
  const config = vscode.workspace.getConfiguration("goAutoContinue");
  const monitorConfig: ChatMonitorConfig = {
    checkInterval: config.get<number>("checkInterval", 5),
    pauseThreshold: config.get<number>("pauseThreshold", 10),
    continueMessage: config.get<string>("message", "continue"),
    enableLogging: config.get<boolean>("enableLogging", true),
  };

  chatMonitor = new ChatMonitor(context, monitorConfig);

  // Создать Tree View Provider
  treeDataProvider = new GoAutoContinueTreeProvider();
  vscode.window.createTreeView("goAutoContinueView", {
    treeDataProvider: treeDataProvider,
  });

  // Основные команды для управления умным мониторингом
  const startCommand = vscode.commands.registerCommand(
    "goAutoContinue.start",
    () => {
      chatMonitor.start();
      treeDataProvider.refresh();
    }
  );

  const stopCommand = vscode.commands.registerCommand(
    "goAutoContinue.stop",
    () => {
      chatMonitor.stop();
      treeDataProvider.refresh();
    }
  );

  // Команда для переключения режима
  const toggleCommand = vscode.commands.registerCommand(
    "goAutoContinue.toggle",
    () => {
      if (chatMonitor.isActive()) {
        chatMonitor.stop();
      } else {
        chatMonitor.start();
      }
      treeDataProvider.refresh();
    }
  );

  // Команда для открытия настроек
  const openSettingsCommand = vscode.commands.registerCommand(
    "goAutoContinue.openSettings",
    () => {
      vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "goAutoContinue"
      );
    }
  );

  context.subscriptions.push(
    startCommand,
    stopCommand,
    toggleCommand,
    openSettingsCommand
  );

  // Слушатель изменений настроек
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration("goAutoContinue")) {
        treeDataProvider.refresh();

        // Обновляем конфигурацию мониторинга
        const config = vscode.workspace.getConfiguration("goAutoContinue");
        const newMonitorConfig: ChatMonitorConfig = {
          checkInterval: config.get<number>("checkInterval", 5),
          pauseThreshold: config.get<number>("pauseThreshold", 10),
          continueMessage: config.get<string>("message", "continue"),
          enableLogging: config.get<boolean>("enableLogging", true),
        };
        chatMonitor.updateConfig(newMonitorConfig);
      }
    }
  );

  context.subscriptions.push(configChangeListener);
}

// Tree View Provider для боковой панели
class GoAutoContinueTreeProvider
  implements vscode.TreeDataProvider<GoAutoContinueItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    GoAutoContinueItem | undefined | null | void
  > = new vscode.EventEmitter<GoAutoContinueItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    GoAutoContinueItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: GoAutoContinueItem): vscode.TreeItem {
    return element;
  }

  getChildren(): GoAutoContinueItem[] {
    const items: GoAutoContinueItem[] = [];

    // Главная кнопка управления умным мониторингом
    if (chatMonitor && chatMonitor.isActive()) {
      items.push(
        new GoAutoContinueItem(
          t("button.stop"),
          `${t("tooltip.stop")} | Статус: ${chatMonitor.getStatus()}`,
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.stop",
            title: t("action.stop"),
          }
        )
      );
    } else {
      items.push(
        new GoAutoContinueItem(
          t("button.start"),
          t("tooltip.start") +
            " | Умный мониторинг через workbench.action.chat.export",
          vscode.TreeItemCollapsibleState.None,
          {
            command: "goAutoContinue.start",
            title: t("action.start"),
          }
        )
      );
    }

    // Настройки
    const config = vscode.workspace.getConfiguration("goAutoContinue");
    const checkInterval = config.get<number>("checkInterval", 5);
    const pauseThreshold = config.get<number>("pauseThreshold", 10);
    const message = config.get<string>("message", "continue");

    items.push(
      new GoAutoContinueItem(
        t("button.settings"),
        `Настройки: проверка каждые ${checkInterval}с, пауза ${pauseThreshold}с, сообщение "${message}"`,
        vscode.TreeItemCollapsibleState.None,
        {
          command: "goAutoContinue.openSettings",
          title: t("action.openSettings"),
        }
      )
    );

    return items;
  }
}

class GoAutoContinueItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.command = command;
  }
}

export function deactivate() {
  if (chatMonitor) {
    chatMonitor.dispose();
  }
  console.log(t("extension.deactivated"));
}
