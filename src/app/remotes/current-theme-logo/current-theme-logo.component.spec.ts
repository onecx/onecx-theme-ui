import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, ReplaySubject } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'
import { ThemeService } from '@onecx/angular-integration-interface'

import { Theme } from 'src/app/shared/generated'
import { OneCXCurrentThemeLogoComponent } from './current-theme-logo.component'

const theme1: Theme = {
  id: 't1',
  name: 'theme1',
  displayName: 'Theme 1'
}

describe('OneCXCurrentThemeLogoComponent', () => {
  let component: OneCXCurrentThemeLogoComponent
  let fixture: ComponentFixture<OneCXCurrentThemeLogoComponent>
  let baseUrlSubject: ReplaySubject<any>

  class MockThemeService {
    currentTheme$ = { asObservable: () => of(theme1) }
  }
  let mockThemeService: MockThemeService
  const slotServiceSpy = {
    init: jasmine.createSpy('init'),
    isSomeComponentDefinedForSlot: jasmine.createSpy('isSomeComponentDefinedForSlot').and.returnValue(of(false))
  }

  function initializeComponent() {
    fixture = TestBed.createComponent(OneCXCurrentThemeLogoComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(() => {
    mockThemeService = new MockThemeService()
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
        { provide: SlotService, useValue: slotServiceSpy },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    })
      .overrideComponent(OneCXCurrentThemeLogoComponent, {
        set: {
          providers: [{ provide: ThemeService, useValue: mockThemeService }]
        }
      })
      .compileComponents()

    slotServiceSpy.isSomeComponentDefinedForSlot.calls.reset()
  })

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
    })
  })

  describe('provide logo', () => {
    it('should load - initially', (done) => {
      initializeComponent()
      component.logEnabled = true
      component.logPrefix = 'get image url'
      component.themeName = theme1.name

      component.onImageLoad()

      component.imageUrl$?.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBe('http://onecx-theme-bff:8080/images/' + theme1.name + '/logo')
          }
          done()
        },
        error: done.fail
      })
    })

    describe('provide logo - on error', () => {
      it('should load - failed - used: url', () => {
        initializeComponent()
        component.logEnabled = true // log without prefix !
        component.themeName = theme1.name
        component.imageUrl = 'http://image/url'

        component.onImageLoadError(component.imageUrl)
      })

      it('should use image - failed - use default', () => {
        initializeComponent()
        component.logEnabled = false
        component.logPrefix = 'default logo'
        component.themeName = theme1.name

        component.onImageLoadError('http://onecx-theme-bff:8080/images/' + theme1.name + '/logo')
      })
    })

    describe('provide logo - get url', () => {
      it('should get image url - use input image url', () => {
        initializeComponent()
        component.logEnabled = false
        component.logPrefix = 'url'
        component.themeName = theme1.name
        component.imageUrl = '/url'

        const url = component.getImageUrl(theme1.name, 'url')

        expect(url).toBe(component.imageUrl)
      })

      it('should get url - use default image url', () => {
        initializeComponent()
        component.logEnabled = false
        component.logPrefix = 'default url'
        component.themeName = theme1.name
        component.defaultImageUrl = '/default/url'
        component.useDefaultLogo = true // enable use of default image

        const url = component.getImageUrl(theme1.name, 'default')

        expect(url).toBe(component.defaultImageUrl)
      })

      it('should get url - unknown prio type', () => {
        initializeComponent()
        component.logEnabled = false
        component.logPrefix = 'default url'
        component.themeName = theme1.name
        component.defaultImageUrl = '/default/url'
        component.useDefaultLogo = false // enable use of default image

        const url = component.getImageUrl(theme1.name, 'unknown')

        expect(url).toBeUndefined()
      })
    })
  })
})
