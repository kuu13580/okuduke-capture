import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { extractWithGemini } from "./services/gemini-extractor.ts";
import { processImageSource, processVideoFrameWithCrop } from "./services/image-processor.ts";
import { type ParsedOkuduke, parseOkudukeFromText } from "./services/rule-extractor.ts";
import {
  type AppConfig,
  type GeminiModelId,
  SUPPORTED_MODELS,
  generateCsv,
  generateTsv,
  type OkudukeRecord,
} from "./types.ts";
import {
  iconAlert,
  iconArrowLeft,
  iconCamera,
  iconCameraOff,
  iconCheck,
  iconCopy,
  iconDownload,
  iconEdit,
  iconImage,
  iconPlus,
  iconScan,
  iconSettings,
  iconTrash,
  iconX,
} from "./ui/icons.ts";

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
  private isCameraActive = false;

  @state()
  private isAnalyzing = false;

  @state()
  private analysisProgress = "";

  @state()
  private isBottomSheetOpen = false;

  @state()
  private isSettingsOpen = false;

  @state()
  private pendingParsed: ParsedOkuduke | null = null;

  @state()
  private editingRecord: OkudukeRecord | null = null;

  @state()
  private feedbackMessage = "";

  private mediaStream: MediaStream | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this.loadState();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCamera();
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
      // localStorageのパースエラーは初期値のまま進行
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

  render() {
    return html`
      <div class="app-layout">
        <header class="main-header">
          <div class="header-left">
            <h1 class="brand-title">奥付キャプチャー</h1>
          </div>
          <div class="header-right">
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
          <div class="list-summary-bar">
            <div class="summary-left">
              <span class="count-badge">${this.records.length}件</span>
              <span class="summary-label">の奥付データ</span>
            </div>
            <div class="summary-actions">
              <button
                type="button"
                class="btn-action"
                @click=${this.copyAsTsv}
                ?disabled=${this.records.length === 0}
                title="GoogleスプレッドシートやExcelに直接貼り付け可能な形式でコピー"
              >
                ${iconCopy(15)} TSVコピー
              </button>
              <button
                type="button"
                class="btn-action"
                @click=${this.downloadAsCsv}
                ?disabled=${this.records.length === 0}
                title="CSVファイルとしてダウンロード"
              >
                ${iconDownload(15)} CSV保存
              </button>
              <button
                type="button"
                class="btn-action btn-danger-action"
                @click=${this.clearAll}
                ?disabled=${this.records.length === 0}
                title="全件消去"
              >
                ${iconTrash(15)}
              </button>
            </div>
          </div>

          <div class="records-container">
            ${
              this.records.length === 0
                ? html`
                    <div class="empty-state-card">
                      <div class="empty-icon">${iconScan(48)}</div>
                      <p class="empty-title">まだデータがありません</p>
                      <p class="empty-desc">
                        同人誌の奥付をカメラでかざしてスキャンすると、ここに自動でリスト化されます。
                      </p>
                    </div>
                  `
                : html`
                    <div class="records-list">
                      ${this.records.map(
                        (r, idx) => html`
                          <div class="record-item">
                            <div class="record-index">${this.records.length - idx}</div>
                            <div class="record-body">
                              <h3 class="record-title">${r.title || "（無題）"}</h3>
                              <div class="record-grid">
                                <span class="record-prop">
                                  <span class="prop-key">サークル:</span>
                                  <span class="prop-val">${r.circle || "-"}</span>
                                </span>
                                <span class="record-prop">
                                  <span class="prop-key">著者:</span>
                                  <span class="prop-val">${r.author || "-"}</span>
                                </span>
                                <span class="record-prop">
                                  <span class="prop-key">発行日:</span>
                                  <span class="prop-val">${r.publishDate || "-"}</span>
                                </span>
                                <span class="record-prop">
                                  <span class="prop-key">印刷所:</span>
                                  <span class="prop-val">${r.printingCompany || "-"}</span>
                                </span>
                              </div>
                              ${r.memo ? html`<div class="record-memo">${r.memo}</div>` : ""}
                            </div>
                            <div class="record-controls">
                              <button
                                type="button"
                                class="btn-row-action"
                                @click=${() => this.openEditModal(r)}
                                title="編集"
                              >
                                ${iconEdit(16)}
                              </button>
                              <button
                                type="button"
                                class="btn-row-action btn-row-delete"
                                @click=${() => this.deleteRecord(r.id)}
                                title="削除"
                              >
                                ${iconTrash(16)}
                              </button>
                            </div>
                          </div>
                        `,
                      )}
                    </div>
                  `
            }
          </div>
        </main>

        <footer class="main-bottom-bar">
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
        </footer>

        ${this.isScannerOpen ? this.renderScannerView() : ""}
        ${this.isSettingsOpen ? this.renderSettingsModal() : ""}

        <dialog id="edit-dialog">
          ${
            this.editingRecord
              ? html`
                  <form method="dialog" @submit=${this.handleSaveEdit}>
                    <div class="dialog-header">
                      <h3>奥付データの編集</h3>
                      <button type="button" class="btn-dialog-close" @click=${this.closeEditModal}>
                        ${iconX(18)}
                      </button>
                    </div>
                    <label>
                      タイトル
                      <input name="title" type="text" .value=${this.editingRecord.title} required />
                    </label>
                    <label>
                      サークル名
                      <input name="circle" type="text" .value=${this.editingRecord.circle} />
                    </label>
                    <label>
                      著者/発行者
                      <input name="author" type="text" .value=${this.editingRecord.author} />
                    </label>
                    <label>
                      発行日
                      <input
                        name="publishDate"
                        type="text"
                        .value=${this.editingRecord.publishDate}
                      />
                    </label>
                    <label>
                      印刷所
                      <input
                        name="printingCompany"
                        type="text"
                        .value=${this.editingRecord.printingCompany}
                      />
                    </label>
                    <label>
                      備考
                      <input name="memo" type="text" .value=${this.editingRecord.memo} />
                    </label>
                    <menu>
                      <button type="button" class="btn-sub" @click=${this.closeEditModal}>
                        キャンセル
                      </button>
                      <button type="submit" class="btn-main">${iconCheck(16)} 保存</button>
                    </menu>
                  </form>
                `
              : ""
          }
        </dialog>

        ${
          this.feedbackMessage
            ? html`<div class="feedback-toast">${this.feedbackMessage}</div>`
            : ""
        }
      </div>
    `;
  }

  private renderScannerView() {
    return html`
      <div class="scanner-fullscreen">
        <div class="scanner-topbar">
          <button
            type="button"
            class="btn-scanner-back"
            @click=${this.closeScanner}
            title="リストに戻る"
          >
            ${iconArrowLeft(20)}
            <span>完了 (${this.records.length}冊)</span>
          </button>

          <div class="scanner-topbar-right">
            ${
              this.isCameraActive
                ? html`
                    <button
                      type="button"
                      class="btn-scanner-icon"
                      @click=${this.stopCamera}
                      title="カメラ一時停止"
                    >
                      ${iconCameraOff(18)}
                    </button>
                  `
                : html`
                    <button
                      type="button"
                      class="btn-scanner-icon"
                      @click=${this.startCamera}
                      title="カメラ起動"
                    >
                      ${iconCamera(18)}
                    </button>
                  `
            }
          </div>
        </div>

        <div class="scanner-viewport">
          ${
            this.isCameraActive
              ? html`
                  <video id="camera-stream" autoplay playsinline muted></video>
                  <div class="scanner-overlay-guide">
                    <div class="scanner-frame">
                      <div class="corner top-left"></div>
                      <div class="corner top-right"></div>
                      <div class="corner bottom-left"></div>
                      <div class="corner bottom-right"></div>
                      <div class="frame-hint">奥付を枠内に合わせてください</div>
                    </div>
                  </div>
                  <canvas id="capture-canvas" style="display: none;"></canvas>
                `
              : html`
                  <div class="scanner-inactive">
                    <div class="inactive-icon">${iconCamera(40)}</div>
                    <p>カメラが停止しています</p>
                    <button type="button" class="btn-main" @click=${this.startCamera}>
                      ${iconCamera(18)} カメラを起動する
                    </button>
                  </div>
                `
          }
        </div>

        <div class="scanner-bottombar">
          <label class="btn-scanner-sub" title="写真から読み取る">
            ${iconImage(22)}
            <input
              type="file"
              accept="image/*"
              style="display: none;"
              @change=${this.handleFileSelected}
            />
          </label>

          <button
            type="button"
            class="btn-read-trigger"
            ?disabled=${this.isAnalyzing}
            @click=${this.captureAndAnalyze}
            title="奥付を読み取る"
          >
            <div class="read-trigger-inner">
              ${this.isAnalyzing ? html`<div class="trigger-spinner"></div>` : iconScan(30)}
            </div>
          </button>

          <div style="width: 48px;"></div>
        </div>

        ${this.isBottomSheetOpen ? this.renderBottomSheet() : ""}
      </div>
    `;
  }

  private renderBottomSheet() {
    return html`
      <div class="bottomsheet-overlay" @click=${this.handleBottomSheetBackdropClick}>
        <div class="bottomsheet-card" @click=${(e: Event) => e.stopPropagation()}>
          <div class="bottomsheet-handle"></div>

          <div class="bottomsheet-header">
            <h3>${this.isAnalyzing ? "奥付を読み取り中..." : "読み取り結果"}</h3>
            <button
              type="button"
              class="btn-sheet-close"
              @click=${this.closeBottomSheet}
              title="閉じる"
            >
              ${iconX(18)}
            </button>
          </div>

          ${
            this.isAnalyzing
              ? html`
                  <div class="analyzing-view">
                    <div class="spinner"></div>
                    <p class="analyzing-text">${this.analysisProgress || "奥付を読み取り中..."}</p>
                  </div>
                `
              : this.pendingParsed
                ? html`
                    <form class="sheet-form" @submit=${this.handleConfirmParsed}>
                      <label class="field-title">
                        <span class="field-label">タイトル</span>
                        <input
                          name="title"
                          type="text"
                          .value=${this.pendingParsed.title}
                          placeholder="作品タイトル"
                          required
                        />
                      </label>

                      <div class="fields-row">
                        <label>
                          <span class="field-label">サークル名</span>
                          <input
                            name="circle"
                            type="text"
                            .value=${this.pendingParsed.circle}
                            placeholder="サークル名"
                          />
                        </label>
                        <label>
                          <span class="field-label">著者/発行者</span>
                          <input
                            name="author"
                            type="text"
                            .value=${this.pendingParsed.author}
                            placeholder="著者名"
                          />
                        </label>
                      </div>

                      <div class="fields-row">
                        <label>
                          <span class="field-label">発行日</span>
                          <input
                            name="publishDate"
                            type="text"
                            .value=${this.pendingParsed.publishDate}
                            placeholder="例: 2026年8月16日"
                          />
                        </label>
                        <label>
                          <span class="field-label">印刷所</span>
                          <input
                            name="printingCompany"
                            type="text"
                            .value=${this.pendingParsed.printingCompany}
                            placeholder="印刷所名"
                          />
                        </label>
                      </div>

                      <label>
                        <span class="field-label">備考 / イベント名</span>
                        <input
                          name="memo"
                          type="text"
                          .value=${this.pendingParsed.memo}
                          placeholder="例: コミケ108 初版"
                        />
                      </label>

                      <div class="sheet-action-row">
                        <button
                          type="button"
                          class="btn-sheet-cancel"
                          @click=${this.closeBottomSheet}
                        >
                          破棄
                        </button>
                        <button type="submit" class="btn-sheet-confirm">
                          ${iconPlus(18)} リストに追加して次へ
                        </button>
                      </div>
                    </form>
                  `
                : html`<p class="empty-sheet">データがありません</p>`
          }
        </div>
      </div>
    `;
  }

  private renderSettingsModal() {
    return html`
      <div class="modal-backdrop" @click=${() => (this.isSettingsOpen = false)}>
        <div class="modal-box" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-box-header">
            <h3>設定</h3>
            <button
              type="button"
              class="btn-dialog-close"
              @click=${() => (this.isSettingsOpen = false)}
            >
              ${iconX(18)}
            </button>
          </div>

          <div class="modal-box-body">
            <label>
              <strong>Gemini API キー</strong>
              <input
                type="password"
                placeholder="AIzaSy..."
                .value=${this.config.geminiApiKey}
                @input=${(e: Event) => {
                  const input = e.target as HTMLInputElement;
                  this.saveConfig({ geminiApiKey: input.value.trim() });
                }}
              />
              <span class="help-text">
                Google AI
                Studioで取得したAPIキーを入力します。端末（localStorage）にのみ保存されます。
              </span>
            </label>

            <details class="settings-advanced">
              <summary>高度な設定 (解析モデル)</summary>
              <div class="advanced-content">
                <label>
                  <strong>使用モデル</strong>
                  <select
                    .value=${this.config.mode === "mock" ? "mock" : this.config.geminiModel}
                    @change=${(e: Event) => {
                      const select = e.target as HTMLSelectElement;
                      if (select.value === "mock") {
                        this.saveConfig({ mode: "mock" });
                      } else {
                        this.saveConfig({
                          mode: "vlm",
                          geminiModel: select.value as GeminiModelId,
                        });
                      }
                    }}
                  >
                    <optgroup label="Gemini VLM">
                      ${SUPPORTED_MODELS.map(
                        (m) => html` <option value=${m.id}>${m.name} (${m.tag})</option> `,
                      )}
                    </optgroup>
                    <optgroup label="テスト用">
                      <option value="mock">モックデータ (APIキー不要)</option>
                    </optgroup>
                  </select>
                </label>
              </div>
            </details>
          </div>

          <div class="modal-box-footer">
            <button type="button" class="btn-main" @click=${() => (this.isSettingsOpen = false)}>
              ${iconCheck(16)} 完了
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private openScanner() {
    this.isScannerOpen = true;
    this.startCamera().catch(() => {});
  }

  private closeScanner() {
    this.isScannerOpen = false;
    this.stopCamera();
    this.closeBottomSheet();
  }

  private handleBottomSheetBackdropClick() {
    if (!this.isAnalyzing) {
      this.closeBottomSheet();
    }
  }

  private closeBottomSheet() {
    this.isBottomSheetOpen = false;
    this.pendingParsed = null;
  }

  private async startCamera() {
    try {
      this.isCameraActive = true;
      await this.updateComplete;

      const video = this.querySelector<HTMLVideoElement>("#camera-stream");
      if (!video) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      this.mediaStream = stream;
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      this.isCameraActive = false;
      const message = err instanceof Error ? err.message : String(err);
      this.showFeedback(`カメラ起動エラー: ${message}`);
    }
  }

  private stopCamera() {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
    this.isCameraActive = false;
  }

  private async captureAndAnalyze() {
    const video = this.querySelector<HTMLVideoElement>("#camera-stream");
    const frame = this.querySelector<HTMLElement>(".scanner-frame");
    if (!video) {
      this.showFeedback("カメラを起動するか、画像ファイルを選択してください");
      return;
    }

    try {
      const processed = processVideoFrameWithCrop(video, frame, {
        maxDimension: 1280,
        quality: 0.8,
      });

      this.isBottomSheetOpen = true;
      await this.processImage(processed.base64, processed.mimeType, this.config.geminiModel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.showFeedback(`キャプチャ処理エラー: ${msg}`);
    }
  }

  private async handleFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      this.isScannerOpen = true;
      this.isBottomSheetOpen = true;
      this.isAnalyzing = true;
      this.analysisProgress = "画像を最適化中...";

      const processed = await processImageSource(file, { maxDimension: 1280, quality: 0.8 });

      await this.processImage(processed.base64, processed.mimeType, this.config.geminiModel);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.showFeedback(`画像読み込みエラー: ${msg}`);
    } finally {
      input.value = "";
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

  private handleConfirmParsed(e: SubmitEvent) {
    e.preventDefault();
    if (!this.pendingParsed) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const record: OkudukeRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: (formData.get("title") as string) || "",
      circle: (formData.get("circle") as string) || "",
      author: (formData.get("author") as string) || "",
      publishDate: (formData.get("publishDate") as string) || "",
      printingCompany: (formData.get("printingCompany") as string) || "",
      memo: (formData.get("memo") as string) || "",
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

  private openEditModal(record: OkudukeRecord) {
    this.editingRecord = { ...record };
    const dialog = this.querySelector<HTMLDialogElement>("#edit-dialog");
    dialog?.showModal();
  }

  private closeEditModal() {
    const dialog = this.querySelector<HTMLDialogElement>("#edit-dialog");
    dialog?.close();
    this.editingRecord = null;
  }

  private handleSaveEdit(e: SubmitEvent) {
    e.preventDefault();
    if (!this.editingRecord) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const updated: OkudukeRecord = {
      ...this.editingRecord,
      title: (formData.get("title") as string) || "",
      circle: (formData.get("circle") as string) || "",
      author: (formData.get("author") as string) || "",
      publishDate: (formData.get("publishDate") as string) || "",
      printingCompany: (formData.get("printingCompany") as string) || "",
      memo: (formData.get("memo") as string) || "",
    };

    this.saveRecords(this.records.map((r) => (r.id === updated.id ? updated : r)));
    this.closeEditModal();
    this.showFeedback("変更を保存しました");
  }

  private showFeedback(msg: string) {
    this.feedbackMessage = msg;
    setTimeout(() => {
      if (this.feedbackMessage === msg) {
        this.feedbackMessage = "";
      }
    }, 2800);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "okuduke-app": OkudukeApp;
  }
}
