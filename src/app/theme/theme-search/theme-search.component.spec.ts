import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'

import { DataSortDirection, RowListGridData } from '@onecx/angular-accelerator'
import { providePermissionService } from '@onecx/angular-utils'

import { SearchThemeResponse, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeSearchComponent } from './theme-search.component'
import { provideNoopAnimations } from '@angular/platform-browser/animations'

describe('ThemeSearchComponent', () => {
  let component: ThemeSearchComponent
  let fixture: ComponentFixture<ThemeSearchComponent>

  const themesApiSpy = { searchThemes: jasmine.createSpy('searchThemes').and.returnValue(of({})) }

  function initTestComponent(): void {
    fixture = TestBed.createComponent(ThemeSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        providePermissionService(),
        provideNoopAnimations(),
        provideRouter([{ path: '', component: ThemeSearchComponent }])
      ]
    })
      .overrideComponent(ThemeSearchComponent, {
        add: {
          providers: [{ provide: ThemesAPIService, useValue: themesApiSpy }]
        }
      })
      .compileComponents()
  })

  beforeEach(() => {
    // reset spy BEFORE creating component so initTestComponent uses neutral value
    themesApiSpy.searchThemes.calls.reset()
    themesApiSpy.searchThemes.and.returnValue(of({}))
    initTestComponent()
  })

  describe('initialization', () => {
    it('should create', () => {
      fixture.detectChanges()
      expect(component).toBeTruthy()
    })

    it('should load themes on initialization', (done) => {
      const themesResponse = {
        stream: [
          { name: 'theme1', displayName: 'Theme 1' },
          { name: 'theme2', displayName: 'Theme 2' }
        ]
      }
      themesApiSpy.searchThemes.and.returnValue(of(themesResponse as SearchThemeResponse))
      component.loadThemes()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result).toHaveSize(2)
            expect(result[0]['name']).toEqual('theme1')
            expect(result[1]['name']).toEqual('theme2')
          }
          done()
        },
        error: done.fail
      })
    })

    it('should init actions on initialization - size', () => {
      let actions: any = []

      component.actions$!.subscribe((act) => (actions = act))

      expect(actions).toHaveSize(2)
    })

    it('should init actions on initialization - create', () => {
      let actions: any = []

      component.actions$!.subscribe((act) => (actions = act))
      actions[0].actionCallback()

      expect(component.themeCreateVisible()).toBeTrue()
    })

    it('should init actions on initialization - import', () => {
      let actions: any = []
      spyOn(component, 'onImportThemeClick')

      component.actions$!.subscribe((act) => (actions = act))
      actions[1].actionCallback()

      expect(component.onImportThemeClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('search on init', () => {
    it('should manage no themes exists', (done) => {
      themesApiSpy.searchThemes.and.returnValue(of({ stream: [] } as SearchThemeResponse))
      component.loadThemes()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result).toHaveSize(0)
          }
          done()
        },
        error: done.fail
      })
    })

    it('should manage known server error', (done) => {
      const errorResponse = { status: 403, statusText: 'No permissions' }
      themesApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.loadThemes()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result).toHaveSize(0)
            expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
            expect(component.exceptionKey()).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.THEME')
          }
          done()
        },
        error: done.fail
      })
    })

    it('should manage unknown server error', (done) => {
      const errorResponse = { status: 405, statusText: 'something went wrong' }
      themesApiSpy.searchThemes.and.returnValue(throwError(() => errorResponse))
      spyOn(console, 'error')
      component.loadThemes()

      component.data$.subscribe({
        next: (result) => {
          if (result) {
            expect(result).toHaveSize(0)
            // maped to unknown error status code 0
            expect(component.exceptionKey()).toEqual('EXCEPTIONS.HTTP_STATUS_0.THEME')
          }
          done()
        },
        error: done.fail
      })
      expect(console.error).toHaveBeenCalledWith('searchThemes', errorResponse)
    })
  })

  it('should change field to sort by on sort change', () => {
    component.sortField = 'name'

    component.onSortChange({ sortColumn: 'description', sortDirection: DataSortDirection.DESCENDING })

    expect(component.sortField).toBe('description')
  })

  it('should show import dialog on import theme click', () => {
    component.themeImportVisible.set(false)
    component.onImportThemeClick()

    expect(component.themeImportVisible()).toBe(true)
  })

  it('should hide import dialog on import close and reload', () => {
    spyOn(component, 'loadThemes')

    component.themeImported.set(true)
    fixture.detectChanges()

    expect(component.loadThemes).toHaveBeenCalledTimes(1)
  })

  it('should navigate to created theme on theme creation', () => {
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true))

    component.onThemeCreation({ name: 'new-theme' } as Theme)
    fixture.detectChanges()

    expect(router.navigate).toHaveBeenCalledWith(['./new-theme'], { relativeTo: (component as any).route })
  })

  describe('filter data', () => {
    const itemData = [
      { name: 'onecx', displayName: 'OneCX', description: 'OneCX theme' },
      { name: 'user', displayName: 'User', description: 'User theme' }
    ] as unknown as RowListGridData[]

    it('should return early if data is not provided', () => {
      component.onGlobalFilter('test', undefined)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData()).toBeUndefined()
    })

    it('should set filteredData to full data when value is empty', () => {
      component.onGlobalFilter('', itemData)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData()).toBeUndefined()
    })

    it('should set filteredData to full data when value is undefined', () => {
      component.onGlobalFilter(undefined, itemData)

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData()).toBeUndefined()
    })

    it('should filter data by title field (case-insensitive)', () => {
      component.onGlobalFilter('one', itemData)

      expect(component.globalFilterValue).toBe('one')
      expect(component.filteredData()?.length).toBe(1)
      expect((component.filteredData()?.[0] as any).name).toBe('onecx')
    })

    it('should return empty array when no title matches', () => {
      component.onGlobalFilter('nonexistent', itemData)

      expect(component.globalFilterValue).toBe('nonexistent')
      expect(component.filteredData()?.length).toBe(0)
    })

    it('should clear global filter and reset filteredData', () => {
      component.globalFilterValue = 'some filter'
      component.filteredData.set(itemData as RowListGridData[])

      component.onClearGlobalFilter()

      expect(component.globalFilterValue).toBe('')
      expect(component.filteredData()).toBeUndefined()
    })
  })

  describe('conversion', () => {
    it('should convert rows to Themes', () => {
      const theme = { name: 'onecx', displayName: 'OneCX', description: 'OneCX theme' } as Theme
      const rows: RowListGridData[] = [theme as unknown as RowListGridData]

      const themes = component.convertToThemes(rows)

      expect(themes).toEqual([theme])
    })

    it('should return undefined when data is undefined', () => {
      const themes = component.convertToThemes(undefined)

      expect(themes).toBeUndefined()
    })
  })
})
