import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpResponse, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup } from '@angular/forms'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeImportComponent } from './theme-import.component'

describe('ThemeImportComponent', () => {
  let component: ThemeImportComponent
  let fixture: ComponentFixture<ThemeImportComponent>
  const themes: Theme[] = [
    { name: 'theme1', displayName: 'Theme-1' },
    { name: 'theme2', displayName: 'Theme-2' }
  ]
  const formGroup = new FormGroup({
    themeName: new FormControl<string | null>(null),
    displayName: new FormControl<string | null>(null)
  })

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const themesApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', ['importThemes'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeImportComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
    })
      .overrideComponent(ThemeImportComponent, {
        add: {
          providers: [
            { provide: ThemesAPIService, useValue: themesApiSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()

    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    themesApiSpy.importThemes.calls.reset()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeImportComponent)
    component = fixture.componentInstance
    component.visible.set(true)
    fixture.componentRef.setInput('themes', themes)
    component.formGroup = formGroup
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    component.ngOnChanges()
  })

  it('should clear form on hide', () => {
    component.importError.set('GENERAL')
    component.themeSnapshot = { themes: { theme: {} } }

    component.visible.set(false)
    component.ngOnChanges()

    expect(component.themeSnapshot).toBeNull()
    expect(component.importError()).toBe('NONE')
  })

  describe('upload', () => {
    it('should read file on theme import select - with displayName', async () => {
      const themeSnapshot = JSON.stringify({
        themes: {
          themeName: {
            displayName: 'themeDisplayName',
            logoUrl: 'logo_url',
            properties: {
              general: { 'primary-color': '#000000' }
            }
          }
        }
      })
      const file = new File([themeSnapshot], 'file_name')
      const event = jasmine.createSpyObj('event', [], { files: [file] })

      await component.onImportSelectFile(event)

      expect(component.importError()).toBe('NONE')
      expect(component.themeSnapshot).toBeDefined()
      expect(component.properties).toEqual({ general: { 'primary-color': '#000000' } })
      expect(component.formGroup.controls['themeName'].value).toEqual('themeName')
      expect(component.formGroup.controls['displayName'].value).toEqual('themeDisplayName')
      expect(component.themeNameExists).toBe(false)
    })

    it('should read file on theme import select - without displayName', async () => {
      const themeSnapshot = JSON.stringify({
        themes: {
          themeName: {
            logoUrl: 'logo_url'
          }
        }
      })
      const file = new File([themeSnapshot], 'file_name')
      const event = jasmine.createSpyObj('event', [], { files: [file] })

      await component.onImportSelectFile(event)

      expect(component.importError()).toBe('NONE')
      expect(component.themeSnapshot).toBeDefined()
      expect(component.formGroup.controls['themeName'].value).toEqual('themeName')
      expect(component.formGroup.controls['displayName'].value).toBeNull()
      expect(component.formGroup.valid).toBeFalse()
    })

    it('should indicate and log error on invalid data', async () => {
      spyOn(console, 'error')
      const file = new File(['{"invalid": "invalidProperty"}'], 'file_name')
      const event = jasmine.createSpyObj('event', [], { files: [file] })

      await component.onImportSelectFile(event)

      expect(component.importError()).toBe('CONTENT')
      expect(component.themeSnapshot).toBeDefined()
      expect(console.error).toHaveBeenCalledOnceWith('Theme Import Error: not valid data ')
    })

    it('should log error on data parsing error', async () => {
      spyOn(console, 'error')

      const file = new File(['notJsonFile'], 'file_name')
      const event = jasmine.createSpyObj('event', [], { files: [file] })

      await component.onImportSelectFile(event)

      expect(console.error).toHaveBeenCalledOnceWith('Theme Import Error: parse error', jasmine.any(Object))
      expect(component.themeSnapshot).toBeNull()
    })

    it('should indicate theme name existance if already present', async () => {
      const themeSnapshot = JSON.stringify({
        themes: {
          theme1: {
            displayName: 'Theme-1',
            logoUrl: 'logo_url',
            properties: {}
          }
        }
      })
      const file = new File([themeSnapshot], 'file_name')
      const event = jasmine.createSpyObj('event', [], { files: [file] })

      await component.onImportSelectFile(event)

      expect(component.importError()).toBe('NONE')
      expect(component.themeSnapshot).toBeDefined()
      expect(component.themeNameExists).toBe(true)
      expect(component.displayNameExists).toBe(true)
    })

    it('should clear error and import data on import clear', () => {
      component.themeSnapshot = {
        themes: {
          themeName: {
            logoUrl: 'logo_url'
          }
        }
      }
      component.importError.set('GENERAL')

      component.onImportClear()

      expect(component.themeSnapshot).toBeNull()
      expect(component.importError()).toBe('NONE')
    })
  })

  describe('import', () => {
    it('should send new theme on import success', async () => {
      spyOn(component.uploaded, 'emit')
      themesApiSpy.importThemes.and.returnValue(
        of(
          new HttpResponse({
            body: { id: 'id', name: 'themeName', displayName: 'themeDisplayName' }
          })
        )
      )
      component.themeSnapshot = {
        id: 'id',
        created: 'created',
        themes: { ['theme']: { description: 'themeDescription' } }
      }
      component.formGroup.controls['themeName'].setValue('themeName')
      component.formGroup.controls['displayName'].setValue('themeDisplayName')
      component.properties = {}

      component.onThemeUpload()

      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.THEME_SUCCESS' })
      expect(component.uploaded.emit).toHaveBeenCalledWith({
        name: 'themeName',
        displayName: 'themeDisplayName'
      })
    })

    it('should prevent import if no themes available', () => {
      themesApiSpy.importThemes.and.returnValue(of(new HttpResponse({ body: { id: 'id' } })))
      component.formGroup.controls['themeName'].setValue('themeName')
      component.formGroup.controls['displayName'].setValue('themeDisplayName')
      component.properties = {}

      component.onThemeUpload()

      expect(component.themeNameExists).toBe(false)
      expect(component.displayNameExists).toBe(false)
    })

    it('should prevent import if form is not ready', () => {
      themesApiSpy.importThemes.and.returnValue(of(new HttpResponse({ body: { id: 'id' } })))

      component.formGroup.controls['themeName'].setValue('themeName')
      component.formGroup.controls['displayName'].setValue(null)
      component.formGroup.controls['displayName'].setErrors({ required: true })
      component.formGroup.controls['displayName'].markAsDirty()
      component.onThemeUpload()

      expect(themesApiSpy.importThemes).not.toHaveBeenCalled()
    })

    it('should display error on api call fail during upload', () => {
      themesApiSpy.importThemes.and.returnValue(throwError(() => new Error()))
      component.themeSnapshot = {
        id: 'id',
        created: 'created',
        themes: { ['theme']: { description: 'themeDescription' } }
      }

      component.formGroup.controls['themeName'].setValue('themeName')
      component.formGroup.controls['displayName'].setValue('themeDisplayName')
      component.properties = {}
      component.onThemeUpload()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.THEME_FAIL' })
    })
  })

  it('should not check existence if form is not ready', () => {
    component.themeNameExists = true
    spyOnProperty(component.formGroup, 'valid').and.returnValue(false)
    component.onThemeNameChange()

    expect(component.themeNameExists).toBeTrue()
  })

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ThemeImportComponent)
      component = fixture.componentInstance
      component.visible.set(true)
      fixture.componentRef.setInput('themes', [])
      fixture.detectChanges()
    })

    it('should reflect form validity on status change', () => {
      expect(component.isFormValid()).toBeFalse()
      component.formGroup.controls['themeName'].setValue('theme1')
      component.formGroup.controls['displayName'].setValue('Theme Display')
      expect(component.isFormValid()).toBeTrue()
    })
  })
})
