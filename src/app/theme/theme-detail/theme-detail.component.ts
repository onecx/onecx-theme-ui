import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, catchError, finalize, map, of } from 'rxjs'
import FileSaver from 'file-saver'

import { Action, PortalMessageService, UserService } from '@onecx/portal-integration-angular'

import { bffImageUrl, getCurrentDateTime, limitText } from 'src/app/shared/utils'
import {
  ExportThemeRequest,
  ImagesInternalAPIService,
  RefType,
  Theme,
  ThemesAPIService
} from 'src/app/shared/generated'

@Component({
  templateUrl: './theme-detail.component.html',
  styleUrls: ['./theme-detail.component.scss']
})
export class ThemeDetailComponent implements OnInit, AfterViewInit {
  public theme: Theme | undefined
  public theme$!: Observable<Theme>
  public themeName: string | null
  public themeDeleteVisible = false
  public showOperatorMessage = true // display initially only
  public loading = true
  public exceptionKey: string | undefined = undefined
  public RefType = RefType
  public dateFormat = 'medium'
  // page header
  public actions$: Observable<Action[]> = of([])
  public headerImageUrl?: string
  public limitText = limitText

  constructor(
    private readonly user: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly themeApi: ThemesAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly imageApi: ImagesInternalAPIService,
    private readonly cd: ChangeDetectorRef
  ) {
    this.themeName = this.route.snapshot.paramMap.get('name')
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
  }

  ngOnInit(): void {
    this.getTheme()
  }

  ngAfterViewInit() {
    this.cd.detectChanges()
  }

  private getTheme() {
    this.prepareActionButtons()
    if (!this.themeName) return
    this.loading = true
    this.theme$ = this.themeApi.getThemeByName({ name: this.themeName }).pipe(
      map((data) => {
        if (data.resource) this.theme = data.resource
        this.headerImageUrl = this.getImageUrl(this.theme, RefType.Logo)
        this.prepareActionButtons()
        return data.resource
      }),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + err.status + '.THEME'
        console.error('getThemeByName():', err)
        return of({} as Theme)
      }),
      finalize(() => (this.loading = false))
    )
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.NAVIGATION.BACK',
        'ACTIONS.NAVIGATION.BACK.TOOLTIP',
        'ACTIONS.EDIT.LABEL',
        'ACTIONS.EDIT.TOOLTIP',
        'ACTIONS.EXPORT.LABEL',
        'ACTIONS.EXPORT.TOOLTIP',
        'ACTIONS.DELETE.LABEL',
        'ACTIONS.DELETE.TOOLTIP',
        'ACTIONS.DELETE.THEME_MESSAGE'
      ])
      .pipe(
        map((data) => {
          return [
            {
              label: data['ACTIONS.NAVIGATION.BACK'],
              title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
              actionCallback: () => this.onClose(),
              icon: 'pi pi-arrow-left',
              show: 'always'
            },
            {
              label: data['ACTIONS.EXPORT.LABEL'],
              title: data['ACTIONS.EXPORT.TOOLTIP'],
              actionCallback: () => this.onExportTheme(),
              icon: 'pi pi-download',
              show: 'always',
              permission: 'THEME#EXPORT',
              conditional: true,
              showCondition: this.theme !== undefined
            },
            {
              label: data['ACTIONS.EDIT.LABEL'],
              title: data['ACTIONS.EDIT.TOOLTIP'],
              actionCallback: () => this.router.navigate(['./edit'], { relativeTo: this.route }),
              icon: 'pi pi-pencil',
              show: 'always',
              permission: 'THEME#EDIT',
              conditional: true,
              showCondition: this.theme !== undefined
            },
            {
              label: data['ACTIONS.DELETE.LABEL'],
              title: data['ACTIONS.DELETE.TOOLTIP'],
              actionCallback: () => (this.themeDeleteVisible = true),
              icon: 'pi pi-trash',
              show: 'asOverflow',
              permission: 'THEME#DELETE',
              conditional: true,
              showCondition: this.theme !== undefined && !this.theme?.operator
            }
          ]
        })
      )
  }

  public onClose(): void {
    this.location.back()
  }

  public onConfirmThemeDeletion(): void {
    this.deleteTheme()
    this.themeDeleteVisible = false
  }

  private deleteTheme(): void {
    this.themeApi.deleteTheme({ id: this.theme?.id ?? '' }).subscribe({
      next: () => {
        this.router.navigate(['..'], { relativeTo: this.route })
        this.msgService.success({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
      },
      error: (err) => {
        this.msgService.error({ summaryKey: 'ACTIONS.DELETE.THEME_NOK', detailKey: err.error.message })
      }
    })
  }

  /**
   * UI EVENTS
   */
  public onTabChange($event: any) {
    this.showOperatorMessage = false
  }

  onExportTheme(): void {
    if (this.theme?.name) {
      const exportThemeRequest: ExportThemeRequest = { names: [this.theme.name] }
      this.themeApi.exportThemes({ exportThemeRequest }).subscribe({
        next: (data) => {
          const themeJSON = JSON.stringify(data, null, 2)
          FileSaver.saveAs(
            new Blob([themeJSON], { type: 'text/json' }),
            `onecx-theme_${this.theme?.name}_${getCurrentDateTime()}.json`
          )
        },
        error: (err) => {
          console.error(err)
          this.msgService.error({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
        }
      })
    }
  }

  public getImageUrl(theme: Theme | undefined, refType: RefType): string | undefined {
    if (!theme) {
      return undefined
    }
    if (refType === RefType.Logo && theme.logoUrl !== null && theme.logoUrl !== '') {
      return theme.logoUrl
    }
    if (refType === RefType.Favicon && theme.faviconUrl !== null && theme.faviconUrl !== '') {
      return theme.faviconUrl
    }
    return bffImageUrl(this.imageApi.configuration.basePath, theme.name, refType)
  }
}
