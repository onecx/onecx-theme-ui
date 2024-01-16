import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core'
import { ImageContainerComponent } from './image-container.component'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { HttpLoaderFactory } from '../shared.module'
import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { environment } from 'src/environments/environment'

describe('ThemeColorBoxComponent', () => {
  let component: ImageContainerComponent
  let fixture: ComponentFixture<ImageContainerComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ImageContainerComponent],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient]
          }
        })
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

    expect(component.imageUrl).toBe(environment.apiPrefix + 'imageUrl')
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
