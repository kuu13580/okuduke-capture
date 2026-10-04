import { svg, type SVGTemplateResult } from "lit";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Image,
  Plus,
  RefreshCw,
  Scan,
  Share,
  Shield,
  Smartphone,
  Trash2,
  X,
  Zap,
  type IconNode,
} from "lucide";

function renderNode([tag, attrs]: IconNode[number]): SVGTemplateResult {
  switch (tag) {
    case "path":
      return svg`<path d="${attrs.d}"></path>`;
    case "circle":
      return svg`<circle cx="${attrs.cx}" cy="${attrs.cy}" r="${attrs.r}"></circle>`;
    case "rect":
      return svg`<rect x="${attrs.x}" y="${attrs.y}" width="${attrs.width}" height="${attrs.height}" rx="${attrs.rx ?? 0}"></rect>`;
    case "line":
      return svg`<line x1="${attrs.x1}" y1="${attrs.y1}" x2="${attrs.x2}" y2="${attrs.y2}"></line>`;
    default:
      return svg``;
  }
}

function createIcon(iconNode: IconNode, defaultSize = 18) {
  return (size = defaultSize, className = ""): SVGTemplateResult => svg`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="lucide-icon ${className}"
      aria-hidden="true"
    >
      ${iconNode.map((node) => renderNode(node))}
    </svg>
  `;
}

export const iconCamera = createIcon(Camera, 20);
export const iconCameraOff = createIcon(CameraOff, 20);
export const iconImage = createIcon(Image, 20);
export const iconBookOpen = createIcon(BookOpen, 18);
export const iconX = createIcon(X, 18);
export const iconCheck = createIcon(Check, 18);
export const iconCopy = createIcon(Copy, 16);
export const iconDownload = createIcon(Download, 16);
export const iconTrash = createIcon(Trash2, 16);
export const iconEdit = createIcon(Edit, 16);
export const iconRefresh = createIcon(RefreshCw, 16);
export const iconAlert = createIcon(AlertCircle, 16);
export const iconClock = createIcon(Clock, 14);
export const iconPlus = createIcon(Plus, 18);
export const iconChevronDown = createIcon(ChevronDown, 16);
export const iconScan = createIcon(Scan, 22);
export const iconArrowLeft = createIcon(ArrowLeft, 18);
export const iconSmartphone = createIcon(Smartphone, 18);
export const iconShare = createIcon(Share, 16);
export const iconZap = createIcon(Zap, 18);
export const iconShield = createIcon(Shield, 18);
export const iconExternalLink = createIcon(ExternalLink, 16);

export function iconGooglePlay(size = 20) {
  return svg`
    <svg
      width="${size}"
      height="${size}"
      viewBox="0 0 512 512"
      aria-hidden="true"
      style="flex-shrink: 0;"
    >
      <path fill="#4285F4" d="M48.7 13.7C46.8 17.1 45.7 21.2 45.7 26.2v459.6c0 5 1.1 9.1 3 12.5l257.4-242.3L48.7 13.7z"/>
      <path fill="#FBBC04" d="M371.3 323.5l-65.2-67.5L48.7 498.3c4.1 2.3 9.3 2.7 15.3-.7l307.3-174.1z"/>
      <path fill="#EA4335" d="M64 14.4c-6-3.4-11.2-3-15.3-.7l257.4 242.3 65.2-67.5L64 14.4z"/>
      <path fill="#34A853" d="M451.7 230.1L371.3 188.5 306.1 256l65.2 67.5 80.4-41.6c11.6-6.1 11.6-16.1 0-22.2l-.1.4.1-.6z"/>
    </svg>
  `;
}
