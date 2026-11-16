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
    { type: OverrideType.Css, alias: 'css-alias', pos: 0, value: '{"b":2}' },
    { type: OverrideType.Primeng, pos: 1, value: '{"a":1}' }
  ]
}

const threeRowTheme: Theme = {
  ...validTheme,
  overrides: [
    { type: OverrideType.Css, pos: 0, value: '.c0 {}' },
    { type: OverrideType.Css, pos: 1, value: '.c1 {}' },
    { type: OverrideType.Primeng, pos: 2, value: '.p0 {}' }
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

      expect(component.overrideForm.getRawValue()).toEqual({
        items: [
          { type: OverrideType.Css, alias: 'css-alias', value: '{"b":2}' },
          { type: OverrideType.Primeng, alias: null, value: '{"a":1}' }
        ]
      })
      expect(component.overrideForm.disabled).toBeTrue()
    })

    it('should have no override rows when theme has no overrides', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', { ...validTheme, overrides: undefined })
      fixture.detectChanges()

      expect(component.overrideRows.length).toBe(0)
    })

    it('should enable the override form in EDIT mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(component.overrideForm.enabled).toBeTrue()
    })

    it('should clear the override rows when theme becomes undefined', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      fixture.componentRef.setInput('theme', undefined)
      fixture.detectChanges()

      expect(component.overrideRows.length).toBe(0)
    })
  })

  describe('override rows', () => {
    function initEditMode(): void {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
    }

    it('should render a row for each override', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelectorAll('textarea[id^="th_detail_override_value_"]').length).toBe(2)
    })

    it('should show the add button in EDIT mode', () => {
      initEditMode()

      expect(fixture.nativeElement.querySelector('#th_detail_override_action_add')).toBeTruthy()
    })

    it('should hide the add button in VIEW mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('#th_detail_override_action_add')).toBeNull()
    })

    it('should add an empty CSS row when addOverride is called', () => {
      initEditMode()
      component.addOverride()

      expect(component.overrideRows.at(2).getRawValue()).toEqual({
        type: OverrideType.Css,
        alias: null,
        value: null
      })
    })

    it('should append the new row at the end', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', threeRowTheme)
      fixture.detectChanges()
      component.addOverride()
      component.overrideRows.at(3).controls.value.setValue('.new {}')

      expect(component.combinedFormValues().overrides?.at(-1)).toEqual({
        type: OverrideType.Css,
        pos: 3,
        value: '.new {}'
      })
    })

    it('should order the rows by pos when the service returns them unordered', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', {
        ...validTheme,
        overrides: [
          { type: OverrideType.Css, pos: 4, value: '.a {}' },
          { type: OverrideType.Css, pos: 1, value: '.b {}' },
          { type: OverrideType.Css, value: '.c {}' }
        ]
      })
      fixture.detectChanges()

      expect(component.overrideRows.controls.map((row) => row.controls.value.value)).toEqual([
        '.b {}',
        '.a {}',
        '.c {}'
      ])
    })

    it('should add an empty row when the add button is clicked', () => {
      initEditMode()
      fixture.nativeElement.querySelector('#th_detail_override_action_add button').click()

      expect(component.overrideRows.length).toBe(3)
    })

    it('should hide the remove buttons in VIEW mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('[id^="th_detail_override_action_remove_"]')).toBeNull()
    })

    it('should enable the remove buttons in EDIT mode', () => {
      initEditMode()

      expect(fixture.nativeElement.querySelector('#th_detail_override_action_remove_0 button').disabled).toBeFalse()
    })

    it('should remove the row when its remove button is clicked', () => {
      initEditMode()
      fixture.nativeElement.querySelector('#th_detail_override_action_remove_0 button').click()

      expect(component.overrideRows.getRawValue()).toEqual([
        { type: OverrideType.Primeng, alias: null, value: '{"a":1}' }
      ])
    })

    it('should omit a removed row from combinedFormValues', () => {
      initEditMode()
      component.removeOverride(0)

      expect(component.combinedFormValues().overrides).toEqual([{ ...validTheme.overrides![1], pos: 0 }])
    })

    it('should render an alias field for each row', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('#th_detail_override_alias_0').value).toBe('css-alias')
    })

    it('should not render a pos field', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('[id^="th_detail_override_pos"]')).toBeNull()
    })
  })

  describe('moving override rows', () => {
    function initEditMode(): void {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', threeRowTheme)
      fixture.detectChanges()
    }

    function values(): (string | null)[] {
      return component.overrideRows.controls.map((row) => row.controls.value.value)
    }

    it('should hide the move buttons in VIEW mode', () => {
      initTestComponent()
      fixture.componentRef.setInput('theme', threeRowTheme)
      fixture.detectChanges()

      expect(fixture.nativeElement.querySelector('[id^="th_detail_override_action_up_"]')).toBeNull()
    })

    it('should disable move up for the first row', () => {
      initEditMode()

      expect(fixture.nativeElement.querySelector('#th_detail_override_action_up_0 button').disabled).toBeTrue()
    })

    it('should enable move up for the other rows', () => {
      initEditMode()

      expect(fixture.nativeElement.querySelector('#th_detail_override_action_up_2 button').disabled).toBeFalse()
    })

    it('should move the row up when move up is clicked', () => {
      initEditMode()
      fixture.nativeElement.querySelector('#th_detail_override_action_up_1 button').click()

      expect(values()).toEqual(['.c1 {}', '.c0 {}', '.p0 {}'])
    })

    it('should move the row up independent of its type', () => {
      initEditMode()
      fixture.nativeElement.querySelector('#th_detail_override_action_up_2 button').click()

      expect(values()).toEqual(['.c0 {}', '.p0 {}', '.c1 {}'])
    })

    it('should move the row down when the offset is 1', () => {
      initEditMode()
      component.moveOverride(0, 1)

      expect(values()).toEqual(['.c1 {}', '.c0 {}', '.p0 {}'])
    })

    it('should send the index as pos in combinedFormValues', () => {
      initEditMode()
      component.moveOverride(2, -1)

      expect(component.combinedFormValues().overrides).toEqual([
        { type: OverrideType.Css, pos: 0, value: '.c0 {}' },
        { type: OverrideType.Primeng, pos: 1, value: '.p0 {}' },
        { type: OverrideType.Css, pos: 2, value: '.c1 {}' }
      ])
    })

    it('should not change anything when moving the first row up', () => {
      initEditMode()
      component.moveOverride(0, -1)

      expect(values()).toEqual(['.c0 {}', '.c1 {}', '.p0 {}'])
    })

    it('should not change anything when moving the last row down', () => {
      initEditMode()
      component.moveOverride(2, 1)

      expect(values()).toEqual(['.c0 {}', '.c1 {}', '.p0 {}'])
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

    it('combinedFormValues should omit rows without a value', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      component.overrideRows.at(0).controls.value.setValue('  ')
      component.overrideRows.at(1).controls.value.setValue(null)

      expect(component.combinedFormValues().overrides).toEqual([])
    })

    it('combinedFormValues should omit rows without a type', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      component.overrideRows.at(0).controls.type.setValue(null)

      expect(component.combinedFormValues().overrides).toEqual([validTheme.overrides![1]])
    })

    it('combinedFormValues should include a newly added complete row', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      component.addOverride()
      component.overrideRows.at(2).setValue({ type: OverrideType.Css, alias: null, value: '.a {}' })

      expect(component.combinedFormValues().overrides).toEqual([
        ...validTheme.overrides!,
        { type: OverrideType.Css, pos: 2, value: '.a {}' }
      ])
    })

    it('isThemeFormValid should be false when an override value exceeds the max length', () => {
      initTestComponent()
      fixture.componentRef.setInput('changeMode', 'EDIT')
      fixture.componentRef.setInput('theme', validTheme)
      fixture.detectChanges()
      component.overrideRows.at(0).controls.value.setValue('a'.repeat(65536))

      expect(component.isThemeFormValid()).toBeFalse()
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
