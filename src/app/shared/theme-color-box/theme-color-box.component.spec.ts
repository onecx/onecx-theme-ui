import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ThemeColorBoxComponent } from './theme-color-box.component'

const colorProperties = {
  general: {
    'primary-color': 'lightgray',
    'secondary-color': 'silver',
    'text-color': 'black',
    'body-bg-color': 'lightgray',
    'content-bg-color': 'white'
  },
  topbar: {
    'topbar-text-color': 'darkgray',
    'topbar-bg-color': 'lightgray'
  },
  sidebar: {
    'menu-item-text-color': 'black',
    'menu-bg-color': 'silver'
  }
}

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

  describe('creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should create with properties', () => {
      fixture.componentRef.setInput(
        'properties',
        '{"general": {"primary-color": "lightgray"}, "topbar": {"topbar-text-color": "darkgray"}, "sidebar": {"menu-text-color": "black"}}'
      )
      fixture.detectChanges()
      expect(component).toBeTruthy()
    })
  })

  describe('signals', () => {
    it('should compute signals', () => {
      fixture.componentRef.setInput('properties', colorProperties)
      fixture.detectChanges()

      expect(component.generalProperties()).toEqual(colorProperties.general)
      expect(component.topbarProperties()).toEqual(colorProperties.topbar)
      expect(component.sidebarProperties()).toEqual(colorProperties.sidebar)
    })
  })
})
