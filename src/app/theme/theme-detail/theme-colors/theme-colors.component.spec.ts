import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
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
      declarations: [ThemeColorsComponent],
      imports: [
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [TranslateService, { provide: PortalMessageService, useValue: msgServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeColorsComponent)
    component = fixture.componentInstance
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
        expect(component.generalForm.contains(v)).toBeTrue()
      }
    })

    it('should create form controls for all topbar theme variables', () => {
      for (const v of themeVariables.topbar) {
        expect(component.topbarForm.contains(v)).toBeTrue()
      }
    })

    it('should create form controls for all sidebar theme variables', () => {
      for (const v of themeVariables.sidebar) {
        expect(component.sidebarForm.contains(v)).toBeTrue()
      }
    })

    it('should have three groups defined', () => {
      expect(component.groups.length).toBe(3)
      expect(component.groups[0].key).toBe('general')
      expect(component.groups[1].key).toBe('topbar')
      expect(component.groups[2].key).toBe('sidebar')
    })

    it('should default autoApply to false', () => {
      expect(component.autoApply).toBeFalse()
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
      component.theme = theme
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })

      expect(component.generalForm.get('primary-color')?.value).toBe('#ff0000')
      expect(component.topbarForm.get('topbar-bg-color')?.value).toBe('#00ff00')
      expect(component.sidebarForm.get('menu-text-color')?.value).toBe('#0000ff')
    })

    it('should not fill form when theme is undefined', () => {
      component.theme = undefined
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })

      expect(component.generalForm.get('primary-color')?.value).toBeNull()
      expect(component.topbarForm.get('topbar-bg-color')?.value).toBeNull()
      expect(component.sidebarForm.get('menu-text-color')?.value).toBeNull()
    })

    it('should default operator to undefined if not set on theme', () => {
      const theme: Theme = { name: 'test-theme' }
      component.theme = theme
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })

      expect(component.theme.operator).toBeUndefined()
    })

    it('should reset form before patching new values', () => {
      const theme1: Theme = {
        name: 'theme1',
        properties: { general: { 'primary-color': '#111111' } }
      }
      component.theme = theme1
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })

      expect(component.generalForm.get('primary-color')?.value).toBe('#111111')

      const theme2: Theme = {
        name: 'theme2',
        properties: { general: { 'secondary-color': '#222222' } }
      }
      component.theme = theme2
      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })

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
      component.changeMode = 'EDIT'
      component.theme = theme

      component.ngOnChanges({ theme: new SimpleChange(undefined, theme, true) })
      expect(component.onUpdateTheme()).toBeTrue()

      expect(component.theme.properties).toEqual(component.colorsForm.value)
    })

    it('call with theme but invalid font form', () => {
      const theme: Theme = { name: 'test-theme', properties: {} }
      component.changeMode = 'EDIT'
      component.theme = theme

      component.ngOnChanges({ theme: new SimpleChange(undefined, component.theme, true) })
      // manually invalidate the font form
      component.colorsForm.markAsDirty()
      component.colorsForm.setErrors({ invalid: true })

      component.onUpdateTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
    })

    it('should not save if theme is undefined', () => {
      component.theme = undefined

      // no error thrown
      expect(component.onUpdateTheme()).toBeFalse()
    })
  })

  describe('autoApply', () => {
    it('should apply CSS variable when autoApply is true and a color value changes', fakeAsync(() => {
      component.autoApply = true
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      tick(300)

      expect(spy).toHaveBeenCalledWith('--primary-color', '#ff5500')
      expect(spy).toHaveBeenCalledWith('--primary-color-rgb', '255,85,0')
    }))

    it('should not apply CSS variable when autoApply is false', fakeAsync(() => {
      component.autoApply = false
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#ff5500')
      tick(300)

      expect(spy).not.toHaveBeenCalled()
    }))

    it('should handle invalid hex gracefully (no rgb property set)', fakeAsync(() => {
      component.autoApply = true
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('not-a-hex')
      tick(300)

      expect(spy).toHaveBeenCalledWith('--primary-color', 'not-a-hex')
      expect(spy).not.toHaveBeenCalledWith('--primary-color-rgb', jasmine.anything())
    }))

    it('should use empty string when form value is null', fakeAsync(() => {
      component.autoApply = true
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue(null)
      tick(300)

      expect(spy).toHaveBeenCalledWith('--primary-color', '')
    }))

    it('should debounce rapid value changes', fakeAsync(() => {
      component.autoApply = true
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.generalForm.get('primary-color')?.setValue('#111111')
      tick(100)
      component.generalForm.get('primary-color')?.setValue('#222222')
      tick(100)
      component.generalForm.get('primary-color')?.setValue('#333333')
      tick(300)

      expect(spy).toHaveBeenCalledWith('--primary-color', '#333333')
      expect(spy).not.toHaveBeenCalledWith('--primary-color', '#111111')
    }))

    it('should apply CSS variable for topbar form controls', fakeAsync(() => {
      component.autoApply = true
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.topbarForm.get('topbar-bg-color')?.setValue('#003366')
      tick(300)

      expect(spy).toHaveBeenCalledWith('--topbar-bg-color', '#003366')
      expect(spy).toHaveBeenCalledWith('--topbar-bg-color-rgb', '0,51,102')
    }))

    it('should apply CSS variable for sidebar form controls', fakeAsync(() => {
      component.autoApply = true
      const spy = spyOn(document.documentElement.style, 'setProperty')

      component.sidebarForm.get('menu-text-color')?.setValue('#99ccff')
      tick(300)

      expect(spy).toHaveBeenCalledWith('--menu-text-color', '#99ccff')
      expect(spy).toHaveBeenCalledWith('--menu-text-color-rgb', '153,204,255')
    }))
  })
})
