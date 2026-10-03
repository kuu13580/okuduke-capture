import { LitElement, html, type PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import type { OkudukeRecord } from "../types.ts";
import { iconCheck, iconCopy, iconEdit, iconTrash, iconX } from "../ui/icons.ts";

interface FieldDef {
  key: string;
  label: string;
  getValue: (r: OkudukeRecord) => string;
}

const FIELDS: FieldDef[] = [
  { key: "title", label: "タイトル", getValue: (r) => r.title },
  { key: "circle", label: "サークル名", getValue: (r) => r.circle },
  { key: "author", label: "著者/発行者", getValue: (r) => r.author },
  { key: "publishDate", label: "発行日", getValue: (r) => r.publishDate },
  { key: "printingCompany", label: "印刷所", getValue: (r) => r.printingCompany },
  { key: "memo", label: "備考", getValue: (r) => r.memo },
  { key: "scannedAt", label: "スキャン日時", getValue: (r) => r.scannedAt },
];

@customElement("record-detail-modal")
export class RecordDetailModal extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Object })
  record: OkudukeRecord | null = null;

  @property({ type: Boolean })
  isOpen = false;

  @state()
  private recentlyCopiedKey: string | null = null;

  @query(".modal-box")
  private modalBox?: HTMLElement;

  override updated(changedProperties: PropertyValues) {
    if (changedProperties.has("isOpen") && this.isOpen) {
      this.modalBox?.focus();
    }
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      this.handleClose();
    }
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleToggleFieldCheck(fieldKey: string, e: Event) {
    e.stopPropagation();
    if (!this.record) return;

    const currentChecks = new Set(this.record.checkedFields || []);
    if (currentChecks.has(fieldKey)) {
      currentChecks.delete(fieldKey);
    } else {
      currentChecks.add(fieldKey);
    }

    const updated: OkudukeRecord = {
      ...this.record,
      checkedFields: Array.from(currentChecks),
    };

    this.dispatchEvent(
      new CustomEvent("update-record", {
        detail: updated,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleToggleComplete(e: Event) {
    e.stopPropagation();
    if (!this.record) return;

    const updated: OkudukeRecord = {
      ...this.record,
      isCompleted: !this.record.isCompleted,
    };

    this.dispatchEvent(
      new CustomEvent("update-record", {
        detail: updated,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async copyFieldValue(key: string, label: string, value: string, e?: Event) {
    if (e) e.stopPropagation();
    if (!value || value === "-") return;

    try {
      await navigator.clipboard.writeText(value);
      this.recentlyCopiedKey = key;
      setTimeout(() => {
        if (this.recentlyCopiedKey === key) {
          this.recentlyCopiedKey = null;
        }
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.dispatchEvent(
        new CustomEvent("feedback", {
          detail: `${label}のコピーに失敗しました: ${msg}`,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handleEdit() {
    if (!this.record) return;
    this.handleClose();
    this.dispatchEvent(
      new CustomEvent("edit", {
        detail: this.record,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDelete() {
    if (!this.record) return;
    this.handleClose();
    this.dispatchEvent(
      new CustomEvent("delete", {
        detail: this.record.id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    if (!this.isOpen || !this.record) return html``;

    const isCompleted = Boolean(this.record.isCompleted);
    const checkedSet = new Set(this.record.checkedFields || []);

    return html`
      <div class="modal-backdrop" role="presentation" @click=${this.handleClose}>
        <div
          class="modal-box record-detail-modal-box"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-detail-modal-title"
          tabindex="-1"
          @click=${(e: Event) => e.stopPropagation()}
          @keydown=${this.handleKeydown}
        >
          <div class="modal-box-header">
            <div class="detail-header-title">
              <input
                type="checkbox"
                class="checkbox"
                .checked=${isCompleted}
                @change=${this.handleToggleComplete}
                @click=${(e: Event) => e.stopPropagation()}
                title="${isCompleted ? "完了を取り消す" : "完了にする"}"
                aria-label="${isCompleted ? "完了を取り消す" : "完了にする"}"
              />
              <h3 id="record-detail-modal-title">奥付データ詳細</h3>
            </div>
            <button
              type="button"
              class="btn-dialog-close"
              @click=${this.handleClose}
              aria-label="閉じる"
            >
              ${iconX(18)}
            </button>
          </div>

          <div class="modal-box-body detail-modal-body">
            <div class="detail-fields-list">
              ${FIELDS.map((field) => {
                const val = field.getValue(this.record!);
                const isChecked = checkedSet.has(field.key);
                const isCopied = this.recentlyCopiedKey === field.key;
                const hasValue = Boolean(val && val.trim() !== "");

                return html`
                  <div
                    class="detail-field-row ${isChecked ? "is-checked" : ""} ${
                      hasValue ? "is-clickable" : ""
                    }"
                    @click=${() => hasValue && this.copyFieldValue(field.key, field.label, val)}
                  >
                    <label class="field-check-label" @click=${(e: Event) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        class="checkbox"
                        .checked=${isChecked}
                        @change=${(e: Event) => this.handleToggleFieldCheck(field.key, e)}
                        aria-label="${field.label}をチェック"
                      />
                    </label>

                    <div class="field-main">
                      <span class="field-label">${field.label}</span>
                      <span class="field-val ${!hasValue ? "is-empty" : ""}">
                        ${hasValue ? val : "（未設定）"}
                      </span>
                    </div>

                    <button
                      type="button"
                      class="btn-field-copy ${isCopied ? "is-copied" : ""}"
                      @click=${(e: Event) => this.copyFieldValue(field.key, field.label, val, e)}
                      title="${field.label}をコピー"
                      ?disabled=${!hasValue}
                      aria-label="${field.label}をコピー"
                    >
                      ${isCopied ? html`${iconCheck(14)}` : iconCopy(14)}
                    </button>
                  </div>
                `;
              })}
            </div>
          </div>

          <div class="modal-box-footer detail-modal-footer">
            <div class="footer-left-actions">
              <button
                type="button"
                class="button tertiary btn-danger-sub"
                @click=${this.handleDelete}
              >
                ${iconTrash(15)} 削除
              </button>
              <button type="button" class="button secondary" @click=${this.handleEdit}>
                ${iconEdit(15)} 編集
              </button>
            </div>
            <button type="button" class="button" @click=${this.handleClose}>閉じる</button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "record-detail-modal": RecordDetailModal;
  }
}
