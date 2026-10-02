export interface ResizeOptions {
  maxDimension?: number;
  quality?: number;
}

export interface ProcessedImage {
  dataUrl: string;
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VideoDimensions {
  videoWidth: number;
  videoHeight: number;
  clientWidth: number;
  clientHeight: number;
}

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

const DEFAULT_MAX_DIMENSION = 1280;
const DEFAULT_QUALITY = 0.8;

export function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxDimension = DEFAULT_MAX_DIMENSION,
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) {
    return { width: maxDimension, height: maxDimension };
  }

  const maxEdge = Math.max(srcWidth, srcHeight);
  if (maxEdge <= maxDimension) {
    return { width: srcWidth, height: srcHeight };
  }

  const scale = maxDimension / maxEdge;
  return {
    width: Math.round(srcWidth * scale),
    height: Math.round(srcHeight * scale),
  };
}

export function calculateVideoCoverCrop(
  videoDims: VideoDimensions,
  frameRect: BoundingBox,
  videoRect: BoundingBox,
  marginRatio = 0.08,
): CropRect {
  const { videoWidth, videoHeight, clientWidth, clientHeight } = videoDims;
  if (!videoWidth || !videoHeight || !clientWidth || !clientHeight) {
    return { sx: 0, sy: 0, sw: videoWidth || 1280, sh: videoHeight || 720 };
  }

  const scale = Math.max(clientWidth / videoWidth, clientHeight / videoHeight);
  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;

  const offsetX = (clientWidth - renderedWidth) / 2;
  const offsetY = (clientHeight - renderedHeight) / 2;

  const frameRelativeX = frameRect.left - videoRect.left;
  const frameRelativeY = frameRect.top - videoRect.top;

  let sx = (frameRelativeX - offsetX) / scale;
  let sy = (frameRelativeY - offsetY) / scale;
  let sw = frameRect.width / scale;
  let sh = frameRect.height / scale;

  // 枠ギリギリでの文字切れ防止マージン
  const marginX = sw * marginRatio;
  const marginY = sh * marginRatio;

  sx = Math.max(0, sx - marginX);
  sy = Math.max(0, sy - marginY);
  sw = Math.min(videoWidth - sx, sw + marginX * 2);
  sh = Math.min(videoHeight - sy, sh + marginY * 2);

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(sw),
    sh: Math.round(sh),
  };
}

export function processVideoFrameWithCrop(
  video: HTMLVideoElement,
  frameElement?: HTMLElement | null,
  options: ResizeOptions = {},
): ProcessedImage {
  const maxDim = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const videoWidth = video.videoWidth || 1280;
  const videoHeight = video.videoHeight || 720;

  let sx = 0;
  let sy = 0;
  let sw = videoWidth;
  let sh = videoHeight;

  if (frameElement) {
    const frameRect = frameElement.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    const crop = calculateVideoCoverCrop(
      {
        videoWidth,
        videoHeight,
        clientWidth: video.clientWidth,
        clientHeight: video.clientHeight,
      },
      frameRect,
      videoRect,
    );
    sx = crop.sx;
    sy = crop.sy;
    sw = crop.sw;
    sh = crop.sh;
  }

  const { width, height } = calculateTargetDimensions(sw, sh, maxDim);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvasコンテキストの取得に失敗しました");
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.split(",")[1] || "";

  return {
    dataUrl,
    base64,
    mimeType: "image/jpeg",
    width,
    height,
  };
}

export function processVideoFrame(
  video: HTMLVideoElement,
  options: ResizeOptions = {},
): ProcessedImage {
  return processVideoFrameWithCrop(video, null, options);
}

export async function processImageSource(
  source: Blob | string,
  options: ResizeOptions = {},
): Promise<ProcessedImage> {
  const maxDim = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const url = typeof source === "string" ? source : URL.createObjectURL(source);

  try {
    const img = await loadImage(url);
    const { width, height } = calculateTargetDimensions(
      img.naturalWidth,
      img.naturalHeight,
      maxDim,
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvasコンテキストの取得に失敗しました");
    }

    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const base64 = dataUrl.split(",")[1] || "";

    return {
      dataUrl,
      base64,
      mimeType: "image/jpeg",
      width,
      height,
    };
  } finally {
    if (typeof source !== "string") {
      URL.revokeObjectURL(url);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
}
