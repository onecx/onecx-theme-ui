import { outputToObservable } from '@angular/core/rxjs-interop'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { firstValueFrom, of, throwError } from 'rxjs'

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

  const themesApiSpy = { createTheme: jasmine.createSpy('createTheme').and.returnValue(of({})) }
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
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([])]
    })
      .overrideComponent(ThemeCreateComponent, {
        add: {
          providers: [
            { provide: ThemesAPIService, useValue: themesApiSpy },
            { provide: PortalMessageService, useValue: msgServiceSpy }
          ]
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeCreateComponent)
    component = fixture.componentInstance
    // initialize component state
    component.visible.set(true)
    component.themeToBeCreated.set(undefined)
    fixture.detectChanges()
  })

  afterEach(() => {
    themesApiSpy.createTheme.calls.reset()
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('initialize dialog', () => {
    it('should reset form and patch values from themeToBeCreated', () => {
      component.themeToBeCreated.set(theme)
      fixture.detectChanges()
      TestBed.flushEffects()

      expect(component.formGroup.value.name).toBe(theme.name)
      expect(component.formGroup.value.displayName).toBe(theme.displayName)
      expect(component.formGroup.value.description).toBe(theme.description)
    })

    it('should reset form without patching when themeToBeCreated is undefined', () => {
      component.themeToBeCreated.set(theme)
      fixture.detectChanges()
      TestBed.flushEffects()

      component.themeToBeCreated.set(undefined)
      fixture.detectChanges()
      TestBed.flushEffects()

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

  describe('onSaveTheme', () => {
    const themes = [
      { name: 'theme1', displayName: 'Theme 1' },
      { name: 'theme2', displayName: 'Theme 2' }
    ]

    it('should create a new theme successfully and set created', async () => {
      themesApiSpy.createTheme.and.returnValue(of({ resource: theme }))
      fixture.componentRef.setInput('themeToBeCreated', theme)
      fixture.detectChanges()
      const createdPromise = firstValueFrom(outputToObservable(component.created))

      component.onSaveTheme()

      expect(msgServiceSpy.success).toHaveBeenCalledWith({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
      await expectAsync(createdPromise).toBeResolved()
    })

    it('should use themeToBeCreated properties when create', () => {
      const newTheme = {
        ...theme,
        description: undefined,
        properties: { general: { 'primary-color': '#000' } }
      } as Theme
      fixture.componentRef.setInput('themeToBeCreated', newTheme)
      fixture.detectChanges()
      themesApiSpy.createTheme.and.returnValue(of({ resource: newTheme }))

      component.onSaveTheme()

      const callArgs = themesApiSpy.createTheme.calls.mostRecent().args[0]
      expect(callArgs.createThemeRequest.resource.properties).toEqual({ general: { 'primary-color': '#000' } })
    })

    it('should display error when theme creation fails', () => {
      const errorResponse = {
        status: 400,
        statusText: 'Could not update ...',
        error: { errorCode: 'PERSIST_ENTITY_FAILED' }
      }
      themesApiSpy.createTheme.and.returnValue(throwError(() => errorResponse))
      fixture.componentRef.setInput('themeToBeCreated', theme)
      fixture.detectChanges()
      spyOn(console, 'error')

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
        detailKey: 'VALIDATION.ERRORS.PERSIST_ENTITY_FAILED'
      })
      expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
    })

    it('should display error when theme creation fails', () => {
      const errorResponse = {
        status: 400,
        statusText: 'Could not update ...',
        error: { errorCode: '12345' }
      }
      themesApiSpy.createTheme.and.returnValue(throwError(() => errorResponse))
      fixture.componentRef.setInput('themeToBeCreated', theme)
      fixture.detectChanges()
      spyOn(console, 'error')

      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({
        summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
        detailKey: '12345'
      })
      expect(console.error).toHaveBeenCalledWith('createTheme', errorResponse)
    })

    it('should prevent creating a theme if theme with same name exists', async () => {
      const newTheme = { ...theme, name: 'theme1' } as Theme
      fixture.componentRef.setInput('themeToBeCreated', newTheme)
      fixture.componentRef.setInput('themes', themes)
      fixture.detectChanges()
      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.ERRORS.PERSIST_ENTITY_FAILED' })
    })

    it('should prevent creating a theme if theme with same display name exists', async () => {
      const newTheme = { ...theme, displayName: 'Theme 1' } as Theme
      fixture.componentRef.setInput('themeToBeCreated', newTheme)
      fixture.componentRef.setInput('themes', themes)
      fixture.detectChanges()
      component.onSaveTheme()

      expect(msgServiceSpy.error).toHaveBeenCalledWith({ summaryKey: 'VALIDATION.ERRORS.PERSIST_ENTITY_FAILED' })
    })
  })
})
