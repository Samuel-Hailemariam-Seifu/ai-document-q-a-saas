import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cloud,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  Folder,
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
  Monitor,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
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

