import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ThemeCssComponent } from './theme-css.component'

describe('ThemeCssComponent', () => {
  let component: ThemeCssComponent
  let fixture: ComponentFixture<ThemeCssComponent>

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeCssComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('changeMode', 'VIEW')
    fixture.componentRef.setInput('theme', undefined)
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeCssComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [provideNoopAnimations()]
    }).compileComponents()
  }))

  it('should create', () => {
    initTestComponent()
    expect(component).toBeTruthy()
  })

  it('should clear the form entries when theme is undefined', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ ctx: 'content' }) })
    fixture.detectChanges()
    expect(component.entries.length).toBe(1)

    fixture.componentRef.setInput('theme', undefined)
    fixture.detectChanges()
    expect(component.entries.length).toBe(0)
  })

  it('should display no entries when customCssVariables is undefined', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', {})
    fixture.detectChanges()
    expect(component.entries.length).toBe(0)
  })

  it('should display no entries when customCssVariables is not valid JSON', () => {
    initTestComponent()
    spyOn(console, 'error')
    fixture.componentRef.setInput('theme', { customCssVariables: 'not-json' })
    fixture.detectChanges()
    expect(component.entries.length).toBe(0)
    expect(console.error).toHaveBeenCalled()
  })

  it('should display no entries when customCssVariables is a JSON array', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify(['a', 'b']) })
    fixture.detectChanges()
    expect(component.entries.length).toBe(0)
  })

  it('should create one entry per top-level property with string content as-is', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: '--my-var: red;' }) })
    fixture.detectChanges()
    expect(component.entries.length).toBe(1)
    expect(component.entries[0].get('context')?.value).toBe('shell')
    expect(component.entries[0].get('content')?.value).toBe('--my-var: red;')
  })

  it('should stringify non-string content values', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: { 'my-var': 'red' } }) })
    fixture.detectChanges()
    expect(component.entries[0].get('content')?.value).toBe(JSON.stringify({ 'my-var': 'red' }, null, 2))
  })

  it('should disable the form fields in VIEW mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()
    expect(component.cssForm.disabled).toBeTrue()
  })

  it('should enable the form fields in EDIT mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()
    expect(component.cssForm.disabled).toBeFalse()
  })

  it('should add a new empty entry when onAddEntry is called in EDIT mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    component.onAddEntry()

    expect(component.entries.length).toBe(2)
    expect(component.entries[1].get('context')?.value).toBe('')
    expect(component.entries[1].get('content')?.value).toBe('')
  })

  it('should not add a new entry when onAddEntry is called in VIEW mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    component.onAddEntry()

    expect(component.entries.length).toBe(1)
  })

  it('should remove an entry when onRemoveEntry is called in EDIT mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value', other: 'value2' }) })
    fixture.detectChanges()

    component.onRemoveEntry(0)

    expect(component.entries.length).toBe(1)
    expect(component.entries[0].get('context')?.value).toBe('other')
  })

  it('should not remove an entry when onRemoveEntry is called in VIEW mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    component.onRemoveEntry(0)

    expect(component.entries.length).toBe(1)
  })

  it('should mark the form invalid when two entries share the same context', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    component.onAddEntry()
    component.entries[1].get('context')?.setValue('shell')

    expect(component.cssForm.errors?.['duplicateContext']).toBeTrue()
    expect(component.isThemeFormValid()).toBeFalse()
  })

  it('should mark the form invalid when a context is empty', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    component.entries[0].get('context')?.setValue('')

    expect(component.isThemeFormValid()).toBeFalse()
  })

  it('should mark the form valid when all contexts are set and unique', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    expect(component.isThemeFormValid()).toBeTrue()
  })

  it('should treat a missing context value as an empty string when checking for duplicates', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    // emitEvent: false avoids recomputing combinedFormValues, which assumes a non-null context
    component.entries[0].get('context')?.setValue(null, { emitEvent: false })

    expect(component.cssForm.errors).toBeNull()
  })

  it('should combine entries back into the customCssVariables JSON string', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', { customCssVariables: JSON.stringify({ shell: 'value' }) })
    fixture.detectChanges()

    component.entries[0].get('content')?.setValue('updated-value')

    expect(component.combinedFormValues().customCssVariables).toBe(JSON.stringify({ shell: 'updated-value' }, null, 2))
  })

  it('should return undefined customCssVariables when there are no entries', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.componentRef.setInput('theme', {})
    fixture.detectChanges()

    expect(component.combinedFormValues().customCssVariables).toBeUndefined()
  })
})
