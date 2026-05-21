import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute, Router, provideRouter } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { BehaviorSubject, of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { PortalMessageService, ThemeService, UserService } from '@onecx/angular-integration-interface'

import { ImagesInternalAPIService, RefType, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'

import { ThemeDetailComponent } from './theme-detail.component'

const theme: Theme = {
  id: 'themeId',
  name: 'themeName',
  displayName: 'themeDisplayName',
  logoUrl: 'path-to-logo',
  smallLogoUrl: '/path-to-small-logo',
  faviconUrl: '/path-to-favicon',
  operator: false
}

describe('ThemeDetailComponent', () => {
  let component: ThemeDetailComponent
  let fixture: ComponentFixture<ThemeDetailComponent>

  const mockUserService = { lang$: { getValue: jasmine.createSpy('getValue').and.returnValue('en') } }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error', 'info'])
  const locationSpy = jasmine.createSpyObj<Location>('Location', ['back'])
  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
    'getThemeByName',
    'getThemeById',
    'deleteTheme',
    'exportThemes',
    'createTheme',
    'updateTheme',
    'searchThemes'
  ])
  const currentTheme$ = new BehaviorSubject<any>({ name: 'currentTheme' })
  const mockThemeService = { currentTheme$: currentTheme$.asObservable() }
  const imgServiceSpy = { configuration: { basePath: '/basePath' } }

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDetailComponent],
      imports: [
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeDetailComponent }]),
        { provide: UserService, useValue: mockUserService },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: Location, useValue: locationSpy },
        { provide: ThemesAPIService, useValue: themeApiSpy },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ImagesInternalAPIService, useValue: imgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    themeApiSpy.getThemeByName.calls.reset()
    themeApiSpy.getThemeById.calls.reset()
    themeApiSpy.exportThemes.calls.reset()
    themeApiSpy.searchThemes.calls.reset()
    themeApiSpy.updateTheme.calls.reset()
    themeApiSpy.createTheme.calls.reset()
    locationSpy.back.calls.reset()
    themeApiSpy.getThemeByName.and.returnValue(of({ resource: {} }) as any)
    themeApiSpy.getThemeById.and.returnValue(of({ resource: {} }) as any)
    themeApiSpy.exportThemes.and.returnValue(of({}) as any)
    themeApiSpy.searchThemes.and.returnValue(of({ stream: [] }) as any)
    themeApiSpy.createTheme.and.returnValue(of({}) as any)
    themeApiSpy.updateTheme.and.returnValue(of({}) as any)
    mockUserService.lang$.getValue.and.returnValue('en')
    currentTheme$.next({ name: 'currentTheme' })

    initTestComponent()
  })

  describe('construction', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should use German date format', () => {
      mockUserService.lang$.getValue.and.returnValue('de')
      initTestComponent()
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })

    it('should use English date format', () => {
      mockUserService.lang$.getValue.and.returnValue('en')
      initTestComponent()
      expect(component.dateFormat).toEqual('medium')
    })

    it('should set changeMode to VIEW when name is in route', () => {
      const route = TestBed.inject(ActivatedRoute)
      spyOn(route.snapshot.paramMap, 'get').and.returnValue('someName')
      initTestComponent()
      expect(component.changeMode).toEqual('VIEW')
    })
  })

  describe('ngOnInit', () => {
    it('should call prepareDialogTranslations on init', () => {
      spyOn(component as any, 'prepareDialogTranslations')
      component.ngOnInit()

      expect(component.messages.length).toBeGreaterThan(0)
      expect(component['prepareDialogTranslations']).toHaveBeenCalled()
    })

    it('should not load theme if no themeName', () => {
      component['themeName'] = null
      themeApiSpy.getThemeByName.calls.reset()

      component['getTheme']()

      expect(themeApiSpy.getThemeByName).not.toHaveBeenCalled()
    })

    it('should re-initialize when route param changes to a new name', () => {
      const route = TestBed.inject(ActivatedRoute)
      const paramMapSubject = new BehaviorSubject(route.snapshot.paramMap)
      spyOnProperty(route, 'paramMap').and.returnValue(paramMapSubject.asObservable())
      themeApiSpy.getThemeByName.calls.reset()

      component['themeName'] = 'oldName'
      component.ngOnInit()

      // Emit a new param with a different name
      paramMapSubject.next({ get: () => 'newName', has: () => true, getAll: () => [], keys: [] } as any)

      expect(component['themeName']).toBe('newName')
      expect(themeApiSpy.getThemeByName).toHaveBeenCalled()
    })

    it('should not re-initialize when route param is the same as current themeName', () => {
      const route = TestBed.inject(ActivatedRoute)
      const paramMapSubject = new BehaviorSubject(route.snapshot.paramMap)
      spyOnProperty(route, 'paramMap').and.returnValue(paramMapSubject.asObservable())

      component['themeName'] = 'sameName'
      component.ngOnInit()
      themeApiSpy.getThemeByName.calls.reset()

      // Emit param with same name
      paramMapSubject.next({ get: () => 'sameName', has: () => true, getAll: () => [], keys: [] } as any)

      expect(themeApiSpy.getThemeByName).not.toHaveBeenCalled()
    })

    it('should not re-initialize when route param name is null', () => {
      const route = TestBed.inject(ActivatedRoute)
      const paramMapSubject = new BehaviorSubject(route.snapshot.paramMap)
      spyOnProperty(route, 'paramMap').and.returnValue(paramMapSubject.asObservable())

      component['themeName'] = 'existingName'
      component.ngOnInit()
      themeApiSpy.getThemeByName.calls.reset()

      // Emit param with null name
      paramMapSubject.next({ get: () => null, has: () => false, getAll: () => [], keys: [] } as any)

      expect(component['themeName']).toBe('existingName')
      expect(themeApiSpy.getThemeByName).not.toHaveBeenCalled()
    })
  })

  describe('getTheme', () => {
    beforeEach(() => {
      component['themeName'] = theme.name!
    })

    it('should get theme - success', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme']()

      expect(component.theme).toEqual(theme)
      expect(component.themeForProps).toEqual({ ...theme, id: undefined })
      expect(component.themeForColors).toEqual({ properties: theme.properties })
      expect(component.headerImageUrl).toBe(theme.logoUrl)
      expect(component.loading).toBeFalse()
    })

    it('should set isCurrentTheme and autoApply when theme matches current theme', () => {
      currentTheme$.next({ name: theme.name })
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme']()

      expect(component.isCurrentTheme).toBeTrue()
      expect(component.autoApply).toBeTrue()
    })

    it('should set isCurrentTheme to false when theme does not match current theme', () => {
      currentTheme$.next({ name: 'otherTheme' })
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme']()

      expect(component.isCurrentTheme).toBeFalse()
      expect(component.autoApply).toBeFalse()
    })

    it('should switch to EDIT mode when switchToEdit is true', () => {
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme'](true)

      expect(component.changeMode).toBe('EDIT')
    })

    it('should handle error when getThemeByName fails', () => {
      const errorResponse = { error: { message: 'No permissions' }, status: 403 }
      themeApiSpy.getThemeByName.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['getTheme']()

      expect(console.error).toHaveBeenCalledWith('getThemeByName', errorResponse)
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_403.THEME')
      expect(component.loading).toBeFalse()
    })

    it('should map unknown error status to 0', () => {
      const errorResponse = { status: 999 }
      themeApiSpy.getThemeByName.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['getTheme']()

      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_0.THEME')
    })
  })

  describe('initSubComponentData', () => {
    it('should set themeForProps and themeForColors from theme', () => {
      component['initSubComponentData'](theme)

      expect(component.themeForProps).toEqual({ ...theme, id: undefined })
      expect(component.themeForColors).toEqual({ properties: theme.properties })
    })

    it('should do nothing if theme is undefined', () => {
      component.themeForProps = undefined
      component.themeForColors = undefined

      component['initSubComponentData'](undefined)

      expect(component.themeForProps).toBeUndefined()
      expect(component.themeForColors).toBeUndefined()
    })
  })

  describe('getThemes', () => {
    it('should load themes successfully', (done: DoneFn) => {
      const themes = [
        { name: 'b', displayName: 'Bravo' },
        { name: 'a', displayName: 'Alpha' }
      ]
      themeApiSpy.searchThemes.and.returnValue(of({ stream: themes }) as any)

      component['getThemes']()

      component.themes$.subscribe((result) => {
        expect(result.length).toBe(2)
        expect(result[0].displayName).toBe('Alpha')
        done()
      })
    })

    it('should handle searchThemes error', (done: DoneFn) => {
      const errorResponse = { status: 500 }
      themeApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['getThemes']()

      component.themes$.subscribe((result) => {
        expect(result).toEqual([])
        expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
        expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_500.THEME')
        done()
      })
    })

    it('should return empty array when stream is undefined', (done: DoneFn) => {
      themeApiSpy.searchThemes.and.returnValue(of({ stream: undefined }) as any)

      component['getThemes']()

      component.themes$.subscribe((result) => {
        expect(result).toEqual([])
        done()
      })
    })
  })

  describe('onChangeAutoApply', () => {
    it('should set autoApply to true and show info message', () => {
      component.onChangeAutoApply(true)

      expect(component.autoApply).toBeTrue()
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'INTERNAL.AUTO_APPLY_MESSAGE' })
    })

    it('should set autoApply to false without showing info message', () => {
      component.onChangeAutoApply(false)

      expect(component.autoApply).toBeFalse()
      expect(msgServiceSpy.info).not.toHaveBeenCalled()
    })
  })

  describe('onBack', () => {
    it('should navigate back', () => {
      component.onBack()

      expect(locationSpy.back).toHaveBeenCalled()
    })
  })

  describe('onTabChange', () => {
    it('should set showOperatorMessage to false and set selectedTabIndex', () => {
      component.showOperatorMessage = true
      const event = { index: 2 }

      component.onTabChange(event, theme)

      expect(component.showOperatorMessage).toBeFalse()
      expect(component.selectedTabIndex).toBe(2)
      expect(component.themeForUse).toEqual(theme)
    })

    it('should set themeForUse when tabIndex is 2', () => {
      const event = { index: 2 }

      component.onTabChange(event, theme)

      expect(component.themeForUse).toEqual(theme)
    })

    it('should not set themeForUse when tabIndex is not 2', () => {
      component.themeForUse = undefined
      const event = { index: 1 }

      component.onTabChange(event, theme)

      expect(component.selectedTabIndex).toBe(1)
      expect(component.themeForUse).toBeUndefined()
    })

    it('should do nothing if theme is undefined', () => {
      component.showOperatorMessage = true
      const event = { index: 1 }

      component.onTabChange(event, undefined)

      expect(component.showOperatorMessage).toBeTrue()
    })
  })

  describe('Theme deletion', () => {
    it('should show delete dialog', () => {
      component.themeDeleteVisible = false

      component.onDeleteTheme(theme)

      expect(component.themeDeleteVisible).toBeTrue()
      expect(component.themeForUse).toEqual(theme)
    })

    it('should hide delete dialog', () => {
      component.themeDeleteVisible = true

      component.onThemeDeletion()

      expect(component.themeDeleteVisible).toBeFalse()
    })
  })

  describe('Theme export', () => {
    it('should save file on theme export', () => {
      spyOn(JSON, 'stringify').and.returnValue('themejson')
      spyOn(FileSaver, 'saveAs')
      const exportTheme: Theme = {
        id: 'id',
        name: 'themeName',
        displayName: 'Theme',
        logoUrl: 'url'
      }
      const exportResponse = {
        themes: {
          themeName: {
            version: 1,
            logoUrl: exportTheme.logoUrl
          }
        }
      }
      themeApiSpy.exportThemes.and.returnValue(of(exportResponse) as any)

      component.onExportTheme(exportTheme)

      expect(themeApiSpy.exportThemes).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ exportThemeRequest: { names: [exportTheme.name] } })
      )
      expect(JSON.stringify).toHaveBeenCalledOnceWith(jasmine.objectContaining(exportResponse), null, 2)
      expect(FileSaver.saveAs).toHaveBeenCalledOnceWith(
        jasmine.any(Blob),
        `onecx-theme_${exportTheme.name}_${Utils.getCurrentDateTime()}.json`
      )
    })

    it('should display error on theme export fail', () => {
      const errorResponse = { error: 'Error on exporting theme', status: 400 }
      themeApiSpy.exportThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onExportTheme(theme)

      expect(console.error).toHaveBeenCalledWith('exportThemes', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
    })

    it('should not export if theme has no name', () => {
      component.onExportTheme({})

      expect(themeApiSpy.exportThemes).not.toHaveBeenCalled()
    })
  })

  describe('prepareHeaderUrl', () => {
    it('should set headerImageUrl to logoUrl when present', () => {
      component.prepareHeaderUrl(theme)

      expect(component.headerImageUrl).toBe(theme.logoUrl)
    })

    it('should set headerImageUrl to bffImageUrl when no logoUrl', () => {
      component.prepareHeaderUrl({ ...theme, logoUrl: undefined })

      expect(component.headerImageUrl).toBe(Utils.bffImageUrl(component.imageBasePath, theme.name, RefType.Logo))
    })

    it('should do nothing if theme is undefined', () => {
      component.headerImageUrl = 'previous'

      component.prepareHeaderUrl(undefined)

      expect(component.headerImageUrl).toBe('previous')
    })
  })

  describe('preparePageActions', () => {
    it('should create 8 actions', (done: DoneFn) => {
      component.preparePageActions(true, theme)

      component.actions$.subscribe((actions) => {
        expect(actions.length).toBe(8)
        done()
      })
    })

    it('should set isThemeUsedByWorkspace', () => {
      component.preparePageActions(true, theme)
      expect(component.isThemeUsedByWorkspace).toBeTrue()

      component.preparePageActions(false, theme)
      expect(component.isThemeUsedByWorkspace).toBeFalse()
    })

    it('should show back, export, edit, delete in VIEW mode', (done: DoneFn) => {
      component.changeMode = 'VIEW'
      component.theme = theme // needed for save_as_on_view condition (this.theme !== undefined)
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const back = actions.find((a) => a.id === 'th_detail_page_action_back')
        const exportAction = actions.find((a) => a.id === 'th_detail_page_action_export')
        const edit = actions.find((a) => a.id === 'th_detail_page_action_edit')
        const deleteAction = actions.find((a) => a.id === 'th_detail_page_action_delete')
        const cancel = actions.find((a) => a.id === 'th_detail_page_action_cancel')
        const save = actions.find((a) => a.id === 'th_detail_page_action_save')
        const saveAsOnView = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_view')
        const saveAsOnEdit = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_edit')
        expect(back!.showCondition).toBeTrue()
        expect(exportAction!.showCondition).toBeTrue()
        expect(edit!.showCondition).toBeTrue()
        expect(deleteAction!.showCondition).toBeTrue()
        expect(cancel!.showCondition).toBeFalse()
        expect(save!.showCondition).toBeFalse()
        // save_as_on_edit: shown in EDIT/CREATE — hidden in VIEW
        expect(saveAsOnEdit!.showCondition).toBeFalse()
        // save_as_on_view: shown in VIEW when this.theme is set
        expect(saveAsOnView!.showCondition).toBeTrue()
        done()
      })
    })

    it('should show cancel, save in EDIT mode', (done: DoneFn) => {
      component.changeMode = 'EDIT'
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const cancel = actions.find((a) => a.id === 'th_detail_page_action_cancel')
        const save = actions.find((a) => a.id === 'th_detail_page_action_save')
        const back = actions.find((a) => a.id === 'th_detail_page_action_back')
        const saveAsOnEdit = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_edit')
        const saveAsOnView = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_view')
        expect(cancel!.showCondition).toBeTrue()
        expect(save!.showCondition).toBeTrue()
        expect(back!.showCondition).toBeFalse()
        // save_as_on_edit: shown in EDIT/CREATE
        expect(saveAsOnEdit!.showCondition).toBeTrue()
        // save_as_on_view: hidden in EDIT (this.theme may or may not be set, but mode isn't VIEW)
        expect(saveAsOnView!.showCondition).toBeFalse()
        done()
      })
    })

    it('should hide delete when theme is undefined', (done: DoneFn) => {
      component.changeMode = 'VIEW'
      component.preparePageActions(false, undefined)

      component.actions$.subscribe((actions) => {
        const deleteAction = actions.find((a) => a.id === 'th_detail_page_action_delete')
        expect(deleteAction!.showCondition).toBeFalse()
        done()
      })
    })

    it('should trigger onBack callback', (done: DoneFn) => {
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const back = actions.find((a) => a.id === 'th_detail_page_action_back')
        back!.actionCallback()
        expect(locationSpy.back).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger onExportTheme callback', (done: DoneFn) => {
      spyOn(component, 'onExportTheme')
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const exportAction = actions.find((a) => a.id === 'th_detail_page_action_export')
        exportAction!.actionCallback()
        expect(component.onExportTheme).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger onDeleteTheme callback', (done: DoneFn) => {
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const deleteAction = actions.find((a) => a.id === 'th_detail_page_action_delete')
        deleteAction!.actionCallback()
        expect(component.themeDeleteVisible).toBeTrue()
        done()
      })
    })

    it('should trigger edit action callback', (done: DoneFn) => {
      component['themeName'] = theme.name!
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
      component.changeMode = 'VIEW'
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const editAction = actions.find((a) => a.id === 'th_detail_page_action_edit')
        editAction!.actionCallback()
        expect(component.changeMode).toBe('EDIT')
        done()
      })
    })

    it('should trigger cancel action callback', (done: DoneFn) => {
      component.changeMode = 'EDIT'
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const cancelAction = actions.find((a) => a.id === 'th_detail_page_action_cancel')
        cancelAction!.actionCallback()
        expect(component.changeMode).toBe('VIEW')
        done()
      })
      expect().nothing() // to satisfy linter about no expectations in subscribe block
    })

    it('should trigger save action callback', (done: DoneFn) => {
      component.changeMode = 'EDIT'
      component.ThemePropsComponent = {
        onUpdateTheme: () => false,
        theme: undefined
      } as any
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const saveAction = actions.find((a) => a.id === 'th_detail_page_action_save')
        saveAction!.actionCallback()
        done()
      })
      expect().nothing() // to satisfy linter about no expectations in subscribe block
    })

    it('should trigger save_as callback in EDIT/CREATE mode', (done: DoneFn) => {
      spyOn(component, 'onSaveAs')
      component.changeMode = 'EDIT'
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const saveAsOnEdit = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_edit')
        saveAsOnEdit!.actionCallback()
        expect(component.onSaveAs).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger save_as callback in VIEW mode (overflow)', (done: DoneFn) => {
      spyOn(component, 'onSaveAs')
      component.changeMode = 'VIEW'
      component.theme = theme
      component.preparePageActions(false, theme)

      component.actions$.subscribe((actions) => {
        const saveAsOnView = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_view')
        saveAsOnView!.actionCallback()
        expect(component.onSaveAs).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('onChangeMode', () => {
    beforeEach(() => {
      component['themeName'] = theme.name!
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
    })

    it('should switch to VIEW mode when forcedMode is view', () => {
      spyOn(component as any, 'preparePageActions')

      component['onChangeMode']('view', theme)

      expect(component.changeMode).toBe('VIEW')
      expect(component['preparePageActions']).toHaveBeenCalled()
    })

    it('should toggle to EDIT and call getTheme', () => {
      spyOn(component as any, 'getTheme')
      spyOn(component as any, 'getThemes')

      component['onChangeMode']('edit', theme)

      expect(component['getTheme']).toHaveBeenCalledWith(true)
      expect(component['getThemes']).toHaveBeenCalled()
    })
  })

  describe('onUpdateTheme', () => {
    let mockThemePropsComponent: any
    let mockThemeColorsComponent: any

    beforeEach(() => {
      mockThemePropsComponent = {
        onUpdateTheme: jasmine.createSpy('onUpdateTheme').and.returnValue(true),
        theme: { ...theme, properties: {} }
      }
      mockThemeColorsComponent = {
        onUpdateTheme: jasmine.createSpy('onUpdateTheme').and.returnValue(true),
        theme: { properties: { primary: '#fff' } }
      }
      component.ThemePropsComponent = mockThemePropsComponent
      component.ThemeColorsComponent = mockThemeColorsComponent
      component['themeName'] = theme.name!
      component.theme = { ...theme, id: 'themeId', modificationCount: 1 }
    })

    it('should call updateTheme on save with valid forms', (done: DoneFn) => {
      const updatedTheme = { ...theme, id: 'themeId' }
      themeApiSpy.updateTheme.and.returnValue(of({ resource: updatedTheme }) as any)
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['onUpdateTheme']()

      expect(mockThemePropsComponent.onUpdateTheme).toHaveBeenCalled()
      expect(mockThemeColorsComponent.onUpdateTheme).toHaveBeenCalled()
      expect(themeApiSpy.updateTheme).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'themeId' }))
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
      // subscribe to theme$ to cover the Observable subscriber
      component.theme$!.subscribe((data) => {
        expect(data).toEqual(updatedTheme)
        done()
      })
    })

    it('should not proceed if ThemePropsComponent.onUpdateTheme returns false', () => {
      mockThemePropsComponent.onUpdateTheme.and.returnValue(false)

      component['onUpdateTheme']()

      expect(mockThemeColorsComponent.onUpdateTheme).not.toHaveBeenCalled()
      expect(themeApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should not proceed if themeData is undefined', () => {
      mockThemePropsComponent.theme = undefined

      component['onUpdateTheme']()

      expect(themeApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should not proceed if ThemeColorsComponent.onUpdateTheme returns false', () => {
      mockThemeColorsComponent.onUpdateTheme.and.returnValue(false)

      component['onUpdateTheme']()

      expect(themeApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should handle updateTheme error', () => {
      const errorResponse = { status: 400 }
      themeApiSpy.updateTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['onUpdateTheme']()

      expect(console.error).toHaveBeenCalledWith('updateTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
    })

    it('should clear empty URL strings', () => {
      mockThemePropsComponent.theme = { ...theme, id: 'themeId', logoUrl: '', smallLogoUrl: '', faviconUrl: '' }
      themeApiSpy.updateTheme.and.returnValue(of({ resource: theme }) as any)
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['onUpdateTheme']()

      const callArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(callArgs.updateThemeRequest!.resource.logoUrl).toBeUndefined()
      expect(callArgs.updateThemeRequest!.resource.smallLogoUrl).toBeUndefined()
      expect(callArgs.updateThemeRequest!.resource.faviconUrl).toBeUndefined()
    })

    it('should not call updateTheme when component theme has no id', () => {
      component.theme = { ...theme, id: undefined }

      component['onUpdateTheme']()

      expect(themeApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should initialize properties if undefined', () => {
      mockThemePropsComponent.theme = { ...theme, id: 'themeId', properties: undefined }
      themeApiSpy.updateTheme.and.returnValue(of({ resource: theme }) as any)
      themeApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['onUpdateTheme']()

      const callArgs = themeApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(callArgs.updateThemeRequest!.resource.properties).toBeDefined()
    })
  })

  describe('useThemeAsTemplate', () => {
    it('should load theme by id and set themeForColors', () => {
      const templateTheme = { name: 'template', displayName: 'Template', properties: { color: 'red' } }
      themeApiSpy.getThemeById.and.returnValue(of({ resource: templateTheme }) as any)
      spyOn(console, 'log')

      component.useThemeAsTemplate({ id: '123' })

      expect(themeApiSpy.getThemeById).toHaveBeenCalledWith({ id: '123' })
      expect(component.themeForColors).toEqual(templateTheme as any)
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'THEME.TEMPLATE.CONFIRMATION.OK' })
    })

    it('should use component theme name in EDIT mode', () => {
      const templateTheme = { name: 'template', displayName: 'Template', properties: {} }
      themeApiSpy.getThemeById.and.returnValue(of({ resource: templateTheme }) as any)
      component.changeMode = 'EDIT'
      component.theme = { name: 'original' }
      spyOn(console, 'log')

      component.useThemeAsTemplate({ id: '123', 'ACTIONS.COPY_OF': 'Copy of ' })

      expect(component.themeForProps!.name).toBe('original')
    })
  })

  describe('prepareDialogTranslations', () => {
    it('should populate messages with translation data', () => {
      component['prepareDialogTranslations']()

      expect(component.messages.length).toBe(1)
      expect(component.messages[0].severity).toBe('warn')
      expect(component.messages[0].id).toBe('ws_detail_operator_message')
    })
  })

  describe('onSaveAs', () => {
    const copyOfPrefix = 'Copy of '

    it('should set themeForCreation and open dialog in VIEW mode', () => {
      component.changeMode = 'VIEW'
      component.theme = theme

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible).toBeTrue()
      expect(component.themeForCreation).toBeDefined()
      expect(component.themeForCreation!.name).toBe(copyOfPrefix + theme.name)
      expect(component.themeForCreation!.displayName).toBe(copyOfPrefix + theme.displayName)
    })

    it('should reset metadata fields on themeForCreation', () => {
      component.changeMode = 'VIEW'
      component.theme = theme

      component.onSaveAs(copyOfPrefix)

      expect(component.themeForCreation!.id).toBeUndefined()
      expect(component.themeForCreation!.operator).toBeUndefined()
      expect(component.themeForCreation!.modificationCount).toBeUndefined()
    })

    it('should not open dialog if theme is undefined in VIEW mode', () => {
      component.changeMode = 'VIEW'
      component.theme = undefined

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible).toBeFalse()
    })

    it('should use sub-component data in EDIT mode', () => {
      component.changeMode = 'EDIT'
      component.ThemePropsComponent = {
        onUpdateTheme: jasmine.createSpy().and.returnValue(true),
        theme: { ...theme, properties: {} }
      } as any
      component.ThemeColorsComponent = {
        onUpdateTheme: jasmine.createSpy().and.returnValue(true),
        theme: { properties: {} }
      } as any
      component.theme = { ...theme, modificationCount: 2 }

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible).toBeTrue()
      expect(component.themeForCreation!.name).toBe(copyOfPrefix + theme.name)
    })

    it('should not open dialog if sub-component data is invalid in EDIT mode', () => {
      component.changeMode = 'EDIT'
      component.ThemePropsComponent = {
        onUpdateTheme: jasmine.createSpy().and.returnValue(false),
        theme: undefined
      } as any
      component.ThemeColorsComponent = {
        onUpdateTheme: jasmine.createSpy().and.returnValue(true),
        theme: { properties: {} }
      } as any

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible).toBeFalse()
    })
  })

  describe('onThemeCreated', () => {
    it('should close dialog, clear themeForCreation and navigate', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      component.themeCreateVisible = true
      component.themeForCreation = theme

      component.onThemeCreated({ name: 'newTheme' })

      expect(component.themeCreateVisible).toBeFalse()
      expect(component.themeForCreation).toBeUndefined()
      expect(router.navigate).toHaveBeenCalledWith(['../newTheme'], jasmine.any(Object))
    })
  })

  describe('onHideCreateDialog', () => {
    it('should close dialog and clear themeForCreation when visible is false', () => {
      component.themeCreateVisible = true
      component.themeForCreation = theme

      component.onHideCreateDialog(false)

      expect(component.themeCreateVisible).toBeFalse()
      expect(component.themeForCreation).toBeUndefined()
    })

    it('should do nothing when visible is true', () => {
      component.themeCreateVisible = true
      component.themeForCreation = theme

      component.onHideCreateDialog(true)

      expect(component.themeCreateVisible).toBeTrue()
      expect(component.themeForCreation).toEqual(theme)
    })
  })
})
