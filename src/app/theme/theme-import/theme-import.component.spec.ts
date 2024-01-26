import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/portal-integration-angular'

import { ThemesAPIService } from 'src/app/generated'
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
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        { provide: PortalMessageService, useValue: msgServiceSpy },
        {
          provide: ThemesAPIService,
          useValue: themeApiSpy
        }
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
    expect(component.httpHeaders.get('Content-Type')).toBe('application/json')
    expect(component.themes).toEqual([])
  })

  it('should initialize themes and headers onInit', () => {
    const themeArr = [
      {
        name: 'theme1'
      },
      {
        name: 'theme2'
      }
    ]
    const themesResponse = {
      stream: themeArr
    }
    themeApiSpy.getThemes.and.returnValue(of(themesResponse as any))
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
    component.themes = [
      {
        name: 'themeName'
      }
    ]
    const themeSnapshot = JSON.stringify({
      themes: {
        themeName: {
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
    // TODO: if error is visible
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
      of({
        id: 'themeId',
        name: 'name'
      } as any)
    )
    spyOn(component.uploadEmitter, 'emit')

    component.onThemeUpload()

    expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
    expect(component.uploadEmitter.emit).toHaveBeenCalledTimes(1)
    expect(router.navigate).toHaveBeenCalledOnceWith(['./themeId'], jasmine.any(Object))
  })

  it('should display error on api call fail during upload', () => {
    themeApiSpy.importThemes.and.returnValue(throwError(() => new Error()))

    component.onThemeUpload()

    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_FAIL' })
  })
})
