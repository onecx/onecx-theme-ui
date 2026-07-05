import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { provideRouter } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeCreateComponent } from './theme-create.component'

const theme: Theme = {
  id: 'id',
  name: 'name',
  displayName: 'displayName',
  description: 'description'
}

describe('ThemeCreateComponent', () => {
  let component: ThemeCreateComponent
  let fixture: ComponentFixture<ThemeCreateComponent>

  const themeApiServiceSpy = { createTheme: jasmine.createSpy('createTheme').and.returnValue(of({})) }
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeCreateComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ThemesAPIService, useValue: themeApiServiceSpy }
      ]
    })
      .overrideComponent(ThemeCreateComponent, {
        set: {
          template: '',
          imports: []
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeCreateComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('visible', false)
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

  describe('ngOnChanges', () => {
    it('should reset form and patch values from themeToBeCreated', () => {
      component.themeToBeCreated = theme

      component.ngOnChanges()

      expect(component.formGroup.value.name).toBe(theme.name)
      expect(component.formGroup.value.displayName).toBe(theme.displayName)
      expect(component.formGroup.value.description).toBe(theme.description)
    })

    it('should reset form without patching when themeToBeCreated is undefined', () => {
      component.formGroup.patchValue({ name: 'existingName' })
      component.themeToBeCreated = undefined

      component.ngOnChanges()

      expect(component.formGroup.value.name).toBeNull()
    })
  })

  describe('closeDialog', () => {
    it('should reset form and set visible to false', () => {
      component.formGroup.patchValue({ name: 'test' })

      component.closeDialog()

      expect(component.formGroup.value.name).toBeNull()
      expect(component.visible()).toBeFalse()
    })
  })

  describe('saveTheme', () => {
    it('should create a theme and set created', () => {
      themeApiServiceSpy.createTheme.and.returnValue(of({ resource: theme }))

      component.saveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
      expect(component.created()).toEqual(theme)
    })

    it('should use themeToBeCreated properties when set', () => {
      component.themeToBeCreated = { ...theme, properties: { general: { 'primary-color': '#000' } } }
      themeApiServiceSpy.createTheme.and.returnValue(of({ resource: theme }))

      component.saveTheme()

      const callArgs = themeApiServiceSpy.createTheme.calls.mostRecent().args[0]
      expect(callArgs.createThemeRequest.resource.properties).toEqual({ general: { 'primary-color': '#000' } })
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
})
