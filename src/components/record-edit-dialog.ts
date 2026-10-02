import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { OkudukeRecord } from "../types.ts";
import { iconCheck, iconX } from "../ui/icons.ts";

@customElement("record-edit-dialog")
export class RecordEditDialog extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Object })
  record: OkudukeRecord | null = null;

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
                  <label>
                    タイトル
                    <input
                      class="input"
                      name="title"
                      type="text"
                      .value=${this.record.title}
                      required
                    />
                  </label>
                  <label>
                    サークル名
                    <input class="input" name="circle" type="text" .value=${this.record.circle} />
                  </label>
                  <label>
                    著者/発行者
                    <input class="input" name="author" type="text" .value=${this.record.author} />
                  </label>
                  <label>
                    発行日
                    <input
                      class="input"
                      name="publishDate"
                      type="text"
                      .value=${this.record.publishDate}
                    />
                  </label>
                  <label>
                    印刷所
                    <input
                      class="input"
                      name="printingCompany"
                      type="text"
                      .value=${this.record.printingCompany}
                    />
                  </label>
                  <label>
                    備考
                    <input class="input" name="memo" type="text" .value=${this.record.memo} />
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
