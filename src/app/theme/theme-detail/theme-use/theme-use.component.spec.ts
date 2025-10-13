import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { ThemeUseComponent, Workspace } from './theme-use.component'

describe('ThemeUseComponent', () => {
  let component: ThemeUseComponent
  let fixture: ComponentFixture<ThemeUseComponent>

  const workspaceService = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['doesUrlExistFor', 'getUrl'])
  const workspaceServiceSpy = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['doesUrlExistFor', 'getUrl'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeUseComponent],
      imports: [
        TranslateModule.forRoot(),
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [TranslateService, { provide: WorkspaceService, useValue: workspaceServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeUseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
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

  describe('getEndpointUrl', () => {
    beforeEach(() => {
      workspaceService.getUrl.calls.reset()
      component.themeName = 'theme'
    })

    it('should workspaceEndpointExist - exist', (done) => {
      component.workspaceEndpointExist = true
      workspaceServiceSpy.getUrl.and.returnValue(of('/url'))

      const eu$ = component.getEndpointUrl$('name')

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

      const eu$ = component.getEndpointUrl$('name')

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
