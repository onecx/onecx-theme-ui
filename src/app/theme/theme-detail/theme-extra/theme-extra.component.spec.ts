import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { OverrideType, Theme } from 'src/app/shared/generated'
import { ThemeExtraComponent } from './theme-extra.component'

const validTheme: Theme = {
  id: 'id',
  name: 'themeName',
  displayName: 'themeDisplayName',
  properties: {
    font: { 'font-family': 'myFont', 'font-size': '16px' }
  },
  customCssVariables: '.my-class { color: red; }',
  overrides: [
    { type: OverrideType.Primeng, value: '{"a":1}' },
    { type: OverrideType.Css, value: '{"b":2}' }
  ]
}

describe('ThemeExtraComponent', () => {
  let component: ThemeExtraComponent
  let fixture: ComponentFixture<ThemeExtraComponent>

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeExtraComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('changeMode', 'VIEW')
    fixture.componentRef.setInput('theme', undefined)
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeExtraComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ]
    }).compileComponents()
  }))

  it('should create', () => {
    initTestComponent()
    expect(component).toBeTruthy()
  })

  describe('form state', () => {
    it('should disable the font form when no theme is set', () => {
      initTestComponent()
      expect(component.fontForm.disabled).toBeTrue()
    })

    it('should disable the css form when no theme is set', () => {
      initTestComponent()
      expect(component.cssForm.disabled).toBeTrue()
    })

    it('should fill and disable the font form in VIEW mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.fontForm.controls['font-family'].value).toBe('myFont')
      expect(component.fontForm.controls['font-size'].value).toBe('16px')
      expect(component.fontForm.disabled).toBeTrue()
    })

    it('should fill and disable the css form in VIEW mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.cssForm.controls['customCssVariables'].value).toBe('.my-class { color: red; }')
      expect(component.cssForm.disabled).toBeTrue()
    })

    it('should enable the font form in EDIT mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.fontForm.enabled).toBeTrue()
    })

    it('should enable the css form in EDIT mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.cssForm.enabled).toBeTrue()
    })

    it('should reset the font form when theme becomes undefined', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      fixture.componentRef.setInput('theme', undefined)
      fixture.detectChanges()

      expect(component.fontForm.controls['font-family'].value).toBeNull()
    })

    it('should reset the css form when theme becomes undefined', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      fixture.componentRef.setInput('theme', undefined)
      fixture.detectChanges()

      expect(component.cssForm.controls['customCssVariables'].value).toBeNull()
    })

    it('should mark customCssVariables invalid when exceeding max length', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      component.cssForm.controls['customCssVariables'].setValue('a'.repeat(65536))

      expect(component.cssForm.controls['customCssVariables'].valid).toBeFalse()
    })

    it('should disable the override form when no theme is set', () => {
      initTestComponent()
      expect(component.overrideForm.disabled).toBeTrue()
    })

    it('should fill and disable the override form in VIEW mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.overrideForm.getRawValue()).toEqual({ primengOverride: '{"a":1}', cssOverride: '{"b":2}' })
      expect(component.overrideForm.disabled).toBeTrue()
    })

    it('should leave override controls empty when theme has no overrides', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', { ...validTheme, overrides: undefined })
      fixture.detectChanges()

      expect(component.overrideForm.getRawValue()).toEqual({ primengOverride: null, cssOverride: null })
    })

    it('should enable the override form in EDIT mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.overrideForm.enabled).toBeTrue()
    })

    it('should reset the override form when theme becomes undefined', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      fixture.componentRef.setInput('theme', undefined)
      fixture.detectChanges()

      expect(component.overrideForm.controls['primengOverride'].value).toBeNull()
    })
  })

  describe('signals', () => {
    it('isThemeFormValid should be false when no theme is set (form disabled)', () => {
      initTestComponent()
      expect(component.isThemeFormValid() as unknown as boolean).toBeFalse()
    })

    it('isThemeFormValid should be false when font-size is invalid', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      component.fontForm.controls['font-size'].setValue('invalid')

      expect(component.isThemeFormValid() as unknown as boolean).toBeFalse()
    })

    it('combinedFormValues should expose the font properties', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.combinedFormValues().properties).toEqual({
        font: { 'font-family': 'myFont', 'font-size': '16px' }
      })
    })

    it('isThemeFormValid should be true when all forms are valid', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.isThemeFormValid()).toBeTrue()
    })

    it('combinedFormValues should expose both overrides', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.combinedFormValues().overrides).toEqual(validTheme.overrides)
    })

    it('combinedFormValues should omit empty overrides', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      component.overrideForm.controls['primengOverride'].setValue('  ')
      component.overrideForm.controls['cssOverride'].setValue(null)

      expect(component.combinedFormValues().overrides).toEqual([])
    })

    it('combinedFormValues should expose the customCssVariables', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.combinedFormValues().customCssVariables).toBe('.my-class { color: red; }')
    })
  })
})
