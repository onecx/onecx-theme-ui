import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { ConfigurationService, PortalMessageService, UserService } from '@onecx/portal-integration-angular'

import { RefType, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeDetailComponent } from './theme-detail.component'

import { bffImageUrl, getCurrentDateTime } from 'src/app/shared/utils'

const theme: Theme = {
  id: 'theme-id',
  name: 'themeName',
  displayName: 'themeDisplayName',
  operator: false
}

describe('ThemeDetailComponent', () => {
  let component: ThemeDetailComponent
  let fixture: ComponentFixture<ThemeDetailComponent>
  let translateService: TranslateService

  const mockUserService = { lang$: { getValue: jasmine.createSpy('getValue').and.returnValue('en') } }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const locationSpy = jasmine.createSpyObj<Location>('Location', ['back'])

  const configServiceSpy = { getProperty: jasmine.createSpy('getProperty').and.returnValue('123'), lang: 'en' }
  const themesApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemeByName',
    'deleteTheme',
    'exportThemes'
  ])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDetailComponent],
      imports: [
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeDetailComponent }]),
        { provide: UserService, useValue: mockUserService },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ConfigurationService, useValue: configServiceSpy },
        { provide: Location, useValue: locationSpy },
        { provide: ThemesAPIService, useValue: themesApiSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    themesApiSpy.getThemeByName.and.returnValue(of({}) as any)
    themesApiSpy.getThemeByName.calls.reset()
    themesApiSpy.exportThemes.and.returnValue(of({}) as any)
    themesApiSpy.exportThemes.calls.reset()
    locationSpy.back.calls.reset()
  }))

  beforeEach(() => {
    translateService = TestBed.inject(TranslateService)
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  function initializeComponent(): void {
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  it('should create component', () => {
    expect(component).toBeTruthy()
  })

  it('should create component with provided id and get theme', async () => {
    const route = TestBed.inject(ActivatedRoute)
    spyOn(route.snapshot.paramMap, 'get').and.returnValue(theme.name!)
    translateService.use('de')

    // recreate component to test constructor
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme } as any))

    await component.ngOnInit()

    component.theme$?.subscribe((data) => {
      expect(data).toBe(theme)
      expect(component.themeName).toBe(theme.name!)
      expect(component.theme?.displayName).toBe(theme.displayName!)
      expect(component.dateFormat).toBe('medium')
      expect(themesApiSpy.getThemeByName).toHaveBeenCalled()
      component.actions$!.subscribe((actions) => {
        expect(actions.length).toBe(4)
        if (actions.length > 0) {
          expect(actions[3].showCondition).toBeTrue()
        }
      })
    })
  })

  it('should set showOperatorMessage to false', async () => {
    const event = { index: 1 }

    await component.ngOnInit()
    component.onTabChange(event)

    expect(component.showOperatorMessage).toBeFalsy()
  })

  it('should create with default dateFormat', async () => {
    // recreate component to test constructor
    initializeComponent()

    expect(component.dateFormat).toBe('medium')
  })

  it('should call this.user.lang$ from the constructor and set this.dateFormat to the default format if user.lang$ is not de', () => {
    mockUserService.lang$.getValue.and.returnValue('de')
    initializeComponent()
    expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
  })

  it('should load theme and action translations on successful call', async () => {
    spyOn(component, 'onClose')
    spyOn(component, 'onExportTheme')
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')
    component.themeName = 'dummy'
    component.themeDeleteVisible = false

    component.actions$!.subscribe((actions) => {
      expect(actions.length).toBe(4)
      if (actions.length > 0) {
        actions[0].actionCallback()
        actions[1].actionCallback()
        actions[2].actionCallback() // => go to designer with ./edit
        actions[3].actionCallback()
        expect(component.onClose).toHaveBeenCalled()
        expect(component.onExportTheme).toHaveBeenCalled()
        expect(router.navigate).toHaveBeenCalledOnceWith(['./edit'], jasmine.any(Object))
        expect(component.themeDeleteVisible).toBeTrue()
      }
    })
  })

  it('should load prepare translations on successfull call', async () => {
    const themeResponse = {
      resource: {
        name: 'themeName',
        displayName: 'Theme',
        creationDate: 'myCreDate',
        modificationDate: 'myModDate'
      }
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

    const translateService = TestBed.inject(TranslateService)
    const actionsTranslations = {
      'ACTIONS.NAVIGATION.BACK': 'actionNavigationClose',
      'ACTIONS.NAVIGATION.BACK.TOOLTIP': 'actionNavigationCloseTooltip',
      'ACTIONS.EDIT.LABEL': 'actionEditLabel',
      'ACTIONS.EDIT.TOOLTIP': 'actionEditTooltip',
      'ACTIONS.EXPORT.LABEL': 'actionExportLabel',
      'ACTIONS.EXPORT.TOOLTIP': 'actionExportTooltip',
      'ACTIONS.DELETE.LABEL': 'actionDeleteLabel',
      'ACTIONS.DELETE.TOOLTIP': 'actionDeleteTooltip',
      'ACTIONS.DELETE.THEME_MESSAGE': '{{ITEM}} actionDeleteThemeMessage'
    }
    const generalTranslations = {
      'INTERNAL.CREATION_DATE': 'detailCreationDate',
      'INTERNAL.TOOLTIPS.CREATION_DATE': 'detailTooltipsCreationDate',
      'INTERNAL.MODIFICATION_DATE': 'detailModificationDate',
      'INTERNAL.TOOLTIPS.MODIFICATION_DATE': 'detailTooltipsModificationDate'
    }
    spyOn(translateService, 'get').and.returnValues(of(actionsTranslations), of(generalTranslations))

    await component.ngOnInit()
  })

  it('should display not found error and limited header actions', () => {
    const errorResponse = { error: 'Theme not found', status: 404, statusText: 'Not found' }
    themesApiSpy.getThemeByName.and.returnValue(throwError(() => new HttpErrorResponse(errorResponse)))
    component.exceptionKey = undefined
    component.themeName = 'dummy'
    component.ngOnInit()

    component.actions$!.subscribe((actions) => {
      expect(actions.length).toBe(4)
      if (actions.length > 0) {
        expect(actions[3].showCondition).toBeFalse() // hide delete action
      }
    })

    component.theme$?.subscribe(() => {
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_404.THEME')
    })
  })

  it('should display permission error', () => {
    const errorResponse = { error: { message: 'No permissions' }, status: 403 }
    themesApiSpy.getThemeByName.and.returnValue(throwError(() => new HttpErrorResponse(errorResponse)))
    component.exceptionKey = undefined

    component.ngOnInit()

    component.theme$?.subscribe(() => {
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.THEME')
    })
  })

  it('should navigate back on close', () => {
    component.ngOnInit()
    component.onClose()

    expect(locationSpy.back).toHaveBeenCalled()
  })

  it('should set header image url with prefix when theme logo doesnt have http/https', async () => {
    const themeResponse = {
      resource: {
        name: 'themeName',
        logoUrl: 'logo123.png'
      }
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

    await component.ngOnInit()

    component.theme$?.subscribe(() => {
      expect(component.headerImageUrl).toBe('logo123.png')
    })
  })

  it('should set header image url without prefix when theme logo has http/https', async () => {
    const url = 'http://external.com/logo123.png'
    const themeResponse = {
      resource: {
        name: 'themeName',
        logoUrl: url
      }
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
    await component.ngOnInit()

    component.theme$?.subscribe(() => {
      expect(component.headerImageUrl).toBe(url)
    })
  })

  describe('Theme deletion', () => {
    it('should hide dialog, inform and navigate on successfull deletion', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      themesApiSpy.deleteTheme.and.returnValue(of({}) as any)
      component.themeDeleteVisible = true

      component.onConfirmThemeDeletion()

      expect(component.themeDeleteVisible).toBe(false)
      expect(router.navigate).toHaveBeenCalledOnceWith(['..'], jasmine.any(Object))
      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
    })

    it('should hide dialog and display error on failed deletion', () => {
      const errorResponse = { error: { message: 'Error on deleting theme' }, status: 400 }
      themesApiSpy.deleteTheme.and.returnValue(throwError(() => new HttpErrorResponse(errorResponse)))
      component.themeDeleteVisible = true

      component.onConfirmThemeDeletion()

      expect(component.themeDeleteVisible).toBe(false)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.DELETE.THEME_NOK',
        detailKey: errorResponse.error.message
      })
    })
  })

  describe('Theme export', () => {
    it('should save file on theme export', () => {
      spyOn(JSON, 'stringify').and.returnValue('themejson')
      spyOn(FileSaver, 'saveAs')

      themesApiSpy.exportThemes.and.returnValue(
        of({
          themes: {
            themeName: {
              version: 1,
              logoUrl: 'url'
            }
          }
        }) as any
      )

      component.theme = {
        modificationCount: 1,
        name: 'themeName',
        displayName: 'Theme',
        logoUrl: 'url',

        creationDate: 'creationDate',
        creationUser: 'createionUser',
        modificationDate: 'modificationDate',
        modificationUser: 'modificationUser',
        id: 'id'
      }

      component.onExportTheme()

      expect(themesApiSpy.exportThemes).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ exportThemeRequest: { names: ['themeName'] } })
      )
      expect(JSON.stringify).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          themes: {
            themeName: {
              version: 1,
              logoUrl: 'url'
            }
          }
        }),
        null,
        2
      )
      expect(FileSaver.saveAs).toHaveBeenCalledOnceWith(
        jasmine.any(Blob),
        `onecx-theme_themeName_${getCurrentDateTime()}.json`
      )
    })

    it('should display error on theme export fail', () => {
      const errorResponse = { error: 'Error on exporting theme', status: 400 }
      themesApiSpy.exportThemes.and.returnValue(throwError(() => errorResponse))
      component.theme = theme

      component.onExportTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
    })

    it('should get correct favicon URL', () => {
      const theme: Theme = {
        modificationCount: 0,
        name: 'themeName',
        faviconUrl: 'faviconUrl'
      }
      expect(component.getImageUrl(theme, RefType.Favicon)).toBe('faviconUrl')

      const configBasePath = 'http://onecx-theme-bff:8080'
      theme.faviconUrl = ''
      expect(component.getImageUrl(theme, RefType.Favicon)).toBe(
        bffImageUrl(configBasePath, theme.name, RefType.Favicon)
      )
    })
  })
})
