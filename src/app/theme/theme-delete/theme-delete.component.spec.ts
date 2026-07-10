import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { outputToObservable } from '@angular/core/rxjs-interop'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { firstValueFrom, of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService } from 'src/app/shared/generated'

import { ThemeDeleteComponent } from './theme-delete.component'

describe('ThemeDeleteComponent', () => {
  let component: ThemeDeleteComponent
  let fixture: ComponentFixture<ThemeDeleteComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const themesApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', ['deleteTheme'])

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeDeleteComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('visible', true)
    fixture.componentRef.setInput('useLoadingState', 'loading')
    fixture.componentRef.setInput('themeUsed', false)
    fixture.componentRef.setInput('themeToBeDeleted', { id: 'themeId', name: 'themeName' } as Theme)
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeDeleteComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [provideNoopAnimations()]
    })
      .overrideComponent(ThemeDeleteComponent, {
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
    msgServiceSpy.success.calls.reset()
    msgServiceSpy.error.calls.reset()
    // to spy data: reset
    themesApiSpy.deleteTheme.calls.reset()
    // to spy data: refill with neutral data
    themesApiSpy.deleteTheme.and.returnValue(of({}) as any)

    initTestComponent()
  })

  describe('construction', () => {
    it('should create component', () => {
      expect(component).toBeTruthy()
    })
  })

  describe('Theme deletion', () => {
    it('should hide dialog and inform on successfull deletion', async () => {
      themesApiSpy.deleteTheme.and.returnValue(of({}) as any)
      const deletedPromise = firstValueFrom(outputToObservable(component.deleted))

      component.onDeleteTheme({ id: 'themeId' } as any)

      await expectAsync(deletedPromise).toBeResolved()

      expect(component.visible()).toBeFalse()
      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
    })

    it('should hide dialog and display error on failed deletion', () => {
      const errorResponse = { error: { message: 'Error on deleting theme' }, status: 400 }
      themesApiSpy.deleteTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onDeleteTheme({ id: 'themeId' } as any)

      expect(console.error).toHaveBeenCalledWith('deleteTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.DELETE.THEME_NOK',
        detailKey: errorResponse.error.message
      })
    })
  })
})
