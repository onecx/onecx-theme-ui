import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ThemeInternComponent } from './theme-intern.component'

describe('ThemeInternComponent', () => {
  let component: ThemeInternComponent
  let fixture: ComponentFixture<ThemeInternComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeInternComponent],
      imports: [
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [TranslateService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeInternComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should set operator to false if theme is not provided', () => {
    component.ngOnChanges()
    expect(component.operator).toBeFalse()
  })

  it('should set operator to theme.operator if theme is provided', () => {
    component.theme = { operator: true }
    component.ngOnChanges()
    expect(component.operator).toBeTrue()
  })

  it('should set operator to false if theme is provided', () => {
    component.theme = { operator: undefined }
    component.ngOnChanges()
    expect(component.operator).toBeFalse()
  })
})
