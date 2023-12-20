import { HttpClient } from '@angular/common/http'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { MessageService } from 'primeng/api'
import { HttpLoaderFactory } from 'src/app/app.module'

import { ThemeImportComponent } from './theme-import.component'

describe('ThemeImportComponent', () => {
  let component: ThemeImportComponent
  let fixture: ComponentFixture<ThemeImportComponent>
  const messageServiceMock: jasmine.SpyObj<MessageService> = jasmine.createSpyObj<MessageService>('MessageService', [
    'add'
  ])
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThemeImportComponent],
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
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        },
        { provide: MessageService, useValue: messageServiceMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ThemeImportComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
