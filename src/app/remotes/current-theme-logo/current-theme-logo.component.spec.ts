import { TestBed } from '@angular/core/testing'
import { CommonModule } from '@angular/common'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, ReplaySubject } from 'rxjs'

import { BASE_URL, RemoteComponentConfig } from '@onecx/angular-remote-components'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { OneCXCurrentThemeLogoComponent } from './current-theme-logo.component'

const theme1: Theme = {
  id: 't1',
  name: 'theme1',
  displayName: 'Theme 1'
}

describe('OneCXCurrentThemeLogoComponent', () => {
  const themeApiSpy = {
    searchThemes: jasmine.createSpy('searchThemes').and.returnValue(of({})),
    getThemeByName: jasmine.createSpy('getThemeByName').and.returnValue(of({}))
  }

  function setUp() {
    const fixture = TestBed.createComponent(OneCXCurrentThemeLogoComponent)
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
      .overrideComponent(OneCXCurrentThemeLogoComponent, {
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

  describe('provide logo', () => {
    it('should load - initially', (done) => {
      const { component } = setUp()
      component.logEnabled = true
      component.logPrefix = 'get image url'
      component.themeName = theme1.name

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

        component.onImageLoadError(component.imageUrl)
      })

      it('should use image - failed - use default', () => {
        const { component } = setUp()
        component.logEnabled = false
        component.logPrefix = 'default logo'
        component.themeName = theme1.name

        component.onImageLoadError('base_url/bff/images/theme1/logo')
      })
    })

    describe('provide logo - get url', () => {
      it('should get image url - use input image url', () => {
        const { component } = setUp()
        component.logEnabled = false
        component.logPrefix = 'url'
        component.themeName = theme1.name
        component.imageUrl = '/url'

        const url = component.getImageUrl(theme1.name, 'url')

        expect(url).toBe(component.imageUrl)
      })

      it('should get url - use default image url', () => {
        const { component } = setUp()
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
