import { Component, OnInit } from '@angular/core'
import { DatePipe } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { finalize } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import FileSaver from 'file-saver'

import { Action, ConfigurationService, ObjectDetailItem, PortalMessageService } from '@onecx/portal-integration-angular'
import { filterObject, limitText, sortByLocale } from '../../shared/utils'
import { ThemeDTO, ThemesAPIService, PortalIdentifierDTO } from '../../generated'
import { environment } from '../../../environments/environment'

@Component({
  templateUrl: './theme-detail.component.html',
  styleUrls: ['./theme-detail.component.scss'],
  providers: [ConfigurationService]
})
export class ThemeDetailComponent implements OnInit {
  theme: ThemeDTO | undefined
  themeId!: string
  themeDeleteVisible = false
  themeDeleteMessage = ''
  themePortalList = ''
  loading = true
  private apiPrefix = environment.apiPrefix
  public dateFormat = 'medium'
  // page header
  public actions: Action[] = []
  public objectDetails: ObjectDetailItem[] = []
  public headerImageUrl?: string

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private themeApi: ThemesAPIService,
    private config: ConfigurationService,
    private msgService: PortalMessageService,
    private translate: TranslateService
  ) {
    this.themeId = this.route.snapshot.paramMap.get('id') || ''
    this.dateFormat = this.config.lang === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
  }

  ngOnInit(): void {
    this.themeApi
      .getThemeById({ id: this.themeId })
      .pipe(
        finalize(() => {
          this.loading = false
        })
      )
      .subscribe({
        next: (data) => {
          this.theme = data
          this.preparePage()
          this.setHeaderImageUrl()
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
    this.translate
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
      .subscribe((data) => {
        this.prepareActionButtons(data)
      })
    this.translate
      .get([
        'DETAIL.CREATION_DATE',
        'DETAIL.TOOLTIPS.CREATION_DATE',
        'DETAIL.MODIFICATION_DATE',
        'DETAIL.TOOLTIPS.MODIFICATION_DATE',
        'THEME.WORKSPACES',
        'THEME.TOOLTIPS.WORKSPACES'
      ])
      .subscribe((data) => {
        this.prepareObjectDetails(data)
      })
  }

  private prepareActionButtons(data: any): void {
    this.actions = [] // provoke change event
    this.actions.push(
      {
        label: data['ACTIONS.NAVIGATION.CLOSE'],
        title: data['ACTIONS.NAVIGATION.CLOSE.TOOLTIP'],
        actionCallback: () => this.close(),
        icon: 'pi pi-arrow-left',
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
    )
  }

  private prepareObjectDetails(data: any): void {
    this.themePortalList = this.prepareUsedInPortalList()
    if (this.theme) {
      this.objectDetails = [
        {
          label: data['DETAIL.CREATION_DATE'],
          tooltip: data['DETAIL.TOOLTIPS.CREATION_DATE'],
          value: this.theme.creationDate,
          valuePipe: DatePipe,
          valuePipeArgs: this.dateFormat
        },
        {
          label: data['DETAIL.MODIFICATION_DATE'],
          tooltip: data['DETAIL.TOOLTIPS.MODIFICATION_DATE'],
          value: this.theme.modificationDate,
          valuePipe: DatePipe,
          valuePipeArgs: this.dateFormat
        },
        {
          label: data['THEME.WORKSPACES'],
          value: limitText(this.themePortalList, 100),
          tooltip: data['THEME.TOOLTIPS.WORKSPACES']
        }
      ]
    }
  }

  private close(): void {
    this.router.navigate(['./..'], { relativeTo: this.route })
  }

  confirmThemeDeletion(): void {
    this.deleteTheme()
    this.themeDeleteVisible = false
  }

  private deleteTheme(): void {
    this.themeApi.deleteTheme({ id: this.themeId }).subscribe({
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
    const themeExportData = filterObject(this.theme, [
      'creationDate',
      'creationUser',
      'modificationDate',
      'modificationUser',
      'id',
      'portalId',
      'tenantId',
      'portals'
    ]) as ThemeDTO
    const themeJSON = JSON.stringify(themeExportData, null, 2)
    FileSaver.saveAs(new Blob([themeJSON], { type: 'text/json' }), `${this.theme?.name + '_Theme'}.json`)
  }

  private setHeaderImageUrl(): void {
    // img format is from BE or from Internet
    if (this.theme?.logoUrl && !this.theme.logoUrl.match(/^(http|https)/g)) {
      this.headerImageUrl = this.apiPrefix + this.theme.logoUrl
    } else {
      this.headerImageUrl = this.theme?.logoUrl
    }
  }

  public prepareUsedInPortalList(): string {
    const arr = this.theme?.portals?.map((portal: PortalIdentifierDTO) => portal.portalName)
    return arr?.sort(sortByLocale).join(', ') || ''
  }
}
