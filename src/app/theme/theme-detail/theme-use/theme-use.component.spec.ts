import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of } from 'rxjs'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { ThemeUseComponent, Workspace } from './theme-use.component'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

describe('ThemeUseComponent', () => {
  let component: ThemeUseComponent
  let fixture: ComponentFixture<ThemeUseComponent>

  const workspaceServiceSpy = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['doesUrlExistFor', 'getUrl'])

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeUseComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ThemeUseComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('de')
      ],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: WorkspaceService, useValue: workspaceServiceSpy }
      ]
    }).compileComponents()
  })

  beforeEach(() => {
    spyOn(console, 'error')
    workspaceServiceSpy.doesUrlExistFor.calls.reset()
    workspaceServiceSpy.getUrl.calls.reset()
    workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(false))
    workspaceServiceSpy.getUrl.and.returnValue(of(''))
  })

  it('should create', () => {
    initTestComponent()

    expect(component).toBeTruthy()
  })

  describe('workspaceEndpointExist', () => {
    it('should be false when the endpoint does not exist', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(false))
      initTestComponent()

      expect(component.workspaceEndpointExist()).toBeFalse()
    })

    it('should be true when the endpoint exists', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      initTestComponent()

      expect(component.workspaceEndpointExist()).toBeTrue()
    })
  })

  describe('workspaceUrls', () => {
    it('should resolve an empty map when the endpoint does not exist', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(false))
      initTestComponent()
      fixture.componentRef.setInput('workspaces', [{ name: 'ws1', displayName: 'Workspace 1' } as Workspace])
      fixture.detectChanges()

      expect(component.workspaceUrls().size).toBe(0)
      expect(workspaceServiceSpy.getUrl).not.toHaveBeenCalled()
    })

    it('should resolve an empty map when there are no workspaces', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      initTestComponent()
      fixture.componentRef.setInput('workspaces', [])
      fixture.detectChanges()

      expect(component.workspaceUrls().size).toBe(0)
    })

    it('should resolve a url per workspace when the endpoint exists', () => {
      workspaceServiceSpy.doesUrlExistFor.and.returnValue(of(true))
      workspaceServiceSpy.getUrl.and.returnValue(of('/workspace/ws1'))
      initTestComponent()
      fixture.componentRef.setInput('workspaces', [{ name: 'ws1', displayName: 'Workspace 1' } as Workspace])
      fixture.detectChanges()

      expect(component.workspaceUrls().get('ws1')).toBe('/workspace/ws1')
    })
  })
})
