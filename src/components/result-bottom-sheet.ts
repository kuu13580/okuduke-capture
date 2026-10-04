import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { normalizeDateToInput } from "../services/date-formatter.ts";
import type { ParsedOkuduke } from "../services/rule-extractor.ts";
import type { FieldCandidates } from "../types.ts";
import { iconCalendar, iconPlus, iconX } from "../ui/icons.ts";

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

  @property({ type: Object })
  candidates?: FieldCandidates;

  private handleBackdropClick() {
    if (!this.isAnalyzing) {
      this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
    }
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleOpenDatePicker(e: Event) {
    const root = (e.currentTarget as HTMLElement).closest(".input-with-action");
    if (!root) return;
    const picker = root.querySelector<HTMLInputElement>(".sr-only-picker");
    const textInput = root.querySelector<HTMLInputElement>('input[name="publishDate"]');
    if (picker) {
      if (textInput?.value) {
        const normalized = normalizeDateToInput(textInput.value);
        if (normalized) {
          picker.value = normalized;
        }
      }
      try {
        if (typeof picker.showPicker === "function") {
          picker.showPicker();
        } else {
          picker.focus();
          picker.click();
        }
      } catch {
        picker.focus();
        picker.click();
      }
    }
  }

  private handleDateChange(e: Event) {
    const picker = e.target as HTMLInputElement;
    const root = picker.closest(".input-with-action");
    if (!root) return;
    const textInput = root.querySelector<HTMLInputElement>('input[name="publishDate"]');
    if (textInput && picker.value) {
      textInput.value = picker.value;
      textInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
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

          <datalist id="sheet-circle-candidates">
            ${(this.candidates?.circles || []).map((c) => html`<option value=${c}></option>`)}
          </datalist>
          <datalist id="sheet-author-candidates">
            ${(this.candidates?.authors || []).map((a) => html`<option value=${a}></option>`)}
          </datalist>
          <datalist id="sheet-printing-candidates">
            ${(this.candidates?.printingCompanies || []).map((p) => html`<option value=${p}></option>`)}
          </datalist>

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

                      <label>
                        <span class="field-label">サークル名</span>
                        <input
                          class="input"
                          name="circle"
                          type="text"
                          list="sheet-circle-candidates"
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
                          list="sheet-author-candidates"
                          .value=${this.pendingParsed.author}
                          placeholder="著者名"
                        />
                      </label>

                      <div class="fields-row">
                        <label>
                          <span class="field-label">発行日</span>
                          <div class="input-with-action">
                            <input
                              class="input"
                              name="publishDate"
                              type="text"
                              .value=${this.pendingParsed.publishDate}
                              placeholder="例: 2026-08-16 / 2026年夏"
                            />
                            <button
                              type="button"
                              class="btn-input-action"
                              @click=${this.handleOpenDatePicker}
                              title="カレンダーから日付を選択"
                              aria-label="カレンダーから日付を選択"
                            >
                              ${iconCalendar(18)}
                            </button>
                            <input
                              type="date"
                              class="sr-only-picker"
                              .value=${normalizeDateToInput(this.pendingParsed.publishDate)}
                              @change=${this.handleDateChange}
                              tabindex="-1"
                              aria-hidden="true"
                            />
                          </div>
                        </label>
                        <label>
                          <span class="field-label">印刷所</span>
                          <input
                            class="input"
                            name="printingCompany"
                            type="text"
                            list="sheet-printing-candidates"
                            .value=${this.pendingParsed.printingCompany}
                            placeholder="印刷所名"
                          />
                        </label>
                      </div>

                      <label>
                        <span class="field-label">備考（未分類テキスト・コピペ用）</span>
                        <input
                          class="input"
                          name="memo"
                          type="text"
                          .value=${this.pendingParsed.memo}
                          placeholder="イベント名、連絡先、未分類テキストなど"
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
