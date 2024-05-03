import { Component, OnInit } from '@angular/core'
import { DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, finalize, map } from 'rxjs'
import FileSaver from 'file-saver'

import { Action, ObjectDetailItem, PortalMessageService, UserService } from '@onecx/portal-integration-angular'

import { limitText, sortByLocale } from 'src/app/shared/utils'
import {
  ExportThemeRequest,
  ImagesInternalAPIService,
  Theme,
  ThemesAPIService,
  Workspace
} from 'src/app/shared/generated'

@Component({
  templateUrl: './theme-detail.component.html',
  styleUrls: ['./theme-detail.component.scss']
})
export class ThemeDetailComponent implements OnInit {
  theme: Theme | undefined
  usedInWorkspaces: Workspace[] | undefined
  themeName!: string
  themeDeleteVisible = false
  themeDeleteMessage = ''
  workspaceList = ''
  loading = true
  public dateFormat = 'medium'
  // page header
  public actions$: Observable<Action[]> | undefined
  public objectDetails$: Observable<ObjectDetailItem[]> | undefined
  public headerImageUrl?: string

  constructor(
    private user: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private themeApi: ThemesAPIService,
    private msgService: PortalMessageService,
    private translate: TranslateService,
    private imageApi: ImagesInternalAPIService
  ) {
    this.themeName = this.route.snapshot.paramMap.get('name') || ''
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
  }

  ngOnInit(): void {
    this.themeApi
      .getThemeByName({ name: this.themeName })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data) => {
          this.theme = data.resource
          this.usedInWorkspaces = data.workspaces
          this.preparePage()
          this.headerImageUrl = this.getLogoUrl(this.theme, 'image')
        },
        error: (err) => {
          this.msgService.error({
            summaryKey: 'THEME.LOAD_ERROR',
            detailKey: err.error.indexOf('was not found') > 1 ? 'THEME.NOT_FOUND' : err.error
          })
          this.close()
        }
      })
  }

  private preparePage() {
    this.prepareActionButtons()
    this.prepareObjectDetails()
  }

  private prepareActionButtons(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.NAVIGATION.CLOSE',
        'ACTIONS.NAVIGATION.CLOSE.TOOLTIP',
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
              label: data['ACTIONS.NAVIGATION.CLOSE'],
              title: data['ACTIONS.NAVIGATION.CLOSE.TOOLTIP'],
              actionCallback: () => this.close(),
              icon: 'pi pi-times',
              show: 'always',
              permission: 'THEME#SEARCH'
            },
            {
              label: data['ACTIONS.EDIT.LABEL'],
              title: data['ACTIONS.EDIT.TOOLTIP'],
              actionCallback: () => this.router.navigate(['./edit'], { relativeTo: this.route }),
              icon: 'pi pi-pencil',
              show: 'always',
              permission: 'THEME#EDIT'
            },
            {
              label: data['ACTIONS.EXPORT.LABEL'],
              title: data['ACTIONS.EXPORT.TOOLTIP'],
              actionCallback: () => this.onExportTheme(),
              icon: 'pi pi-download',
              show: 'always',
              permission: 'THEME#EXPORT'
            },
            {
              label: data['ACTIONS.DELETE.LABEL'],
              title: data['ACTIONS.DELETE.TOOLTIP'],
              actionCallback: () => {
                this.themeDeleteVisible = true
                this.themeDeleteMessage = data['ACTIONS.DELETE.THEME_MESSAGE'].replace('{{ITEM}}', this.theme?.name)
              },
              icon: 'pi pi-trash',
              show: 'asOverflow',
              permission: 'THEME#DELETE'
            }
          ]
        })
      )
  }

  private prepareObjectDetails(): void {
    this.workspaceList = this.prepareWorkspaceList()
    if (this.theme) {
      this.objectDetails$ = this.translate
        .get([
          'DETAIL.CREATION_DATE',
          'DETAIL.TOOLTIPS.CREATION_DATE',
          'DETAIL.MODIFICATION_DATE',
          'DETAIL.TOOLTIPS.MODIFICATION_DATE',
          'THEME.WORKSPACES',
          'THEME.TOOLTIPS.WORKSPACES'
        ])
        .pipe(
          map((data) => {
            return [
              {
                label: data['DETAIL.CREATION_DATE'],
                tooltip: data['DETAIL.TOOLTIPS.CREATION_DATE'],
                value: this.theme?.creationDate,
                valuePipe: DatePipe,
                valuePipeArgs: this.dateFormat
              },
              {
                label: data['DETAIL.MODIFICATION_DATE'],
                tooltip: data['DETAIL.TOOLTIPS.MODIFICATION_DATE'],
                value: this.theme?.modificationDate,
                valuePipe: DatePipe,
                valuePipeArgs: this.dateFormat
              },
              {
                label: data['THEME.WORKSPACES'],
                value: limitText(this.workspaceList, 100),
                tooltip: data['THEME.TOOLTIPS.WORKSPACES']
              }
            ]
          })
        )
    }
  }

  public close(): void {
    this.router.navigate(['./..'], { relativeTo: this.route })
  }

  confirmThemeDeletion(): void {
    this.deleteTheme()
    this.themeDeleteVisible = false
  }

  private deleteTheme(): void {
    this.themeApi.deleteTheme({ id: this.theme?.id! }).subscribe({
      next: () => {
        this.router.navigate(['..'], { relativeTo: this.route })
        this.msgService.success({ summaryKey: 'ACTIONS.DELETE.THEME_OK' })
      },
      error: (err) => {
        this.msgService.error({ summaryKey: 'ACTIONS.DELETE.THEME_NOK', detailKey: err.error.message })
      }
    })
  }

  onExportTheme(): void {
    if (this.theme?.name) {
      const exportThemeRequest: ExportThemeRequest = { names: [this.theme.name] }
      this.themeApi
        .exportThemes({
          exportThemeRequest
        })
        .subscribe({
          next: (data) => {
            const themeJSON = JSON.stringify(data, null, 2)
            FileSaver.saveAs(new Blob([themeJSON], { type: 'text/json' }), `${this.theme?.name + '_Theme'}.json`)
          },
          error: (err) => {
            console.log(err)
            this.msgService.error({ summaryKey: 'ACTIONS.EXPORT.EXPORT_THEME_FAIL' })
          }
        })
    }
  }

  public prepareWorkspaceList(): string {
    const arr = this.usedInWorkspaces?.map((workspace: Workspace) => workspace.name)
    return arr?.sort(sortByLocale).join(', ') ?? ''
  }

  getLogoUrl(theme: Theme | undefined, usedFor: string): string | undefined {
    if (!theme) {
      return undefined
    }
    if (theme.logoUrl != null && theme.logoUrl != '') {
      return theme.logoUrl
    }
    if (usedFor === 'image') {
      return this.imageApi.configuration.basePath + '/images/' + theme.name + '/logo'
    } else {
      return ''
    }
  }
}
