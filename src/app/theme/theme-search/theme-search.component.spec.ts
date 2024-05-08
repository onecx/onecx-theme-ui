import { HttpClientTestingModule } from '@angular/common/http/testing'
import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { TranslateService } from '@ngx-translate/core'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DataViewModule } from 'primeng/dataview'
import { of } from 'rxjs'

import { ThemesAPIService } from 'src/app/shared/generated'
import { ThemeSearchComponent } from './theme-search.component'

describe('ThemeSearchComponent', () => {
  let component: ThemeSearchComponent
  let fixture: ComponentFixture<ThemeSearchComponent>

  const themeApiSpy = jasmine.createSpyObj<ThemesAPIService>('ThemesAPIService', ['getThemes'])

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeSearchComponent],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        DataViewModule,
        TranslateTestingModule.withTranslations({
          de: require('src/assets/i18n/de.json'),
          en: require('src/assets/i18n/en.json')
        }).withDefaultLanguage('en')
      ],
      providers: [{ provide: ThemesAPIService, useValue: themeApiSpy }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should load themes and translations on initialization', async () => {
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
      stream: [{ name: 'theme1' }, { name: 'theme2' }]
    }
    const themesObservable = of(themesResponse as any)
    themeApiSpy.getThemes.and.returnValue(themesObservable)

    await component.ngOnInit()

    expect(component.themes$).toEqual(themesObservable)

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
    component.themeImportDialogVisible = false
    component.onImportThemeClick()
    expect(component.themeImportDialogVisible).toBe(true)
  })
})
