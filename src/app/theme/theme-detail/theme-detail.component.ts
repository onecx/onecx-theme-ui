import { Component, DestroyRef, effect, inject, OnInit, signal, untracked, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AsyncPipe, JsonPipe, Location } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { catchError, combineLatest, finalize, first, map, of, Observable } from 'rxjs'
import FileSaver from 'file-saver'

import { MessageModule } from 'primeng/message'
import { Tabs, TabsModule } from 'primeng/tabs'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService, ThemeService, UserService } from '@onecx/angular-integration-interface'

import { Action, AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { PortalPageComponent } from '@onecx/angular-utils'

import { Utils, LogoRefType } from 'src/app/shared/utils'
import { ExportThemeRequest, ImagesInternalAPIService, Theme, ThemesAPIService } from 'src/app/shared/generated'

import { ThemeApplyComponent } from './theme-apply/theme-apply.component'
import { ThemeColorsComponent } from './theme-colors/theme-colors.component'
import { ThemePropsComponent } from './theme-props/theme-props.component'
import { ThemeUseComponent } from './theme-use/theme-use.component'
import { ThemeInternComponent } from './theme-intern/theme-intern.component'
import { ThemeCreateComponent } from '../theme-create/theme-create.component'
import { ThemeDeleteComponent } from '../theme-delete/theme-delete.component'

export type ChangeMode = 'VIEW' | 'EDIT'

@Component({
  standalone: true,
  imports: [
    AngularAcceleratorModule,
    AsyncPipe,
    JsonPipe,
    MessageModule,
    TabsModule,
    TooltipModule,
    TranslateModule,
    // components
    PortalPageComponent,
    ThemeCreateComponent,
    ThemeDeleteComponent,
    ThemeInternComponent,
    ThemeUseComponent,
    ThemeApplyComponent,
    ThemePropsComponent,
    ThemeColorsComponent
  ],
  templateUrl: './theme-detail.component.html',
  styleUrls: ['./theme-detail.component.scss']
})
export class ThemeDetailComponent implements OnInit {
  @ViewChild(ThemePropsComponent, { static: false }) ThemePropsComponent!: ThemePropsComponent
  @ViewChild(ThemeColorsComponent, { static: false }) ThemeColorsComponent!: ThemeColorsComponent
  @ViewChild(Tabs, { static: false }) tabComponent!: Tabs

  private readonly destroyRef = inject(DestroyRef)
  // signals
  public themeCreated = signal<Theme | undefined>(undefined)
  public themeDeleted = signal<boolean>(false)
  public themeDeleteVisible = signal<boolean>(false)
  public themeCreateVisible = signal<boolean>(false)
  // dialog
  public loading = true
  public exceptionKey: string | undefined = undefined
  public changeMode: ChangeMode = 'VIEW'
  public autoApply = false
  public showOperatorMessage = true // display initially only
  public selectedTabIndex = '0'
  public dateFormat = 'medium'
  public isThemeUsedByWorkspace = false
  public isCurrentTheme = false
  public Utils = Utils
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
  public themeForCreation: Theme | undefined
  // image
  public imageBasePath = this.imageApi.configuration.basePath

  // Partial theme with undefined values for internal use (copying, editing) to prevent issues with form patching and image url handling when required properties are missing
  private readonly undefinedThemeData = {
    id: undefined,
    name: undefined,
    operator: undefined,
    modificationCount: undefined,
    modificationDate: undefined,
    modificationUser: undefined,
    creationDate: undefined,
    creationUser: undefined
  } as Theme

  constructor(
    private readonly user: UserService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly themeApi: ThemesAPIService,
    private readonly themeService: ThemeService,
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly imageApi: ImagesInternalAPIService
  ) {
    effect(() => {
      if (this.themeDeleted()) {
        this.themeDeleted.set(false)
      }
      const theme = this.themeCreated()
      if (theme) {
        this.router.navigate(['../' + theme.name], { relativeTo: this.route })
      }
      if (!this.themeCreateVisible()) {
        this.themeForCreation = undefined
      }
    })
  }

  ngOnInit(): void {
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : 'medium'
    this.themeName = this.route.snapshot.paramMap.get('name')
    // Common start
    this.theme = undefined
    this.getTheme()
    // Re-initialize the component when the route parameter changes (e.g. after creating a new theme)
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const newThemeName = params.get('name')
      if (newThemeName && newThemeName !== this.themeName) {
        this.themeName = newThemeName
        this.changeMode = 'VIEW'
        this.getTheme()
      }
    })
  }

  private getTheme(): void {
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
          return of(undefined)
        }),
        finalize(() => {
          this.loading = false
          this.tabComponent.value.set(this.selectedTabIndex) // Forces tab change
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

  // Get themes for the template dropdown
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
   * OTHER UI EVENTS
   */
  public onBack(): void {
    this.location.back()
  }

  public onTabChange(tabValue: string | number, theme?: Theme): void {
    if (theme) {
      this.showOperatorMessage = false
      this.selectedTabIndex = typeof tabValue === 'number' ? tabValue.toString() : tabValue
      if (this.selectedTabIndex === '3') this.themeForUse = theme
    } else this.selectedTabIndex = '0'
  }

  public onChangeAutoApply(value: boolean): void {
    this.autoApply = value
    if (this.autoApply) {
      this.msgService.info({ summaryKey: 'DIALOG.DETAIL.AUTO_APPLY.MESSAGE' })
    }
  }

  // Change the mode to operate with the theme
  private onChangeMode(requestedMode: ChangeMode, theme?: Theme): void {
    this.changeMode = requestedMode
    if (requestedMode === 'VIEW') {
      this.initSubComponentData(theme) // use originally loaded theme data
      this.preparePageActions(this.isThemeUsedByWorkspace, theme)
    }
    if (requestedMode === 'EDIT') {
      if (Number(this.selectedTabIndex) > 1) this.selectedTabIndex = '0'
      this.getTheme()
      this.getThemes()
    }
  }

  /**
   * SAVE
   */
  private getThemeDataFromSubComponents(): Theme | undefined {
    // Trigger save on sub components (return false on validation error to prevent saving)
    if (!this.ThemePropsComponent.onUpdateTheme()) return undefined
    if (!this.ThemeColorsComponent.onUpdateTheme()) return undefined

    let themeData = this.ThemePropsComponent.theme
    if (!themeData) return undefined
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
    return themeData
  }

  private onUpdateTheme(): void {
    const themeData = this.getThemeDataFromSubComponents()
    if (!themeData) return
    // save
    if (this.theme?.id)
      this.themeApi
        .updateTheme({
          id: this.theme.id,
          updateThemeRequest: { resource: themeData }
        })
        .subscribe({
          next: (data) => {
            this.msgService.success({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
            this.onChangeMode('VIEW', data.resource)
            // update observable with response data
            this.theme$ = new Observable((sub) => sub.next(data.resource))
          },
          error: (err) => {
            console.error('updateTheme', err)
            this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
          }
        })
  }

  /**
   * CREATE
   */
  // SAVE AS => prepare theme data and pass it to the creation dialog
  public onSaveAs(copyOfPrefix: string): void {
    let themeData: Theme | undefined
    if (this.changeMode === 'EDIT') {
      themeData = this.getThemeDataFromSubComponents()
      if (!themeData) return
    } else {
      themeData = this.theme
    }
    if (!themeData) return
    this.themeForCreation = {
      ...themeData,
      ...this.undefinedThemeData,
      name: copyOfPrefix + themeData.name,
      displayName: copyOfPrefix + themeData.displayName
    }
    this.themeCreateVisible.set(true)
  }

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme): void {
    this.themeForUse = theme // force checking use in workspaces
    this.themeDeleteVisible.set(true)
  }

  /**
   * EXPORT
   */
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
    else this.headerImageUrl = Utils.bffImageUrl(this.imageBasePath, theme.name, LogoRefType.Logo)
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
        'ACTIONS.TOOLTIPS.SAVE',
        'ACTIONS.SAVE_AS',
        'ACTIONS.TOOLTIPS.SAVE_AS',
        'ACTIONS.COPY_OF'
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
              actionCallback: () => this.onChangeMode('EDIT', theme!),
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
              actionCallback: () => this.onChangeMode('VIEW', theme!),
              permission: 'THEME#VIEW',
              icon: 'pi pi-times',
              show: 'always',
              conditional: true,
              showCondition: this.theme !== undefined && this.changeMode === 'EDIT'
            },
            {
              id: 'th_detail_page_action_save',
              label: data['ACTIONS.SAVE'],
              title: data['ACTIONS.TOOLTIPS.SAVE'],
              actionCallback: () => this.onUpdateTheme(),
              permission: this.changeMode === 'EDIT' ? 'THEME#EDIT' : 'THEME#CREATE',
              icon: 'pi pi-save',
              show: 'always',
              conditional: true,
              showCondition: this.theme !== undefined && this.changeMode === 'EDIT'
            },
            {
              id: 'th_detail_page_action_save_as_on_edit',
              label: data['ACTIONS.SAVE_AS'],
              title: data['ACTIONS.TOOLTIPS.SAVE_AS'],
              actionCallback: () => this.onSaveAs(data['ACTIONS.COPY_OF']),
              icon: 'pi pi-plus-circle',
              show: 'always',
              conditional: true,
              showCondition: this.theme !== undefined && this.changeMode === 'EDIT',
              permission: 'THEME#CREATE'
            },
            {
              id: 'th_detail_page_action_save_as_on_view',
              label: data['ACTIONS.SAVE_AS'],
              title: data['ACTIONS.TOOLTIPS.SAVE_AS'],
              actionCallback: () => this.onSaveAs(data['ACTIONS.COPY_OF']),
              icon: 'pi pi-plus-circle',
              show: 'asOverflow',
              conditional: true,
              showCondition: this.theme !== undefined && this.changeMode === 'VIEW',
              permission: 'THEME#CREATE'
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
              showCondition: theme !== undefined && this.changeMode === 'VIEW'
            }
          ]
        })
      )
  }

  /**
   * TEMPLATING: allow using properties from an existing theme => no creation of a new theme!
   */
  public useThemeAsTemplate(data: any): any {
    this.themeApi.getThemeById({ id: data.id }).subscribe((response) => {
      this.themeForProps = {
        ...response.resource,
        ...this.undefinedThemeData,
        name: this.theme?.name,
        displayName: data['ACTIONS.COPY_OF'] + response.resource.displayName,
        modificationCount: this.theme?.modificationCount
      }
      this.themeForColors = response.resource
      this.msgService.info({ summaryKey: 'THEME.TEMPLATE.CONFIRMATION.OK' })
    })
  }

  public onThemeDeleted(deleted: boolean): void {
    if (deleted) {
      this.router.navigate(['..'], { relativeTo: this.route })
    }
  }
}
