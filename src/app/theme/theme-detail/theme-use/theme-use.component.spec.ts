import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { slotInitializer, ThemeUseComponent, Workspace } from './theme-use.component'
import { SlotService } from '@onecx/angular-remote-components'

describe('ThemeUseComponent', () => {
  let component: ThemeUseComponent
  let fixture: ComponentFixture<ThemeUseComponent>

  const workspaceServiceSpy = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['doesUrlExistFor', 'getUrl'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeUseComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [{ provide: WorkspaceService, useValue: workspaceServiceSpy }]
    })
      .overrideComponent(ThemeUseComponent, {
        set: {
          template: '',
          imports: []
        }
      })
      .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeUseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('slotInitializer', () => {
    let slotService: jasmine.SpyObj<SlotService>

    beforeEach(() => {
      slotService = jasmine.createSpyObj('SlotService', ['init'])
    })

    it('should call SlotService.init', () => {
      const initializer = slotInitializer(slotService)
      initializer()

      expect(slotService.init).toHaveBeenCalled()
    })
  })

  describe('on changes', () => {
    beforeEach(() => {
      component.themeName = 'theme'
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      component.ngOnChanges()
    })

    it('should emit true', () => {
      component.slotEmitter.emit([{ name: 'name' } as Workspace])
    })

    it('should emit false', () => {
      component.slotEmitter.emit([])
    })
  })

  describe('getWorkspaceEndpointUrl', () => {
    beforeEach(() => {
      component.themeName = 'theme'
    })

    it('should workspaceEndpointExist - exist', (done) => {
      component.workspaceEndpointExist = true
      workspaceServiceSpy.getUrl.and.returnValue(of('/url'))

      const eu$ = component.getWorkspaceEndpointUrl$('name')

      eu$.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBe('/url')
          }
          done()
        },
        error: done.fail
      })
    })

    it('should workspaceEndpointExist - not exist', (done) => {
      component.workspaceEndpointExist = false
      const errorResponse = { status: 400, statusText: 'Error on check endpoint' }
      workspaceServiceSpy.getUrl.and.returnValue(throwError(() => errorResponse))

      const eu$ = component.getWorkspaceEndpointUrl$('name')

      eu$.subscribe({
        next: (data) => {
          if (data) {
            expect(data).toBeFalse()
          }
          done()
        },
        error: done.fail
      })
    })
  })
})
