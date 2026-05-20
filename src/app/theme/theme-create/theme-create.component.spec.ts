import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, ActivatedRouteSnapshot, provideRouter, Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import { ConfirmationService } from 'primeng/api'
import { DropdownModule } from 'primeng/dropdown'

import { PortalMessageService } from '@onecx/angular-integration-interface'
import { APP_CONFIG } from '@onecx/portal-integration-angular'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { environment } from 'src/environments/environment'
import { ThemeCreateComponent } from './theme-create.component'

const theme: Theme = {
  id: 'id',
  name: 'name',
  displayName: 'displayName',
  description: 'description'
}

class MockRouter {
  navigate = jasmine.createSpy('navigate')
}

describe('ThemeCreateComponent', () => {
  let component: ThemeCreateComponent
  let fixture: ComponentFixture<ThemeCreateComponent>
  const mockRouter = new MockRouter()

  const themeApiServiceSpy = { createTheme: jasmine.createSpy('createTheme').and.returnValue(of({})) }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const mockActivatedRouteSnapshot: Partial<ActivatedRouteSnapshot> = { params: { id: 'mockId' } }
  const mockActivatedRoute: Partial<ActivatedRoute> = {
    snapshot: mockActivatedRouteSnapshot as ActivatedRouteSnapshot
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeCreateComponent],
      imports: [
        ReactiveFormsModule,
        DropdownModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeCreateComponent }]),
        { provide: APP_CONFIG, useValue: environment },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ThemesAPIService, useValue: themeApiServiceSpy },
        ConfirmationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeCreateComponent)
    component = fixture.componentInstance
    component.formGroup = new FormGroup({
      name: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      description: new FormControl(null, [Validators.maxLength(255)])
    })
    fixture.detectChanges()
  })

  afterEach(() => {
    themeApiServiceSpy.createTheme.calls.reset()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should create a theme', () => {
    themeApiServiceSpy.createTheme.and.returnValue(of({ resource: theme }))

    component.saveTheme()

    expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
    expect(mockRouter.navigate).toHaveBeenCalledWith(['./name'], { relativeTo: mockActivatedRoute })
  })

  it('should display error when theme creation fails', () => {
    const errorResponse = { status: 400, statusText: 'Error on creating a theme' }
    themeApiServiceSpy.createTheme.and.returnValue(throwError(() => errorResponse))
    spyOn(console, 'error')

    component.saveTheme()

    expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK' })
    expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
  })
})
