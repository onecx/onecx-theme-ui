import { TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, ReplaySubject, throwError } from 'rxjs'

import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'

import { Theme, SearchThemeResponse, ThemesAPIService } from 'src/app/shared/generated'
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
  const themeApiSpy = {
    searchThemes: jasmine.createSpy('searchThemes').and.returnValue(of({})),
    getThemeByName: jasmine.createSpy('getThemeByName').and.returnValue(of({}))
  }

  function setUp() {
    const fixture = TestBed.createComponent(OneCXThemeDataComponent)
    const component = fixture.componentInstance
    fixture.detectChanges()
    return { fixture, component }
  }

  let baseUrlSubject: ReplaySubject<any>
  beforeEach(() => {
    baseUrlSubject = new ReplaySubject<any>(1)
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en'),
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: BASE_URL,
          useValue: baseUrlSubject
        }
      ]
    })
      .overrideComponent(OneCXThemeDataComponent, {
        set: {
          imports: [TranslateTestingModule, CommonModule],
          providers: [{ provide: ThemesAPIService, useValue: themeApiSpy }]
        }
      })
      .compileComponents()

    baseUrlSubject.next('base_url_mock')
    themeApiSpy.searchThemes.calls.reset()
    themeApiSpy.getThemeByName.calls.reset()
  })

  describe('initialize', () => {
    it('should create', () => {
      const { component } = setUp()

      expect(component).toBeTruthy()
    })

    it('should call ocxInitRemoteComponent with the correct config', () => {
      const { component } = setUp()
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

    it('should init remote component', (done: DoneFn) => {
      const { component } = setUp()

      component.ocxInitRemoteComponent({ baseUrl: 'base_url' } as RemoteComponentConfig)

      baseUrlSubject.asObservable().subscribe((item) => {
        expect(item).toEqual('base_url')
        done()
      })
    })
  })

  describe('getting themes', () => {
    it('should get themes - successful with data', (done) => {
      const { component } = setUp()
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
      const { component } = setUp()
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
      const { component } = setUp()
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
      const { component } = setUp()
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
      const { component } = setUp()
      component.dataType = 'theme'
      themeApiSpy.getThemeByName.and.returnValue(of(theme1))

      component.ngOnChanges()

      expect(themeApiSpy.getThemeByName).not.toHaveBeenCalled()
    })

    it('should get theme - successful with data', (done) => {
      const { component } = setUp()
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
      const { component } = setUp()
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
      const { component } = setUp()
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
      it('should load - failed - used: url', () => {
        const { component } = setUp()
        component.logEnabled = true // log without prefix !
        component.themeName = theme1.name
        component.imageUrl = 'http://image/url'
        component.dataType = 'logo'

        component.onImageLoadError(component.imageUrl)
      })

      it('should use image - failed - use default', () => {
        const { component } = setUp()
        component.logEnabled = false
        component.logPrefix = 'default logo'
        component.themeName = theme1.name
        component.dataType = 'logo'

        component.onImageLoadError('base_url/bff/images/theme1/logo')
      })
    })

    describe('provide logo - get url', () => {
      it('should get image url - data type undefined', () => {
        const { component } = setUp()
        component.dataType = undefined
        component.themeName = theme1.name

        const url = component.getImageUrl(theme1.name, 'other')

        expect(url).toBeUndefined()
      })

      it('should get image url - use input image url', () => {
        const { component } = setUp()
        component.dataType = 'logo'
        component.logEnabled = false
        component.logPrefix = 'url'
        component.themeName = theme1.name
        component.imageUrl = '/url'

        const url = component.getImageUrl(theme1.name, 'url')

        expect(url).toBe(component.imageUrl)
      })

      it('should get url - use default image url', () => {
        const { component } = setUp()
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
