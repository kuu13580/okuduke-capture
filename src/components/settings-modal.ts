import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { type AppConfig, type GeminiModelId, SUPPORTED_MODELS } from "../types.ts";
import { iconCheck, iconDownload, iconShield, iconX } from "../ui/icons.ts";

@customElement("settings-modal")
export class SettingsModal extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Object })
  config: AppConfig = {
    mode: "vlm",
    geminiApiKey: "",
    geminiModel: "gemini-3.1-flash-lite",
  };

  @property({ type: Boolean })
  isInstalled = false;

  private handleClose() {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private handleApiKeyInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent("save-config", {
        detail: { geminiApiKey: input.value.trim() },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleModelChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    if (select.value === "mock") {
      this.dispatchEvent(
        new CustomEvent("save-config", {
          detail: { mode: "mock" },
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this.dispatchEvent(
        new CustomEvent("save-config", {
          detail: {
            mode: "vlm",
            geminiModel: select.value as GeminiModelId,
          },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private handleOpenPwaModal() {
    this.handleClose();
    this.dispatchEvent(new CustomEvent("open-pwa-modal", { bubbles: true, composed: true }));
  }

  private handleOpenTermsModal() {
    this.dispatchEvent(new CustomEvent("open-terms-modal", { bubbles: true, composed: true }));
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="modal-backdrop" @click=${this.handleClose}>
        <div class="modal-box" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-box-header">
            <h3>設定</h3>
            <button
              type="button"
              class="btn-dialog-close"
              @click=${this.handleClose}
              aria-label="閉じる"
            >
              ${iconX(18)}
            </button>
          </div>

          <div class="modal-box-body">
            <label>
              <strong>Gemini API キー</strong>
              <input
                type="password"
                placeholder="AIzaSy..."
                .value=${this.config.geminiApiKey}
                @input=${this.handleApiKeyInput}
              />
              <span class="help-text">
                Google AI
                Studioで取得したAPIキーを入力します。端末（localStorage）にのみ保存されます。
              </span>
            </label>

            ${
              !this.isInstalled
                ? html`
                    <div class="settings-pwa-banner">
                      <div class="pwa-banner-text">
                        <strong>アプリのインストール (PWA)</strong>
                        <span>全画面表示やホーム画面から素早く利用できます</span>
                      </div>
                      <button
                        type="button"
                        class="btn-sub btn-sm"
                        @click=${this.handleOpenPwaModal}
                      >
                        ${iconDownload(15)} インストール
                      </button>
                    </div>
                  `
                : ""
            }

            <div class="settings-terms-link-row">
              <button type="button" class="link-terms-plain" @click=${this.handleOpenTermsModal}>
                ${iconShield(15)} データの取り扱いについて
              </button>
            </div>

            <details class="settings-advanced">
              <summary>高度な設定 (解析モデル)</summary>
              <div class="advanced-content">
                <label>
                  <strong>使用モデル</strong>
                  <select
                    .value=${this.config.mode === "mock" ? "mock" : this.config.geminiModel}
                    @change=${this.handleModelChange}
                  >
                    <optgroup label="Gemini VLM">
                      ${SUPPORTED_MODELS.map(
                        (m) => html` <option value=${m.id}>${m.name} (${m.tag})</option> `,
                      )}
                    </optgroup>
                    <optgroup label="テスト用">
                      <option value="mock">モックデータ (APIキー不要)</option>
                    </optgroup>
                  </select>
                </label>
              </div>
            </details>
          </div>

          <div class="modal-box-footer">
            <button type="button" class="btn-main" @click=${this.handleClose}>
              ${iconCheck(16)} 完了
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-modal": SettingsModal;
  }
}
