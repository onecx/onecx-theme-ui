import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme } from 'src/app/shared/generated'
import { themeVariables } from '../theme-variables'
import { colorValueValidator, ThemeColorsComponent } from './theme-colors.component'
import { FormControl } from '@angular/forms'

const generalColors = {
  'primary-color': '#000000',
  'secondary-color': '#000000',
  'text-color': '#000000',
  'text-secondary-color': '#000000',
  'body-bg-color': '#000000',
  'content-bg-color': '#000000',
  'content-alt-bg-color': '#000000',
  'overlay-content-bg-color': '#000000',
  'hover-bg-color': '#000000',
  'solid-surface-text-color': '#000000',
  'divider-color': '#000000',
  'button-hover-bg': '#000000',
  'button-active-bg': '#000000',
  'danger-button-bg': '#000000',
  'info-message-bg': '#000000',
  'success-message-bg': '#000000',
  'warning-message-bg': '#000000',
  'error-message-bg': '#000000'
}
const properties = {
  general: generalColors,
  topbar: {},
  sidebar: {}
}

describe('ThemeColorsComponent', () => {
  let component: ThemeColorsComponent
  let fixture: ComponentFixture<ThemeColorsComponent>
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeColorsComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: []
    })
      .overrideComponent(ThemeColorsComponent, {
        add: {
          providers: [{ provide: PortalMessageService, useValue: msgServiceSpy }]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeColorsComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('changeMode', 'VIEW')
    fixture.componentRef.setInput('autoApply', false)
    fixture.componentRef.setInput('theme', undefined)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initialization', () => {
    it('should initialize form groups for general, topbar, and sidebar', () => {
      expect(component.generalForm).toBeDefined()
      expect(component.topbarForm).toBeDefined()
      expect(component.sidebarForm).toBeDefined()
      expect(component.colorsForm).toBeDefined()
    })

    it('should create form controls for all general theme variables', () => {
      for (const v of themeVariables.general) {
        expect(component.generalForm.get(v)).not.toBeNull()
      }
    })

    it('should create form controls for all topbar theme variables', () => {
      for (const v of themeVariables.topbar) {
        expect(component.topbarForm.get(v)).not.toBeNull()
      }
    })

    it('should create form controls for all sidebar theme variables', () => {
      for (const v of themeVariables.sidebar) {
        expect(component.sidebarForm.get(v)).not.toBeNull()
      }
    })

    it('should have three groups defined', () => {
      expect(component.groups).toHaveSize(3)
      expect(component.groups[0].key).toBe('general')
      expect(component.groups[1].key).toBe('topbar')
      expect(component.groups[2].key).toBe('sidebar')
    })

    it('should default autoApply to false', () => {
      expect(component.autoApply()).toBeFalse()
    })
  })

  describe('form', () => {
    it('should fill the form when theme is set', fakeAsync(() => {
      const theme: Theme = {
        name: 'test-theme',
        properties: {
          general: { 'primary-color': '#ff0000' },
          topbar: { 'topbar-bg-color': '#00ff00' },
          sidebar: { 'menu-text-color': '#0000ff' }
        }
      }
      fixture.componentRef.setInput('theme', theme)
      fixture.detectChanges()
      flush()

      expect(component.generalForm.get('primary-color')?.value).toBe('#ff0000')
      expect(component.topbarForm.get('topbar-bg-color')?.value).toBe('#00ff00')
      expect(component.sidebarForm.get('menu-text-color')?.value).toBe('#0000ff')
    }))

    it('should not fill form when theme is undefined', fakeAsync(() => {
      fixture.componentRef.setInput('theme', undefined)
      fixture.detectChanges()
      flush()

      expect(component.generalForm.get('primary-color')?.value).toBeNull()
      expect(component.topbarForm.get('topbar-bg-color')?.value).toBeNull()
      expect(component.sidebarForm.get('menu-text-color')?.value).toBeNull()
    }))

    it('should default operator to undefined if not set on theme', fakeAsync(() => {
      const theme: Theme = { name: 'test-theme' }
      fixture.componentRef.setInput('theme', theme)
      fixture.detectChanges()
      flush()

      expect(component.theme()?.operator).toBeUndefined()
    }))

    it('should reset form before patching new values', fakeAsync(() => {
      const theme1: Theme = {
        name: 'theme1',
        properties: { general: { 'primary-color': '#111111' } }
      }
      fixture.componentRef.setInput('theme', theme1)
      fixture.detectChanges()
      flush()

      expect(component.generalForm.get('primary-color')?.value).toBe('#111111')

      const theme2: Theme = {
        name: 'theme2',
        properties: { general: { 'secondary-color': '#222222' } }
      }
      fixture.componentRef.setInput('theme', theme2)
      fixture.detectChanges()
      flush()

      expect(component.generalForm.get('primary-color')?.value).toBeNull()
      expect(component.generalForm.get('secondary-color')?.value).toBe('#222222')
    }))
  })

  describe('form validation', () => {
    // valid properties for the theme (all general colors are defined)
    const theme: Theme = { name: 'test', properties: properties }

    function setEditModeWithTheme() {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      fixture.detectChanges()
      flush()
    }

    it('isThemeFormValid should be false when forms are disabled (initial state)', () => {
      // default from beforeEach: theme=undefined, changeMode=VIEW → all sub-forms disabled
      expect(component.isThemeFormValid()).toBeFalse()
    })

    it('isThemeFormValid should be true when all forms are enabled and valid', fakeAsync(() => {
      setEditModeWithTheme()
      expect(component.isThemeFormValid()).toBeTrue()
    }))

    it('isThemeFormValid should be false when general form has errors', fakeAsync(() => {
      setEditModeWithTheme()
      component.generalForm.setErrors({ invalid: true })

      expect(component.isThemeFormValid()).toBeFalse()
    }))

    it('isThemeFormValid should be false when topbar form has errors', fakeAsync(() => {
      setEditModeWithTheme()
      component.topbarForm.setErrors({ invalid: true })

      expect(component.isThemeFormValid()).toBeFalse()
    }))

    it('isThemeFormValid should be false when sidebar form has errors', fakeAsync(() => {
      setEditModeWithTheme()
      component.sidebarForm.setErrors({ invalid: true })

      expect(component.isThemeFormValid()).toBeFalse()
    }))
  })

  describe('onChangeColorValue', () => {
    it('should keep the form valid when color value is valid HEX', fakeAsync(() => {
      const theme: Theme = {
        name: 'test-theme',
        properties: { general: generalColors, topbar: {}, sidebar: {} }
      }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      fixture.detectChanges()
      flush()

      expect(component.generalForm.get('primary-color')?.value).toBe(generalColors['primary-color'])
      expect(component.generalForm.valid).toBeTrue()
    }))

    it('should keep the form valid when color value is an known color', () => {
      spyOn(CSS as any, 'supports').and.callFake((property: string, value: string) => {
        if (value === 'unknowncolor') return false
        return true
      })

      const validator = colorValueValidator()
      expect(validator(new FormControl('white'))).toBeNull()
    })

    it('should make the form invalid when color value is an unknown color', () => {
      spyOn(CSS as any, 'supports').and.callFake((property: string, value: string) => {
        if (value === 'unknowncolor') return false
        return true
      })

      const validator = colorValueValidator()
      expect(validator(new FormControl('unknowncolor'))).toEqual({
        invalidColor: { value: 'unknowncolor' }
      })
    })

    it('should make the form invalid if color value is invalid', fakeAsync(() => {
      const val = '#xyz'
      const theme: Theme = {
        name: 'test-theme',
        properties: { general: { ...generalColors, 'primary-color': val }, topbar: {}, sidebar: {} }
      }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      fixture.detectChanges()
      flush()

      expect(component.generalForm.get('primary-color')?.value).toBe(val)
      expect(component.generalForm.valid).toBeFalse()
    }))
  })

  describe('autoApply', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
    })

    it('should not apply CSS variable when autoApply is false', async () => {
      fixture.componentRef.setInput('autoApply', false)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).not.toHaveBeenCalled()
    })

    it('should apply CSS variable when autoApply is true and a color value changes', async () => {
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', '#ff5500')
      expect(spy).toHaveBeenCalledWith('--primary-color-rgb', '255,85,0')
    })

    it('should handle invalid hex gracefully (no rgb property set)', async () => {
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('not-a-hex')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', 'not-a-hex')
      expect(spy).not.toHaveBeenCalledWith('--primary-color-rgb', jasmine.anything())
    })

    it('should use empty string when form value is null', async () => {
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue(null)
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', '')
    })

    it('should debounce rapid value changes', async () => {
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#111111')
      component.generalForm.get('primary-color')?.setValue('#222222')
      component.generalForm.get('primary-color')?.setValue('#333333')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', '#333333')
      expect(spy).not.toHaveBeenCalledWith('--primary-color', '#111111')
    })

    it('should apply CSS variable for topbar form controls', async () => {
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.topbarForm.get('topbar-bg-color')?.setValue('#003366')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--topbar-bg-color', '#003366')
      expect(spy).toHaveBeenCalledWith('--topbar-bg-color-rgb', '0,51,102')
    })

    it('should apply CSS variable for sidebar form controls', async () => {
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.sidebarForm.get('menu-text-color')?.setValue('#99ccff')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--menu-text-color', '#99ccff')
      expect(spy).toHaveBeenCalledWith('--menu-text-color-rgb', '153,204,255')
    })
  })

  describe('CSS variable baseline (restore on destroy)', () => {
    beforeEach(() => {
      // clear inline color variables so tests are isolated from each other (documentElement is shared)
      const style = document.documentElement.style
      for (const group of [themeVariables.general, themeVariables.topbar, themeVariables.sidebar]) {
        for (const name of group) {
          style.removeProperty(`--${name}`)
          style.removeProperty(`--${name}-rgb`)
        }
      }
    })

    function setEditModeWithAutoApply() {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
    }

    it('should restore the pre-edit value of a modified variable on destroy', async () => {
      setEditModeWithAutoApply()
      const style = document.documentElement.style
      // original inline value (before any auto-apply mutation)
      style.setProperty('--primary-color', '#111111')
      const original = style.getPropertyValue('--primary-color')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()
      expect(style.getPropertyValue('--primary-color')).toBe('#ff5500')

      fixture.destroy()
      expect(style.getPropertyValue('--primary-color')).toBe(original)
    })

    it('should restore untouched variables to their own original values (full-set snapshot)', async () => {
      setEditModeWithAutoApply()
      const style = document.documentElement.style
      style.setProperty('--primary-color', '#111111')
      style.setProperty('--secondary-color', '#222222')

      // only primary-color is changed; secondary-color stays untouched
      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()

      fixture.destroy()
      expect(style.getPropertyValue('--primary-color')).toBe('#111111')
      expect(style.getPropertyValue('--secondary-color')).toBe('#222222')
    })

    it('should also restore the -rgb variant to its original value', async () => {
      setEditModeWithAutoApply()
      const style = document.documentElement.style
      style.setProperty('--primary-color', '#ffffff')
      style.setProperty('--primary-color-rgb', '9,9,9')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()
      expect(style.getPropertyValue('--primary-color-rgb')).toBe('255,85,0')

      fixture.destroy()
      expect(style.getPropertyValue('--primary-color-rgb')).toBe('9,9,9')
    })

    it('should clear a variable that had no inline value (revert to stylesheet) on destroy', async () => {
      setEditModeWithAutoApply()
      const style = document.documentElement.style
      // no inline value for --primary-color beforehand
      expect(style.getPropertyValue('--primary-color')).toBe('')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()
      expect(style.getPropertyValue('--primary-color')).toBe('#ff5500')

      fixture.destroy()
      expect(style.getPropertyValue('--primary-color')).toBe('')
    })

    it('should be a no-op and not throw on destroy when no mutation ever happened', () => {
      setEditModeWithAutoApply()
      // no color changed → baseline never captured
      expect(() => fixture.destroy()).not.toThrow()
    })
  })

  describe('onChangeColorValue', () => {
    it('should do nothing when changeMode is VIEW', () => {
      fixture.componentRef.setInput('changeMode', 'VIEW')
      fixture.detectChanges()
      component.onChangeColorValue('general', 'primary-color', '#abcdef')

      expect(component.generalForm.get('primary-color')?.value).toBeNull()
    })

    it('should update the form control value for a general variable', () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      component.onChangeColorValue('general', 'primary-color', '#abcdef')

      expect(component.generalForm.get('primary-color')?.value).toBe('#abcdef')
    })

    it('should update the form control value for a topbar variable', () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.detectChanges()
      component.onChangeColorValue('topbar', 'topbar-bg-color', '#112233')

      expect(component.topbarForm.get('topbar-bg-color')?.value).toBe('#112233')
    })

    it('should update the form control value for a sidebar variable', () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.detectChanges()
      component.onChangeColorValue('sidebar', 'menu-text-color', '#334455')

      expect(component.sidebarForm.get('menu-text-color')?.value).toBe('#334455')
    })

    it('should apply CSS variable when autoApply is true', () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.onChangeColorValue('general', 'primary-color', '#ff0000')

      expect(spy).toHaveBeenCalledWith('--primary-color', '#ff0000')
      expect(spy).toHaveBeenCalledWith('--primary-color-rgb', '255,0,0')
    })

    it('should not apply CSS variable when autoApply is false', () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('autoApply', false)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.onChangeColorValue('general', 'primary-color', '#ff0000')

      expect(spy).not.toHaveBeenCalled()
    })

    it('should do nothing for an unknown group key', async () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('autoApply', false)
      await fixture.whenStable()
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      // Should not throw; unknown key finds no group
      expect(() => component.onChangeColorValue('unknown', 'primary-color', '#ff0000')).not.toThrow()
      await fixture.whenStable()
      fixture.detectChanges()
      expect(component.generalForm.get('primary-color')?.value).toBeNull()
      expect(spy).not.toHaveBeenCalled()
    })
  })
})
