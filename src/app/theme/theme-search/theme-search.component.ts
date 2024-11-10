import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { DataView } from 'primeng/dataview'

import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'

import { ImagesInternalAPIService, RefType, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { limitText, bffImageUrl } from 'src/app/shared/utils'

@Component({
  templateUrl: './theme-search.component.html',
  styleUrls: ['./theme-search.component.scss']
})
export class ThemeSearchComponent implements OnInit {
  public themes$!: Observable<Theme[]>
  public actions$: Observable<Action[]> | undefined
  public loading = false
  public exceptionKey: string | undefined = undefined
  public viewMode: 'list' | 'grid' = 'grid'
  public filter: string | undefined
  public sortField = 'displayName'
  public sortOrder = 1
  public limitText = limitText

  public importDialogVisible = false
  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly themeApi: ThemesAPIService,
    private readonly translate: TranslateService,
    private readonly imageApi: ImagesInternalAPIService
  ) {}

  ngOnInit(): void {
    this.prepareTranslations()
    this.prepareActionButtons()
    this.loadThemes()
  }

  public loadThemes(): void {
    this.loading = true
    this.themes$ = this.themeApi.getThemes({}).pipe(
      map((data) => (data?.stream ? data.stream.sort(this.sortThemesByName) : [])),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.THEMES'
        console.error('getThemes():', err)
        return of([] as Theme[])
      }),
      finalize(() => (this.loading = false))
    )
  }
  private sortThemesByName(a: Theme, b: Theme): number {
    return a.displayName!.toUpperCase().localeCompare(b.displayName!.toUpperCase())
  }

  private prepareTranslations() {
    this.translate
      .get([
        'THEME.NAME',
        'THEME.DISPLAY_NAME',
        'SEARCH.SORT_BY',
        'SEARCH.FILTER',
        'SEARCH.FILTER_OF',
        'SEARCH.SORT_DIRECTION_ASC',
        'SEARCH.SORT_DIRECTION_DESC',
        'GENERAL.TOOLTIP.VIEW_MODE_GRID',
        'GENERAL.TOOLTIP.VIEW_MODE_LIST',
        'GENERAL.TOOLTIP.VIEW_MODE_TABLE'
      ])
      .pipe(
        map((data) => {
          this.dataViewControlsTranslations = {
            sortDropdownPlaceholder: data['SEARCH.SORT_BY'],
            filterInputPlaceholder: data['SEARCH.FILTER'],
            filterInputTooltip: data['SEARCH.FILTER_OF'] + data['THEME.DISPLAY_NAME'] + ', ' + data['THEME.NAME'],
            viewModeToggleTooltips: {
              grid: data['GENERAL.TOOLTIP.VIEW_MODE_GRID'],
              list: data['GENERAL.TOOLTIP.VIEW_MODE_LIST']
            },
            sortOrderTooltips: {
              ascending: data['SEARCH.SORT_DIRECTION_ASC'],
              descending: data['SEARCH.SORT_DIRECTION_DESC']
            },
            sortDropdownTooltip: data['SEARCH.SORT_BY']
          }
        })
      )
      .subscribe()
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get(['ACTIONS.CREATE.THEME', 'ACTIONS.CREATE.THEME.TOOLTIP', 'ACTIONS.IMPORT.LABEL', 'ACTIONS.IMPORT.TOOLTIP'])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.CREATE.THEME'],
              title: data['ACTIONS.CREATE.THEME.TOOLTIP'],
              actionCallback: () => this.onNewTheme(),
              permission: 'THEME#CREATE',
              icon: 'pi pi-plus',
              show: 'always'
            },
            {
              label: data['ACTIONS.IMPORT.LABEL'],
              title: data['ACTIONS.IMPORT.TOOLTIP'],
              actionCallback: () => this.onImportThemeClick(),
              permission: 'THEME#IMPORT',
              icon: 'pi pi-upload',
              show: 'always'
            }
          ]
        })
      )
  }

  getLogoUrl(theme: Theme | undefined): string | undefined {
    if (!theme) {
      return undefined
    }
    if (theme.logoUrl != null && theme.logoUrl != '') {
      return theme.logoUrl
    }
    return bffImageUrl(this.imageApi.configuration.basePath, theme.name, RefType.Logo)
  }

  public onNewTheme(): void {
    this.router.navigate(['./new'], { relativeTo: this.route })
  }
  public onLayoutChange(viewMode: 'list' | 'grid'): void {
    this.viewMode = viewMode
  }
  public onFilterChange(filter: string): void {
    this.filter = filter
    this.dv?.filter(filter, 'contains')
  }
  public onSortChange(field: string): void {
    this.sortField = field
  }
  public onSortDirChange(asc: boolean): void {
    this.sortOrder = asc ? -1 : 1
  }
  public onImportThemeClick(): void {
    this.importDialogVisible = true
  }
  public onThemeUpload(uploaded: boolean) {
    this.importDialogVisible = false
    if (uploaded) this.loadThemes()
  }
}
