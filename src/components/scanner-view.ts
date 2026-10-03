import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { processVideoFrameWithCrop } from "../services/image-processor.ts";
import { iconArrowLeft, iconCamera, iconCameraOff, iconImage, iconScan } from "../ui/icons.ts";

@customElement("scanner-view")
export class ScannerView extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Number })
  recordCount = 0;

  @property({ type: Boolean })
  isAnalyzing = false;

  @property({ type: Boolean })
  isPaused = false;

  @state()
  private isCameraActive = false;

  private mediaStream: MediaStream | null = null;

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("isOpen")) {
      if (this.isOpen) {
        this.startCamera().catch(() => {});
      } else {
        this.stopCamera();
      }
    }
    if (changedProperties.has("isPaused") && this.isOpen && this.mediaStream) {
      for (const track of this.mediaStream.getVideoTracks()) {
        track.enabled = !this.isPaused;
      }
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopCamera();
  }

  private emitClose() {
    this.stopCamera();
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
  }

  private emitFeedback(message: string) {
    this.dispatchEvent(
      new CustomEvent("feedback", {
        detail: message,
        bubbles: true,
        composed: true,
      }),
    );
  }

  public async startCamera() {
    try {
      this.isCameraActive = true;
      await this.updateComplete;

      const video = this.querySelector<HTMLVideoElement>("#camera-stream");
      if (!video) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (!this.isOpen) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        return;
      }

      this.mediaStream = stream;
      if (this.isPaused) {
        for (const track of stream.getVideoTracks()) {
          track.enabled = false;
        }
      }
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      this.isCameraActive = false;
      const message = err instanceof Error ? err.message : String(err);
      this.emitFeedback(`カメラ起動エラー: ${message}`);
    }
  }

  public stopCamera() {
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
    this.isCameraActive = false;
  }

  private handleCapture() {
    const video = this.querySelector<HTMLVideoElement>("#camera-stream");
    const frame = this.querySelector<HTMLElement>(".scanner-frame");
    if (!video) {
      this.emitFeedback("カメラを起動するか、画像ファイルを選択してください");
      return;
    }

    try {
      const processed = processVideoFrameWithCrop(video, frame, {
        maxDimension: 1280,
        quality: 0.8,
      });

      this.dispatchEvent(
        new CustomEvent("capture", {
          detail: { base64: processed.base64, mimeType: processed.mimeType },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.emitFeedback(`キャプチャ処理エラー: ${msg}`);
    }
  }

  private handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.dispatchEvent(
      new CustomEvent("file-selected", {
        detail: file,
        bubbles: true,
        composed: true,
      }),
    );
    input.value = "";
  }

  render() {
    if (!this.isOpen) return html``;

    return html`
      <div class="scanner-fullscreen">
        <div class="scanner-topbar">
          <div class="scanner-topbar-inner">
            <button
              type="button"
              class="btn-scanner-back"
              @click=${this.emitClose}
              title="リストに戻る"
            >
              ${iconArrowLeft(20)}
              <span>完了 (${this.recordCount}冊)</span>
            </button>

            <div class="scanner-topbar-right">
              ${
                this.isCameraActive
                  ? html`
                      <button
                        type="button"
                        class="btn-scanner-icon"
                        @click=${this.stopCamera}
                        title="カメラ一時停止"
                      >
                        ${iconCameraOff(18)}
                      </button>
                    `
                  : html`
                      <button
                        type="button"
                        class="btn-scanner-icon"
                        @click=${this.startCamera}
                        title="カメラ起動"
                      >
                        ${iconCamera(18)}
                      </button>
                    `
              }
            </div>
          </div>
        </div>

        <div class="scanner-viewport">
          ${
            this.isCameraActive
              ? html`
                  <video id="camera-stream" autoplay playsinline muted></video>
                  <div class="scanner-overlay-guide">
                    <div class="scanner-frame">
                      <div class="corner top-left"></div>
                      <div class="corner top-right"></div>
                      <div class="corner bottom-left"></div>
                      <div class="corner bottom-right"></div>
                      <div class="frame-hint">奥付を枠内に合わせてください</div>
                    </div>
                  </div>
                  <canvas id="capture-canvas" style="display: none;"></canvas>
                `
              : html`
                  <div class="scanner-inactive">
                    <div class="inactive-icon">${iconCamera(40)}</div>
                    <p>カメラが停止しています</p>
                    <button type="button" class="button" @click=${this.startCamera}>
                      ${iconCamera(18)} カメラを起動する
                    </button>
                  </div>
                `
          }
        </div>

        <div class="scanner-bottombar">
          <div class="scanner-bottombar-inner">
            <label class="btn-scanner-sub" title="写真から読み取る">
              ${iconImage(22)}
              <input
                type="file"
                accept="image/*"
                style="display: none;"
                @change=${this.handleFileInput}
              />
            </label>

            <button
              type="button"
              class="btn-read-trigger"
              ?disabled=${this.isAnalyzing}
              @click=${this.handleCapture}
              title="奥付を読み取る"
            >
              <div class="read-trigger-inner">
                ${this.isAnalyzing ? html`<div class="trigger-spinner"></div>` : iconScan(30)}
              </div>
            </button>

            <div style="width: 48px;"></div>
          </div>
        </div>

        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "scanner-view": ScannerView;
  }
}
