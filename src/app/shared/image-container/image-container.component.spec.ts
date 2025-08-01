import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'

import { ImageContainerComponent } from './image-container.component'

class MockAppStateService {
  currentMfe$ = of({
    remoteBaseUrl: '/base/'
  })
}

describe('ImageContainerComponent', () => {
  let component: ImageContainerComponent
  let fixture: ComponentFixture<ImageContainerComponent>
  let mockAppStateService: MockAppStateService

  beforeEach(waitForAsync(() => {
    mockAppStateService = new MockAppStateService()

    TestBed.configureTestingModule({
      declarations: [ImageContainerComponent],
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: AppStateService, useValue: mockAppStateService }]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
    expect(component.defaultImageUrl).toEqual('/base/assets/images/logo.png')
  })

  describe('ngOnChanges', () => {
    it('should not modify imageUrl if it starts with http/https', () => {
      const testUrl = 'http://path/to/image.jpg'
      component.imageUrl = testUrl
      component.ngOnChanges({
        imageUrl: {
          currentValue: testUrl,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      })

      expect(component.imageUrl).toBe(testUrl)
    })

    it('should display default logo if there is no image url', () => {
      component.imageUrl = ''
      component.ngOnChanges({
        imageUrl: {
          currentValue: '',
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      })

      expect(component.displayDefault).toBeTrue()
    })
  })

  describe('image loading', () => {
    it('should use default logo on error', () => {
      spyOn(component.imageLoadResult, 'emit')
      component.displayImageUrl = 'url'

      component.onImageLoadError()

      expect(component.displayDefault).toBeTrue()
      expect(component.imageLoadResult.emit).toHaveBeenCalledWith(false)
    })

    it('should inform caller on success', () => {
      spyOn(component.imageLoadResult, 'emit')
      component.displayImageUrl = 'url'

      component.onImageLoadSuccess()

      expect(component.imageLoadResult.emit).toHaveBeenCalledWith(true)
    })
  })
})
