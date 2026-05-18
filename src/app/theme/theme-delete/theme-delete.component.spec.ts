import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ThemesAPIService } from 'src/app/shared/generated'

import { ThemeDeleteComponent } from './theme-delete.component'

describe('ThemeDeleteComponent', () => {
  let component: ThemeDeleteComponent
  let fixture: ComponentFixture<ThemeDeleteComponent>

  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])
  const themesApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', ['deleteTheme'])

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeDeleteComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeDeleteComponent],
      imports: [
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeDeleteComponent }]),
        { provide: PortalMessageService, useValue: msgServiceSpy },
        { provide: ThemesAPIService, useValue: themesApiSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
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
    it('should hide dialog, inform and navigate on successfull deletion', () => {
      const router = TestBed.inject(Router)
      spyOn(router, 'navigate')
      themesApiSpy.deleteTheme.and.returnValue(of({}) as any)

      component.onDeleteTheme({ id: 'themeId' } as any)

      expect(component.visible).toBe(false)
      expect(router.navigate).toHaveBeenCalledOnceWith(['..'], jasmine.any(Object))
      expect(msgServiceSpy.success).toHaveBeenCalledOnceWith({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
    })

    it('should hide dialog and display error on failed deletion', () => {
      const errorResponse = { error: { message: 'Error on deleting theme' }, status: 400 }
      themesApiSpy.deleteTheme.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')

      component.onDeleteTheme({ id: 'themeId' } as any)

      expect(component.visible).toBe(false)
      expect(console.error).toHaveBeenCalledWith('deleteTheme', errorResponse)
      expect(msgServiceSpy.error).toHaveBeenCalledOnceWith({
        summaryKey: 'ACTIONS.DELETE.THEME_NOK',
        detailKey: errorResponse.error.message
      })
    })
  })
})
