// extension.ts
import * as vscode from "vscode";

let continueInterval: NodeJS.Timeout | undefined;
let isRunning = false;
let webviewPanel: vscode.WebviewPanel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("Auto Continue extension activated");

  // Создать Tree View Provider
  const treeDataProvider = new AutoContinueTreeProvider();
  vscode.window.createTreeView("autoContinueView", {
    treeDataProvider: treeDataProvider,
  });

  // Команда для открытия панели управления
  const openPanelCommand = vscode.commands.registerCommand(
    "autoContinue.openPanel",
    () => {
      createWebviewPanel(context);
    }
  );

  // Команды для управления режимом
  const startCommand = vscode.commands.registerCommand(
    "autoContinue.start",
    () => {
      startContinueMode();
      updateWebview();
      treeDataProvider.refresh();
    }
  );

  const stopCommand = vscode.commands.registerCommand(
    "autoContinue.stop",
    () => {
      stopContinueMode();
      updateWebview();
      treeDataProvider.refresh();
    }
  );

  context.subscriptions.push(openPanelCommand, startCommand, stopCommand);

  // Статус бар
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "autoContinue.openPanel";
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Автоматически открыть панель при активации
  createWebviewPanel(context);
}

function createWebviewPanel(context: vscode.ExtensionContext) {
  if (webviewPanel) {
    webviewPanel.reveal();
    return;
  }

  webviewPanel = vscode.window.createWebviewPanel(
    "autoContinue",
    "Auto Continue Control",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  webviewPanel.webview.html = getWebviewContent();

  // Обработка сообщений от веб-вью
  webviewPanel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.command) {
        case "start":
          startContinueMode();
          updateWebview();
          break;
        case "stop":
          stopContinueMode();
          updateWebview();
          break;
        case "getStatus":
          updateWebview();
          break;
      }
    },
    undefined,
    context.subscriptions
  );

  webviewPanel.onDidDispose(() => {
    webviewPanel = undefined;
  });

  // Отправить начальный статус
  updateWebview();
}

function startContinueMode() {
  if (isRunning) {
    return;
  }

  isRunning = true;
  continueInterval = setInterval(() => {
    vscode.commands.executeCommand("workbench.action.chat.open", "continue");
  }, 10000); // 10 секунд

  vscode.window.showInformationMessage("Auto Continue mode started!");
  updateStatusBar();
}

function stopContinueMode() {
  if (!isRunning) {
    return;
  }

  isRunning = false;
  if (continueInterval) {
    clearInterval(continueInterval);
    continueInterval = undefined;
  }

  vscode.window.showInformationMessage("Auto Continue mode stopped!");
  updateStatusBar();
}

function updateWebview() {
  if (webviewPanel) {
    webviewPanel.webview.postMessage({
      command: "updateStatus",
      isRunning: isRunning,
    });
  }
}

function updateStatusBar() {
  if (statusBarItem) {
    if (isRunning) {
      statusBarItem.text = "$(play-circle) Auto Continue";
      statusBarItem.tooltip = "Auto Continue is running - Click to open panel";
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground"
      );
    } else {
      statusBarItem.text = "$(circle-large-outline) Auto Continue";
      statusBarItem.tooltip = "Auto Continue is stopped - Click to open panel";
      statusBarItem.backgroundColor = undefined;
    }
  }
}

function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto Continue Control</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            
            .container {
                max-width: 400px;
                margin: 0 auto;
            }
            
            .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .status {
                background-color: var(--vscode-textBlockQuote-background);
                border: 1px solid var(--vscode-textBlockQuote-border);
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .status.running {
                border-color: #4CAF50;
                background-color: rgba(76, 175, 80, 0.1);
            }
            
            .status.stopped {
                border-color: #f44336;
                background-color: rgba(244, 67, 54, 0.1);
            }
            
            .status-text {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .status-description {
                font-size: 14px;
                opacity: 0.8;
            }
            
            .controls {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .start-btn {
                background-color: #4CAF50;
            }
            
            .start-btn:hover:not(:disabled) {
                background-color: #45a049;
            }
            
            .stop-btn {
                background-color: #f44336;
            }
            
            .stop-btn:hover:not(:disabled) {
                background-color: #da190b;
            }
            
            .info {
                margin-top: 20px;
                padding: 15px;
                background-color: var(--vscode-textBlockQuote-background);
                border-radius: 4px;
                font-size: 14px;
                opacity: 0.8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="title">🤖 Auto Continue</div>
            
            <div id="status" class="status stopped">
                <div class="status-text">Остановлено</div>
                <div class="status-description">Автоматическое продолжение диалога выключено</div>
            </div>
            
            <div class="controls">
                <button id="startBtn" class="start-btn">▶️ Start Continue</button>
                <button id="stopBtn" class="stop-btn" disabled>⏹️ Stop Continue</button>
            </div>
            
            <div class="info">
                <strong>Как это работает:</strong><br>
                • Нажмите "Start Continue" чтобы начать автоматическое продолжение<br>
                • Команда "continue" будет отправляться каждые 10 секунд<br>
                • Нажмите "Stop Continue" чтобы остановить
            </div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            
            const statusDiv = document.getElementById('status');
            const startBtn = document.getElementById('startBtn');
            const stopBtn = document.getElementById('stopBtn');
            
            startBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'start' });
            });
            
            stopBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'stop' });
            });
            
            // Запросить текущий статус при загрузке
            vscode.postMessage({ command: 'getStatus' });
            
            // Обработка сообщений от расширения
            window.addEventListener('message', event => {
                const message = event.data;
                
                if (message.command === 'updateStatus') {
                    updateUI(message.isRunning);
                }
            });
            
            function updateUI(isRunning) {
                if (isRunning) {
                    statusDiv.className = 'status running';
                    statusDiv.innerHTML = '<div class="status-text">Запущено ✅</div><div class="status-description">Автоматическое продолжение диалога активно</div>';
                    startBtn.disabled = true;
                    stopBtn.disabled = false;
                } else {
                    statusDiv.className = 'status stopped';
                    statusDiv.innerHTML = '<div class="status-text">Остановлено ⏸️</div><div class="status-description">Автоматическое продолжение диалога выключено</div>';
                    startBtn.disabled = false;
                    stopBtn.disabled = true;
                }
            }
        </script>
    </body>
    </html>
  `;
}

export function deactivate() {
  stopContinueMode();
  console.log("Auto Continue extension deactivated");
}

// Tree View Provider для боковой панели
class AutoContinueTreeProvider
  implements vscode.TreeDataProvider<AutoContinueItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AutoContinueItem | undefined | null | void
  > = new vscode.EventEmitter<AutoContinueItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AutoContinueItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: AutoContinueItem): vscode.TreeItem {
    return element;
  }

  getChildren(): AutoContinueItem[] {
    return [
      new AutoContinueItem(
        isRunning ? "🟢 Running" : "🔴 Stopped",
        isRunning ? "Auto continue is active" : "Auto continue is stopped",
        vscode.TreeItemCollapsibleState.None
      ),
      new AutoContinueItem(
        "🎮 Open Control Panel",
        "Click to open the control panel",
        vscode.TreeItemCollapsibleState.None,
        {
          command: "autoContinue.openPanel",
          title: "Open Panel",
        }
      ),
    ];
  }
}

class AutoContinueItem extends vscode.TreeItem {
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
