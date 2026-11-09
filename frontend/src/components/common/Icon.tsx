import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Bell,
  Bot,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Folder,
  FolderOpen,
  History,
  Hourglass,
  Info,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MessageSquareQuote,
  Monitor,
  Moon,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  PlayCircle,
  Plus,
  Quote,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { ComponentProps } from 'react'

export type IconName =
  | 'sparkles'
  | 'play'
  | 'chat'
  | 'file'
  | 'shield'
  | 'users'
  | 'api'
  | 'check'
  | 'upload'
  | 'dashboard'
  | 'folder'
  | 'billing'
  | 'plus'
  | 'search'
  | 'bell'
  | 'settings'
  | 'sun'
  | 'moon'
  | 'system'
  | 'zap'
  | 'cloud'
  | 'trendingUp'
  | 'pdf'
  | 'externalLink'
  | 'paperclip'
  | 'bot'
  | 'send'
  | 'hourglass'
  | 'user'
  | 'mail'
  | 'lock'
  | 'menu'
  | 'close'
  | 'chevronDown'
  | 'chevronRight'
  | 'panelClose'
  | 'panelLeft'
  | 'panelRight'
  | 'panelOpen'
  | 'checkMark'
  | 'logout'
  | 'history'
  | 'crown'
  | 'workspaces'
  | 'refresh'
  | 'trash'
  | 'arrowLeft'
  | 'calendar'
  | 'info'
  | 'book'
  | 'panelRightClose'
  | 'panelRightOpen'
  | 'alert'
  | 'layers'
  | 'lightbulb'
  | 'eye'
  | 'eyeOff'
  | 'arrowRight'
  | 'arrowUp'
  | 'quote'
  | 'badgeCheck'
  | 'folderOpen'
  | 'messageQuote'
  | 'copy'
  | 'thumbsUp'
  | 'thumbsDown'
  | 'pencil'

const ICONS: Record<IconName, LucideIcon> = {
  sparkles: Sparkles,
  play: PlayCircle,
  chat: MessageCircle,
  file: FileText,
  shield: Shield,
  users: Users,
  api: Zap,
  check: CheckCircle2,
  upload: Upload,
  dashboard: LayoutDashboard,
  folder: Folder,
  billing: CreditCard,
  plus: Plus,
  search: Search,
  bell: Bell,
  settings: Settings,
  sun: Sun,
  moon: Moon,
  system: Monitor,
  zap: Zap,
  cloud: Cloud,
  trendingUp: TrendingUp,
  pdf: FileText,
  externalLink: ExternalLink,
  paperclip: Paperclip,
  bot: Bot,
  send: Send,
  hourglass: Hourglass,
  user: User,
  mail: Mail,
  lock: Lock,
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  panelClose: PanelLeftClose,
  panelLeft: PanelLeft,
  panelRight: PanelRight,
  panelOpen: PanelLeftOpen,
  checkMark: Check,
  logout: LogOut,
  history: History,
  crown: Crown,
  workspaces: LayoutGrid,
  refresh: RefreshCw,
  trash: Trash2,
  arrowLeft: ArrowLeft,
  calendar: CalendarDays,
  info: Info,
  book: BookOpen,
  panelRightClose: PanelRightClose,
  panelRightOpen: PanelRightOpen,
  alert: AlertTriangle,
  layers: Layers,
  lightbulb: Lightbulb,
  eye: Eye,
  eyeOff: EyeOff,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  quote: Quote,
  badgeCheck: BadgeCheck,
  folderOpen: FolderOpen,
  messageQuote: MessageSquareQuote,
  copy: Copy,
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  pencil: Pencil,
}

type Props = {
  name: IconName
  size?: number
} & Omit<ComponentProps<'svg'>, 'width' | 'height'>

export function Icon({ name, size = 20, className, ...rest }: Props) {
  const Cmp = ICONS[name]
  return (
    <Cmp
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  )
}

