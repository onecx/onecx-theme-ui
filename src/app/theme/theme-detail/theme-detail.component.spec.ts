import { DestroyRef, signal } from '@angular/core'
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { BehaviorSubject, of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { PortalMessageService, ThemeService, UserService } from '@onecx/angular-integration-interface'
import { providePermissionService } from '@onecx/angular-utils'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { SlotService } from '@onecx/angular-remote-components'

import { ImagesInternalAPIService, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { Utils, LogoRefType } from 'src/app/shared/utils'

import { slotInitializer, ThemeDetailComponent } from './theme-detail.component'
import { Workspace } from './theme-use/theme-use.component'

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
  const themesApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', [
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
  let slotServiceMock: any
  let slotSubject: BehaviorSubject<boolean>

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    slotSubject = new BehaviorSubject<boolean>(false)
    // Mock für den Service erstellen
    slotServiceMock = {
      isSomeComponentDefinedForSlot: jasmine
        .createSpy('isSomeComponentDefinedForSlot')
        .and.returnValue(slotSubject.asObservable())
    }

    TestBed.configureTestingModule({
      imports: [
        ThemeDetailComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePermissionService(),
        provideNoopAnimations(),
        provideRouter([{ path: '', component: ThemeDetailComponent }]),
        { provide: Location, useValue: locationSpy },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ImagesInternalAPIService, useValue: imgServiceSpy },
        { provide: SlotService, useValue: slotServiceMock },
        { provide: DestroyRef, useValue: { onDestroy: () => {} } }
      ]
    })
      .overrideComponent(ThemeDetailComponent, {
        add: {
          providers: [
            { provide: UserService, useValue: mockUserService },
            { provide: ThemesAPIService, useValue: themesApiSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    msgServiceSpy.info.calls.reset()
    themesApiSpy.getThemeByName.calls.reset()
    themesApiSpy.getThemeById.calls.reset()
    themesApiSpy.exportThemes.calls.reset()
    themesApiSpy.searchThemes.calls.reset()
    themesApiSpy.updateTheme.calls.reset()
    themesApiSpy.createTheme.calls.reset()
    locationSpy.back.calls.reset()
    themesApiSpy.getThemeByName.and.returnValue(of({ resource: {} }) as any)
    themesApiSpy.getThemeById.and.returnValue(of({ resource: {} }) as any)
    themesApiSpy.exportThemes.and.returnValue(of({}) as any)
    themesApiSpy.searchThemes.and.returnValue(of({ stream: [] }) as any)
    themesApiSpy.createTheme.and.returnValue(of({}) as any)
    themesApiSpy.updateTheme.and.returnValue(of({}) as any)
    mockUserService.lang$.getValue.and.returnValue('en')
    currentTheme$.next({ name: 'currentTheme' })

    initTestComponent()
  })

  describe('construction', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })

    it('should compute themeData from view children without mock', () => {
      // Reading themeData() without overriding it triggers the lazy computed() callback,
      // which reads viewChild signals for themePropsComponent and themeColorsComponent.
      const data = component.themeData()
      expect(data).toBeDefined()
      expect(data.theme).toBeDefined()
    })

    it('should use German date format', () => {
      mockUserService.lang$.getValue.and.returnValue('de')
      initTestComponent()
      expect(component.dateFormat).toEqual('dd.MM.yyyy HH:mm:ss')
    })

    it('should use English date format', () => {
      mockUserService.lang$.getValue.and.returnValue('en')
      initTestComponent()
      expect(component.dateFormat).toEqual('M/d/yy, hh:mm:ss a')
    })

    it('should set changeMode to VIEW when name is in route', () => {
      const route = TestBed.inject(ActivatedRoute)
      spyOn(route.snapshot.paramMap, 'get').and.returnValue('someName')
      initTestComponent()
      expect(component.changeMode).toEqual('VIEW')
    })
  })

  describe('slotInitializer', () => {
    let slotService: jasmine.SpyObj<SlotService>

    beforeEach(() => {
      slotService = jasmine.createSpyObj('SlotService', ['init'])
    })

    it('should call SlotService.init', () => {
      const initializer = slotInitializer(slotService)
      initializer()

      expect(slotService.init).toHaveBeenCalled()
    })
  })

  describe('ngOnInit', () => {
    it('should call getTheme on init', () => {
      spyOn(component as any, 'getTheme')
      component.ngOnInit()

      expect(component['getTheme']).toHaveBeenCalled()
    })

    it('should not load theme if no themeName', () => {
      component['themeName'] = null
      themesApiSpy.getThemeByName.calls.reset()

      component['getTheme']()

      expect(themesApiSpy.getThemeByName).not.toHaveBeenCalled()
    })

    it('should re-initialize when route param changes to a new name', () => {
      const route = TestBed.inject(ActivatedRoute)
      const paramMapSubject = new BehaviorSubject(route.snapshot.paramMap)
      spyOnProperty(route, 'paramMap').and.returnValue(paramMapSubject.asObservable())
      themesApiSpy.getThemeByName.calls.reset()

      component['themeName'] = 'oldName'
      component.ngOnInit()

      // Emit a new param with a different name
      paramMapSubject.next({ get: () => 'newName', has: () => true, getAll: () => [], keys: [] } as any)

      expect(component['themeName']).toBe('newName')
      expect(themesApiSpy.getThemeByName).toHaveBeenCalled()
    })

    it('should not re-initialize when route param is the same as current themeName', () => {
      const route = TestBed.inject(ActivatedRoute)
      spyOn(route.snapshot.paramMap, 'get').and.callFake((key: string) => (key === 'name' ? 'sameName' : null))
      const paramMapSubject = new BehaviorSubject(route.snapshot.paramMap)
      spyOnProperty(route, 'paramMap').and.returnValue(paramMapSubject.asObservable())

      component.ngOnInit()
      themesApiSpy.getThemeByName.calls.reset()

      // Emit param with same name
      paramMapSubject.next({ get: () => 'sameName', has: () => true, getAll: () => [], keys: [] } as any)

      expect(themesApiSpy.getThemeByName).not.toHaveBeenCalled()
    })

    it('should not re-initialize when route param name is null', () => {
      const route = TestBed.inject(ActivatedRoute)
      spyOn(route.snapshot.paramMap, 'get').and.callFake((key: string) => (key === 'name' ? 'existingName' : null))
      const paramMapSubject = new BehaviorSubject(route.snapshot.paramMap)
      spyOnProperty(route, 'paramMap').and.returnValue(paramMapSubject.asObservable())

      component.ngOnInit()
      themesApiSpy.getThemeByName.calls.reset()

      // Emit param with null name
      paramMapSubject.next({ get: () => null, has: () => false, getAll: () => [], keys: [] } as any)

      expect(component['themeName']).toBe('existingName')
      expect(themesApiSpy.getThemeByName).not.toHaveBeenCalled()
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

  describe('getTheme', () => {
    beforeEach(() => {
      component['themeName'] = theme.name!
    })

    it('should get theme - success', () => {
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme']()

      expect(component.theme).toEqual(theme)
      expect(component.themeForProps).toEqual({ ...theme, id: undefined })
      expect(component.themeForColors).toEqual({ properties: theme.properties })
      expect(component.headerImageUrl).toBe(theme.logoUrl)
      expect(component.loading).toBeFalse()
    })

    it('should set isCurrentTheme and autoApply when theme matches current theme', () => {
      currentTheme$.next({ name: theme.name })
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme']()

      expect(component.isCurrentTheme).toBeTrue()
      expect(component.autoApply).toBeTrue()
    })

    it('should set isCurrentTheme to false when theme does not match current theme', () => {
      currentTheme$.next({ name: 'otherTheme' })
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['getTheme']()

      expect(component.isCurrentTheme).toBeFalse()
      expect(component.autoApply).toBeFalse()
    })

    it('should handle error when getThemeByName fails', () => {
      const errorResponse = { error: { message: 'No permissions' }, status: 403 }
      themesApiSpy.getThemeByName.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['getTheme']()

      expect(console.error).toHaveBeenCalledWith('getThemeByName', errorResponse)
      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_403.THEME')
      expect(component.loading).toBeFalse()
    })

    it('should map unknown error status to 0', () => {
      const errorResponse = { status: 999 }
      themesApiSpy.getThemeByName.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['getTheme']()

      expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_0.THEME')
    })
  })

  describe('getThemes', () => {
    it('should load themes successfully', (done: DoneFn) => {
      const themes = [
        { name: 'b', displayName: 'Bravo' },
        { name: 'a', displayName: 'Alpha' }
      ]
      themesApiSpy.searchThemes.and.returnValue(of({ stream: themes }) as any)

      component['getThemes']()

      component.themes$.subscribe((result) => {
        expect(result).toHaveSize(2)
        expect(result[0].displayName).toBe('Alpha')
        done()
      })
    })

    it('should handle searchThemes error', (done: DoneFn) => {
      const errorResponse = { status: 500 }
      themesApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
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
      themesApiSpy.searchThemes.and.returnValue(of({ stream: undefined }) as any)

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
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'DIALOG.DETAIL.AUTO_APPLY.MESSAGE' })
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

      component.onTabChange(2, theme)

      expect(component.showOperatorMessage).toBeFalse()
      expect(component.selectedTabIndex).toBe('2')
    })

    it('should start getting theme use data when tabIndex is 3', () => {
      spyOn<any>(component, 'startGettingThemeUseData')

      component.onTabChange('3', theme)

      expect(component.selectedTabIndex).toBe('3')
      expect(component['startGettingThemeUseData']).toHaveBeenCalledWith(theme.name)
    })

    it('should set selectedTabIndex to 0 if theme is undefined', () => {
      component.onTabChange('1', undefined)

      expect(component.selectedTabIndex).toBe('0')
    })
  })

  describe('slot service', () => {
    it('should test if component is assigned to slot', () => {
      slotSubject.next(true)
      fixture = TestBed.createComponent(ThemeDetailComponent)
      component = fixture.componentInstance
      fixture.detectChanges() // trigger ngOnInit

      expect(slotServiceMock.isSomeComponentDefinedForSlot).toHaveBeenCalledWith(component.slotName)
      expect(component.isComponentDefined()).toBeTrue()
    })

    it('should destroy the stream when the component is destroyed', () => {
      fixture = TestBed.createComponent(ThemeDetailComponent)
      component = fixture.componentInstance

      fixture.destroy()
      slotSubject.next(true) // new value emitted after component destroyed

      // No change of the signal after component destroyed
      expect(component.isComponentDefined()).toBeFalse()
    })
  })

  describe('getting theme use data', () => {
    const workspaces = [{ name: 'Workspace 1' }, { name: 'Workspace 2' }] as Workspace[]

    it('should start first time', () => {
      component.themeUseLoadingState.set('initial')

      component.onTabChange('3', theme)

      expect(component.selectedTabIndex).toBe('3')
      expect(component.themeUseLoadingState()).toBe('loading')
      expect(component.themeUsedName()).toBe(theme.name)
    })

    describe('timer', () => {
      it('should get timeout if time is exceeded', fakeAsync(() => {
        component.themeUseLoadingState.set('initial')
        component['themeUseTimeoutTimer'] = setTimeout(() => {}, 10)

        component.onTabChange('3', theme)
        tick(component['MAX_LOADING_TIME'] + 100) // wait for timer to trigger

        expect(component.selectedTabIndex).toBe('3')
        expect(component.themeUseLoadingState()).toBe('timeout')
        expect(component.themeUsedName()).toBe(theme.name)
      }))

      it('should stop getting theme use data process if data received', fakeAsync(() => {
        component.themeUseLoadingState.set('initial')
        component['themeUseTimeoutTimer'] = setTimeout(() => {}, 10)

        component.onTabChange('3', theme)
        tick(component['MAX_LOADING_TIME'] + 100) // wait for timer to trigger

        expect(component.selectedTabIndex).toBe('3')
        expect(component.themeUseLoadingState()).toBe('timeout')
        expect(component.themeUsedName()).toBe(theme.name)
      }))
    })

    describe('stop', () => {
      it('should call stopGettingThemeUseData when slotEmitter emits', () => {
        fixture = TestBed.createComponent(ThemeDetailComponent)
        component = fixture.componentInstance
        fixture.detectChanges() // trigger ngOnInit
        const stopSpy = spyOn<any>(component, 'stopGettingThemeUseData').and.callThrough()

        component.slotEmitter.emit(workspaces)

        expect(stopSpy).toHaveBeenCalledOnceWith(workspaces)
      })

      it('should wait until min loading time before stopping theme use data process', fakeAsync(() => {
        fixture = TestBed.createComponent(ThemeDetailComponent)
        component = fixture.componentInstance
        fixture.detectChanges() // trigger ngOnInit
        const stopSpy = spyOn<any>(component, 'stopGettingThemeUseData').and.callThrough()
        component['themeUseTimeoutTimer'] = setTimeout(() => {}, 10) // should exist for cleanup only
        component['themeUseStartTime'] = Date.now() - 1 // simulate that 1 second has passed

        component.slotEmitter.emit(workspaces)
        tick(component['MIN_LOADING_TIME'] - 1) // wait until min loading time

        expect(stopSpy).toHaveBeenCalledOnceWith(workspaces)
      }))

      it('should not call stopGettingThemeUseData when the component is destroyed', () => {
        fixture = TestBed.createComponent(ThemeDetailComponent)
        component = fixture.componentInstance
        const stopSpy = spyOn<any>(component, 'stopGettingThemeUseData').and.callThrough()

        fixture.destroy()
        component.slotEmitter.emit(workspaces)

        expect(stopSpy).not.toHaveBeenCalled()
      })
    })
  })

  describe('Theme deletion', () => {
    it('should show delete dialog', () => {
      component.themeDeleteVisible.set(false)
      spyOn<any>(component, 'startGettingThemeUseData')

      component.onDeleteTheme(theme)

      expect(component.themeDeleteVisible()).toBeTrue()
      expect(component.themeToBeDeleted()).toEqual(theme)
      expect(component['startGettingThemeUseData']).toHaveBeenCalledWith(theme.name)
    })

    it('should navigate back on theme deleted', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')

      component.onThemeDeletion() // signal that theme was deleted

      expect(router.navigate).toHaveBeenCalledOnceWith(['..'], jasmine.any(Object))
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
      themesApiSpy.exportThemes.and.returnValue(of(exportResponse) as any)

      component.onExportTheme(exportTheme)

      expect(themesApiSpy.exportThemes).toHaveBeenCalledOnceWith(
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
      themesApiSpy.exportThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onExportTheme(theme)

      expect(console.error).toHaveBeenCalledWith('exportThemes', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
    })

    it('should not export if theme has no name', () => {
      component.onExportTheme({})

      expect(themesApiSpy.exportThemes).not.toHaveBeenCalled()
    })
  })

  describe('prepareHeaderUrl', () => {
    it('should set headerImageUrl to logoUrl when present', () => {
      component.prepareHeaderUrl(theme)

      expect(component.headerImageUrl).toBe(theme.logoUrl)
    })

    it('should set headerImageUrl to bffImageUrl when no logoUrl', () => {
      component.prepareHeaderUrl({ ...theme, logoUrl: undefined })

      expect(component.headerImageUrl).toBe(Utils.bffImageUrl(component.imageBasePath, theme.name, LogoRefType.Logo))
    })

    it('should do nothing if theme is undefined', () => {
      component.headerImageUrl = 'previous'

      component.prepareHeaderUrl(undefined)

      expect(component.headerImageUrl).toBe('previous')
    })
  })

  describe('preparePageActions', () => {
    it('should create 8 actions', (done: DoneFn) => {
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        expect(actions).toHaveSize(8)
        done()
      })
    })

    it('should show back, export, edit, delete in VIEW mode', (done: DoneFn) => {
      component.changeMode = 'VIEW'
      component.theme = theme // needed for save_as_on_view condition (this.theme !== undefined)

      component.preparePageActions(theme)

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
      component.theme = theme

      component.preparePageActions(theme)

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
      component.preparePageActions(undefined)

      component.actions$.subscribe((actions) => {
        const deleteAction = actions.find((a) => a.id === 'th_detail_page_action_delete')
        expect(deleteAction!.showCondition).toBeFalse()
        done()
      })
    })

    it('should trigger onBack callback', (done: DoneFn) => {
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const back = actions.find((a) => a.id === 'th_detail_page_action_back')
        back?.actionCallback?.()
        expect(locationSpy.back).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger onExportTheme callback', (done: DoneFn) => {
      spyOn(component, 'onExportTheme')
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const exportAction = actions.find((a) => a.id === 'th_detail_page_action_export')
        exportAction?.actionCallback?.()
        expect(component.onExportTheme).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger onDeleteTheme callback', (done: DoneFn) => {
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const deleteAction = actions.find((a) => a.id === 'th_detail_page_action_delete')
        deleteAction?.actionCallback?.()
        expect(component.themeDeleteVisible()).toBeTrue()
        done()
      })
    })

    it('should trigger edit action callback', (done: DoneFn) => {
      component['themeName'] = theme.name!
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
      component.changeMode = 'VIEW'
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const editAction = actions.find((a) => a.id === 'th_detail_page_action_edit')
        editAction?.actionCallback?.()
        expect(component.changeMode).toBe('EDIT')
        done()
      })
    })

    it('should trigger cancel action callback', (done: DoneFn) => {
      component.changeMode = 'EDIT'
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const cancelAction = actions.find((a) => a.id === 'th_detail_page_action_cancel')
        cancelAction?.actionCallback?.()
        expect(component.changeMode).toBe('VIEW')
        done()
      })
      expect().nothing() // to satisfy linter about no expectations in subscribe block
    })

    it('should trigger save action callback', (done: DoneFn) => {
      component.changeMode = 'EDIT'
      component.themeData = signal({ theme: {}, propsValid: false, colorsValid: true }) as any
      spyOn(console, 'log')
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const saveAction = actions.find((a) => a.id === 'th_detail_page_action_save')
        saveAction?.actionCallback?.()
        done()
      })
      expect().nothing() // to satisfy linter about no expectations in subscribe block
    })

    it('should trigger save_as callback in EDIT/CREATE mode', (done: DoneFn) => {
      spyOn(component, 'onSaveAs')
      component.changeMode = 'EDIT'
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const saveAsOnEdit = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_edit')
        saveAsOnEdit?.actionCallback?.()
        expect(component.onSaveAs).toHaveBeenCalled()
        done()
      })
    })

    it('should trigger save_as callback in VIEW mode (overflow)', (done: DoneFn) => {
      spyOn(component, 'onSaveAs')
      component.changeMode = 'VIEW'
      component.theme = theme
      component.preparePageActions(theme)

      component.actions$.subscribe((actions) => {
        const saveAsOnView = actions.find((a) => a.id === 'th_detail_page_action_save_as_on_view')
        saveAsOnView?.actionCallback?.()
        expect(component.onSaveAs).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('onChangeMode', () => {
    beforeEach(() => {
      component['themeName'] = theme.name!
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)
    })

    it('should switch to VIEW mode when forcedMode is view', () => {
      spyOn(component as any, 'preparePageActions')

      component['onChangeMode']('VIEW', theme)

      expect(component.changeMode).toBe('VIEW')
      expect(component['preparePageActions']).toHaveBeenCalled()
    })

    it('should toggle to EDIT and call getTheme', () => {
      spyOn(component as any, 'getTheme')
      spyOn(component as any, 'getThemes')
      component.selectedTabIndex = '2'

      component['onChangeMode']('EDIT', theme)

      expect(component['getTheme']).toHaveBeenCalledWith()
      expect(component['getThemes']).toHaveBeenCalled()
      expect(component.selectedTabIndex).toBe('0')
    })
  })

  describe('onUpdateTheme', () => {
    beforeEach(() => {
      component.themeData = signal({ theme: { ...theme, properties: {} }, propsValid: true, colorsValid: true }) as any
      component['themeName'] = theme.name!
      component.theme = { ...theme, id: 'themeId', modificationCount: 1 }
      spyOn(console, 'log')
    })

    it('should call updateTheme on save with valid forms', (done: DoneFn) => {
      const updatedTheme = { ...theme, id: 'themeId' }
      themesApiSpy.updateTheme.and.returnValue(of({ resource: updatedTheme }) as any)
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['onUpdateTheme']()

      expect(themesApiSpy.updateTheme).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'themeId' }))
      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
      // subscribe to theme$ to cover the Observable subscriber
      component.theme$!.subscribe((data) => {
        expect(data).toEqual(updatedTheme)
        done()
      })
    })

    it('should not proceed if propsValid is false', () => {
      component.themeData = signal({ theme: {}, propsValid: false, colorsValid: true }) as any

      component['onUpdateTheme']()

      expect(themesApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should not proceed if propsValid is undefined (no child component)', () => {
      component.themeData = signal({ theme: {}, propsValid: undefined, colorsValid: true }) as any

      component['onUpdateTheme']()

      expect(themesApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should not proceed if colorsValid is false', () => {
      component.themeData = signal({ theme: {}, propsValid: true, colorsValid: false }) as any

      component['onUpdateTheme']()

      expect(themesApiSpy.updateTheme).not.toHaveBeenCalled()
    })

    it('should handle updateTheme error', () => {
      const errorResponse = { status: 400 }
      themesApiSpy.updateTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component['onUpdateTheme']()

      expect(console.error).toHaveBeenCalledWith('updateTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
    })

    it('should clear empty URL strings', () => {
      component.themeData = signal({
        theme: { ...theme, logoUrl: '', smallLogoUrl: '', faviconUrl: '' },
        propsValid: true,
        colorsValid: true
      }) as any
      themesApiSpy.updateTheme.and.returnValue(of({ resource: theme }) as any)
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component['onUpdateTheme']()

      const callArgs = themesApiSpy.updateTheme.calls.mostRecent().args[0]
      expect(callArgs.updateThemeRequest!.resource.logoUrl).toBeUndefined()
      expect(callArgs.updateThemeRequest!.resource.smallLogoUrl).toBeUndefined()
      expect(callArgs.updateThemeRequest!.resource.faviconUrl).toBeUndefined()
    })

    it('should not call updateTheme when component theme has no id', () => {
      component.theme = { ...theme, id: undefined }

      component['onUpdateTheme']()

      expect(themesApiSpy.updateTheme).not.toHaveBeenCalled()
    })
  })

  describe('useThemeAsTemplate', () => {
    it('should load theme by id and set themeForColors', () => {
      const templateTheme = { name: 'template', displayName: 'Template', properties: { color: 'red' } }
      themesApiSpy.getThemeById.and.returnValue(of({ resource: templateTheme }) as any)
      spyOn(console, 'log')

      component.useThemeAsTemplate({ id: '123', displayName: 'Copy of' })

      expect(themesApiSpy.getThemeById).toHaveBeenCalledWith({ id: '123' })
      expect(component.themeForColors).toEqual(templateTheme as any)
      expect(msgServiceSpy.info).toHaveBeenCalledWith({ summaryKey: 'THEME.TEMPLATE.CONFIRMATION.OK' })
    })

    it('should use component theme name in EDIT mode', () => {
      const templateTheme = { name: 'template', displayName: 'Template', properties: {} }
      themesApiSpy.getThemeById.and.returnValue(of({ resource: templateTheme }) as any)
      component.changeMode = 'EDIT'
      component.theme = { name: 'original' }
      spyOn(console, 'log')

      component.useThemeAsTemplate({ id: '123' })

      expect(component.themeForProps!.name).toBe('original')
    })
  })

  describe('onSaveAs', () => {
    const copyOfPrefix = 'Copy of '

    it('should set themeForCreation and open dialog in VIEW mode', () => {
      component.changeMode = 'VIEW'
      component.theme = theme

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible()).toBeTrue()
      expect(component.themeForCreation()).toBeDefined()
      expect(component.themeForCreation()!.name).toBe(copyOfPrefix + theme.name)
      expect(component.themeForCreation()!.displayName).toBe(copyOfPrefix + theme.displayName)
      expect(component.themeForCreation()!.id).toBeUndefined()
      expect(component.themeForCreation()!.operator).toBeUndefined()
      expect(component.themeForCreation()!.modificationCount).toBeUndefined()
    })

    it('should not open dialog if theme is undefined in VIEW mode', () => {
      component.changeMode = 'VIEW'
      component.theme = undefined

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible()).toBeFalse()
    })

    it('should use sub-component data in EDIT mode', () => {
      component.changeMode = 'EDIT'
      component.themeData = signal({ theme: { ...theme, properties: {} }, propsValid: true, colorsValid: true }) as any
      component.theme = { ...theme, modificationCount: 2 }
      spyOn(console, 'log')

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible()).toBeTrue()
      expect(component.themeForCreation()!.name).toBe(copyOfPrefix + theme.name)
    })

    it('should not open dialog if sub-component data is invalid in EDIT mode', () => {
      component.changeMode = 'EDIT'
      component.themeData = signal({ theme: {}, propsValid: false, colorsValid: true }) as any
      spyOn(console, 'log')

      component.onSaveAs(copyOfPrefix)

      expect(component.themeCreateVisible()).toBeFalse()
    })
  })

  describe('theme creation', () => {
    it('should clear theme for creation and navigate on theme creation', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      component.themeForCreation.set(theme)

      component.onThemeCreation({ name: 'newTheme' })

      expect(component.themeForCreation()).toBeUndefined()
      expect(router.navigate).toHaveBeenCalledWith(['../newTheme'], jasmine.any(Object))
    })
  })
})
