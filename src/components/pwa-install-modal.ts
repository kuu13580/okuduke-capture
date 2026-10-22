import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import {
  type DeviceDetectionOptions,
  isIosDevice,
  isPlayStoreEligible,
} from "../services/device.ts";
import { PLAY_STORE_URL } from "../types.ts";
import {
  iconCheck,
  iconDownload,
  iconExternalLink,
  iconGooglePlay,
  iconShare,
  iconSmartphone,
  iconX,
  iconZap,
} from "../ui/icons.ts";

@customElement("pwa-install-modal")
export class PwaInstallModal extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Boolean })
  hasInstallPrompt = false;

  @property({ type: Object })
  deviceOptions?: DeviceDetectionOptions;

  private get isPreviewMode(): boolean {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const preview = params.get("preview");
    return preview === "android" || preview === "modal" || preview === "banner";
  }

  private get isAndroidDevice(): boolean {
    if (this.isPreviewMode) return true;
    return isPlayStoreEligible(this.deviceOptions);
  }

  private get isIosDevice(): boolean {
    return isIosDevice(this.deviceOptions);
  }

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      this.handleClose();
    }
  }

  private handleInstall() {
    this.dispatchEvent(new CustomEvent("install", { bubbles: true, composed: true }));
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-backdrop" role="presentation" @click=${this.handleClose}>
        <div
          class="modal-box pwa-modal-box"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-modal-title"
          tabindex="-1"
          @click=${(e: Event) => e.stopPropagation()}
          @keydown=${this.handleKeydown}
        >
          <div class="modal-box-header">
            <h3 id="pwa-install-modal-title">アプリをインストール</h3>
            <button
              type="button"
              class="btn-dialog-close"
              @click=${this.handleClose}
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

            ${
              this.isAndroidDevice
                ? html`
                    <div class="android-install-options">
                      <a
                        href=${PLAY_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-play-store-primary"
                        @click=${this.handleClose}
                      >
                        ${iconGooglePlay(24)}
                        <div class="btn-play-store-text">
                          <span class="btn-subtext">Google Play から</span>
                          <strong class="btn-maintext">アプリをダウンロード</strong>
                        </div>
                        ${iconExternalLink(16)}
                      </a>

                      <div class="install-divider">
                        <span>またはブラウザ版をホーム画面に追加</span>
                      </div>

                      <div class="pwa-install-guide">
                        ${
                          this.hasInstallPrompt
                            ? html`
                                <div class="install-steps">
                                  <div class="install-step-row">
                                    <span class="step-badge">1</span>
                                    <span class="step-desc">
                                      下の <strong>「ホーム画面に追加」ボタン</strong> をタップ
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
                                      <strong>「ホーム画面に追加」</strong> を選択
                                    </span>
                                  </div>
                                </div>
                              `
                        }
                      </div>
                    </div>
                  `
                : this.isIosDevice
                  ? html`
                      <div class="pwa-install-guide">
                        <div class="install-steps">
                          <div class="install-step-row">
                            <span class="step-badge">1</span>
                            <span class="step-desc">
                              Safariの <strong>共有ボタン</strong> ${iconShare(15)} をタップ
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
                        <p class="guide-note">
                          ※ Safari以外のブラウザではSafariで開き直してください
                        </p>
                      </div>
                    `
                  : html`
                      <div class="pwa-install-guide">
                        ${
                          this.hasInstallPrompt
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
                    `
            }
          </div>

          <div class="modal-box-footer pwa-modal-footer">
            <button type="button" class="button secondary" @click=${this.handleClose}>
              ${this.isAndroidDevice ? "閉じる" : "後で"}
            </button>
            ${
              this.isAndroidDevice
                ? this.hasInstallPrompt
                  ? html`
                      <button type="button" class="button secondary" @click=${this.handleInstall}>
                        ${iconDownload(16)} ホーム画面に追加
                      </button>
                    `
                  : ""
                : this.hasInstallPrompt
                  ? html`
                      <button type="button" class="button" @click=${this.handleInstall}>
                        ${iconDownload(16)} インストール
                      </button>
                    `
                  : html`
                      <button type="button" class="button" @click=${this.handleClose}>
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
