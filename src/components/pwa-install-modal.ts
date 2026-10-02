import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { iconCheck, iconDownload, iconShare, iconSmartphone, iconX, iconZap } from "../ui/icons.ts";

@customElement("pwa-install-modal")
export class PwaInstallModal extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Boolean })
  hasInstallPrompt = false;

  private get isIosDevice(): boolean {
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isMacTouch = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    return (isIos || isMacTouch) && !(window as any).MSStream;
  }

  private handleClose(dismissForever = false) {
    this.dispatchEvent(
      new CustomEvent("close", {
        detail: { dismissForever },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleInstall() {
    this.dispatchEvent(new CustomEvent("install", { bubbles: true, composed: true }));
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-backdrop" @click=${() => this.handleClose(false)}>
        <div class="modal-box pwa-modal-box" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-box-header">
            <h3>アプリをインストール</h3>
            <button
              type="button"
              class="btn-dialog-close"
              @click=${() => this.handleClose(false)}
              aria-label="閉じる"
            >
              ${iconX(18)}
            </button>
          </div>

          <div class="modal-box-body pwa-modal-body">
            <div class="pwa-hero">
              <img src="/icon.svg" alt="" class="pwa-hero-icon" width="56" height="56" />
              <div class="pwa-hero-text">
                <h4 class="pwa-hero-title">奥付キャプチャー</h4>
                <p class="pwa-hero-subtitle">
                  インストールすると、全画面でカメラが使いやすくなり、いつでも快適に起動できます。
                </p>
              </div>
            </div>

            <div class="pwa-features-list">
              <div class="pwa-feature-item">
                <div class="feature-icon">${iconZap(18)}</div>
                <div class="feature-text">
                  <strong>全画面でスキャン</strong>
                  <span>ブラウザのアドレスバーが隠れ、ファインダーを広く利用可能</span>
                </div>
              </div>
              <div class="pwa-feature-item">
                <div class="feature-icon">${iconSmartphone(18)}</div>
                <div class="feature-text">
                  <strong>ワンタップ起動</strong>
                  <span>ブラウザを開く手間なく、ホーム画面から直接呼び出し</span>
                </div>
              </div>
            </div>

            <div class="pwa-install-guide">
              <div class="guide-title">
                <strong>どこからインストールするか</strong>
              </div>
              ${
                this.isIosDevice
                  ? html`
                      <div class="install-steps">
                        <div class="install-step-row">
                          <span class="step-badge">1</span>
                          <span class="step-desc">
                            Safari画面下の <strong>共有ボタン</strong> ${iconShare(15)} をタップ
                          </span>
                        </div>
                        <div class="install-step-row">
                          <span class="step-badge">2</span>
                          <span class="step-desc">
                            メニューから <strong>「ホーム画面に追加」</strong> を選択
                          </span>
                        </div>
                        <div class="install-step-row">
                          <span class="step-badge">3</span>
                          <span class="step-desc">
                            右上の <strong>「追加」</strong> をタップすると完了
                          </span>
                        </div>
                      </div>
                      <p class="guide-note">※ Safari以外のブラウザではSafariで開き直してください</p>
                    `
                  : this.hasInstallPrompt
                    ? html`
                        <div class="install-steps">
                          <div class="install-step-row">
                            <span class="step-badge">1</span>
                            <span class="step-desc">
                              下の <strong>「インストール」ボタン</strong> をタップ
                            </span>
                          </div>
                          <div class="install-step-row">
                            <span class="step-badge">2</span>
                            <span class="step-desc">
                              確認ダイアログで <strong>「インストール」</strong> を選択
                            </span>
                          </div>
                        </div>
                      `
                    : html`
                        <div class="install-steps">
                          <div class="install-step-row">
                            <span class="step-badge">1</span>
                            <span class="step-desc">
                              ブラウザ右上メニュー <strong>「︙」</strong> をタップ
                            </span>
                          </div>
                          <div class="install-step-row">
                            <span class="step-badge">2</span>
                            <span class="step-desc">
                              <strong>「アプリをインストール」</strong> または
                              <strong>「ホーム画面に追加」</strong> を選択
                            </span>
                          </div>
                        </div>
                      `
              }
            </div>
          </div>

          <div class="modal-box-footer pwa-modal-footer">
            <button type="button" class="btn-sub" @click=${() => this.handleClose(true)}>
              後で
            </button>
            ${
              this.hasInstallPrompt
                ? html`
                    <button type="button" class="btn-main" @click=${this.handleInstall}>
                      ${iconDownload(16)} インストール
                    </button>
                  `
                : html`
                    <button type="button" class="btn-main" @click=${() => this.handleClose(false)}>
                      ${iconCheck(16)} わかった
                    </button>
                  `
            }
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "pwa-install-modal": PwaInstallModal;
  }
}
