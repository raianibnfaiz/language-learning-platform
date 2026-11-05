import { BarChart3, BookOpen, Bookmark, Globe2, LayoutDashboard, Sparkles, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const mainNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/languages', label: 'Languages', icon: Globe2 },
  { to: '/practice', label: 'Practice', icon: Sparkles },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/about', label: 'Why these 5?', icon: BookOpen },
]
