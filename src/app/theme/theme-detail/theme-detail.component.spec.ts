import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { ConfigurationService, PortalMessageService, UserService } from '@onecx/portal-integration-angular'

import { RefType, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeDetailComponent } from './theme-detail.component'
import { bffImageUrl, getCurrentDateTime } from 'src/app/shared/utils'

describe('ThemeDetailComponent', () => {
  let component: ThemeDetailComponent
  let fixture: ComponentFixture<ThemeDetailComponent>
  let translateService: TranslateService

  const mockUserService = {
    lang$: {
      getValue: jasmine.createSpy('getValue').and.returnValue('en')
    }
  }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const locationSpy = jasmine.createSpyObj<Location>('Location', ['back'])

  const configServiceSpy = {
    getProperty: jasmine.createSpy('getProperty').and.returnValue('123'),
    lang: 'en'
  }
  const themesApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemeByName',
    'deleteTheme',
    'exportThemes'
  ])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDetailComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [
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

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should create with provided id and get theme', async () => {
    const name = 'themeName'
    const route = TestBed.inject(ActivatedRoute)
    spyOn(route.snapshot.paramMap, 'get').and.returnValue(name)
    translateService.use('de')

    // recreate component to test constructor
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    themesApiSpy.getThemeByName.calls.reset()
    component.loading = true

    await component.ngOnInit()
    expect(component.themeName).toBe(name)
    expect(component.dateFormat).toBe('medium')
    expect(themesApiSpy.getThemeByName).toHaveBeenCalledOnceWith({ name: name })
    expect(component.loading).toBe(false)
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
    const themeResponse = {
      resource: { name: 'themeName', displayName: 'Theme' },
      workspaces: [{ name: 'workspace', description: 'workspaceDesc' }]
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
      'DETAIL.CREATION_DATE': 'detailCreationDate',
      'DETAIL.TOOLTIPS.CREATION_DATE': 'detailTooltipsCreationDate',
      'DETAIL.MODIFICATION_DATE': 'detailModificationDate',
      'DETAIL.TOOLTIPS.MODIFICATION_DATE': 'detailTooltipsModificationDate',
      'THEME.WORKSPACES': 'themeWorkspaces',
      'THEME.TOOLTIPS.WORKSPACES': 'themeTooltipsWorkspaces'
    }
    spyOn(translateService, 'get').and.returnValues(of(actionsTranslations), of(generalTranslations))

    await component.ngOnInit()

    expect(component.theme).toEqual(themeResponse['resource'])

    let actions: any = []
    component.actions$!.subscribe((act) => (actions = act))

    expect(actions.length).toBe(4)
    const closeAction = actions.filter(
      (a: { label: string; title: string }) =>
        a.label === 'actionNavigationClose' && a.title === 'actionNavigationCloseTooltip'
    )[0]
    spyOn(component, 'onClose')
    closeAction.actionCallback()
    expect(component.onClose).toHaveBeenCalledTimes(1)

    const editAction = actions.filter(
      (a: { label: string; title: string }) => a.label === 'actionEditLabel' && a.title === 'actionEditTooltip'
    )[0]
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')
    editAction.actionCallback()
    expect(router.navigate).toHaveBeenCalledOnceWith(['./edit'], jasmine.any(Object))

    const exportAction = actions.filter(
      (a: { label: string; title: string }) => a.label === 'actionExportLabel' && a.title === 'actionExportTooltip'
    )[0]
    spyOn(component, 'onExportTheme')
    exportAction.actionCallback()
    expect(component.onExportTheme).toHaveBeenCalledTimes(1)

    const deleteAction = actions.filter(
      (a: { label: string; title: string }) => a.label === 'actionDeleteLabel' && a.title === 'actionDeleteTooltip'
    )[0]
    expect(component.themeDeleteVisible).toBe(false)
    expect(component.themeDeleteMessage).toBe('')
    deleteAction.actionCallback()
    expect(component.themeDeleteVisible).toBe(true)
    expect(component.themeDeleteMessage).toBe('Theme actionDeleteThemeMessage')
  })

  it('should load prepare object details on successfull call', async () => {
    const themeResponse = {
      resource: {
        name: 'themeName',
        displayName: 'Theme',
        creationDate: 'myCreDate',
        modificationDate: 'myModDate'
      },
      workspaces: [{ name: 'workspace1' }, { name: 'workspace2' }]
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
      'DETAIL.CREATION_DATE': 'detailCreationDate',
      'DETAIL.TOOLTIPS.CREATION_DATE': 'detailTooltipsCreationDate',
      'DETAIL.MODIFICATION_DATE': 'detailModificationDate',
      'DETAIL.TOOLTIPS.MODIFICATION_DATE': 'detailTooltipsModificationDate',
      'THEME.WORKSPACES': 'themeWorkspaces',
      'THEME.TOOLTIPS.WORKSPACES': 'themeTooltipsWorkspaces'
    }
    spyOn(translateService, 'get').and.returnValues(of(actionsTranslations), of(generalTranslations))

    await component.ngOnInit()
  })

  it('should display not found error and close page on theme fetch failure', () => {
    spyOn(component, 'onClose')
    themesApiSpy.getThemeByName.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: 'err: was not found'
          })
      )
    )

    component.ngOnInit()

    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'THEME.LOAD_ERROR',
      detailKey: 'THEME.NOT_FOUND'
    })
    expect(component.onClose).toHaveBeenCalledTimes(1)
  })

  it('should display catched error and close page on theme fetch failure', () => {
    spyOn(component, 'onClose')
    themesApiSpy.getThemeByName.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: 'does not contain checked string'
          })
      )
    )

    component.ngOnInit()

    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'THEME.LOAD_ERROR',
      detailKey: 'does not contain checked string'
    })
    expect(component.onClose).toHaveBeenCalledTimes(1)
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
      },
      workspaces: []
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

    await component.ngOnInit()

    expect(component.headerImageUrl).toBe('logo123.png')
  })

  it('should set header image url without prefix when theme logo has http/https', async () => {
    const url = 'http://external.com/logo123.png'
    const themeResponse = {
      resource: {
        name: 'themeName',
        logoUrl: url
      },
      workspaces: []
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)
    await component.ngOnInit()
    expect(component.headerImageUrl).toBe(url)
  })

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
    themesApiSpy.deleteTheme.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: {
              message: 'errorMessage'
            }
          })
      )
    )
    component.themeDeleteVisible = true

    component.onConfirmThemeDeletion()

    expect(component.themeDeleteVisible).toBe(false)
    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
      summaryKey: 'ACTIONS.DELETE.THEME_NOK',
      detailKey: 'errorMessage'
    })
  })

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
    themesApiSpy.exportThemes.and.returnValue(throwError(() => new Error()))
    component.theme = {
      name: 'themeName'
    }
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
    expect(component.getImageUrl(theme, RefType.Favicon)).toBe(bffImageUrl(configBasePath, theme.name, RefType.Favicon))
  })
})
