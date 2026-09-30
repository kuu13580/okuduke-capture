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
            <p class="terms-lead">
              「奥付キャプチャー」では、安心してご利用いただくために画像およびデータの取り扱い方針を定めています。
            </p>

            <div class="terms-card-list">
              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>Google（Gemini API）への画像送信</strong>
                  <span>
                    奥付の文字認識・抽出を行うため、撮影または選択された画像データを Google の AI
                    モデル（Gemini API）に送信して解析します。
                  </span>
                </div>
              </div>

              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>サーバー・端末への画像非保存</strong>
                  <span>
                    撮影された画像はブラウザのメモリ上でのみ一時処理され、本サービスのサーバーや端末ストレージに保存されることは一切ありません。
                  </span>
                </div>
              </div>

              <div class="terms-card-item">
                <div class="terms-item-icon">${iconCheck(16)}</div>
                <div class="terms-item-text">
                  <strong>抽出データのローカル管理</strong>
                  <span>
                    認識されたタイトルや著者名などの奥付テキストは、お使いの端末（ブラウザのローカルストレージ）にのみ保存され、外部へ送信されません。
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-box-footer terms-modal-footer">
            <button type="button" class="btn-main" @click=${this.handleClose}>
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
