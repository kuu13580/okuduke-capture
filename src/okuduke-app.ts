import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { generateCsv, generateTsv, type OkudukeRecord } from "./types.ts";

@customElement("okuduke-app")
export class OkudukeApp extends LitElement {
  // Sashimi UI (グローバルCSS) をそのまま適用するため Light DOM を使用
  override createRenderRoot() {
    return this;
  }

  @state()
  private records: OkudukeRecord[] = [
    {
      id: "sample-1",
      title: "銀河鉄道の夜（サンプル同人誌）",
      circle: "星巡り工房",
      author: "宮沢賢治",
      publishDate: "2026/08/16",
      printingCompany: "日光企画",
      memo: "コミックマーケット108",
      scannedAt: "2026-10-01 12:30",
    },
  ];

  @state()
  private feedbackMessage = "";

  @state()
  private editingRecord: OkudukeRecord | null = null;

  render() {
    return html`
      <div class="app-container">
        <header class="app-header">
          <h1>奥付キャプチャー</h1>
          <p class="description">
            同人誌の奥付をカメラで読み取り、即座にリスト化＆スプシ・CSV出力できるツール
          </p>
        </header>

        <section class="action-card">
          <div class="scanner-placeholder">
            <div class="scanner-icon">📷</div>
            <p><strong>カメラ機能（Phase 2 で実装予定）</strong></p>
            <p class="subtext">
              端末保存なしで奥付を連続スキャン。VLM / ブラウザOCR+Jev のPoCを順次検証します。
            </p>
            <div class="button-group">
              <button type="button" @click=${this.addSampleRecord}>＋ サンプルデータを追加</button>
            </div>
          </div>
        </section>

        ${
          this.feedbackMessage
            ? html`<div class="feedback-toast">${this.feedbackMessage}</div>`
            : ""
        }

        <section class="list-section">
          <div class="list-header">
            <h2>スキャン済みリスト (${this.records.length}件)</h2>
            <div class="list-actions">
              <button type="button" @click=${this.copyAsTsv} ?disabled=${this.records.length === 0}>
                📋 スプシ用コピー (TSV)
              </button>
              <button
                type="button"
                @click=${this.downloadAsCsv}
                ?disabled=${this.records.length === 0}
              >
                💾 CSV保存
              </button>
              <button type="button" @click=${this.clearAll} ?disabled=${this.records.length === 0}>
                🗑️ 全消去
              </button>
            </div>
          </div>

          ${
            this.records.length === 0
              ? html`<p class="empty-state">まだ読み取ったデータはありません。</p>`
              : html`
                  <div class="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>タイトル</th>
                          <th>サークル名</th>
                          <th>著者/発行者</th>
                          <th>発行日</th>
                          <th>印刷所</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${this.records.map(
                          (r) => html`
                            <tr>
                              <td><strong>${r.title || "（無題）"}</strong></td>
                              <td>${r.circle || "-"}</td>
                              <td>${r.author || "-"}</td>
                              <td>${r.publishDate || "-"}</td>
                              <td>${r.printingCompany || "-"}</td>
                              <td class="table-actions">
                                <button type="button" @click=${() => this.openEditModal(r)}>
                                  編集
                                </button>
                                <button type="button" @click=${() => this.deleteRecord(r.id)}>
                                  削除
                                </button>
                              </td>
                            </tr>
                          `,
                        )}
                      </tbody>
                    </table>
                  </div>
                `
          }
        </section>

        <!-- 編集モーダル（Sashimi UI の dialog スタイルを活用） -->
        <dialog id="edit-dialog">
          ${
            this.editingRecord
              ? html`
                  <form method="dialog" @submit=${this.handleSaveEdit}>
                    <h3>奥付データの編集</h3>
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
                      <button type="button" @click=${this.closeEditModal}>キャンセル</button>
                      <button type="submit">保存</button>
                    </menu>
                  </form>
                `
              : ""
          }
        </dialog>
      </div>
    `;
  }

  private addSampleRecord() {
    const count = this.records.length + 1;
    const newRecord: OkudukeRecord = {
      id: `sample-${Date.now()}`,
      title: `サンプル同人誌 #${count}`,
      circle: `架空サークル${count}`,
      author: `作家${count}`,
      publishDate: `2026/08/${10 + (count % 20)}`,
      printingCompany: "日光企画",
      memo: "初版",
      scannedAt: new Date().toLocaleString("ja-JP"),
    };
    this.records = [newRecord, ...this.records];
    this.showFeedback("サンプルを追加しました");
  }

  private deleteRecord(id: string) {
    this.records = this.records.filter((r) => r.id !== id);
    this.showFeedback("1件削除しました");
  }

  private clearAll() {
    if (confirm("スキャン済みリストをすべて消去しますか？")) {
      this.records = [];
      this.showFeedback("リストをクリアしました");
    }
  }

  private async copyAsTsv() {
    const tsv = generateTsv(this.records);
    try {
      await navigator.clipboard.writeText(tsv);
      this.showFeedback("📋 スプシ用TSVをクリップボードにコピーしました！");
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
    this.showFeedback("💾 CSVファイルをダウンロードしました");
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

    this.records = this.records.map((r) => (r.id === updated.id ? updated : r));
    this.closeEditModal();
    this.showFeedback("変更を保存しました");
  }

  private showFeedback(msg: string) {
    this.feedbackMessage = msg;
    setTimeout(() => {
      if (this.feedbackMessage === msg) {
        this.feedbackMessage = "";
      }
    }, 2500);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "okuduke-app": OkudukeApp;
  }
}
