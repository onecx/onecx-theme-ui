export interface ThemeVariablesType {
  font: string[]
  topbar: string[]
  general: string[]
  sidebar: string[]
}

export const themeVariables: ThemeVariablesType = {
  font: ['font-family', 'font-size'],
  topbar: [
    'topbar-bg-color',
    'topbar-item-text-color',
    'topbar-text-color',
    'topbar-left-bg-color',
    'topbar-item-text-hover-bg-color',
    'topbar-menu-button-bg-color',
    'logo-color'
  ],

  general: [
    'primary-color',
    'secondary-color',
    'text-color',
    'text-secondary-color',
    'body-bg-color',
    'content-bg-color',
    'content-alt-bg-colorr',
    'overlay-content-bg-color',
    'hover-bg-color',
    'solid-surface-text-color',
    'divider-color',
    'button-hover-bg',
    'danger-button-bg',
    'info-message-bg',
    'success-message-bg',
    'warning-message-bg',
    'error-message-bg'
  ],

  sidebar: [
    'menu-text-color',
    'menu-bg-color',
    'menu-item-text-color',
    'menu-item-hover-bg-color',
    'menu-active-item-text-color',
    'menu-active-item-bg-color',
    'inline-menu-border-color'
  ]
}
