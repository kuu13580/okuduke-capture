import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconCheck, iconShield, iconX } from "../ui/icons.ts";

@customElement("data-policy-modal")
export class DataPolicyModal extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Boolean })
  isOpen = false;

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-backdrop" @click=${this.handleClose}>
        <div class="modal-box terms-modal-box" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-box-header">
            <div class="terms-header-title">
              ${iconShield(20)}
              <h3>データの取り扱いについて</h3>
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

          <div class="modal-box-body terms-modal-body">
            <div class="terms-card-list">
              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>Gemini API への画像送信</strong>
                  <span
                    >AIによる文字認識のため、撮影画像のみを Google Gemini API
                    に送信して解析します。</span
                  >
                </div>
              </div>

              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>画像の非保存</strong>
                  <span
                    >画像はメモリ上でのみ一時処理され、サーバーや端末ストレージには一切保存されません。</span
                  >
                </div>
              </div>

              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>抽出データのローカル管理</strong>
                  <span
                    >抽出された奥付データ（タイトル・サークル等）は、端末（ブラウザ）にのみ保存されます。</span
                  >
                </div>
              </div>

              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>利用状況の計測（GA4）</strong>
                  <span
                    >品質改善のため利用回数等を計測しています（画像や奥付の内容は一切含みません）。</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="modal-box-footer terms-modal-footer">
            <button type="button" class="button" @click=${this.handleClose}>
              ${iconCheck(16)} 閉じる
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "data-policy-modal": DataPolicyModal;
  }
}
