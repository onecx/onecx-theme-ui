/**
 * Generic interface for hierarchical properties
 */
export type DictionaryObject = Record<string, string | Record<string, string>>
export type DictionaryObjectString<T = string> = Record<string, T>

export interface ThemeProperties {
  font?: DictionaryObject
  general?: DictionaryObject
  topbar?: DictionaryObject
  sidebar?: DictionaryObject
}

// plain interface for theme variables
export interface ThemeVariables {
  font: string[]
  general: string[]
  topbar: string[]
  sidebar: string[]
}

/**
 * Interfaces for theme color box component
 */
export interface GeneralProps {
  'primary-color': string
  'secondary-color': string
  'text-color': string
  'body-bg-color': string
  'content-bg-color': string
}

export interface TopbarProps {
  'topbar-text-color': string
  'topbar-bg-color': string
}
export interface SidebarProps {
  'menu-item-text-color': string
  'menu-bg-color': string
}

export interface ThemeColorBoxProperties {
  general: GeneralProps
  topbar: TopbarProps
  sidebar: SidebarProps
}
