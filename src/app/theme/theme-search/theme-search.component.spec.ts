import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { of, throwError } from 'rxjs'
import { DataViewModule } from 'primeng/dataview'

import { GetThemesResponse, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeSearchComponent } from './theme-search.component'

describe('ThemeSearchComponent', () => {
  let component: ThemeSearchComponent
  let fixture: ComponentFixture<ThemeSearchComponent>

  const themeApiSpy = { getThemes: jasmine.createSpy('getThemes').and.returnValue(of({})) }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeSearchComponent],
      imports: [
        DataViewModule,
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
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
    // to spy data: reset
    themeApiSpy.getThemes.calls.reset()
    // to spy data: refill with neutral data
    themeApiSpy.getThemes.and.returnValue(of({}))
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should load themes and translations on initialization', (done) => {
    const translateService = TestBed.inject(TranslateService)
    const actionsTranslations = {
      'ACTIONS.CREATE.THEME': 'actionsCreateTheme',
      'ACTIONS.CREATE.THEME.TOOLTIP': 'actionsCreateThemeTooltip',
      'ACTIONS.IMPORT.LABEL': 'actionsImportLabel',
      'ACTIONS.IMPORT.TOOLTIP': 'actionsImportTooltip'
    }
    const generalTranslations = {
      'THEME.NAME': 'themeName',
      'THEME.DESCRIPTION': 'themeDescription',
      'SEARCH.SORT_BY': 'searchSort',
      'SEARCH.FILTER': 'searchFilter',
      'SEARCH.FILTER_OF': 'searchFilterOf',
      'SEARCH.SORT_DIRECTION_ASC': 'searchSortDirectionsAsc',
      'SEARCH.SORT_DIRECTION_DESC': 'searchSortDirectionDesc',
      'GENERAL.TOOLTIP.VIEW_MODE_GRID': 'generalTooltipViewModeGrid',
      'GENERAL.TOOLTIP.VIEW_MODE_LIST': 'generalTooltipViewModeList',
      'GENERAL.TOOLTIP.VIEW_MODE_TABLE': 'generalTooltipViewModeTable'
    }
    spyOn(translateService, 'get').and.returnValues(of(actionsTranslations), of(generalTranslations))
    const themesResponse = {
      stream: [
        { name: 'theme1', displayName: 'Theme 1' },
        { name: 'theme2', displayName: 'Theme 2' }
      ]
    }
    themeApiSpy.getThemes.and.returnValue(of(themesResponse as GetThemesResponse))

    component.ngOnInit()

    component.themes$.subscribe({
      next: (result) => {
        if (result) {
          expect(result.length).toBe(2)
          expect(result[0].name).toEqual('theme1')
          expect(result[1].name).toEqual('theme2')
        }
        done()
      },
      error: done.fail
    })

    let actions: any = []
    component.actions$!.subscribe((act) => (actions = act))
    expect(actions.length).toBe(2)

    spyOn(component, 'onNewTheme')
    actions[0].actionCallback()
    expect(component.onNewTheme).toHaveBeenCalledTimes(1)

    spyOn(component, 'onImportThemeClick')
    actions[1].actionCallback()
    expect(component.onImportThemeClick).toHaveBeenCalledTimes(1)
  })

  it('should search themes without results', (done) => {
    themeApiSpy.getThemes.and.returnValue(of({ stream: [] } as GetThemesResponse))

    component.ngOnInit()

    component.themes$.subscribe({
      next: (result) => {
        if (result) {
          expect(result.length).toBe(0)
        }
        done()
      },
      error: done.fail
    })
  })

  it('should search themes but display error if API call fails', (done) => {
    const errorResponse = { status: 403, statusText: 'No permissions' }
    themeApiSpy.getThemes.and.returnValue(throwError(() => errorResponse))
    spyOn(console, 'error')

    component.ngOnInit()

    component.themes$.subscribe({
      next: (result) => {
        if (result) {
          expect(result.length).toBe(0)
          expect(console.error).toHaveBeenCalledWith('getThemes', errorResponse)
          expect(component.exceptionKey).toEqual('EXCEPTIONS.HTTP_STATUS_' + errorResponse.status + '.THEMES')
        }
        done()
      },
      error: done.fail
    })
  })

  it('should get the logo url: theme undefined', () => {
    const result = component.getLogoUrl(undefined)

    expect(result).toBeUndefined()
  })

  it('should get the logo url: logoUrl present', () => {
    const result = component.getLogoUrl({ logoUrl: 'theme' })

    expect(result).toBe('theme')
  })

  it('should get the logo url: logoUrl empty', () => {
    const result = component.getLogoUrl({ logoUrl: '' })

    expect(result).toBe('')
  })

  it('should navigate to theme detail on new theme callback', () => {
    const router = TestBed.inject(Router)
    spyOn(router, 'navigate')
    component.onNewTheme()
    expect(router.navigate).toHaveBeenCalledOnceWith(['./new'], jasmine.any(Object))
  })

  it('should change viewMode on layout change', () => {
    expect(component.viewMode).toBe('grid')
    component.onLayoutChange('list')
    expect(component.viewMode).toBe('list')
  })

  it('should filter dataView on filter change', () => {
    component.dv = jasmine.createSpyObj('DataView', ['filter'])
    component.filter = ''
    const myFilter = 'myTheme'
    component.onFilterChange(myFilter)
    expect(component.filter).toBe(myFilter)
    expect(component.dv!.filter).toHaveBeenCalledOnceWith(myFilter, 'contains')
  })

  it('should change field to sort by on sort change', () => {
    component.sortField = 'name'
    component.onSortChange('description')
    expect(component.sortField).toBe('description')
  })

  it('should change sorting direction on sorting direction change', () => {
    component.sortOrder = 1
    component.onSortDirChange(true)
    expect(component.sortOrder).toBe(-1)
    component.onSortDirChange(false)
    expect(component.sortOrder).toBe(1)
  })

  it('should show import dialog on import theme click', () => {
    component.importDialogVisible = false
    component.onImportThemeClick()
    expect(component.importDialogVisible).toBe(true)
  })
  it('should hide import dialog on import close', () => {
    component.importDialogVisible = true
    component.onThemeUpload(false)
    expect(component.importDialogVisible).toBe(false)
  })
  it('should hide import dialog on import close and reload', () => {
    spyOn(component, 'loadThemes')
    component.importDialogVisible = true
    component.onThemeUpload(true)
    expect(component.importDialogVisible).toBe(false)
    expect(component.loadThemes).toHaveBeenCalledTimes(1)
  })
})
