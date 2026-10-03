import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { OkudukeRecord } from "../types.ts";
import { iconCopy, iconDownload, iconEdit, iconScan, iconTrash } from "../ui/icons.ts";

@customElement("record-list")
export class RecordList extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Array })
  records: OkudukeRecord[] = [];

  private handleCopyTsv() {
    this.dispatchEvent(new CustomEvent("copy-tsv", { bubbles: true, composed: true }));
  }

  private handleDownloadCsv() {
    this.dispatchEvent(new CustomEvent("download-csv", { bubbles: true, composed: true }));
  }

  private handleClearAll() {
    this.dispatchEvent(new CustomEvent("clear-all", { bubbles: true, composed: true }));
  }

  private handleSelect(record: OkudukeRecord) {
    this.dispatchEvent(
      new CustomEvent("select", {
        detail: record,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleToggleComplete(record: OkudukeRecord, e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("toggle-complete", {
        detail: record,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleEdit(record: OkudukeRecord, e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("edit", {
        detail: record,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleDelete(id: string, e: Event) {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent("delete", {
        detail: id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="list-summary-bar">
        <div class="summary-bar-inner">
          <div class="summary-left">
            <span class="count-badge">${this.records.length}件</span>
            <span class="summary-label">の奥付データ</span>
          </div>
          <div class="summary-actions">
            <button
              type="button"
              class="button tertiary btn-action"
              @click=${this.handleCopyTsv}
              ?disabled=${this.records.length === 0}
              title="GoogleスプレッドシートやExcelに直接貼り付け可能な形式でコピー"
            >
              ${iconCopy(15)} TSVコピー
            </button>
            <button
              type="button"
              class="button tertiary btn-action"
              @click=${this.handleDownloadCsv}
              ?disabled=${this.records.length === 0}
              title="CSVファイルとしてダウンロード"
            >
              ${iconDownload(15)} CSV保存
            </button>
            <button
              type="button"
              class="button tertiary btn-action btn-danger-action"
              @click=${this.handleClearAll}
              ?disabled=${this.records.length === 0}
              title="全件消去"
            >
              ${iconTrash(15)}
            </button>
          </div>
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
                      <div
                        class="record-item ${r.isCompleted ? "is-completed" : ""}"
                        @click=${() => this.handleSelect(r)}
                        role="button"
                        tabindex="0"
                      >
                        <div class="record-meta-col">
                          <input
                            type="checkbox"
                            class="checkbox"
                            .checked=${Boolean(r.isCompleted)}
                            @change=${(e: Event) => this.handleToggleComplete(r, e)}
                            @click=${(e: Event) => e.stopPropagation()}
                            title="${r.isCompleted ? "完了を取り消す" : "完了にする"}"
                            aria-label="${r.isCompleted ? "完了を取り消す" : "完了にする"}"
                          />
                          <div class="record-index">${this.records.length - idx}</div>
                        </div>

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
                            @click=${(e: Event) => this.handleEdit(r, e)}
                            title="編集"
                          >
                            ${iconEdit(16)}
                          </button>
                          <button
                            type="button"
                            class="btn-row-action btn-row-delete"
                            @click=${(e: Event) => this.handleDelete(r.id, e)}
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "record-list": RecordList;
  }
}
