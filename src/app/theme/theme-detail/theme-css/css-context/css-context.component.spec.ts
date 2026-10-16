import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { FormControl, FormGroup } from '@angular/forms'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { CssContextComponent } from './css-context.component'

describe('CssContextComponent', () => {
  let component: CssContextComponent
  let fixture: ComponentFixture<CssContextComponent>

  function initTestComponent(): void {
    fixture = TestBed.createComponent(CssContextComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput(
      'group',
      new FormGroup({
        context: new FormControl('shell'),
        content: new FormControl('--my-var: red;')
      })
    )
    fixture.componentRef.setInput('changeMode', 'VIEW')
    fixture.componentRef.setInput('index', 0)
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
      ]
    }).compileComponents()
  }))

  it('should create', () => {
    initTestComponent()
    expect(component).toBeTruthy()
  })

  it('should display the context and content as text in VIEW mode', () => {
    initTestComponent()
    expect(component.group().get('context')?.value).toBe('shell')
    expect(component.group().get('content')?.value).toBe('--my-var: red;')
  })

  it('should render editable controls in EDIT mode', () => {
    initTestComponent()
    fixture.componentRef.setInput('changeMode', 'EDIT')
    fixture.detectChanges()
    expect(component.changeMode()).toBe('EDIT')
  })

  it('should emit remove when onRemove is called', () => {
    initTestComponent()
    spyOn(component.remove, 'emit')

    component.onRemove()

    expect(component.remove.emit).toHaveBeenCalled()
  })
})
