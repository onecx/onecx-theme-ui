import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ActivatedRoute, provideRouter, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import FileSaver from 'file-saver'

import { ConfigurationService, PortalMessageService, UserService } from '@onecx/angular-integration-interface'

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
        { provide: ThemesAPIService, useValue: themesApiSpy },
        { provide: ImagesInternalAPIService, useValue: imgServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    // to spy data: reset
    themesApiSpy.getThemeByName.calls.reset()
    themesApiSpy.exportThemes.calls.reset()
    locationSpy.back.calls.reset()
    // to spy data: refill with neutral data
    themesApiSpy.getThemeByName.and.returnValue(of({}) as any)
    themesApiSpy.exportThemes.and.returnValue(of({}) as any)

    translateService = TestBed.inject(TranslateService)
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

    it('should set showOperatorMessage to false', () => {
      const event = { index: 2 }

      component.ngOnInit()
      component.onTabChange(event, theme)

      expect(component.showOperatorMessage).toBeFalsy()
      expect(component.themeForUse).toEqual(theme)
    })

    it('should prevent theme loading if no name in route', () => {
      const route = TestBed.inject(ActivatedRoute)
      spyOn(route.snapshot.paramMap, 'get').and.returnValue(null)
      spyOn<any>(component, 'getTheme')

      component['getTheme']()

      expect(component['getTheme']).toHaveBeenCalled()
    })
  })

  describe('on changes', () => {
    beforeEach(() => {
      const route = TestBed.inject(ActivatedRoute)
      spyOn(route.snapshot.paramMap, 'get').and.returnValue(theme.name!)
      translateService.use('en')
    })

    it('should get theme - success', (done: DoneFn) => {
      themesApiSpy.getThemeByName.and.returnValue(of({ resource: theme }) as any)

      component.ngOnInit()

      component.theme$?.subscribe((data) => {
        expect(data).toBe(theme)
        expect(component.headerImageUrl).toBe(theme.logoUrl)

        component.actions$.subscribe((actions) => {
          expect(actions.length).toBe(4)
          if (actions.length > 0) {
            expect(actions[3].label).toBe('Delete')
            expect(actions[3].showCondition).toBeTrue() // hide action
          }
          done()
        })
      })
    })

    it('should get theme - failed', (done: DoneFn) => {
      const errorResponse = { error: { message: 'No permissions' }, status: 403 }
      themesApiSpy.getThemeByName.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.exceptionKey = undefined

      component.ngOnInit()

      component.theme$?.subscribe(() => {
        expect(console.error).toHaveBeenCalledWith('getThemeByName', errorResponse)
        expect(component.exceptionKey).toBe('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.THEME')
        component.actions$!.subscribe((actions) => {
          expect(actions.length).toBe(4)
          if (actions.length > 0) {
            expect(actions[3].showCondition).toBeFalse() // hide delete action
          }
          done()
        })
      })
    })

    it('should prepare header URL - logo URL', () => {
      component.prepareHeaderUrl(theme)

      expect(component.headerImageUrl).toBe(theme.logoUrl)

      component.prepareHeaderUrl({ ...theme, logoUrl: undefined })

      expect(component.headerImageUrl).toBe(Utils.bffImageUrl(component.imageBasePath, theme.name, RefType.Logo))
    })
  })

  describe('UI actions', () => {
    it('should prepare page actions', async () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      spyOn(component, 'onClose')
      spyOn(component, 'onExportTheme')
      component.themeDeleteVisible = false

      component.preparePageAction(true, theme)

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

    it('onClose', () => {
      component.ngOnInit()
      component.onClose()

      expect(locationSpy.back).toHaveBeenCalled()
    })
  })

  describe('Theme deletion', () => {
    it('should hide dialog, inform and navigate on successfull deletion', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      themesApiSpy.deleteTheme.and.returnValue(of({}) as any)
      component.themeDeleteVisible = true

      component.onConfirmThemeDeletion(theme)

      expect(component.themeDeleteVisible).toBe(false)
      expect(router.navigate).toHaveBeenCalledOnceWith(['..'], jasmine.any(Object))
      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
    })

    it('should hide dialog and display error on failed deletion', () => {
      const errorResponse = { error: { message: 'Error on deleting theme' }, status: 400 }
      themesApiSpy.deleteTheme.and.returnValue(throwError(() => errorResponse))
      component.themeDeleteVisible = true
      spyOn(console, 'error')

      component.onConfirmThemeDeletion(theme)

      expect(component.themeDeleteVisible).toBe(false)
      expect(console.error).toHaveBeenCalledWith('deleteTheme', errorResponse)
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
      const theme = {
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
      const exportResponse = {
        themes: {
          themeName: {
            version: 1,
            logoUrl: theme.logoUrl
          }
        }
      }
      themesApiSpy.exportThemes.and.returnValue(of(exportResponse) as any)

      component.onExportTheme(theme)

      expect(themesApiSpy.exportThemes).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ exportThemeRequest: { names: [theme.name] } })
      )
      expect(JSON.stringify).toHaveBeenCalledOnceWith(jasmine.objectContaining(exportResponse), null, 2)
      expect(FileSaver.saveAs).toHaveBeenCalledOnceWith(
        jasmine.any(Blob),
        `onecx-theme_${theme.name}_${Utils.getCurrentDateTime()}.json`
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
  })
})
