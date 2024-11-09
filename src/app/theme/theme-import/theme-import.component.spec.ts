import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpResponse, provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'

import { Theme, ThemesAPIService, GetThemesResponse } from 'src/app/shared/generated'
import { ThemeImportComponent } from './theme-import.component'

describe('ThemeImportComponent', () => {
  let component: ThemeImportComponent
  let fixture: ComponentFixture<ThemeImportComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', ['getThemes', 'importThemes'])

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
    themeApiSpy.getThemes.and.returnValue(of({ stream: [] }) as any)
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeImportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize themes and headers onInit', () => {
    const themeArr: Theme[] = [
      { name: 'theme1', displayName: 'Theme-1' },
      { name: 'theme2', displayName: 'Theme-2' }
    ]
    const themesResponse: GetThemesResponse = { stream: themeArr }

    themeApiSpy.getThemes.and.returnValue(of(themesResponse as any))

    component.displayThemeImport = true
    component.ngOnInit()

    expect(component.themes).toEqual(themeArr)
  })

  it('should read file on theme import select', async () => {
    const themeSnapshot = JSON.stringify({
      themes: {
        themeName: {
          logoUrl: 'logo_url',
          properties: {
            general: {
              'primary-color': '#000000'
            }
          }
        }
      }
    })
    const file = new File([themeSnapshot], 'file_name')
    const event = jasmine.createSpyObj('event', [], { files: [file] })

    await component.onImportThemeSelect(event)

    expect(component.themeImportError).toBe(false)
    expect(component.themeSnapshot).toBeDefined()
    expect(component.properties).toEqual({
      general: {
        'primary-color': '#000000'
      }
    })
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
    // TODO: if error is visible
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
    component.themes = [{ name: 'themeName', displayName: 'Theme-1' }]
    const themeSnapshot = JSON.stringify({
      themes: {
        themeName: {
          displayName: 'Theme-1',
          logoUrl: 'logo_url'
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

  it('should emit displayThemeImportChange on import hide', () => {
    spyOn(component.displayThemeImportChange, 'emit')

    component.onImportThemeHide()

    expect(component.displayThemeImportChange.emit).toHaveBeenCalledOnceWith(false)
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
    component.themeName = 'themeName'
    component.displayName = 'themeDisplayName'
    component.onThemeUpload()

    expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
    expect(component.uploadEmitter.emit).toHaveBeenCalledTimes(1)
  })

  it('should return if no themes available', () => {
    themeApiSpy.importThemes.and.returnValue(of(new HttpResponse({ body: { id: 'id' } })))
    spyOn(component.uploadEmitter, 'emit')

    component.themeName = 'themeName'
    component.displayName = 'themeDisplayName'
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

    component.themeName = 'themeName'
    component.displayName = 'themeDisplayName'
    component.onThemeUpload()

    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_FAIL' })
  })
})
