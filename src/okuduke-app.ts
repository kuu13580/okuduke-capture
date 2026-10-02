import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/data-policy-modal.ts";
import "./components/pwa-install-modal.ts";
import "./components/record-edit-dialog.ts";
import "./components/record-list.ts";
import "./components/result-bottom-sheet.ts";
import "./components/scanner-view.ts";
import { extractWithGemini } from "./services/gemini-extractor.ts";
import { processImageSource } from "./services/image-processor.ts";
import { type ParsedOkuduke, parseOkudukeFromText } from "./services/rule-extractor.ts";
import {
  type AppConfig,
  type GeminiModelId,
  SUPPORTED_MODELS,
  generateCsv,
  generateTsv,
  type OkudukeRecord,
} from "./types.ts";
import { iconAlert, iconDownload, iconImage, iconScan, iconSettings } from "./ui/icons.ts";

const STORAGE_KEY_CONFIG = "okuduke_config";
const STORAGE_KEY_RECORDS = "okuduke_records";

@customElement("okuduke-app")
export class OkudukeApp extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state()
  private records: OkudukeRecord[] = [];

  @state()
  private config: AppConfig = {
    mode: "vlm",
    geminiApiKey: "",
    geminiModel: "gemini-3.1-flash-lite",
  };

  @state()
  private isScannerOpen = false;

  @state()
  private isBottomSheetOpen = false;

  @state()
  private isSettingsOpen = false;

  @state()
  private isPwaModalOpen = false;

  @state()
  private isTermsModalOpen = false;

  @state()
  private isInstalled = false;

  @state()
  private deferredInstallPrompt: {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  } | null = null;

  @state()
  private isAnalyzing = false;

  @state()
  private analysisProgress = "";

  @state()
  private pendingParsed: ParsedOkuduke | null = null;

  @state()
  private editingRecord: OkudukeRecord | null = null;

  @state()
  private feedbackMessage = "";

  private onBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    this.deferredInstallPrompt = e as any;
    const dismissed = localStorage.getItem("okuduke_pwa_dismissed");
    if (!dismissed && !this.isInstalled) {
      this.isPwaModalOpen = true;
    }
  };

  private onAppInstalled = () => {
    this.isInstalled = true;
    this.isPwaModalOpen = false;
    this.deferredInstallPrompt = null;
    this.showFeedback("アプリがホーム画面に追加されました");
  };

  private get isIosDevice(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.loadState();
    this.checkInstallationState();
    window.addEventListener("beforeinstallprompt", this.onBeforeInstallPrompt);
    window.addEventListener("appinstalled", this.onAppInstalled);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("beforeinstallprompt", this.onBeforeInstallPrompt);
    window.removeEventListener("appinstalled", this.onAppInstalled);
  }

  private checkInstallationState() {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    this.isInstalled = isStandalone;

    if (!isStandalone && this.isIosDevice) {
      const dismissed = localStorage.getItem("okuduke_pwa_dismissed");
      if (!dismissed) {
        this.isPwaModalOpen = true;
      }
    }
  }

  private loadState() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        let model: GeminiModelId = parsed.geminiModel;
        if (!SUPPORTED_MODELS.some((m) => m.id === model)) {
          model = "gemini-3.1-flash-lite";
        }

        this.config = {
          mode: parsed.mode || "vlm",
          geminiApiKey: parsed.geminiApiKey || "",
          geminiModel: model,
        };
      }

      const savedRecords = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (savedRecords) {
        this.records = JSON.parse(savedRecords);
      }
    } catch {
      // LocalStorageパースエラー時は初期値を使用
    }
  }

  private saveRecords(records: OkudukeRecord[]) {
    this.records = records;
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }

  private saveConfig(partial: Partial<AppConfig>) {
    this.config = { ...this.config, ...partial };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
  }

  private openScanner() {
    this.isScannerOpen = true;
  }

  private closeScanner() {
    this.isScannerOpen = false;
    this.closeBottomSheet();
  }

  private closeBottomSheet() {
    this.isBottomSheetOpen = false;
    this.pendingParsed = null;
  }

  private async handleCapture(e: CustomEvent<{ base64: string; mimeType: string }>) {
    this.isBottomSheetOpen = true;
    await this.processImage(e.detail.base64, e.detail.mimeType, this.config.geminiModel);
  }

  private async handleFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    await this.processSelectedFile(file);
    input.value = "";
  }

  private async processSelectedFile(file: File) {
    try {
      this.isBottomSheetOpen = true;
      this.isAnalyzing = true;
      this.analysisProgress = "画像を最適化中...";

      const processed = await processImageSource(file, { maxDimension: 1280, quality: 0.8 });
      await this.processImage(processed.base64, processed.mimeType, this.config.geminiModel);
    } catch (err) {
      this.isAnalyzing = false;
      this.analysisProgress = "";
      this.isBottomSheetOpen = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.showFeedback(`画像読み込みエラー: ${msg}`);
    }
  }

  private async processImage(base64Data: string, mimeType: string, targetModel: GeminiModelId) {
    this.isAnalyzing = true;
    this.analysisProgress = "奥付を読み取り中...";

    try {
      let parsed: ParsedOkuduke;

      if (this.config.mode === "vlm") {
        if (!this.config.geminiApiKey) {
          throw new Error("Gemini APIキーを設定してください。");
        }
        parsed = await extractWithGemini(
          base64Data,
          mimeType,
          this.config.geminiApiKey,
          targetModel,
        );
      } else {
        await new Promise((r) => setTimeout(r, 400));
        const sampleText = `
          東方幻想郷奇譚
          発行日: 2026年8月16日
          サークル: 幻想書房
          著者: 博麗博人
          印刷所: 日光企画
          コミックマーケット108 初版
        `;
        parsed = parseOkudukeFromText(sampleText);
      }

      this.pendingParsed = parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.showFeedback(`読み取りエラー: ${msg}`);
      if (!this.config.geminiApiKey) {
        this.isSettingsOpen = true;
      }
    } finally {
      this.isAnalyzing = false;
      this.analysisProgress = "";
    }
  }

  private handleConfirmParsed(e: CustomEvent<ParsedOkuduke>) {
    const data = e.detail;
    const record: OkudukeRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: data.title || "",
      circle: data.circle || "",
      author: data.author || "",
      publishDate: data.publishDate || "",
      printingCompany: data.printingCompany || "",
      memo: data.memo || "",
      scannedAt: new Date().toLocaleString("ja-JP"),
    };

    this.saveRecords([record, ...this.records]);
    this.closeBottomSheet();
    this.showFeedback(`「${record.title || "奥付"}」を追加しました（計${this.records.length}件）`);
  }

  private deleteRecord(id: string) {
    this.saveRecords(this.records.filter((r) => r.id !== id));
    this.showFeedback("1件削除しました");
  }

  private clearAll() {
    if (confirm("スキャン済みリストをすべて消去しますか？")) {
      this.saveRecords([]);
      this.showFeedback("リストをクリアしました");
    }
  }

  private async copyAsTsv() {
    const tsv = generateTsv(this.records);
    try {
      await navigator.clipboard.writeText(tsv);
      this.showFeedback("スプシ用TSVをクリップボードにコピーしました");
    } catch {
      this.showFeedback("クリップボードへのコピーに失敗しました");
    }
  }

  private downloadAsCsv() {
    const csv = generateCsv(this.records);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okuduke-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showFeedback("CSVファイルをダウンロードしました");
  }

  private handleSaveEdit(e: CustomEvent<OkudukeRecord>) {
    const updated = e.detail;
    this.saveRecords(this.records.map((r) => (r.id === updated.id ? updated : r)));
    this.editingRecord = null;
    this.showFeedback("変更を保存しました");
  }

  private async triggerInstall() {
    if (this.deferredInstallPrompt) {
      await this.deferredInstallPrompt.prompt();
      const choice = await this.deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        this.isInstalled = true;
        this.isPwaModalOpen = false;
      }
      this.deferredInstallPrompt = null;
    } else {
      this.closePwaModal(true);
    }
  }

  private closePwaModal(dismissForever = false) {
    this.isPwaModalOpen = false;
    if (dismissForever) {
      localStorage.setItem("okuduke_pwa_dismissed", "true");
    }
  }

  private showFeedback(msg: string) {
    this.feedbackMessage = msg;
    setTimeout(() => {
      if (this.feedbackMessage === msg) {
        this.feedbackMessage = "";
      }
    }, 2800);
  }

  render() {
    return html`
      <div class="app-layout">
        <header class="main-header">
          <div class="header-left">
            <img src="/icon.svg" alt="" class="header-app-logo" width="28" height="28" />
            <h1 class="brand-title">奥付キャプチャー</h1>
          </div>
          <div class="header-right">
            ${
              !this.isInstalled
                ? html`
                    <button
                      type="button"
                      class="btn-header-pill install-pill"
                      @click=${() => {
                        this.isPwaModalOpen = true;
                      }}
                      title="アプリをインストール"
                    >
                      ${iconDownload(15)}
                      <span class="install-text">インストール</span>
                    </button>
                  `
                : ""
            }
            ${
              !this.config.geminiApiKey && this.config.mode === "vlm"
                ? html`
                    <button
                      type="button"
                      class="btn-header-pill warning-pill"
                      @click=${() => {
                        this.isSettingsOpen = true;
                      }}
                      title="APIキーが未設定です"
                    >
                      ${iconAlert(16)}
                      <span>キー未設定</span>
                    </button>
                  `
                : ""
            }
            <button
              type="button"
              class="btn-header-icon"
              @click=${() => {
                this.isSettingsOpen = true;
              }}
              title="設定"
            >
              ${iconSettings(18)}
            </button>
          </div>
        </header>

        <main class="main-content">
          <record-list
            .records=${this.records}
            @edit=${(e: CustomEvent<OkudukeRecord>) => {
              this.editingRecord = e.detail;
            }}
            @delete=${(e: CustomEvent<string>) => {
              this.deleteRecord(e.detail);
            }}
            @copy-tsv=${this.copyAsTsv}
            @download-csv=${this.downloadAsCsv}
            @clear-all=${this.clearAll}
          ></record-list>
        </main>

        <footer class="main-bottom-bar">
          <div class="bottom-actions-row">
            <label class="btn-file-sub" title="写真アルバムから選択">
              ${iconImage(20)}
              <input
                type="file"
                accept="image/*"
                style="display: none;"
                @change=${this.handleFileSelected}
              />
            </label>

            <button
              type="button"
              class="btn-primary-scan"
              @click=${this.openScanner}
              title="カメラで奥付をスキャン"
            >
              ${iconScan(22)}
              <span>奥付をスキャン</span>
            </button>
          </div>

          <p class="terms-notice-footer">
            ご利用にあたり<button
              type="button"
              class="link-terms-inline"
              @click=${() => {
                this.isTermsModalOpen = true;
              }}
            >
              データの取り扱いについて</button
            >をご確認ください
          </p>
        </footer>

        <scanner-view
          .isOpen=${this.isScannerOpen}
          .recordCount=${this.records.length}
          .isAnalyzing=${this.isAnalyzing}
          .isPaused=${this.isBottomSheetOpen}
          @close=${this.closeScanner}
          @capture=${this.handleCapture}
          @file-selected=${(e: CustomEvent<File>) => this.processSelectedFile(e.detail)}
          @feedback=${(e: CustomEvent<string>) => this.showFeedback(e.detail)}
        ></scanner-view>

        <result-bottom-sheet
          .isOpen=${this.isBottomSheetOpen}
          .isAnalyzing=${this.isAnalyzing}
          .analysisProgress=${this.analysisProgress}
          .pendingParsed=${this.pendingParsed}
          @close=${this.closeBottomSheet}
          @confirm=${this.handleConfirmParsed}
        ></result-bottom-sheet>

        <settings-modal
          .isOpen=${this.isSettingsOpen}
          .config=${this.config}
          .isInstalled=${this.isInstalled}
          @close=${() => {
            this.isSettingsOpen = false;
          }}
          @save-config=${(e: CustomEvent<Partial<AppConfig>>) => this.saveConfig(e.detail)}
          @open-pwa-modal=${() => {
            this.isPwaModalOpen = true;
          }}
          @open-terms-modal=${() => {
            this.isTermsModalOpen = true;
          }}
        ></settings-modal>

        <pwa-install-modal
          .isOpen=${this.isPwaModalOpen}
          .hasInstallPrompt=${Boolean(this.deferredInstallPrompt)}
          @close=${(e: CustomEvent<{ dismissForever: boolean }>) => {
            this.closePwaModal(e.detail?.dismissForever);
          }}
          @install=${this.triggerInstall}
        ></pwa-install-modal>

        <data-policy-modal
          .isOpen=${this.isTermsModalOpen}
          @close=${() => {
            this.isTermsModalOpen = false;
          }}
        ></data-policy-modal>

        <record-edit-dialog
          .record=${this.editingRecord}
          @save=${this.handleSaveEdit}
          @close=${() => {
            this.editingRecord = null;
          }}
        ></record-edit-dialog>

        ${
          this.feedbackMessage
            ? html`<div class="feedback-toast">${this.feedbackMessage}</div>`
            : ""
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "okuduke-app": OkudukeApp;
  }
}
