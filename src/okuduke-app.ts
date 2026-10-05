import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./components/data-policy-modal.ts";
import "./components/pwa-install-modal.ts";
import "./components/record-detail-modal.ts";
import "./components/record-edit-dialog.ts";
import "./components/record-list.ts";
import "./components/result-bottom-sheet.ts";
import "./components/scanner-view.ts";
import { extractWithBff } from "./services/bff-extractor.ts";
import { processImageSource } from "./services/image-processor.ts";
import type { ParsedOkuduke } from "./services/rule-extractor.ts";
import { analytics } from "./services/analytics.ts";
import { extractFieldCandidates, generateCsv, generateTsv, type OkudukeRecord } from "./types.ts";
import { iconDownload, iconImage, iconScan } from "./ui/icons.ts";

const STORAGE_KEY_RECORDS = "okuduke_records";
const STORAGE_KEY_PWA_PROMPTED = "okuduke_pwa_dismissed";

@customElement("okuduke-app")
export class OkudukeApp extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state()
  private records: OkudukeRecord[] = [];

  @state()
  private isScannerOpen = false;

  @state()
  private isBottomSheetOpen = false;

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
  private selectedRecordForDetail: OkudukeRecord | null = null;

  @state()
  private feedbackMessage = "";

  private currentAnalysisId = 0;
  private isPreviewMode = false;

  private onBeforeInstallPrompt = (e: Event) => {
    e.preventDefault();
    this.deferredInstallPrompt = e as any;
    const prompted = localStorage.getItem(STORAGE_KEY_PWA_PROMPTED);
    if (!prompted && !this.isInstalled) {
      this.isPwaModalOpen = true;
      localStorage.setItem(STORAGE_KEY_PWA_PROMPTED, "true");
      analytics.pwaPromptShow();
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

    const params = new URLSearchParams(window.location.search);
    const preview = params.get("preview");
    if (preview) {
      this.isPreviewMode = true;
      this.isInstalled = true;
      if (this.records.length === 0) {
        this.records = [
          {
            id: "sample-1",
            title: "星屑のダイアログ",
            circle: "銀河通信社",
            author: "星野るな",
            publishDate: "2026-08-16",
            printingCompany: "日光企画",
            memo: "コミックマーケット108新刊 初版",
            scannedAt: "2026/10/05 00:00",
          },
          {
            id: "sample-2",
            title: "喫茶ポラリスの日常",
            circle: "北極星工房",
            author: "蒼井ミナト",
            publishDate: "2026-05-04",
            printingCompany: "緑陽社",
            memo: "SUPER COMIC CITY 33",
            scannedAt: "2026/10/05 00:05",
          },
        ];
      }
      if (preview === "sheet") {
        this.isBottomSheetOpen = true;
        this.pendingParsed = {
          title: "夜明け前のプレリュード",
          circle: "銀河通信社",
          author: "星野るな",
          publishDate: "2026-08-16",
          printingCompany: "日光企画",
          memo: "C108新刊 特典ペーパー付き",
          rawText: "夜明け前のプレリュード...",
        };
      } else if (preview === "edit") {
        this.editingRecord = this.records[0] || null;
      } else if (preview === "scroll") {
        this.records = Array.from({ length: 8 }, (_, i) => ({
          id: `sample-${i + 1}`,
          title: `サンプル同人誌作品 その${i + 1}`,
          circle: `サンプルサークル ${i + 1}`,
          author: `作者名 ${i + 1}`,
          publishDate: `2026-08-${String(10 + i).padStart(2, "0")}`,
          printingCompany: "日光企画",
          memo: `テスト備考 ${i + 1}`,
          scannedAt: "2026/10/05 00:00",
        }));
      }
    }
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
      const prompted = localStorage.getItem(STORAGE_KEY_PWA_PROMPTED);
      if (!prompted) {
        this.isPwaModalOpen = true;
        localStorage.setItem(STORAGE_KEY_PWA_PROMPTED, "true");
        analytics.pwaPromptShow();
      }
    }
  }

  private loadState() {
    try {
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
    if (this.isPreviewMode) return;
    const persistable = records.filter((r) => !r.id.startsWith("sample-"));
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(persistable));
  }

  private openScanner() {
    this.isScannerOpen = true;
  }

  private closeScanner() {
    this.isScannerOpen = false;
    this.closeBottomSheet();
  }

  private closeBottomSheet() {
    this.currentAnalysisId++;
    this.isBottomSheetOpen = false;
    this.pendingParsed = null;
    this.isAnalyzing = false;
    this.analysisProgress = "";
  }

  private async handleCapture(e: CustomEvent<{ base64: string; mimeType: string }>) {
    analytics.scanStart("camera");
    this.isBottomSheetOpen = true;
    await this.processImage(e.detail.base64, e.detail.mimeType);
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
      analytics.scanStart("file");
      this.isBottomSheetOpen = true;
      this.isAnalyzing = true;
      this.analysisProgress = "画像を最適化中...";

      const processed = await processImageSource(file, { maxDimension: 1280, quality: 0.8 });
      await this.processImage(processed.base64, processed.mimeType);
    } catch (err) {
      analytics.scanError("image_process_failed");
      this.isAnalyzing = false;
      this.analysisProgress = "";
      this.isBottomSheetOpen = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.showFeedback(`画像読み込みエラー: ${msg}`);
    }
  }

  private async processImage(base64Data: string, mimeType: string) {
    const analysisId = ++this.currentAnalysisId;
    this.isAnalyzing = true;
    this.analysisProgress = "奥付を読み取り中...";

    try {
      const parsed = await extractWithBff(base64Data, mimeType);

      if (analysisId !== this.currentAnalysisId) return;
      this.pendingParsed = parsed;
      analytics.scanSuccess({
        hasTitle: Boolean(parsed.title),
        hasCircle: Boolean(parsed.circle),
        hasAuthor: Boolean(parsed.author),
      });
    } catch (err) {
      if (analysisId !== this.currentAnalysisId) return;
      analytics.scanError("extract_failed");
      const msg = err instanceof Error ? err.message : String(err);
      this.showFeedback(`読み取りエラー: ${msg}`);
    } finally {
      if (analysisId === this.currentAnalysisId) {
        this.isAnalyzing = false;
        this.analysisProgress = "";
      }
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

    const actualRecords = this.records.filter((r) => !r.id.startsWith("sample-"));
    this.saveRecords([record, ...actualRecords]);
    analytics.recordSave();
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
      analytics.exportData("tsv", this.records.length);
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
    analytics.exportData("csv", this.records.length);
    this.showFeedback("CSVファイルをダウンロードしました");
  }

  private handleSaveEdit(e: CustomEvent<OkudukeRecord>) {
    const updated = e.detail;
    this.saveRecords(this.records.map((r) => (r.id === updated.id ? updated : r)));
    this.editingRecord = null;
    if (this.selectedRecordForDetail?.id === updated.id) {
      this.selectedRecordForDetail = updated;
    }
    this.showFeedback("変更を保存しました");
  }

  private handleSelectRecord(e: CustomEvent<OkudukeRecord>) {
    this.selectedRecordForDetail = e.detail;
  }

  private handleUpdateRecord(e: CustomEvent<OkudukeRecord>) {
    const updated = e.detail;
    this.saveRecords(this.records.map((r) => (r.id === updated.id ? updated : r)));
    if (this.selectedRecordForDetail?.id === updated.id) {
      this.selectedRecordForDetail = updated;
    }
  }

  private handleToggleComplete(e: CustomEvent<OkudukeRecord>) {
    const target = e.detail;
    const updated: OkudukeRecord = { ...target, isCompleted: !target.isCompleted };
    this.saveRecords(this.records.map((r) => (r.id === updated.id ? updated : r)));
    if (this.selectedRecordForDetail?.id === updated.id) {
      this.selectedRecordForDetail = updated;
    }
  }

  private async triggerInstall() {
    analytics.pwaInstallClick();
    if (this.deferredInstallPrompt) {
      await this.deferredInstallPrompt.prompt();
      const choice = await this.deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") {
        this.isInstalled = true;
      }
      this.isPwaModalOpen = false;
      localStorage.setItem(STORAGE_KEY_PWA_PROMPTED, "true");
      this.deferredInstallPrompt = null;
    } else {
      this.closePwaModal();
    }
  }

  private closePwaModal() {
    this.isPwaModalOpen = false;
    localStorage.setItem(STORAGE_KEY_PWA_PROMPTED, "true");
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
          <div class="header-inner">
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
                        class="chip active"
                        @click=${() => {
                          this.isPwaModalOpen = true;
                          analytics.pwaPromptShow();
                        }}
                        title="アプリをインストール"
                      >
                        ${iconDownload(14)}
                        <span>インストール</span>
                      </button>
                    `
                  : ""
              }
            </div>
          </div>
        </header>

        <main class="main-content">
          <record-list
            .records=${this.records}
            @select=${this.handleSelectRecord}
            @toggle-complete=${this.handleToggleComplete}
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
          <div class="bottom-bar-inner">
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
          </div>
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
          .candidates=${extractFieldCandidates(this.records)}
          @close=${this.closeBottomSheet}
          @confirm=${this.handleConfirmParsed}
        ></result-bottom-sheet>

        <pwa-install-modal
          .isOpen=${this.isPwaModalOpen}
          .hasInstallPrompt=${Boolean(this.deferredInstallPrompt)}
          @close=${this.closePwaModal}
          @install=${this.triggerInstall}
        ></pwa-install-modal>

        <data-policy-modal
          .isOpen=${this.isTermsModalOpen}
          @close=${() => {
            this.isTermsModalOpen = false;
          }}
        ></data-policy-modal>

        <record-detail-modal
          .isOpen=${Boolean(this.selectedRecordForDetail)}
          .record=${this.selectedRecordForDetail}
          @close=${() => {
            this.selectedRecordForDetail = null;
          }}
          @update-record=${this.handleUpdateRecord}
          @edit=${(e: CustomEvent<OkudukeRecord>) => {
            this.selectedRecordForDetail = null;
            this.editingRecord = e.detail;
          }}
          @delete=${(e: CustomEvent<string>) => {
            this.selectedRecordForDetail = null;
            this.deleteRecord(e.detail);
          }}
          @feedback=${(e: CustomEvent<string>) => this.showFeedback(e.detail)}
        ></record-detail-modal>

        <record-edit-dialog
          .record=${this.editingRecord}
          .candidates=${extractFieldCandidates(this.records)}
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
