import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Location } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, ReplaySubject, throwError } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'
import { AppConfigService } from '@onecx/angular-integration-interface'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'

import { Theme, SearchThemeResponse, ThemesAPIService } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { OneCXThemeDataComponent } from './theme-data.component'

const theme1: Theme = {
  id: 't1',
  name: 'theme1',
  displayName: 'Theme 1'
}
const theme2: Theme = {
  id: 't2',
  name: 'theme2',
  displayName: 'Theme 2'
}
const themes: Theme[] = [theme1, theme2]

describe('OneCXThemeDataComponent', () => {
  let component: OneCXThemeDataComponent
  let fixture: ComponentFixture<OneCXThemeDataComponent>
  let baseUrlSubject: ReplaySubject<any>

  const themeApiSpy = {
    searchThemes: jasmine.createSpy('searchThemes').and.returnValue(of({})),
    getThemeByName: jasmine.createSpy('getThemeByName').and.returnValue(of({}))
  }
  const slotServiceSpy = {
    init: jasmine.createSpy('init'),
    isSomeComponentDefinedForSlot: jasmine.createSpy('isSomeComponentDefinedForSlot').and.returnValue(of(false))
  }

  function initializeComponent() {
    fixture = TestBed.createComponent(OneCXThemeDataComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    baseUrlSubject = new ReplaySubject<any>(1)

    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: REMOTE_COMPONENT_CONFIG, useValue: baseUrlSubject },
        { provide: SlotService, useValue: slotServiceSpy }
      ]
    })
      .overrideComponent(OneCXThemeDataComponent, {
        set: {
          providers: [{ provide: ThemesAPIService, useValue: themeApiSpy }, { provide: AppConfigService }]
        }
      })
      .compileComponents()

    slotServiceSpy.isSomeComponentDefinedForSlot.calls.reset()
    themeApiSpy.searchThemes.calls.reset()
    themeApiSpy.getThemeByName.calls.reset()
  }))

  describe('initialization', () => {
    it('should create', () => {
      initializeComponent()
      expect(component).toBeTruthy()
    })

    it('should call ocxInitRemoteComponent with the correct config', () => {
      initializeComponent()
      const mockConfig: RemoteComponentConfig = {
        appId: 'appId',
        productName: 'prodName',
        permissions: ['permission'],
        baseUrl: 'base'
      }
      spyOn(component, 'ocxInitRemoteComponent')

      component.ocxRemoteComponentConfig = mockConfig

      expect(component.ocxInitRemoteComponent).toHaveBeenCalledWith(mockConfig)
    })

    it('should initialize remote component', (done: DoneFn) => {
      const config = { baseUrl: 'base_url' } as RemoteComponentConfig
      initializeComponent()

      component.ocxInitRemoteComponent(config)

      baseUrlSubject.asObservable().subscribe((item) => {
        expect(item).toEqual(config)
        done()
      })
      const expectedBasePath = Location.joinWithSlash('base_url', environment.apiPrefix)
      expect((themeApiSpy as any).configuration.basePath).toEqual(expectedBasePath)
    })
  })

  describe('getting themes', () => {
    it('should get themes - successful with data', (done) => {
      initializeComponent()
      const mockResponse: SearchThemeResponse = { stream: themes }
      themeApiSpy.searchThemes.and.returnValue(of(mockResponse))
      component.dataType = 'themes'

      component.ngOnChanges()

      component.themes$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual(themes)
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get themes - successful without data', (done) => {
      initializeComponent()
      const mockResponse: SearchThemeResponse = { stream: [] }
      themeApiSpy.searchThemes.and.returnValue(of(mockResponse))
      component.dataType = 'themes'

      component.ngOnChanges()

      component.themes$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual([])
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get themes - successful without stream', (done) => {
      initializeComponent()
      const mockResponse: SearchThemeResponse = { stream: undefined }
      themeApiSpy.searchThemes.and.returnValue(of(mockResponse))
      component.dataType = 'themes'

      component.ngOnChanges()

      component.themes$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual([])
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get themes - failed', (done) => {
      initializeComponent()
      const errorResponse = { status: 400, statusText: 'Error on getting themes' }
      themeApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
      component.dataType = 'themes'
      spyOn(console, 'error')

      component.ngOnChanges()
      component.themes$?.subscribe({
        next: (data) => {
          if (data) {
            expect(console.error).toHaveBeenCalledWith('onecx-theme-data.searchThemes', errorResponse)
          }
          done()
        },
        error: done.fail
      })
    })
  })

  describe('getting theme', () => {
    it('should get theme - successful with data', () => {
      initializeComponent()
      component.dataType = 'theme'
      themeApiSpy.getThemeByName.and.returnValue(of(theme1))

      component.ngOnChanges()

      expect(themeApiSpy.getThemeByName).not.toHaveBeenCalled()
    })

    it('should get theme - successful with data', (done) => {
      initializeComponent()
      themeApiSpy.getThemeByName.and.returnValue(of(theme1))
      component.dataType = 'theme'
      component.themeName = theme1.name

      component.ngOnChanges()

      component.theme$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toEqual(theme1)
          }
          done()
        },
        error: done.fail
      })
    })

    it('should get theme - failed', (done) => {
      initializeComponent()
      const errorResponse = { status: 400, statusText: 'Error on getting themes' }
      themeApiSpy.getThemeByName.and.returnValue(throwError(() => errorResponse))
      component.dataType = 'theme'
      component.themeName = theme1.name
      spyOn(console, 'error')

      component.ngOnChanges()

      component.theme$?.subscribe({
        next: (data) => {
          if (data) {
            expect(console.error).toHaveBeenCalledWith('onecx-theme-data.getThemeByName', errorResponse)
          }
          done()
        },
        error: done.fail
      })
    })
  })

  describe('provide logo', () => {
    it('should load - initially', (done) => {
      initializeComponent()
      component.logEnabled = true
      component.logPrefix = 'get image url'
      component.themeName = theme1.name
      component.dataType = 'logo'

      component.ngOnChanges()
      component.onImageLoad()

      component.imageUrl$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBe('base_url/bff/images/theme1/logo')
          }
          done()
        },
        error: done.fail
      })
    })

    describe('provide logo - on error', () => {
      it('should load - failed - used: url', (done) => {
        initializeComponent()
        component.logEnabled = true // log without prefix !
        component.themeName = theme1.name
        component.imageUrl = 'http://image/url'
        component.dataType = 'logo'
        spyOn(component, 'getImageUrl').and.callThrough()

        component.onImageLoadError(component.imageUrl)

        component.imageUrl$?.subscribe({
          next: (data) => {
            if (data) {
              expect(data).toBe('base_url/bff/images/' + theme1.name + '/logo')
              expect(component.getImageUrl).toHaveBeenCalledOnceWith(theme1.name, 'image')
            }
            done()
          },
          error: done.fail
        })
      })

      it('should use image - failed - use default', (done) => {
        initializeComponent()
        component.logEnabled = false
        component.logPrefix = 'default logo'
        component.themeName = theme1.name
        component.dataType = 'logo'
        spyOn(component, 'getImageUrl').and.callThrough()

        component.onImageLoadError('base_url/bff/images/theme1/logo')

        component.imageUrl$?.subscribe({
          next: (data) => {
            if (data) {
              expect(data).toBe('base_url/bff/images/' + theme1.name + '/logo')
              expect(component.getImageUrl).toHaveBeenCalledOnceWith(theme1.name, 'image')
            }
            done()
          },
          error: done.fail
        })
      })
    })

    describe('provide logo - get url', () => {
      it('should get image url - data type undefined', () => {
        initializeComponent()
        component.dataType = undefined
        component.themeName = theme1.name

        const url = component.getImageUrl(theme1.name, 'other')

        expect(url).toBeUndefined()
      })

      it('should get image url - use input image url', () => {
        initializeComponent()
        component.dataType = 'logo'
        component.logEnabled = false
        component.logPrefix = 'url'
        component.themeName = theme1.name
        component.imageUrl = '/url'

        const url = component.getImageUrl(theme1.name, 'url')

        expect(url).toBe(component.imageUrl)
      })

      it('should get url - use default image url', () => {
        initializeComponent()
        component.dataType = 'logo'
        component.logEnabled = false
        component.logPrefix = 'default url'
        component.themeName = theme1.name
        component.defaultImageUrl = '/default/url'
        component.useDefaultLogo = true // enable use of default image

        const url = component.getImageUrl(theme1.name, 'default')

        expect(url).toBe(component.defaultImageUrl)
      })
    })
  })
})
