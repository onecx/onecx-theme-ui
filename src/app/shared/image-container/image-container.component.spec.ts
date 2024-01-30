import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ImageContainerComponent } from './image-container.component'
import { prepareUrl } from 'src/app/shared/utils'

describe('ThemeColorBoxComponent', () => {
  let component: ImageContainerComponent
  let fixture: ComponentFixture<ImageContainerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ImageContainerComponent],
      imports: [
        HttpClientTestingModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageContainerComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display placeholder on image error', () => {
    component.onImageError()

    expect(component.displayPlaceHolder).toBeTrue()
  })

  it('should use imageUrl on backend after change', () => {
    const changes = {
      imageUrl: new SimpleChange('', 'imageUrl', false)
    }

    component.imageUrl = 'imageUrl'

    component.ngOnChanges(changes)
    expect(component.imageUrl).toBe(prepareUrl('imageUrl') ?? '')
  })

  it('should use image from external resource after change', () => {
    const changes = {
      imageUrl: new SimpleChange('', 'http://web.com/imageUrl', false)
    }

    component.imageUrl = 'http://web.com/imageUrl'
    component.ngOnChanges(changes)

    expect(component.imageUrl).toBe('http://web.com/imageUrl')
  })
})
