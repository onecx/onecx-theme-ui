import { Component, OnInit, ViewChild } from '@angular/core'
import { Location } from '@angular/common'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { Observable, catchError, combineLatest, finalize, first, map, of } from 'rxjs'
import { Message } from 'primeng/api'
import FileSaver from 'file-saver'

import { PortalMessageService, ThemeService, UserService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'

import {
  ExportThemeRequest,
  GetThemeResponse,
  ImagesInternalAPIService,
  RefType,
  Theme,
  ThemesAPIService
} from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'

import { ThemeColorsComponent } from './theme-colors/theme-colors.component'
import { ThemePropsComponent } from './theme-props/theme-props.component'

@Component({
  templateUrl: './theme-detail.component.html',
  styleUrls: ['./theme-detail.component.scss']
})
export class ThemeDetailComponent implements OnInit {
  @ViewChild(ThemePropsComponent, { static: false }) ThemePropsComponent!: ThemePropsComponent
  @ViewChild(ThemeColorsComponent, { static: false }) ThemeColorsComponent!: ThemeColorsComponent

  // dialog
  public loading = true
  public exceptionKey: string | undefined = undefined
  public changeMode: 'VIEW' | 'EDIT' | 'CREATE' = 'VIEW'
  public autoApply = false
  public themeDeleteVisible = false
  public showOperatorMessage = true // display initially only
  public selectedTabIndex = 0
  public dateFormat = 'medium'
  public messages: Message[] = []
  public isThemeUsedByWorkspace = false
  public isCurrentTheme = false
  public Utils = Utils
  private translations$: Observable<Message[]> | undefined
  // page header
  public actions$: Observable<Action[]> = of([])
  public headerImageUrl?: string
  // data
  public themeName: string | null = null
  public theme$!: Observable<Theme | undefined>
  public themes$!: Observable<Theme[]>
  public theme: Theme | undefined
  public themeForUse: Theme | undefined
  public themeForProps: Theme | undefined
  public themeForColors: Theme | undefined
  // image
  public imageBasePath = this.imageApi.configuration.basePath
  public RefType = RefType
  public saveAsForm: FormGroup

  // Partial theme with undefined values for internal use (copying, editing) to prevent issues with form patching and image url handling when required properties are missing
  private readonly unchangeableThemeData = {
    id: undefined,
    name: undefined,
    operator: undefined,
    modificationDate: undefined,
    modificationUser: undefined,
    creationDate: undefined,
    creationUser: undefined
  } as Theme

  constructor(
    private readonly user: UserService,
    private readonly route: ActivatedRoute,
    private readonly location: Location,
    private readonly themeApi: ThemesAPIService,
    private readonly themeService: ThemeService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly imageApi: ImagesInternalAPIService
  ) {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
    this.themeName = route.snapshot.paramMap.get('name')
    this.changeMode = this.themeName ? 'VIEW' : 'CREATE'
    // FORMs
    this.saveAsForm = new FormGroup({
      themeName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)])
    })
  }

  ngOnInit(): void {
    this.prepareDialogTranslations()
    this.getTheme()
    this.getThemes()
  }

  public changeAutoApply(value: boolean): void {
    this.autoApply = value
    if (this.autoApply) {
      this.msgService.info({ summaryKey: 'INTERNAL.AUTO_APPLY_MESSAGE' })
    }
  }
  private getTheme(switchToEdit?: boolean) {
    if (!this.themeName) return
    this.loading = true
    combineLatest([
      this.themeService.currentTheme$.pipe(first()),
      this.themeApi.getThemeByName({ name: this.themeName })
    ])
      .pipe(
        map(([ct, response]) => {
          this.isCurrentTheme = ct.name === response.resource.name
          this.autoApply = this.isCurrentTheme
          this.prepareHeaderUrl(response.resource)
          this.preparePageActions(true, response.resource)
          return response.resource
        }),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + Utils.mapping_error_status(err.status) + '.THEME'
          console.error('getThemeByName', err)
          this.prepareHeaderUrl()
          this.preparePageActions(true)
          return of({})
        }),
        finalize(() => {
          this.loading = false
          if (switchToEdit === true) this.changeMode = 'EDIT'
        })
      )
      .subscribe((theme) => {
        this.theme = theme
        this.initSubComponentData(theme)
      })
  }
  private initSubComponentData(theme: Theme | undefined): void {
    if (!theme) return
    this.themeForProps = { ...theme, id: undefined }
    this.themeForColors = { properties: theme.properties } // only pass properties to colors component
  }
  private getThemes(): void {
    // for using themes as templates
    this.themes$ = this.themeApi.searchThemes({ searchThemeRequest: {} }).pipe(
      map(
        (data) =>
          data.stream
            ?.map((theme) => ({ ...theme, displayName: Utils.limitText(theme.displayName, 30) }))
            ?.sort(Utils.sortByDisplayName) ?? []
      ),
      catchError((err) => {
        this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + Utils.mapping_error_status(err.status) + '.THEME'
        console.error('searchThemes', err)
        return of([])
      })
    )
  }

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme): void {
    this.themeForUse = theme // force checking use in workspaces
    this.themeDeleteVisible = true
  }

  public onThemeDeletion(): void {
    this.themeDeleteVisible = false
  }

  /**
   * UI EVENTS
   */
  public onBack(): void {
    this.location.back()
  }

  public onTabChange($event: any, theme?: Theme): void {
    if (theme) {
      this.showOperatorMessage = false
      this.selectedTabIndex = $event.index
      if (this.selectedTabIndex === 2) this.themeForUse = theme
    }
  }

  private toggleEditMode(forcedMode?: 'edit' | 'view', theme?: Theme): void {
    if (forcedMode === 'view') {
      this.changeMode = 'VIEW'
    } else {
      this.changeMode = this.changeMode === 'EDIT' ? 'VIEW' : 'EDIT'
      this.getTheme(this.changeMode === 'EDIT')
    }
    if (this.changeMode === 'VIEW' && theme) {
      this.initSubComponentData(theme) // use originally loaded theme data
    }
    this.preparePageActions(this.isThemeUsedByWorkspace, theme)
  }

  private onSave(): void {
    // Trigger save on sub components (return false on validation error to prevent saving)
    if (!this.ThemePropsComponent.onSave()) return
    if (!this.ThemeColorsComponent.onSave()) return

    let themeData = this.ThemePropsComponent.theme
    if (!themeData) return
    themeData = {
      ...themeData,
      id: undefined,
      operator: undefined,
      modificationCount: this.theme?.modificationCount,
      // prevent empty strings for urls, as it causes issues for the image service
      logoUrl: themeData.logoUrl === '' ? undefined : themeData.logoUrl,
      smallLogoUrl: themeData.smallLogoUrl === '' ? undefined : themeData.smallLogoUrl,
      faviconUrl: themeData.faviconUrl === '' ? undefined : themeData.faviconUrl
    }
    // properties: fonts & colors
    themeData.properties = {
      ...this.ThemePropsComponent.theme?.properties, // font only
      ...this.ThemeColorsComponent.theme?.properties // colors only
    }
    if (this.theme?.id)
      this.themeApi
        .updateTheme({
          id: this.theme.id,
          updateThemeRequest: { resource: themeData }
        })
        .subscribe({
          next: (data) => {
            this.msgService.success({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
            this.toggleEditMode('view', data.resource)
            // update observable with response data
            this.theme$ = new Observable((sub) => sub.next(data.resource))
          },
          error: (err) => {
            console.error('updateTheme', err)
            this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
          }
        })
  }

  public onExportTheme(theme: Theme): void {
    if (theme?.name) {
      const exportThemeRequest: ExportThemeRequest = { names: [theme.name] }
      this.themeApi.exportThemes({ exportThemeRequest }).subscribe({
        next: (data) => {
          const themeJSON = JSON.stringify(data, null, 2)
          FileSaver.saveAs(
            new Blob([themeJSON], { type: 'text/json' }),
            `onecx-theme_${theme?.name}_${Utils.getCurrentDateTime()}.json`
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
    else this.headerImageUrl = Utils.bffImageUrl(this.imageBasePath, theme.name, RefType.Logo)
  }

  private prepareDialogTranslations(): void {
    this.translations$ = this.translate.get(['INTERNAL.OPERATOR_MESSAGE', 'INTERNAL.OPERATOR_HINT']).pipe(
      first(),
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
  public preparePageActions(inUse: boolean, theme?: Theme): void {
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
        'ACTIONS.DELETE.THEME_MESSAGE',
        'ACTIONS.CANCEL',
        'ACTIONS.TOOLTIPS.CANCEL',
        'ACTIONS.SAVE',
        'ACTIONS.TOOLTIPS.SAVE'
      ])
      .pipe(
        map((data) => {
          return [
            {
              id: 'th_detail_page_action_back',
              label: data['ACTIONS.NAVIGATION.BACK'],
              title: data['ACTIONS.NAVIGATION.BACK.TOOLTIP'],
              actionCallback: () => this.onBack(),
              icon: 'pi pi-arrow-left',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'VIEW'
            },
            {
              id: 'th_detail_page_action_export',
              label: data['ACTIONS.EXPORT.LABEL'],
              title: data['ACTIONS.EXPORT.TOOLTIP'],
              actionCallback: () => this.onExportTheme(theme!),
              permission: 'THEME#EXPORT',
              icon: 'pi pi-download',
              show: 'always',
              conditional: true,
              showCondition: theme !== undefined && this.changeMode === 'VIEW'
            },
            {
              id: 'th_detail_page_action_edit',
              label: data['ACTIONS.EDIT.LABEL'],
              title: data['ACTIONS.EDIT.TOOLTIP'],
              actionCallback: () => this.toggleEditMode('edit', theme!),
              permission: 'THEME#EDIT',
              icon: 'pi pi-pencil',
              show: 'always',
              conditional: true,
              showCondition: theme !== undefined && this.changeMode === 'VIEW'
            },
            {
              id: 'th_detail_page_action_cancel',
              label: data['ACTIONS.CANCEL'],
              title: data['ACTIONS.TOOLTIPS.CANCEL'],
              actionCallback: () => this.toggleEditMode('view', theme!),
              permission: 'THEME#VIEW',
              icon: 'pi pi-times',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'EDIT' || this.changeMode === 'CREATE'
            },
            {
              id: 'th_detail_page_action_save',
              label: data['ACTIONS.SAVE'],
              title: data['ACTIONS.TOOLTIPS.SAVE'],
              actionCallback: () => this.onSave(),
              permission: this.changeMode === 'EDIT' ? 'THEME#EDIT' : 'THEME#CREATE',
              icon: 'pi pi-save',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'EDIT' || this.changeMode === 'CREATE'
            },
            {
              id: 'th_detail_page_action_delete',
              label: data['ACTIONS.DELETE.LABEL'],
              title: data['ACTIONS.DELETE.TOOLTIP'],
              actionCallback: () => this.onDeleteTheme(theme!),
              permission: 'THEME#DELETE',
              icon: 'pi pi-trash',
              show: 'asOverflow',
              conditional: true,
              showCondition: this.changeMode === 'VIEW' && theme !== undefined
            }
          ]
        })
      )
  }

  // USE THEME AS TEMPLATE
  private getThemeById(id: string): Observable<GetThemeResponse> {
    return this.themeApi.getThemeById({ id: id })
  }

  public useThemeAsTemplate(data: any): any {
    console.log('useThemeAsTemplate', data)
    this.getThemeById(data.id).subscribe((response) => {
      // on creation the "name" can be edited
      let name = this.theme?.name // default: original name
      if (this.changeMode === 'CREATE') {
        name = data['ACTIONS.COPY_OF'] + response.resource.name // only here changeable
      }
      this.themeForProps = {
        ...response.resource,
        ...this.unchangeableThemeData,
        name: name,
        displayName: data['ACTIONS.COPY_OF'] + response.resource.displayName
      }
      this.themeForColors = response.resource
      console.log('themeForColors', this.themeForColors)
      this.msgService.info({ summaryKey: 'THEME.TEMPLATE.CONFIRMATION.OK' })
    })
  }
}
