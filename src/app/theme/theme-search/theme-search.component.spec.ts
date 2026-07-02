import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { DataSortDirection } from '@onecx/angular-accelerator'

import { SearchThemeResponse, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeSearchComponent } from './theme-search.component'

describe('ThemeSearchComponent', () => {
  let component: ThemeSearchComponent
  let fixture: ComponentFixture<ThemeSearchComponent>

  const themeApiSpy = { searchThemes: jasmine.createSpy('searchThemes').and.returnValue(of({})) }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        ThemeSearchComponent,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClientTesting(),
        provideHttpClient(),
        provideRouter([{ path: '', component: ThemeSearchComponent }]),
        { provide: ThemesAPIService, useValue: themeApiSpy }
      ]
    })
      .overrideComponent(ThemeSearchComponent, {
        set: {
          template: '',
          imports: []
        }
      })
      .compileComponents()
    // to spy data: reset
    themeApiSpy.searchThemes.calls.reset()
    // to spy data: refill with neutral data
    themeApiSpy.searchThemes.and.returnValue(of({}))
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeSearchComponent)
    component = fixture.componentInstance
    themeApiSpy.searchThemes.and.returnValue(of({}) as any)
  })

  afterEach(() => {
    themeApiSpy.searchThemes.calls.reset()
  })

  describe('initialization', () => {
    it('should create', () => {
      fixture.detectChanges()
      expect(component).toBeTruthy()
    })

    it('should load themes and init actions on initialization', (done) => {
      const themesResponse = {
        stream: [
          { name: 'theme1', displayName: 'Theme 1' },
          { name: 'theme2', displayName: 'Theme 2' }
        ]
      }
      themeApiSpy.searchThemes.and.returnValue(of(themesResponse as SearchThemeResponse))
      fixture.detectChanges()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result.length).toBe(2)
            expect(result[0]['name']).toEqual('theme1')
            expect(result[1]['name']).toEqual('theme2')
          }
          done()
        },
        error: done.fail
      })

      let actions: any = []
      component.actions$!.subscribe((act) => (actions = act))
      expect(actions.length).toBe(2)

      actions[0].actionCallback()
      expect(component.themeCreateVisible).toBe(true)

      spyOn(component, 'onImportThemeClick')
      actions[1].actionCallback()
      expect(component.onImportThemeClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('search on init', () => {
    it('should manage no themes exists', (done) => {
      themeApiSpy.searchThemes.and.returnValue(of({ stream: [] } as SearchThemeResponse))
      fixture.detectChanges()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result.length).toBe(0)
          }
          done()
        },
        error: done.fail
      })
    })

    it('should manage known server error', (done) => {
      const errorResponse = { status: 403, statusText: 'No permissions' }
      themeApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      fixture.detectChanges()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result.length).toBe(0)
            expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.THEME')
          }
          done()
        },
        error: done.fail
      })
    })

    it('should manage unknown server error', (done) => {
      const errorResponse = { status: 405, statusText: 'something went wrong' }
      themeApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      fixture.detectChanges()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result.length).toBe(0)
            expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
            expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_405.THEME')
          }
          done()
        },
        error: done.fail
      })
    })
  })

  it('should change field to sort by on sort change', () => {
    fixture.detectChanges()
    component.sortField = 'name'

    component.onSortChange({ sortColumn: 'description', sortDirection: DataSortDirection.DESCENDING })

    expect(component.sortField).toBe('description')
  })

  it('should show import dialog on import theme click', () => {
    fixture.detectChanges()
    component.themeImportVisible = false
    component.onImportThemeClick()
    expect(component.themeImportVisible).toBe(true)
  })
  it('should hide import dialog on import close', () => {
    fixture.detectChanges()
    component.themeImportVisible = true
    component.onThemeUpload(false)
    expect(component.themeImportVisible).toBe(false)
  })
  it('should hide import dialog on import close and reload', () => {
    fixture.detectChanges()
    spyOn(component, 'loadThemes')
    component.themeImportVisible = true
    component.onThemeUpload(true)
    expect(component.themeImportVisible).toBe(false)
    expect(component.loadThemes).toHaveBeenCalledTimes(1)
  })

  it('should set themeCreateVisible on onThemeCreateClosed', () => {
    fixture.detectChanges()
    component.themeCreateVisible = true
    component.onThemeCreateClosed(false)
    expect(component.themeCreateVisible).toBe(false)

    component.onThemeCreateClosed(true)
    expect(component.themeCreateVisible).toBe(true)
  })

  it('should navigate to created theme on onThemeCreated', () => {
    fixture.detectChanges()
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')

    component.onThemeCreated({ name: 'new-theme' })

    expect(router.navigate).toHaveBeenCalledWith(['./new-theme'], { relativeTo: (component as any).route })
  })
})
