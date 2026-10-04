import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { normalizeDateToInput } from "../services/date-formatter.ts";
import type { FieldCandidates, OkudukeRecord } from "../types.ts";
import { iconCalendar, iconCheck, iconX } from "../ui/icons.ts";

@customElement("record-edit-dialog")
export class RecordEditDialog extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Object })
  record: OkudukeRecord | null = null;

  @property({ type: Object })
  candidates?: FieldCandidates;

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("record")) {
      const dialog = this.querySelector<HTMLDialogElement>("dialog");
      if (dialog) {
        if (this.record && !dialog.open) {
          dialog.showModal();
        } else if (!this.record && dialog.open) {
          dialog.close();
        }
      }
    }
  }

  private handleClose() {
    const dialog = this.querySelector<HTMLDialogElement>("dialog");
    dialog?.close();
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
    if (!this.record) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const updated: OkudukeRecord = {
      ...this.record,
      title: (formData.get("title") as string) || "",
      circle: (formData.get("circle") as string) || "",
      author: (formData.get("author") as string) || "",
      publishDate: (formData.get("publishDate") as string) || "",
      printingCompany: (formData.get("printingCompany") as string) || "",
      memo: (formData.get("memo") as string) || "",
    };

    this.dispatchEvent(
      new CustomEvent("save", {
        detail: updated,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <dialog id="edit-dialog">
        ${
          this.record
            ? html`
                <form method="dialog" @submit=${this.handleSubmit}>
                  <div class="dialog-header">
                    <h3>奥付データの編集</h3>
                    <button type="button" class="btn-dialog-close" @click=${this.handleClose}>
                      ${iconX(18)}
                    </button>
                  </div>

                  <datalist id="edit-circle-candidates">
                    ${(this.candidates?.circles || []).map(
                      (c) => html`<option value=${c}></option>`,
                    )}
                  </datalist>
                  <datalist id="edit-author-candidates">
                    ${(this.candidates?.authors || []).map(
                      (a) => html`<option value=${a}></option>`,
                    )}
                  </datalist>
                  <datalist id="edit-printing-candidates">
                    ${(this.candidates?.printingCompanies || []).map(
                      (p) => html`<option value=${p}></option>`,
                    )}
                  </datalist>

                  <label class="field-title">
                    <span class="field-label">タイトル</span>
                    <input
                      class="input"
                      name="title"
                      type="text"
                      .value=${this.record.title}
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
                      list="edit-circle-candidates"
                      .value=${this.record.circle}
                      placeholder="サークル名"
                    />
                  </label>

                  <label>
                    <span class="field-label">著者/発行者</span>
                    <input
                      class="input"
                      name="author"
                      type="text"
                      list="edit-author-candidates"
                      .value=${this.record.author}
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
                          .value=${this.record.publishDate}
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
                          .value=${normalizeDateToInput(this.record.publishDate)}
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
                        list="edit-printing-candidates"
                        .value=${this.record.printingCompany}
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
                      .value=${this.record.memo}
                      placeholder="イベント名、連絡先、未分類テキストなど"
                    />
                  </label>

                  <menu>
                    <button type="button" class="button secondary" @click=${this.handleClose}>
                      キャンセル
                    </button>
                    <button type="submit" class="button">${iconCheck(16)} 保存</button>
                  </menu>
                </form>
              `
            : ""
        }
      </dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "record-edit-dialog": RecordEditDialog;
  }
}
