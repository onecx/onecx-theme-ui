import { SimpleChange } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme } from 'src/app/shared/generated'
import { themeVariables } from '../theme-variables'
import { ThemeColorsComponent } from './theme-colors.component'

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
      expect(component.groups.length).toBe(3)
      expect(component.groups[0].key).toBe('general')
      expect(component.groups[1].key).toBe('topbar')
      expect(component.groups[2].key).toBe('sidebar')
    })

    it('should default autoApply to false', () => {
      expect(component.autoApply()).toBeFalse()
    })
  })

  describe('signals', () => {
    it('isComponentValid should be false when forms are disabled (initial state)', () => {
      // default from beforeEach: theme=undefined, changeMode=VIEW → all sub-forms disabled
      expect(component.isComponentValid()).toBeFalse()
    })

    it('isComponentValid should be true when all forms are enabled and valid', () => {
      const theme: Theme = { name: 'test', properties: {} }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      component.ngOnChanges({ theme: new SimpleChange(undefined, theme, true) })

      expect(component.isComponentValid()).toBeTrue()
    })

    it('isComponentValid should be false when general form has errors', () => {
      const theme: Theme = { name: 'test', properties: {} }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      component.ngOnChanges({ theme: new SimpleChange(undefined, theme, true) })
      component.generalForm.setErrors({ invalid: true })

      expect(component.isComponentValid()).toBeFalse()
    })

    it('isComponentValid should be false when topbar form has errors', () => {
      const theme: Theme = { name: 'test', properties: {} }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      component.ngOnChanges({ theme: new SimpleChange(undefined, theme, true) })
      component.topbarForm.setErrors({ invalid: true })

      expect(component.isComponentValid()).toBeFalse()
    })

    it('isComponentValid should be false when sidebar form has errors', () => {
      const theme: Theme = { name: 'test', properties: {} }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)
      component.ngOnChanges({ theme: new SimpleChange(undefined, theme, true) })
      component.sidebarForm.setErrors({ invalid: true })

      expect(component.isComponentValid()).toBeFalse()
    })
  })

  describe('ngOnChanges', () => {
    it('should fill the form when theme is set', () => {
      const theme: Theme = {
        name: 'test-theme',
        properties: {
          general: { 'primary-color': '#ff0000' },
          topbar: { 'topbar-bg-color': '#00ff00' },
          sidebar: { 'menu-text-color': '#0000ff' }
        }
      }
      fixture.componentRef.setInput('theme', theme)
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })

      expect(component.generalForm.get('primary-color')?.value).toBe('#ff0000')
      expect(component.topbarForm.get('topbar-bg-color')?.value).toBe('#00ff00')
      expect(component.sidebarForm.get('menu-text-color')?.value).toBe('#0000ff')
    })

    it('should not fill form when theme is undefined', () => {
      fixture.componentRef.setInput('theme', undefined)
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })

      expect(component.generalForm.get('primary-color')?.value).toBeNull()
      expect(component.topbarForm.get('topbar-bg-color')?.value).toBeNull()
      expect(component.sidebarForm.get('menu-text-color')?.value).toBeNull()
    })

    it('should default operator to undefined if not set on theme', () => {
      const theme: Theme = { name: 'test-theme' }
      fixture.componentRef.setInput('theme', theme)
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })

      expect(component.theme()?.operator).toBeUndefined()
    })

    it('should reset form before patching new values', () => {
      const theme1: Theme = {
        name: 'theme1',
        properties: { general: { 'primary-color': '#111111' } }
      }
      fixture.componentRef.setInput('theme', theme1)
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })

      expect(component.generalForm.get('primary-color')?.value).toBe('#111111')

      const theme2: Theme = {
        name: 'theme2',
        properties: { general: { 'secondary-color': '#222222' } }
      }
      fixture.componentRef.setInput('theme', theme2)
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })

      expect(component.generalForm.get('primary-color')?.value).toBeNull()
      expect(component.generalForm.get('secondary-color')?.value).toBe('#222222')
    })
  })

  describe('onSave', () => {
    const theme: Theme = {
      name: 'test-theme',
      displayName: 'Test Theme',
      properties: {
        general: { 'primary-color': '#ff0000' },
        topbar: { 'topbar-bg-color': '#00ff00' },
        sidebar: { 'menu-text-color': '#0000ff' }
      }
    }

    it('should save form values to theme properties', () => {
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)

      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })
      expect(component.onUpdateTheme()).toBeTrue()

      expect(component.theme()?.properties).toEqual(component.colorsForm.value)
    })

    it('call with theme but invalid font form', () => {
      const theme: Theme = { name: 'test-theme', properties: {} }
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', theme)

      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme(), true) })
      // manually invalidate the font form
      component.colorsForm.markAsDirty()
      component.colorsForm.setErrors({ invalid: true })

      component.onUpdateTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should not save if theme is undefined', () => {
      fixture.componentRef.setInput('theme', undefined)

      // no error thrown
      expect(component.onUpdateTheme()).toBeFalse()
    })
  })

  describe('autoApply', () => {
    it('should apply CSS variable when autoApply is true and a color value changes', async () => {
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', '#ff5500')
      expect(spy).toHaveBeenCalledWith('--primary-color-rgb', '255,85,0')
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

    it('should handle invalid hex gracefully (no rgb property set)', async () => {
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('not-a-hex')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', 'not-a-hex')
      expect(spy).not.toHaveBeenCalledWith('--primary-color-rgb', jasmine.anything())
    })

    it('should use empty string when form value is null', async () => {
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue(null)
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--primary-color', '')
    })

    it('should debounce rapid value changes', async () => {
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
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
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.topbarForm.get('topbar-bg-color')?.setValue('#003366')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--topbar-bg-color', '#003366')
      expect(spy).toHaveBeenCalledWith('--topbar-bg-color-rgb', '0,51,102')
    })

    it('should apply CSS variable for sidebar form controls', async () => {
      fixture.componentRef.setInput('autoApply', true)
      fixture.detectChanges()
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.sidebarForm.get('menu-text-color')?.setValue('#99ccff')
      await fixture.whenStable()
      fixture.detectChanges()

      expect(spy).toHaveBeenCalledWith('--menu-text-color', '#99ccff')
      expect(spy).toHaveBeenCalledWith('--menu-text-color-rgb', '153,204,255')
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
