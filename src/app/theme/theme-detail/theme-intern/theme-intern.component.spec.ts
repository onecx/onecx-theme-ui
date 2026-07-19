import { DatePipe } from '@angular/common'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'

import { ThemeInternComponent } from './theme-intern.component'

describe('ThemeInternComponent', () => {
  let component: ThemeInternComponent
  let fixture: ComponentFixture<ThemeInternComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeInternComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: []
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeInternComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('dateFormat', 'medium')
    fixture.componentRef.setInput('theme', undefined)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('creationDate', () => {
    it('should return empty string if theme has no creationDate', () => {
      fixture.componentRef.setInput('theme', {})
      fixture.detectChanges()
      expect(component.creationDate()).toBe('')
    })

    it('should return formatted date if theme has a creationDate', () => {
      fixture.componentRef.setInput('theme', { creationDate: '2024-01-15T10:00:00.000Z' })
      fixture.detectChanges()
      expect(component.creationDate()).toBeTruthy()
    })

    it('should return empty string if datePipe returns null for creationDate', () => {
      spyOn(DatePipe.prototype, 'transform').and.returnValue(null)
      fixture.componentRef.setInput('theme', { creationDate: '2024-01-15T10:00:00.000Z' })
      fixture.detectChanges()
      expect(component.creationDate()).toBe('')
    })
  })

  describe('modificationDate', () => {
    it('should return empty string if theme has no modificationDate', () => {
      fixture.componentRef.setInput('theme', {})
      fixture.detectChanges()
      expect(component.modificationDate()).toBe('')
    })

    it('should return formatted date if theme has a modificationDate', () => {
      fixture.componentRef.setInput('theme', { modificationDate: '2024-01-15T10:00:00.000Z' })
      fixture.detectChanges()
      expect(component.modificationDate()).toBeTruthy()
    })

    it('should return empty string if datePipe returns null for modificationDate', () => {
      spyOn(DatePipe.prototype, 'transform').and.returnValue(null)
      fixture.componentRef.setInput('theme', { modificationDate: '2024-01-15T10:00:00.000Z' })
      fixture.detectChanges()
      expect(component.modificationDate()).toBe('')
    })

    it('should use default format', () => {
      fixture.componentRef.setInput('theme', {
        modificationDate: '2024-01-15T00:00:00.000Z',
        creationDate: '2024-01-15T00:00:00.000Z'
      })
      fixture.componentRef.setInput('dateFormat', undefined)
      fixture.detectChanges()
      expect(component.modificationDate()).toBeTruthy()
      expect(component.creationDate()).toBeTruthy()
    })
  })
})
