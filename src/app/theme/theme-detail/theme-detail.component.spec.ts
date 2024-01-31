import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpErrorResponse } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { ConfigurationService, PortalMessageService } from '@onecx/portal-integration-angular'

import { prepareUrl } from 'src/app/shared/utils'
import { ThemesAPIService } from 'src/app/shared/generated'
import { ThemeDetailComponent } from './theme-detail.component'

describe('ThemeDetailComponent', () => {
  let component: ThemeDetailComponent
  let fixture: ComponentFixture<ThemeDetailComponent>
  let translateService: TranslateService

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  const configServiceSpy = {
    getProperty: jasmine.createSpy('getProperty').and.returnValue('123'),
    getPortal: jasmine.createSpy('getPortal').and.returnValue({
      themeId: '1234',
      portalName: 'test',
      baseUrl: '/',
      microfrontendRegistrations: []
    })
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
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ConfigurationService, useValue: configServiceSpy },
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
  }))

  beforeEach(() => {
    translateService = TestBed.inject(TranslateService)
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

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

  it('should create with default dateFormat', async () => {
    // recreate component to test constructor
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()

    expect(component.dateFormat).toBe('medium')
  })

  it('should load theme and action translations on successful call', async () => {
    const themeResponse = {
      resource: {
        name: 'themeName'
      },
      workspaces: [
        {
          workspaceName: 'workspace',
          description: 'workspaceDesc'
        }
      ]
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

    const translateService = TestBed.inject(TranslateService)
    const actionsTranslations = {
      'ACTIONS.NAVIGATION.CLOSE': 'actionNavigationClose',
      'ACTIONS.NAVIGATION.CLOSE.TOOLTIP': 'actionNavigationCloseTooltip',
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
    expect(component.usedInWorkspace).toEqual(themeResponse['workspaces'])

    expect(component.actions.length).toBe(4)
    const closeAction = component.actions.filter(
      (a) => a.label === 'actionNavigationClose' && a.title === 'actionNavigationCloseTooltip'
    )[0]
    spyOn(component, 'close')
    closeAction.actionCallback()
    expect(component.close).toHaveBeenCalledTimes(1)

    const editAction = component.actions.filter(
      (a) => a.label === 'actionEditLabel' && a.title === 'actionEditTooltip'
    )[0]
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')
    editAction.actionCallback()
    expect(router.navigate).toHaveBeenCalledOnceWith(['./edit'], jasmine.any(Object))

    const exportAction = component.actions.filter(
      (a) => a.label === 'actionExportLabel' && a.title === 'actionExportTooltip'
    )[0]
    spyOn(component, 'onExportTheme')
    exportAction.actionCallback()
    expect(component.onExportTheme).toHaveBeenCalledTimes(1)

    const deleteAction = component.actions.filter(
      (a) => a.label === 'actionDeleteLabel' && a.title === 'actionDeleteTooltip'
    )[0]
    expect(component.themeDeleteVisible).toBe(false)
    expect(component.themeDeleteMessage).toBe('')
    deleteAction.actionCallback()
    expect(component.themeDeleteVisible).toBe(true)
    expect(component.themeDeleteMessage).toBe('themeName actionDeleteThemeMessage')
  })

  it('should load prepare object details on successfull call', async () => {
    const themeResponse = {
      resource: {
        name: 'themeName',
        creationDate: 'myCreDate',
        modificationDate: 'myModDate'
      },
      workspaces: [
        {
          workspaceName: 'portal1'
        },
        {
          workspaceName: 'myPortal'
        }
      ]
    }
    themesApiSpy.getThemeByName.and.returnValue(of(themeResponse) as any)

    const translateService = TestBed.inject(TranslateService)
    const actionsTranslations = {
      'ACTIONS.NAVIGATION.CLOSE': 'actionNavigationClose',
      'ACTIONS.NAVIGATION.CLOSE.TOOLTIP': 'actionNavigationCloseTooltip',
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

    expect(component.themePortalList).toBe('myPortal, portal1')
    expect(component.objectDetails.length).toBe(3)
    const creationDate = component.objectDetails.filter(
      (detail) => detail.label === 'detailCreationDate' && detail.tooltip === 'detailTooltipsCreationDate'
    )[0]
    expect(creationDate.value).toBe('myCreDate')

    const modificationDate = component.objectDetails.filter(
      (detail) => detail.label === 'detailModificationDate' && detail.tooltip === 'detailTooltipsModificationDate'
    )[0]
    expect(modificationDate.value).toBe('myModDate')

    const workspaces = component.objectDetails.filter(
      (detail) => detail.label === 'themeWorkspaces' && detail.tooltip === 'themeTooltipsWorkspaces'
    )[0]
    expect(workspaces.value).toBe('myPortal, portal1')
  })

  it('should display not found error and close page on theme fetch failure', () => {
    spyOn(component, 'close')
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
    expect(component.close).toHaveBeenCalledTimes(1)
  })

  it('should display catched error and close page on theme fetch failure', () => {
    spyOn(component, 'close')
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
    expect(component.close).toHaveBeenCalledTimes(1)
  })

  it('should return empty string if theme has no portals', () => {
    component.theme = undefined

    const result = component.prepareUsedInPortalList()
    expect(result).toBe('')
  })

  it('should navigate back on close', () => {
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')

    component.close()

    expect(router.navigate).toHaveBeenCalledOnceWith(['./..'], jasmine.any(Object))
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

    expect(component.headerImageUrl).toBe(prepareUrl('logo123.png'))
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

    component.confirmThemeDeletion()

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

    component.confirmThemeDeletion()

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
      version: 1,
      name: 'themeName',
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
    expect(FileSaver.saveAs).toHaveBeenCalledOnceWith(jasmine.any(Blob), 'themeName_Theme.json')
  })

  it('should display error on theme export fail', () => {
    themesApiSpy.exportThemes.and.returnValue(throwError(() => new Error()))
    component.theme = {
      name: 'themeName'
    }
    component.onExportTheme()
    expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
  })
})
