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

  describe('computed signals', () => {
    describe('with default input', () => {
      it('should return the default generalProperties', () => {
        expect(component.generalProperties()).toEqual({
          'primary-color': 'gray',
          'secondary-color': 'silver',
          'text-color': 'black',
          'body-bg-color': 'lightgray',
          'content-bg-color': 'white'
        })
      })

      it('should return the default topbarProperties', () => {
        expect(component.topbarProperties()).toEqual({
          'topbar-text-color': 'darkgray',
          'topbar-bg-color': 'lightgray'
        })
      })

      it('should return the default sidebarProperties', () => {
        expect(component.sidebarProperties()).toEqual({
          'menu-item-text-color': 'black',
          'menu-bg-color': 'silver'
        })
      })
    })

    describe('with explicit properties input', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('properties', colorProperties)
      })

      it('should return generalProperties from the general section of the input', () => {
        expect(component.generalProperties()).toEqual(colorProperties.general)
      })

      it('should return topbarProperties from the topbar section of the input', () => {
        expect(component.topbarProperties()).toEqual(colorProperties.topbar)
      })

      it('should return sidebarProperties from the sidebar section of the input', () => {
        expect(component.sidebarProperties()).toEqual(colorProperties.sidebar)
      })
    })

    describe('with missing properties sections', () => {
      beforeEach(() => {
        fixture.componentRef.setInput('properties', {})
      })

      it('should return undefined for generalProperties when the general section is absent', () => {
        expect(component.generalProperties()).toBeUndefined()
      })

      it('should return undefined for topbarProperties when the topbar section is absent', () => {
        expect(component.topbarProperties()).toBeUndefined()
      })

      it('should return undefined for sidebarProperties when the sidebar section is absent', () => {
        expect(component.sidebarProperties()).toBeUndefined()
      })
    })
  })
})
