import { Component, computed, DestroyRef, EventEmitter, inject, OnInit, signal, viewChild } from '@angular/core'
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
import { SlotService } from '@onecx/angular-remote-components'

import { Utils, LogoRefType } from 'src/app/shared/utils'
import { ExportThemeRequest, ImagesInternalAPIService, Theme, ThemesAPIService } from 'src/app/shared/generated'

import { ThemeApplyComponent } from './theme-apply/theme-apply.component'
import { ThemeColorsComponent } from './theme-colors/theme-colors.component'
import { ThemePropsComponent } from './theme-props/theme-props.component'
import { ThemeUseComponent, Workspace } from './theme-use/theme-use.component'
import { ThemeInternComponent } from './theme-intern/theme-intern.component'
import { ThemeCreateComponent } from '../theme-create/theme-create.component'
import { ThemeDeleteComponent } from '../theme-delete/theme-delete.component'

export type ChangeMode = 'VIEW' | 'EDIT'
export type LoadingState = 'initial' | 'ready' | 'loading' | 'timeout'
export function slotInitializer(slotService: SlotService) {
  return () => slotService.init()
}
type ThemeData = {
  theme: Theme
  propsValid: boolean | undefined
  colorsValid: boolean | undefined
}

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
  styleUrl: './theme-detail.component.scss'
})
export class ThemeDetailComponent implements OnInit {
  private readonly user = inject(UserService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly location = inject(Location)
  private readonly themeApi = inject(ThemesAPIService)
  private readonly themeService = inject(ThemeService)
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)
  private readonly imageApi = inject(ImagesInternalAPIService)
  private readonly slotService = inject(SlotService)
  private readonly destroyRef = inject(DestroyRef)
  // signals
  public readonly themeDeleteVisible = signal<boolean>(false)
  public readonly themeCreateVisible = signal<boolean>(false)
  public readonly themeToBeDeleted = signal<Theme | undefined>(undefined)
  public readonly themeForCreation = signal<Theme | undefined>(undefined)
  public readonly checkThemeUse = signal<boolean>(false)
  public readonly isComponentDefined = signal<boolean>(false)
  public readonly themeUsed = signal<boolean>(false)
  public readonly themeUsedName = signal<string | undefined>(undefined)
  public readonly themeUsedByWorkspaces = signal<Workspace[]>([])
  public readonly themeUseLoadingState = signal<LoadingState>('initial')
  // signals: Combine the data from the sub components to a single theme object and check if the forms are valid
  public themeData = computed(() => this.computeThemeData())
  // signals: components
  public readonly tabComponent = viewChild(Tabs)
  public readonly themePropsComponent = viewChild(ThemePropsComponent)
  public readonly themeColorsComponent = viewChild(ThemeColorsComponent)
  // private timer to avoid long waits for getting workspace data
  private themeUseTimeoutTimer: ReturnType<typeof setTimeout> | undefined
  private themeUseStartTime: number | undefined
  private readonly MIN_LOADING_TIME = 1500 // 1.5 seconds
  private readonly MAX_LOADING_TIME = 4000 // 4 seconds
  // dialog
  public loading = true
  public exceptionKey: string | undefined = undefined
  public changeMode: ChangeMode = 'VIEW'
  public autoApply = false
  public showOperatorMessage = true // display initially only
  public selectedTabIndex = '0'
  public dateFormat = 'M/d/yy, hh:mm:ss a'
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
  public themeForProps: Theme | undefined
  public themeForColors: Theme | undefined
  // image
  public imageBasePath = this.imageApi.configuration.basePath
  // receive the slot output
  public slotName = 'onecx-workspace-data'
  public slotEmitter = new EventEmitter<Workspace[]>()

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

  ngOnInit(): void {
    // old constructor starts here
    // Initialize the slot service for getting workspaces using the theme.
    slotInitializer(this.slotService)
    this.slotService
      .isSomeComponentDefinedForSlot(this.slotName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isDefined) => {
        this.isComponentDefined.set(isDefined)
      })
    // trigger the request to the workspace service via slot to get the workspaces that use the theme
    this.themeUsed.set(false)
    // receive data and stop process
    this.slotEmitter.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      this.stopGettingThemeUseData(res)
    })

    // old constructor ends here
    this.dateFormat = this.user.lang$.getValue() === 'de' ? 'dd.MM.yyyy HH:mm:ss' : this.dateFormat
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
          this.preparePageActions(response.resource)
          return response.resource
        }),
        catchError((err) => {
          this.exceptionKey = 'EXCEPTIONS.HTTP_STATUS_' + Utils.mapping_error_status(err.status) + '.THEME'
          console.error('getThemeByName', err)
          this.prepareHeaderUrl()
          this.preparePageActions()
          return of(undefined)
        }),
        finalize(() => {
          this.loading = false
          this.tabComponent()?.value.set(this.selectedTabIndex) // Forces tab change
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
   * GETTING THEME USE IN WORKSPACES
   * The theme use in workspaces is checked when the user opens the "Use" tab or when the user tries to delete a theme.
   * The check is done by sending a request to the workspace service via a slot. The response is received via an event emitter.
   * The loading state is managed by a signal and a timeout timer. The loading indicator is shown for at least 1.5 seconds.
   * If the data is not received within timeout time, the loading state is set to "timeout".
   */
  private computeThemeData(): ThemeData {
    const themeProps = this.themePropsComponent()?.combinedFormValues()
    const themeColors = this.themeColorsComponent()?.combinedFormValues()
    const propsValid = this.themePropsComponent()?.isComponentValid()
    const colorsValid = this.themeColorsComponent()?.isComponentValid()
    return {
      theme: { ...themeProps, ...themeColors },
      propsValid: propsValid,
      colorsValid: colorsValid
    } as ThemeData
  }

  // Initialize the process of checking if the theme is used in workspaces
  private startGettingThemeUseData(themeName?: string): void {
    if (themeName && this.themeUseLoadingState() === 'initial') {
      this.themeUseLoadingState.set('loading')
      // best customer experience: show the loading indicator for at least 1.5 seconds, even if the data is received faster
      this.themeUseStartTime = performance.now() // store the start time for measuring loading duration
      if (this.themeUseTimeoutTimer) {
        clearTimeout(this.themeUseTimeoutTimer)
      }
      this.themeUseTimeoutTimer = setTimeout(() => {
        if (this.themeUseLoadingState() === 'loading') this.themeUseLoadingState.set('timeout')
      }, this.MAX_LOADING_TIME)
      this.themeUsedName.set(themeName) // force checking use in workspaces
    }
  }

  // Stop the process of checking if the theme is used in workspaces
  private stopGettingThemeUseData(workspaces: Workspace[]): void {
    this.themeUsedByWorkspaces.set(workspaces)
    this.themeUsed.set(workspaces.length > 0)
    const themeUseLoadingDuration = performance.now() - this.themeUseStartTime!
    // Switch not to fast to the ready state, to avoid flickering of the loading indicator.
    const rest = this.MIN_LOADING_TIME - themeUseLoadingDuration
    if (rest > 0) {
      setTimeout(() => {
        this.themeUseLoadingState.set('ready')
      }, rest)
    } else {
      this.themeUseLoadingState.set('ready')
    }
    // clear the timeout timer if it is still running, to avoid unnecessary state changes
    if (this.themeUseTimeoutTimer) {
      clearTimeout(this.themeUseTimeoutTimer)
      this.themeUseTimeoutTimer = undefined
    }
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
      if (this.selectedTabIndex === '3') {
        this.startGettingThemeUseData(theme?.name)
      }
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
      this.preparePageActions(theme)
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
  private prepareThemeData(): Theme | undefined {
    // check form state in sub components before saving: must be valid!
    if (!this.themeData().propsValid) return undefined
    if (!this.themeData().colorsValid) return undefined

    let data = this.themeData().theme // combined data from sub components
    // combine with the original theme data to preserve properties (modificationCount!)
    data = {
      ...data,
      id: undefined,
      operator: undefined,
      modificationCount: this.theme?.modificationCount,
      // prevent empty strings for urls, as it causes issues for the image service
      logoUrl: data.logoUrl === '' ? undefined : data.logoUrl,
      smallLogoUrl: data.smallLogoUrl === '' ? undefined : data.smallLogoUrl,
      faviconUrl: data.faviconUrl === '' ? undefined : data.faviconUrl
    }
    return data
  }

  private onUpdateTheme(): void {
    const themeData = this.prepareThemeData()
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
            this.theme$ = of(data.resource) // update observable with response data
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
      themeData = this.prepareThemeData()
      if (!themeData) return
    } else {
      themeData = this.theme
    }
    if (!themeData) return
    this.themeForCreation.set({
      ...themeData,
      ...this.undefinedThemeData,
      name: copyOfPrefix + themeData.name,
      displayName: copyOfPrefix + themeData.displayName
    })
    this.themeCreateVisible.set(true)
  }

  public onThemeCreation(theme: Theme | undefined): void {
    this.themeForCreation.set(undefined)
    this.themeCreateVisible.set(false)
    if (theme) {
      this.router.navigate(['../' + theme.name], { relativeTo: this.route })
    }
  }

  /**
   * DELETE
   */
  public onDeleteTheme(theme: Theme): void {
    this.themeToBeDeleted.set(theme)
    this.startGettingThemeUseData(theme?.name)
    this.themeDeleteVisible.set(true)
  }

  public onThemeDeletion(): void {
    this.router.navigate(['..'], { relativeTo: this.route })
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
  public preparePageActions(theme?: Theme): void {
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
  public onUseThemeAsTemplate(selectedTheme: Theme): void {
    if (selectedTheme.id)
      this.themeApi.getThemeById({ id: selectedTheme.id }).subscribe((response) => {
        this.themeForProps = {
          ...response.resource,
          ...this.undefinedThemeData,
          name: this.theme?.name,
          displayName: (selectedTheme.displayName ?? 'copy of ') + response.resource.displayName,
          modificationCount: this.theme?.modificationCount
        }
        this.themeForColors = response.resource
        this.msgService.info({ summaryKey: 'THEME.TEMPLATE.CONFIRMATION.OK' })
      })
  }
}
