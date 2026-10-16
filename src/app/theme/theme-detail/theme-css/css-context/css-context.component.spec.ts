import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { FormControl, FormGroup } from '@angular/forms'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { CssContextComponent } from './css-context.component'

describe('CssContextComponent', () => {
  let component: CssContextComponent
  let fixture: ComponentFixture<CssContextComponent>

  function createGroup(): FormGroup {
    return new FormGroup({
      context: new FormControl('shell'),
      content: new FormControl(JSON.stringify({ '--my-var': 'red' }, null, 2))
    })
  }

  function initTestComponent(): void {
    fixture = TestBed.createComponent(CssContextComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('group', createGroup())
    fixture.componentRef.setInput('changeMode', 'VIEW')
    fixture.componentRef.setInput('index', 0)
    fixture.detectChanges()
  }

  function setChangeMode(mode: 'VIEW' | 'EDIT'): void {
    fixture.componentRef.setInput('changeMode', mode)
    fixture.detectChanges()
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CssContextComponent,
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

  it('should display the context and content as plain text in VIEW mode', () => {
    initTestComponent()

    const header: HTMLElement = fixture.nativeElement.querySelector('#th_detail_css_card_0_header')
    expect(header.textContent).toContain('shell')
    const content: HTMLElement = fixture.nativeElement.querySelector('#th_detail_css_card_0_content')
    expect(content.textContent).toContain('"--my-var": "red"')

    // no editable context input and no remove action are rendered in VIEW mode
    expect(fixture.nativeElement.querySelector('#th_detail_css_card_0_context')).toBeNull()
    expect(fixture.nativeElement.querySelector('#th_detail_css_card_0_action_remove')).toBeNull()
  })

  it('should render editable controls and the remove action in EDIT mode', () => {
    initTestComponent()
    setChangeMode('EDIT')

    expect(component.changeMode()).toBe('EDIT')
    expect(fixture.nativeElement.querySelector('#th_detail_css_card_0_context')).toBeTruthy()
    const textarea: HTMLElement = fixture.nativeElement.querySelector('#th_detail_css_card_0_content')
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(fixture.nativeElement.querySelector('#th_detail_css_card_0_action_remove')).toBeTruthy()
  })

  it('should show the invalid content error message in EDIT mode when content is not a valid JSON object', () => {
    initTestComponent()
    setChangeMode('EDIT')
    component.group().get('content')?.setErrors({ invalidJson: true })
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('#th_detail_css_card_0_content_error')).toBeTruthy()
  })

  it('should not show the invalid content error message in EDIT mode when content is a valid JSON object', () => {
    initTestComponent()
    setChangeMode('EDIT')
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector('#th_detail_css_card_0_content_error')).toBeFalsy()
  })

  it('should emit remove when the remove action is clicked', () => {
    initTestComponent()
    setChangeMode('EDIT')

    const removeSpy = spyOn(component.remove, 'emit')
    const action: HTMLElement = fixture.nativeElement.querySelector('#th_detail_css_card_0_action_remove')
    action.querySelector('button')?.click() ?? action.click()
    fixture.detectChanges()

    expect(removeSpy).toHaveBeenCalled()
  })

  it('should call the bound remove output from onRemove()', () => {
    initTestComponent()

    const removeSpy = spyOn(component.remove, 'emit')
    component.onRemove()

    expect(removeSpy).toHaveBeenCalled()
  })
})
