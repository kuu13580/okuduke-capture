import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { ParsedOkuduke } from "../services/rule-extractor.ts";
import { iconPlus, iconX } from "../ui/icons.ts";

@customElement("result-bottom-sheet")
export class ResultBottomSheet extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Boolean })
  isAnalyzing = false;

  @property({ type: String })
  analysisProgress = "";

  @property({ type: Object })
  pendingParsed: ParsedOkuduke | null = null;

  private handleBackdropClick() {
    if (!this.isAnalyzing) {
      this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
    }
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (!this.pendingParsed) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const result: ParsedOkuduke = {
      title: (formData.get("title") as string) || "",
      circle: (formData.get("circle") as string) || "",
      author: (formData.get("author") as string) || "",
      publishDate: (formData.get("publishDate") as string) || "",
      printingCompany: (formData.get("printingCompany") as string) || "",
      memo: (formData.get("memo") as string) || "",
      rawText: this.pendingParsed.rawText || "",
    };

    this.dispatchEvent(
      new CustomEvent("confirm", {
        detail: result,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="bottomsheet-overlay" @click=${this.handleBackdropClick}>
        <div class="bottomsheet-card" @click=${(e: Event) => e.stopPropagation()}>
          <div class="bottomsheet-handle"></div>

          <div class="bottomsheet-header">
            <h3>${this.isAnalyzing ? "奥付を読み取り中..." : "読み取り結果"}</h3>
            <button type="button" class="btn-sheet-close" @click=${this.handleClose} title="閉じる">
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
                    <form class="sheet-form" @submit=${this.handleSubmit}>
                      <label class="field-title">
                        <span class="field-label">タイトル</span>
                        <input
                          class="input"
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
                            class="input"
                            name="circle"
                            type="text"
                            .value=${this.pendingParsed.circle}
                            placeholder="サークル名"
                          />
                        </label>
                        <label>
                          <span class="field-label">著者/発行者</span>
                          <input
                            class="input"
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
                            class="input"
                            name="publishDate"
                            type="text"
                            .value=${this.pendingParsed.publishDate}
                            placeholder="例: 2026年8月16日"
                          />
                        </label>
                        <label>
                          <span class="field-label">印刷所</span>
                          <input
                            class="input"
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
                          class="input"
                          name="memo"
                          type="text"
                          .value=${this.pendingParsed.memo}
                          placeholder="例: コミケ108 初版"
                        />
                      </label>

                      <div class="sheet-action-row">
                        <button
                          type="button"
                          class="button secondary btn-sheet-cancel"
                          @click=${this.handleClose}
                        >
                          破棄
                        </button>
                        <button type="submit" class="button btn-sheet-confirm">
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
}

declare global {
  interface HTMLElementTagNameMap {
    "result-bottom-sheet": ResultBottomSheet;
  }
}
