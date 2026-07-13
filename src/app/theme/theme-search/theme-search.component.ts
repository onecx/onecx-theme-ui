import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe } from '@angular/common'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { BehaviorSubject, catchError, finalize, map, Observable, of, Subscription } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { MessageModule } from 'primeng/message'
import { ToastModule } from 'primeng/toast'
import { TooltipModule } from 'primeng/tooltip'

import {
  Action,
  AngularAcceleratorModule,
  RowListGridData,
  DataSortDirection,
  DataTableColumn,
  ColumnType
} from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import { Utils, LogoRefType } from 'src/app/shared/utils'
import { ImagesInternalAPIService, Theme, ThemesAPIService } from 'src/app/shared/generated'
import { ThemeColorBoxComponent } from 'src/app/shared/theme-color-box/theme-color-box.component'
import { ImageContainerComponent } from 'src/app/shared/image-container/image-container.component'

import { ThemeCreateComponent } from '../theme-create/theme-create.component'
import { ThemeImportComponent } from '../theme-import/theme-import.component'

@Component({
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AsyncPipe,
    ButtonModule,
    CardModule,
    FloatLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    MessageModule,
    RouterModule,
    ToastModule,
    TooltipModule,
    TranslateModule,
    PortalPageComponent,
    ThemeCreateComponent,
    ThemeImportComponent,
    ThemeColorBoxComponent,
    ImageContainerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-search.component.html',
  styleUrl: './theme-search.component.scss'
})
export class ThemeSearchComponent implements OnInit {
  public readonly route = inject(ActivatedRoute)
  public readonly router = inject(Router)
  private readonly themeApi = inject(ThemesAPIService)
  private readonly translate = inject(TranslateService)
  private readonly imageApi = inject(ImagesInternalAPIService)
  private readonly destroyRef = inject(DestroyRef)
  // signals
  public themeImportVisible = signal(false)
  public themeCreateVisible = signal(false)
  public themeImported = signal(false)
  // data
  private readonly dataSubject$ = new BehaviorSubject<RowListGridData[]>([])
  public data$: Observable<RowListGridData[] | null> = this.dataSubject$.asObservable()
  private searchSubscription?: Subscription // to cancel ongoing search if new search is triggered
  public filteredData: RowListGridData[] | undefined = undefined
  // dialog
  public loading = false
  public exceptionKey: string | undefined = undefined
  public actions$: Observable<Action[]> | undefined
  public textFilterValue$ = new BehaviorSubject<string | undefined>(undefined)
  public globalFilterValue = ''
  public sortColumns = this.prepareSortColumns()
  public sortColumnKeys = this.sortColumns.map((c) => c.id)
  public sortDirection: DataSortDirection = DataSortDirection.ASCENDING
  public sortField = 'displayName'
  public Utils = Utils
  // image
  public imageBasePath = this.imageApi.configuration.basePath
  public LogoRefType = LogoRefType

  constructor() {
    effect(() => {
      if (this.themeImported()) {
        this.loadThemes()
      }
    })
  }

  ngOnInit(): void {
    this.prepareActionButtons()
    this.loadThemes()
  }

  public loadThemes(): void {
    this.loading = true
    this.exceptionKey = undefined
    this.searchSubscription?.unsubscribe()
    this.searchSubscription = this.themeApi
      .searchThemes({ searchThemeRequest: {} })
      .pipe(
        map((data) => {
          const themes = data?.stream ?? []
          themes.sort(this.sortThemesByName)
          return themes as unknown[] as RowListGridData[]
        }),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.THEME'
          console.error('searchThemes', err)
          return of([] as RowListGridData[])
        }),
        finalize(() => (this.loading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((data) => this.dataSubject$.next(data))
  }
  private sortThemesByName(a: Theme, b: Theme): number {
    return a.displayName!.toUpperCase().localeCompare(b.displayName!.toUpperCase())
  }
  public convertToThemes(data: RowListGridData[]): Theme[] {
    return data as unknown[] as Theme[]
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
              actionCallback: () => this.themeCreateVisible.set(true),
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
  private prepareSortColumns(): DataTableColumn[] {
    return [
      {
        columnType: ColumnType.STRING,
        nameKey: 'THEME.NAME',
        id: 'name',
        sortable: true
      },
      {
        columnType: ColumnType.STRING,
        nameKey: 'THEME.DISPLAY_NAME',
        id: 'displayName',
        sortable: true
      },
      {
        columnType: ColumnType.STRING,
        nameKey: 'INTERNAL.CREATION_DATE',
        id: 'creationDate',
        sortable: true
      }
    ]
  }

  /**
   * FILTER & SORT Events
   */
  public onGlobalFilter(value?: string, data?: RowListGridData[]): void {
    if (!data) return
    this.globalFilterValue = value ?? ''
    if (this.globalFilterValue === '') this.filteredData = undefined
    else {
      this.filteredData = data?.filter(
        (row) =>
          row['name']?.toString().toLowerCase().includes(this.globalFilterValue.toLowerCase()) ||
          row['displayName']?.toString().toLowerCase().includes(this.globalFilterValue.toLowerCase())
      )
    }
  }

  public onClearGlobalFilter(input?: HTMLInputElement): void {
    this.globalFilterValue = ''
    this.filteredData = undefined
    if (input) input.value = ''
  }

  public onSortChange(event: { sortColumn: string; sortDirection: DataSortDirection }): void {
    this.sortField = event.sortColumn
    this.sortDirection = event.sortDirection
  }

  public onAppClick(item: RowListGridData): void {
    const theme = item as unknown as Theme
    if (!theme?.name) return
    this.router.navigate(['./', theme.name], { relativeTo: this.route })
  }

  public onImportThemeClick(): void {
    this.themeImportVisible.set(true)
  }

  public onThemeCreation(theme: Theme | undefined): void {
    if (theme) {
      this.router.navigate(['./' + theme.name], { relativeTo: this.route })
    }
  }
}
