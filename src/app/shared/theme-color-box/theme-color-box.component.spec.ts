import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { ThemeColorBoxComponent } from './theme-color-box.component'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { HttpLoaderFactory } from '../shared.module'
import { HttpClient } from '@angular/common/http'

describe('ThemeColorBoxComponent', () => {
  let component: ThemeColorBoxComponent
  let fixture: ComponentFixture<ThemeColorBoxComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeColorBoxComponent],
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
    fixture = TestBed.createComponent(ThemeColorBoxComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
