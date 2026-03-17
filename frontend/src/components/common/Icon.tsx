import {
  Bell,
  Bot,
  CheckCircle2,
  Cloud,
  CreditCard,
  ExternalLink,
  FileText,
  Folder,
  Hourglass,
  Mail,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Moon,
  Monitor,
  Paperclip,
  PlayCircle,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
  User,
  Users,
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

