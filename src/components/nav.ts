import { BarChart3, FileText, BookOpen, Bookmark, Brain, Globe2, LayoutDashboard, MessageCircleHeart, Sparkles, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/phrasebook', label: 'Phrasebook', icon: MessageCircleHeart },
  { to: '/review', label: 'Review', icon: Brain },
  { to: '/languages', label: 'Career languages', icon: Globe2 },
  { to: '/practice', label: 'Practice', icon: Sparkles },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/about', label: 'Why these 5?', icon: BookOpen },
]
