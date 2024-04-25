import { Component, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, map } from 'rxjs'
import { DataView } from 'primeng/dataview'

import { Action, DataViewControlTranslations } from '@onecx/portal-integration-angular'

import { GetThemesResponse, ImagesInternalAPIService, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { limitText } from 'src/app/shared/utils'

@Component({
  templateUrl: './theme-search.component.html',
  styleUrls: ['./theme-search.component.scss']
})
export class ThemeSearchComponent implements OnInit {
  themes$!: Observable<GetThemesResponse>
  public actions: Action[] = []
  public actions$: Observable<Action[]> | undefined
  public viewMode = 'grid'
  public filter: string | undefined
  public sortField = 'name'
  public sortOrder = 1
  public limitText = limitText

  public themeImportDialogVisible = false
  public dataViewControlsTranslations: DataViewControlTranslations = {}
  @ViewChild(DataView) dv: DataView | undefined

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private themeApi: ThemesAPIService,
    private translate: TranslateService,
    private imageApi: ImagesInternalAPIService
  ) {}

  ngOnInit(): void {
    this.loadThemes()
    this.prepareTranslations()
    this.prepareActionButtons()
  }

  public loadThemes(): void {
    this.themes$ = this.themeApi.getThemes({})
  }

  private prepareTranslations() {
    this.translate
      .get([
        'THEME.NAME',
        'THEME.DESCRIPTION',
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
            filterInputTooltip: data['SEARCH.FILTER_OF'] + data['THEME.NAME'] + ', ' + data['THEME.DESCRIPTION'],
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
    return this.imageApi.configuration.basePath + '/images/' + theme.name + '/logo'
  }

  public onNewTheme(): void {
    this.router.navigate(['./new'], { relativeTo: this.route })
  }
  public onLayoutChange(viewMode: string): void {
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
    this.themeImportDialogVisible = true
  }
}
