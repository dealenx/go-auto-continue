// chatMonitor.ts
import * as vscode from "vscode";
import CopilotChatAnalyzer, { DialogStatus } from "copilot-chat-analyzer";

export interface ChatMonitorConfig {
  checkInterval: number;
  pauseThreshold: number;
  continueMessage: string;
  enableLogging: boolean;
}

export class ChatMonitor {
  private intervalId?: NodeJS.Timeout;
  private lastChatData: any = null;
  private pauseStartTime?: number;
  private analyzer: CopilotChatAnalyzer;
  private config: ChatMonitorConfig;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext, config: ChatMonitorConfig) {
    this.context = context;
    this.config = config;
    this.analyzer = new CopilotChatAnalyzer();

    // Создаем директорию для временных файлов если не существует
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory(): Promise<void> {
    try {
      await vscode.workspace.fs.createDirectory(this.context.globalStorageUri);
    } catch (error) {
      // Директория уже существует или ошибка создания - игнорируем
    }
  }

  public start(): void {
    this.log("Smart chat monitoring started");
    this.intervalId = setInterval(() => {
      this.checkChatStatus();
    }, this.config.checkInterval);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.log("Smart chat monitoring stopped");
    }
  }

  private async checkChatStatus(): Promise<void> {
    try {
      const chatData = await this.exportChatData();
      if (!chatData) return;

      const status = this.analyzer.getDialogStatus(chatData);
      this.log(`Chat status: ${status}`);

      if (status === DialogStatus.IN_PROGRESS) {
        this.pauseStartTime = undefined;
        return;
      }

      if (status === DialogStatus.COMPLETED) {
        // При завершении чата сразу отправляем сообщение для продолжения
        this.log("Chat completed - sending continue message");
        await this.sendContinueMessage();
        this.pauseStartTime = undefined;
        return;
      }

      if (status === DialogStatus.CANCELED) {
        this.handleChatPause();
      }
    } catch (error) {
      this.log(`Error checking chat status: ${error}`);
    }
  }

  private async exportChatData(): Promise<any> {
    try {
      // Создаем временный файл для экспорта
      const tempUri = vscode.Uri.joinPath(
        this.context.globalStorageUri,
        `chat-export-${Date.now()}.json`
      );

      // Выполняем команду экспорта чата в JSON формате
      await vscode.commands.executeCommand(
        "workbench.action.chat.export",
        tempUri
      );

      // Читаем содержимое экспортированного файла
      const content = await vscode.workspace.fs.readFile(tempUri);
      const chatContent = Buffer.from(content).toString("utf8");

      // Парсим JSON данные
      const chatData = JSON.parse(chatContent);

      // Удаляем временный файл
      try {
        await vscode.workspace.fs.delete(tempUri);
      } catch (deleteError) {
        // Игнорируем ошибки удаления
      }

      return chatData;
    } catch (error) {
      this.log(`Error exporting chat: ${error}`);
      return null;
    }
  }

  private getChatExportData(): any {
    // Этот метод больше не нужен, так как данные получаем напрямую из экспорта
    return this.lastChatData;
  }

  private handleChatPause(): void {
    if (!this.pauseStartTime) {
      this.pauseStartTime = Date.now();
      this.log("Chat pause detected");
      return;
    }

    const pauseDuration = Date.now() - this.pauseStartTime;
    if (pauseDuration >= this.config.pauseThreshold) {
      this.log(`Auto-continuing after ${pauseDuration}ms pause`);
      this.sendContinueMessage();
      this.pauseStartTime = undefined;
    }
  }

  private async sendContinueMessage(): Promise<void> {
    try {
      // Отправляем сообщение напрямую в чат
      await vscode.commands.executeCommand(
        "workbench.action.chat.open",
        this.config.continueMessage
      );

      this.log(`Continue message sent: "${this.config.continueMessage}"`);
    } catch (error) {
      this.log(`Error sending continue message: ${error}`);

      // Fallback: просто открываем чат
      try {
        await vscode.commands.executeCommand("workbench.action.chat.open");
        this.log("Chat opened as fallback");
      } catch (fallbackError) {
        this.log(`Error opening chat: ${fallbackError}`);
      }
    }
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[Auto-Continue] ${message}`);
    }
  }

  public isActive(): boolean {
    return this.intervalId !== undefined;
  }

  public updateConfig(newConfig: ChatMonitorConfig): void {
    this.config = newConfig;
    this.log("Configuration updated");
  }

  public getStatus(): string {
    if (this.isActive()) {
      return this.pauseStartTime ? "paused" : "monitoring";
    }
    return "stopped";
  }

  public dispose(): void {
    this.stop();
  }
}
