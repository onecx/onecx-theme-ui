import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { ThemeUseComponent } from './theme-use.component'

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
      providers: [provideRouter([]), { provide: WorkspaceService, useValue: workspaceServiceSpy }]
    }).compileComponents()
  }))

  beforeEach(() => {
    spyOn(console, 'error')
    workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(false))

    fixture = TestBed.createComponent(ThemeUseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('getWorkspaceEndpointUrl', () => {
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

      const eu$ = component.getWorkspaceEndpointUrl$('name')

      eu$.subscribe({
        next: (data) => {
          expect(data).toBeUndefined()
          done()
        },
        error: done.fail
      })
    })
  })
})
