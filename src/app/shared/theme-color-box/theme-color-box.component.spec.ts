import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ThemeColorBoxComponent } from './theme-color-box.component'

describe('ThemeColorBoxComponent', () => {
  let component: ThemeColorBoxComponent
  let fixture: ComponentFixture<ThemeColorBoxComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeColorBoxComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: []
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeColorBoxComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should create', () => {
    fixture.componentRef.setInput(
      'properties',
      '{"general": {"primary-color": "lightgray"}, "topbar": {"topbar-text-color": "darkgray"}, "sidebar": {"menu-text-color": "black"}}'
    )
    fixture.detectChanges()
    expect(component).toBeTruthy()
  })
})
