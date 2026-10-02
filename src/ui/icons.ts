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
  Image,
  Plus,
  RefreshCw,
  Scan,
  Settings,
  Share,
  Shield,
  Smartphone,
  Trash2,
  X,
  Zap,
} from "lucide";

type IconNodeItem = readonly [string, Record<string, string | number>];
type IconNode = readonly IconNodeItem[];

function renderNode([tag, attrs]: IconNodeItem): SVGTemplateResult {
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
export const iconSettings = createIcon(Settings, 18);
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
