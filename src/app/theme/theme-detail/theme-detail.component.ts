import { Component, OnInit } from '@angular/core'
import { Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, catchError, finalize, map, of } from 'rxjs'
import { Message } from 'primeng/api'
import FileSaver from 'file-saver'

import { PortalMessageService, UserService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'

import { bffImageUrl, getCurrentDateTime, mapping_error_status } from 'src/app/shared/utils'
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
export class ThemeDetailComponent implements OnInit {
  // dialog
  public loading = true
  public exceptionKey: string | undefined = undefined
  public themeDeleteVisible = false
  public showOperatorMessage = true // display initially only
  public selectedTabIndex = 0
  public dateFormat = 'medium'
  public messages: Message[] = []
  public isThemeUsedByWorkspace = false
  private translations$: Observable<Message[]> | undefined
  // page header
  public actions$: Observable<Action[]> = of([])
  public headerImageUrl?: string
  // data
  public theme$!: Observable<Theme | undefined>
  public themeForUse: Theme | undefined
  // image
  public imageBasePath = this.imageApi.configuration.basePath
  public RefType = RefType
  public bffImageUrl = bffImageUrl

  constructor(
    private readonly user: UserService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly themeApi: ThemesAPIService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly imageApi: ImagesInternalAPIService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.getTheme()
  }

  private getTheme() {
    const themeName = this.route.snapshot.paramMap.get('name')
    if (!themeName) return
    this.loading = true
    this.theme$ = this.themeApi.getThemeByName({ name: themeName }).pipe(
      map((data) => {
        this.prepareHeaderUrl(data.resource)
        this.preparePageAction(true, data.resource)
        return data.resource
      }),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + mapping_error_status(err.status) + '.THEME'
        console.error('getThemeByName', err)
        this.prepareHeaderUrl()
        this.preparePageAction(true)
        return of(undefined)
      }),
      finalize(() => (this.loading = false))
    )
  }

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme): void {
    this.themeForUse = theme // force checking use in workspaces
    this.themeDeleteVisible = true
  }

  public onConfirmThemeDeletion(theme: Theme): void {
    this.deleteTheme(theme)
    this.themeDeleteVisible = false
  }

  private deleteTheme(theme: Theme): void {
    if (theme?.id)
      this.themeApi.deleteTheme({ id: theme.id }).subscribe({
        next: () => {
          this.router.navigate(['..'], { relativeTo: this.route })
          this.msgService.success({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
        },
        error: (err) => {
          console.error('deleteTheme', err)
          this.msgService.error({ summaryKey: 'ACTIONS.DELETE.THEME_NOK', detailKey: err.error.message })
        }
      })
  }

  /**
   * UI EVENTS
   */
  public onClose(): void {
    this.location.back()
  }

  public onTabChange($event: any, theme: Theme) {
    if (theme) {
      this.showOperatorMessage = false
      this.selectedTabIndex = $event.index
      if (this.selectedTabIndex === 2) this.themeForUse = theme
    }
  }

  public onExportTheme(theme: Theme): void {
    if (theme?.name) {
      const exportThemeRequest: ExportThemeRequest = { names: [theme.name] }
      this.themeApi.exportThemes({ exportThemeRequest }).subscribe({
        next: (data) => {
          const themeJSON = JSON.stringify(data, null, 2)
          FileSaver.saveAs(
            new Blob([themeJSON], { type: 'text/json' }),
            `onecx-theme_${theme?.name}_${getCurrentDateTime()}.json`
          )
        },
        error: (err) => {
          console.error('exportThemes', err)
          this.msgService.error({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
        }
      })
    }
  }

  /**
   * DIALOG
   */
  public prepareHeaderUrl(theme?: Theme): void {
    if (!theme) return undefined
    if (theme.logoUrl) this.headerImageUrl = theme.logoUrl
    else if (theme.smallLogoUrl) this.headerImageUrl = theme.smallLogoUrl
    else this.headerImageUrl = bffImageUrl(this.imageBasePath, theme.name, RefType.Logo)
  }

  private prepareDialogTranslations(): void {
    this.translations$ = this.translate.get(['INTERNAL.OPERATOR_MESSAGE', 'INTERNAL.OPERATOR_HINT']).pipe(
      map((data) => {
        return [
          {
            id: 'ws_detail_operator_message',
            severity: 'warn',
            life: 5000,
            closable: true,
            summary: data['INTERNAL.OPERATOR_HINT'],
            detail: data['INTERNAL.OPERATOR_MESSAGE']
          }
        ]
      })
    )
    this.translations$.subscribe((data) => (this.messages = data))
  }

  // default: we guess the Theme is in use so that deletion is not offered
  public preparePageAction(inUse: boolean, theme?: Theme): void {
    this.isThemeUsedByWorkspace = inUse
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
              actionCallback: () => this.onExportTheme(theme!),
              icon: 'pi pi-download',
              show: 'always',
              permission: 'THEME#EXPORT',
              conditional: true,
              showCondition: theme !== undefined
            },
            {
              label: data['ACTIONS.EDIT.LABEL'],
              title: data['ACTIONS.EDIT.TOOLTIP'],
              actionCallback: () => this.router.navigate(['./edit'], { relativeTo: this.route }),
              icon: 'pi pi-pencil',
              show: 'always',
              permission: 'THEME#EDIT',
              conditional: true,
              showCondition: theme !== undefined
            },
            {
              label: data['ACTIONS.DELETE.LABEL'],
              title: data['ACTIONS.DELETE.TOOLTIP'],
              actionCallback: () => this.onDeleteTheme(theme!),
              icon: 'pi pi-trash',
              show: 'asOverflow',
              permission: 'THEME#DELETE',
              conditional: true,
              showCondition: theme !== undefined
            }
          ]
        })
      )
  }
}
