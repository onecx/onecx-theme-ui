import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ThemeApplyComponent } from './theme-apply.component'
import { ConfirmationService } from 'primeng/api'
import { Dropdown } from 'primeng/dropdown'
import { Theme } from 'src/app/shared/generated'

describe('ThemeApplyComponent', () => {
  let component: ThemeApplyComponent
  let fixture: ComponentFixture<ThemeApplyComponent>
  let confirmationService: ConfirmationService
  const msgServiceSpy = jasmine.createSpyObj<PortalMessageService>('PortalMessageService', ['success', 'error'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeApplyComponent],
      imports: [
        ReactiveFormsModule,
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [TranslateService, { provide: PortalMessageService, useValue: msgServiceSpy }, ConfirmationService]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeApplyComponent)
    component = fixture.componentInstance
    confirmationService = fixture.debugElement.injector.get(ConfirmationService)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('default inputs', () => {
    it('should have default changeMode as VIEW', () => {
      expect(component.changeMode).toBe('VIEW')
    })

    it('should have default isCurrentTheme as true', () => {
      expect(component.isCurrentTheme).toBeTrue()
    })

    it('should have default autoApply as true', () => {
      expect(component.autoApply).toBeTrue()
    })
  })

  describe('onSelectThemeTemplate', () => {
    let dropdownMock: jasmine.SpyObj<Dropdown>

    beforeEach(() => {
      dropdownMock = jasmine.createSpyObj<Dropdown>('Dropdown', ['clear'])
    })

    it('should not trigger confirmation if no theme matches the event value', () => {
      const confirmSpy = spyOn(confirmationService, 'confirm')
      const themes: Theme[] = [{ id: '1', name: 'theme-a', displayName: 'Theme A' }]

      component.onSelectThemeTemplate({ value: 'non-existent' }, themes, dropdownMock)

      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('should not trigger confirmation if theme has no id', () => {
      const confirmSpy = spyOn(confirmationService, 'confirm')
      const themes: Theme[] = [{ name: 'theme-a', displayName: 'Theme A' }]

      component.onSelectThemeTemplate({ value: 'theme-a' }, themes, dropdownMock)

      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('should not trigger confirmation if theme has no displayName', () => {
      const confirmSpy = spyOn(confirmationService, 'confirm')
      const themes: Theme[] = [{ id: '1', name: 'theme-a' }]

      component.onSelectThemeTemplate({ value: 'theme-a' }, themes, dropdownMock)

      expect(confirmSpy).not.toHaveBeenCalled()
    })

    it('should trigger confirmation dialog when theme with id and displayName is selected', async () => {
      const confirmSpy = spyOn(confirmationService, 'confirm')
      const themes: Theme[] = [{ id: '1', name: 'theme-a', displayName: 'Theme A' }]

      component.onSelectThemeTemplate({ value: 'theme-a' }, themes, dropdownMock)
      await fixture.whenStable()

      expect(confirmSpy).toHaveBeenCalled()
      const confirmArg = confirmSpy.calls.mostRecent().args[0]
      expect(confirmArg.key).toBe('template')
      expect(confirmArg.icon).toBe('pi pi-question-circle')
      expect(confirmArg.defaultFocus).toBe('reject')
      expect(confirmArg.dismissableMask).toBeTrue()
    })

    it('should emit templatingThemeData and clear dropdown on accept', async () => {
      const emitSpy = spyOn(component.templatingThemeData, 'emit')
      spyOn(confirmationService, 'confirm').and.callFake((confirmation: any) => {
        confirmation.accept()
        return confirmationService
      })
      const themes: Theme[] = [{ id: '1', name: 'theme-a', displayName: 'Theme A' }]

      component.onSelectThemeTemplate({ value: 'theme-a' }, themes, dropdownMock)
      await fixture.whenStable()

      expect(dropdownMock.clear).toHaveBeenCalled()
      expect(emitSpy).toHaveBeenCalled()
      const emitted = emitSpy.calls.mostRecent().args[0]
      expect(emitted?.id).toBe('1')
    })

    it('should clear dropdown on reject', async () => {
      spyOn(confirmationService, 'confirm').and.callFake((confirmation: any) => {
        confirmation.reject()
        return confirmationService
      })
      const themes: Theme[] = [{ id: '1', name: 'theme-a', displayName: 'Theme A' }]

      component.onSelectThemeTemplate({ value: 'theme-a' }, themes, dropdownMock)
      await fixture.whenStable()

      expect(dropdownMock.clear).toHaveBeenCalled()
    })
  })
})
