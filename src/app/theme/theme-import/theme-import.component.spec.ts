import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpResponse, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup } from '@angular/forms'
import { provideRouter, Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'

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
    themeName: new FormControl(null),
    displayName: new FormControl(null)
  })

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', ['importThemes'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeImportComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeImportComponent }]),
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ThemesAPIService, useValue: themeApiSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeImportComponent)
    component = fixture.componentInstance
    component.displayThemeImport = true
    component.themes = themes
    component.formGroup = formGroup
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    component.ngOnChanges()
  })

  it('should read file on theme import select', async () => {
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

    await component.onImportThemeSelect(event)

    expect(component.themeImportError).toBe(false)
    expect(component.themeSnapshot).toBeDefined()
    expect(component.properties).toEqual({ general: { 'primary-color': '#000000' } })
    expect(component.formGroup.controls['themeName'].value).toEqual('themeName')
    expect(component.formGroup.controls['displayName'].value).toEqual('themeDisplayName')
    expect(component.themeNameExists).toBe(false)
  })

  it('should indicate and log error on invalid data', async () => {
    spyOn(console, 'error')
    const file = new File(['{"invalid": "invalidProperty"}'], 'file_name')
    const event = jasmine.createSpyObj('event', [], { files: [file] })

    await component.onImportThemeSelect(event)

    expect(component.themeImportError).toBe(true)
    expect(component.themeSnapshot).toBe(null)
    expect(console.error).toHaveBeenCalledOnceWith('Theme Import Error: not valid data ')
  })

  it('should log error on data parsing error', async () => {
    spyOn(console, 'error')

    const file = new File(['notJsonFile'], 'file_name')
    const event = jasmine.createSpyObj('event', [], { files: [file] })

    await component.onImportThemeSelect(event)

    expect(console.error).toHaveBeenCalledOnceWith('Theme Import Parse Error', jasmine.any(Object))
    expect(component.themeSnapshot).toBe(null)
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

    await component.onImportThemeSelect(event)

    expect(component.themeImportError).toBe(false)
    expect(component.themeSnapshot).toBeDefined()
    expect(component.themeNameExists).toBe(true)
    expect(component.displayNameExists).toBe(true)
  })

  it('should emit uploadEmitter false on closing import dialog', () => {
    spyOn(component.uploadEmitter, 'emit')

    component.onImportThemeHide()

    expect(component.uploadEmitter.emit).toHaveBeenCalledOnceWith(false)
  })

  it('should clear error and import data on import clear', () => {
    component.themeSnapshot = {
      themes: {
        themeName: {
          logoUrl: 'logo_url'
        }
      }
    }
    component.themeImportError = true

    component.onImportThemeClear()

    expect(component.themeSnapshot).toBeNull()
    expect(component.themeImportError).toBeFalse()
  })

  it('should inform and navigate to new theme on import success', () => {
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')
    themeApiSpy.importThemes.and.returnValue(
      of(
        new HttpResponse({
          body: { id: 'id', name: 'themeName', displayName: 'themeDisplayName' }
        })
      )
    )
    spyOn(component.uploadEmitter, 'emit')
    component.themeSnapshot = {
      id: 'id',
      created: 'created',
      themes: { ['theme']: { description: 'themeDescription' } }
    }
    component.formGroup.controls['themeName'].setValue('themeName')
    component.formGroup.controls['displayName'].setValue('themeDisplayName')
    component.properties = {}

    component.onThemeUpload()

    expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
    expect(component.uploadEmitter.emit).toHaveBeenCalledOnceWith(true)
  })

  it('should return if no themes available', () => {
    themeApiSpy.importThemes.and.returnValue(of(new HttpResponse({ body: { id: 'id' } })))
    spyOn(component.uploadEmitter, 'emit')

    component.formGroup.controls['themeName'].setValue('themeName')
    component.formGroup.controls['displayName'].setValue('themeDisplayName')
    component.properties = {}
    component.onThemeUpload()

    expect(component.themeNameExists).toBe(false)
    expect(component.displayNameExists).toBe(false)
    expect(component.uploadEmitter.emit).not.toHaveBeenCalled()
  })

  it('should prevent upload if form is not ready', () => {
    themeApiSpy.importThemes.and.returnValue(of(new HttpResponse({ body: { id: 'id' } })))
    spyOn(component.uploadEmitter, 'emit')

    component.formGroup.controls['themeName'].setValue('themeName')
    component.onThemeUpload()

    expect(component.uploadEmitter.emit).not.toHaveBeenCalled()
  })

  it('should display error on api call fail during upload', () => {
    themeApiSpy.importThemes.and.returnValue(throwError(() => new Error()))
    component.themeSnapshot = {
      id: 'id',
      created: 'created',
      themes: { ['theme']: { description: 'themeDescription' } }
    }

    component.formGroup.controls['themeName'].setValue('themeName')
    component.formGroup.controls['displayName'].setValue('themeDisplayName')
    component.properties = {}
    component.onThemeUpload()

    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_FAIL' })
  })

  it('should not check existence if form is not ready', () => {
    component.themeNameExists = true
    spyOnProperty(component.formGroup, 'valid').and.returnValue(false)
    component.onThemeNameChange()

    expect(component.themeNameExists).toBeTrue()
  })
})
