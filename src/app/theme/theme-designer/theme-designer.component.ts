import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, catchError, combineLatest, debounceTime, first, map, of, switchMap } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { ConfirmationService } from 'primeng/api'

import { PortalMessageService, ThemeService } from '@onecx/angular-integration-interface'
import { Action } from '@onecx/angular-accelerator'

import {
  GetThemeResponse,
  ImagesInternalAPIService,
  RefType,
  Theme,
  ThemesAPIService,
  ThemeUpdateCreate,
  UploadImageRequestParams,
  UpdateThemeResponse,
  MimeType
} from 'src/app/shared/generated'
import { bffImageUrl } from 'src/app/shared/utils'
import { themeVariables } from './theme-variables'

@Component({
  selector: 'app-theme-designer',
  templateUrl: './theme-designer.component.html',
  styleUrls: ['./theme-designer.component.scss'],
  providers: [ConfirmationService]
})
export class ThemeDesignerComponent implements OnInit, AfterContentChecked {
  // dialog
  public actions$: Observable<Action[]> | undefined
  public changeMode: 'EDIT' | 'CREATE' = 'CREATE'
  public isCurrentTheme = false
  public autoApply = false
  public headerImageUrl?: string
  public displaySaveAsDialog = false
  // data
  public theme$!: Observable<Theme>
  public themes$!: Observable<Theme[]>
  public themeId: string | undefined
  public themeName: string | null
  public copyOfPrefix: string | undefined
  public themeVars = themeVariables // make it available in HTML
  // Images: Logo, Favicon
  public RefType = RefType
  public bffImageUrl = bffImageUrl // make it available in HTML
  public imageBasePath = this.imageApi.configuration.basePath
  public bffUrl: Partial<Record<RefType, string | undefined>> = {}
  public imageMaxSize = 100000
  public urlPatternAbsolute = 'http(s)://path-to-image'

  // Forms
  public saveAsForm: FormGroup
  public fontForm: FormGroup
  public basicForm: FormGroup
  public sidebarForm: FormGroup
  public topbarForm: FormGroup
  public generalForm: FormGroup
  public propertiesForm: FormGroup
  public groups: {
    title: string
    formGroup: FormGroup
    key: keyof typeof themeVariables
  }[]

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly themeApi: ThemesAPIService,
    private readonly themeService: ThemeService,
    private readonly imageApi: ImagesInternalAPIService,
    private readonly translate: TranslateService,
    private readonly confirmation: ConfirmationService,
    private readonly msgService: PortalMessageService,
    private readonly cd: ChangeDetectorRef
  ) {
    this.themeName = route.snapshot.paramMap.get('name')
    this.changeMode = this.themeName ? 'EDIT' : 'CREATE'
    this.preparePageActions()
    // for using themes as templates
    this.themes$ = this.themeApi.searchThemes({ searchThemeRequest: {} }).pipe(
      map((data) => data.stream ?? []),
      catchError((err) => {
        console.error('searchThemes', err)
        return of([])
      })
    )
    // FORMs
    this.saveAsForm = new FormGroup({
      themeName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)])
    })
    this.basicForm = new FormGroup({})
    this.fontForm = new FormGroup({})
    this.topbarForm = new FormGroup({})
    this.generalForm = new FormGroup({})
    this.sidebarForm = new FormGroup({})
    this.groups = [
      { key: 'general', title: 'General Colors', formGroup: this.generalForm },
      { key: 'topbar', title: 'Topbar Colors', formGroup: this.topbarForm },
      { key: 'sidebar', title: 'Menu Colors', formGroup: this.sidebarForm }
    ]
    this.propertiesForm = this.fb.group({
      font: this.fontForm,
      topbar: this.topbarForm,
      general: this.generalForm,
      sidebar: this.sidebarForm
    })
    this.buildForms()
  }

  public ngOnInit(): void {
    if (this.changeMode === 'EDIT' && this.themeName) {
      this.theme$ = combineLatest([
        this.themeService.currentTheme$.pipe(first()),
        this.themeApi.getThemeByName({ name: this.themeName })
      ]).pipe(
        map(([ct, response]) => {
          this.themeId = response.resource.id
          this.isCurrentTheme = ct.name === response.resource.name
          this.autoApply = this.isCurrentTheme
          this.fillForm(response.resource)
          return response.resource
        })
      )
    } else {
      // CREATION ... initialize a fresh theme
      this.theme$ = of({})
      const currentVars: { [key: string]: { [key: string]: string } } = {}
      for (const tv of Object.entries(themeVariables)) {
        currentVars[tv[0]] = {}
        for (const v of tv[1])
          currentVars[tv[0]][v] = getComputedStyle(document.documentElement).getPropertyValue(`--${v}`)
      }
      this.propertiesForm.reset()
      this.propertiesForm.patchValue(currentVars)
    }
  }

  public ngAfterContentChecked(): void {
    this.cd.detectChanges()
  }

  private fillForm(theme: Theme): void {
    this.basicForm.patchValue(theme)
    this.basicForm.get('name')?.disable()
    this.propertiesForm.reset()
    if (theme.properties) this.propertiesForm.patchValue(theme.properties as { [key: string]: any })
    // images
    this.setBffImageUrl(theme, RefType.Logo)
    this.setBffImageUrl(theme, RefType.LogoSmall)
    this.setBffImageUrl(theme, RefType.Favicon)
  }

  /***************************************************************************
   * IMAGE => LOGO, LOGO SMALL, FAVICON => uploaded images and/or URL
   */

  // LOAD AND DISPLAYING
  // Image component informs about loading result for image
  public onImageLoadResult(loaded: any, refType: RefType, extUrl?: string): void {
    if (loaded && refType === RefType.Logo) {
      this.headerImageUrl = extUrl !== '' ? extUrl : this.bffUrl[refType]
    }
    if (!loaded) {
      if (refType === RefType.Logo) this.headerImageUrl = undefined
      // if no ext. URL then bff URL was used => reset
      if (!(extUrl && extUrl !== '') && this.bffUrl[refType]) this.bffUrl[refType] = undefined
    }
  }

  // initially prepare image URL based on workspace
  public setBffImageUrl(theme: Theme | undefined, refType: RefType): void {
    if (!theme) return undefined
    this.bffUrl[refType] = bffImageUrl(this.imageBasePath, theme.name, refType)
  }

  // UPLOAD
  public onFileUpload(ev: Event, refType: RefType): void {
    const currThemeName = this.basicForm.controls['name'].value
    if (!currThemeName || currThemeName === '') {
      this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.NAME' })
      return
    }
    const files = (ev.target as HTMLInputElement).files
    if (files) {
      const regex = RefType.Favicon === refType ? /^.*.(jpg|jpeg|ico|png|svg)$/ : /^.*.(jpg|jpeg|png|svg)$/
      if (files[0].size > this.imageMaxSize) {
        this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.SIZE' })
      } else if (!regex.exec(files[0].name)) {
        this.msgService.error({
          summaryKey: 'IMAGE.CONSTRAINT.FAILED',
          detailKey: 'IMAGE.CONSTRAINT.FILE_TYPE' + (RefType.Favicon === refType ? '.FAVICON' : '')
        })
      } else if (this.themeName) {
        this.saveImage(this.themeName, files, refType) // store image
      }
    } else this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.FILE_MISSING' })
  }

  private mapMimeType(type: string): MimeType {
    switch (type) {
      case 'image/x-icon':
        return MimeType.XIcon
      case 'image/svg+xml':
        return MimeType.Svgxml
      case 'image/jpg':
        return MimeType.Jpg
      case 'image/jpeg':
        return MimeType.Jpeg
      case 'image/png':
        return MimeType.Png
      default:
        return MimeType.Png
    }
  }

  // SAVE image
  private saveImage(name: string, files: FileList, refType: RefType) {
    this.bffUrl[refType] = undefined // reset - important to trigger the change in UI (props)
    this.headerImageUrl = undefined // trigger the change in UI (header)

    // prepare request
    const mType = this.mapMimeType(files[0].type)
    const data = mType === MimeType.Svgxml ? files[0] : new Blob([files[0]], { type: files[0].type })
    const requestParameter: UploadImageRequestParams = {
      refId: name,
      refType: refType,
      mimeType: mType,
      body: data
    }
    this.imageApi.uploadImage(requestParameter).subscribe({
      next: () => this.saveImageResponse(name, refType),
      error: (err) => this.saveImageResponse(name, refType, err)
    })
  }

  private saveImageResponse(name: string, refType: RefType, err?: any): void {
    if (err) {
      console.error('uploadImage', err)
      this.msgService.error({ summaryKey: 'IMAGE.UPLOAD.NOK' })
    } else {
      this.msgService.success({ summaryKey: 'IMAGE.UPLOAD.OK' })
      this.bffUrl[refType] = bffImageUrl(this.imageBasePath, name, refType)
      if (refType === RefType.Logo) this.headerImageUrl = this.bffUrl[refType]
    }
  }

  // REMOVING
  public onRemoveImageUrl(refType: RefType) {
    this.bffUrl[refType] = undefined
    if (refType === RefType.Logo && this.basicForm.get('logoUrl')?.value) {
      this.basicForm.get('logoUrl')?.setValue(null)
    }
    if (refType === RefType.LogoSmall && this.basicForm.get('smallLogoUrl')?.value) {
      this.basicForm.get('smallLogoUrl')?.setValue(null)
    }
    if (refType === RefType.Favicon && this.basicForm.get('faviconUrl')?.value) {
      this.basicForm.get('faviconUrl')?.setValue(null)
    }
    this.bffUrl[refType] = bffImageUrl(this.imageBasePath, this.themeName!, refType)
  }

  public onRemoveImage(refType: RefType) {
    if (this.themeName && this.bffUrl[refType]) {
      // On VIEW mode: manage image is enabled
      this.imageApi.deleteImage({ refId: this.themeName, refType: refType }).subscribe({
        next: () => {
          // reset - important to trigger the change in UI
          this.bffUrl[refType] = undefined
          if (refType === RefType.Logo) this.headerImageUrl = undefined
        },
        error: (err) => console.error('deleteImage', err)
      })
    }
  }

  /***************************************************************************
   * THEME
   */

  // SAVE and close dialog
  public onSaveTheme(): void {
    if (this.basicForm.invalid || this.propertiesForm.invalid) {
      this.msgService.error({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
      return
    }
    const newTheme: ThemeUpdateCreate = { ...this.basicForm.value }
    newTheme.properties = this.propertiesForm.value
    if (this.changeMode === 'CREATE') this.createTheme(newTheme)
    if (this.changeMode === 'EDIT') this.updateTheme()
  }

  // SAVE AS => create and route to
  public onSaveAsTheme(): void {
    const newTheme: ThemeUpdateCreate = { ...this.basicForm.value }
    newTheme.name = this.saveAsForm.controls['themeName'].value
    newTheme.displayName = this.saveAsForm.controls['displayName'].value
    newTheme.mandatory = false
    newTheme.properties = this.propertiesForm.value
    this.createTheme(newTheme)
  }

  // SAVE AS => EDIT mode
  public onDisplaySaveAsDialog(): void {
    this.saveAsForm.controls['themeName'].setValue(this.copyOfPrefix + this.basicForm.controls['name'].value)
    this.saveAsForm.controls['displayName'].setValue(this.copyOfPrefix + this.basicForm.controls['displayName'].value)
    this.displaySaveAsDialog = true
  }

  // CREATE
  private createTheme(theme: ThemeUpdateCreate): void {
    this.themeApi.createTheme({ createThemeRequest: { resource: theme } }).subscribe({
      next: (data) => {
        // new => save:     go to theme detail
        // edit => save as: stay on designer => update theme with data?
        this.router.navigate([(this.changeMode === 'EDIT' ? '../' : '') + `../${data.resource.name}`], {
          relativeTo: this.route
        })
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.OK' })
      },
      error: (err) => {
        console.error('createTheme', err)
        this.msgService.error({
          summaryKey: 'ACTIONS.CREATE.MESSAGE.NOK',
          detailKey:
            err?.error?.errorCode && err?.error?.errorCode === 'PERSIST_ENTITY_FAILED'
              ? 'ACTIONS.CREATE.MESSAGE.THEME_ALREADY_EXISTS'
              : err.error
        })
      }
    })
  }

  // EDIT
  private updateTheme(): void {
    this.themeApi
      .getThemeByName({ name: this.themeName! })
      .pipe(
        switchMap((data) => {
          data.resource.properties = this.propertiesForm.value

          if (this.basicForm.controls['logoUrl'].value) data.resource.logoUrl = undefined
          else data.resource.logoUrl = this.basicForm.controls['logoUrl'].value
          //
          if (this.basicForm.controls['smallLogoUrl'].value) data.resource.smallLogoUrl = undefined
          else data.resource.smallLogoUrl = this.basicForm.controls['smallLogoUrl'].value
          //
          if (this.basicForm.controls['faviconUrl'].value) data.resource.faviconUrl = undefined
          else data.resource.faviconUrl = this.basicForm.controls['faviconUrl'].value

          //
          Object.assign(data.resource, this.basicForm.value)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return this.themeApi.updateTheme({
            id: this.themeId!,
            updateThemeRequest: data
          })
        })
      )
      .subscribe({
        next: (data: UpdateThemeResponse) => {
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.MESSAGE.OK' })
          // apply theme changes immediately if it is the theme of the current portal
          if (this.autoApply) this.themeService.apply(data as object)
          this.onClose()
        },
        error: (err) => {
          console.error('updateTheme', err)
          this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.NOK' })
        }
      })
  }

  private getThemeById(id: string): Observable<GetThemeResponse> {
    return this.themeApi.getThemeById({ id: id })
  }

  // TEMPLATES
  public onSelectThemeTemplate(ev: any, themes: Theme[]): void {
    const theme = themes.find((t) => t.name === ev.value)
    if (theme?.displayName) this.confirmUseThemeTemplate(theme.displayName, ev.value)
  }

  private confirmUseThemeTemplate(name: string, id: string) {
    this.translate
      .get([
        'ACTIONS.COPY_OF',
        'THEME.TEMPLATE.CONFIRMATION.HEADER',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE',
        'ACTIONS.CONFIRMATION.YES',
        'ACTIONS.CONFIRMATION.NO'
      ])
      .pipe(
        map((data) => {
          this.displayConfirmationForUsingTemplate(name, data, this.useThemeAsTemplate(id, data))
        })
      )
      .subscribe()
  }

  private useThemeAsTemplate(themeId: string, data: any): any {
    return this.getThemeById(themeId).subscribe((result) => {
      if (this.changeMode === 'CREATE') {
        this.basicForm.controls['name'].setValue(data['ACTIONS.COPY_OF'] + result.resource.name)
        this.basicForm.controls['mandatory'].setValue(null)
        this.basicForm.controls['displayName'].setValue(result.resource.displayName)
        this.basicForm.controls['description'].setValue(result.resource.description)
        this.basicForm.controls['logoUrl'].setValue(result.resource.logoUrl)
        this.basicForm.controls['smallLogoUrl'].setValue(result.resource.smallLogoUrl)
        this.basicForm.controls['faviconUrl'].setValue(result.resource.faviconUrl)
        // images
        this.setBffImageUrl(result.resource, RefType.Logo)
        this.setBffImageUrl(result.resource, RefType.LogoSmall)
        this.setBffImageUrl(result.resource, RefType.Favicon)
      }
      if (result.resource.properties) {
        this.propertiesForm.reset()
        this.propertiesForm.patchValue(result.resource.properties)
      }
    })
  }

  private displayConfirmationForUsingTemplate(themeName: string, data: any, onConfirm: () => void): void {
    this.confirmation.confirm({
      icon: 'pi pi-question-circle',
      defaultFocus: 'reject',
      dismissableMask: true,
      header: data['THEME.TEMPLATE.CONFIRMATION.HEADER'],
      message: data['THEME.TEMPLATE.CONFIRMATION.MESSAGE'].replace('{{ITEM}}', themeName),
      acceptLabel: data['ACTIONS.CONFIRMATION.YES'],
      rejectLabel: data['ACTIONS.CONFIRMATION.NO'],
      accept: () => onConfirm()
    })
  }

  private onClose(): void {
    this.router.navigate(['./..'], { relativeTo: this.route })
  }

  /***************************************************************************
   * VARIOUS
   */

  // Applying Styles
  private updateCssVar(varName: string, value: string): void {
    document.documentElement.style.setProperty(`--${varName}`, value)
    const rgb = this.hexToRgb(value)
    if (rgb) {
      document.documentElement.style.setProperty(`--${varName}-rgb`, `${rgb.r},${rgb.g},${rgb.b}`)
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16)
        }
      : null
  }

  public buildForms() {
    this.basicForm = this.fb.group({
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      name: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(255)]),
      mandatory: new FormControl<boolean | null>(null),
      description: new FormControl<string | null>(null),
      logoUrl: new FormControl<string | null>(null, [
        Validators.minLength(7),
        Validators.maxLength(255),
        Validators.pattern('^(http|https)://.{6,245}')
      ]),
      smallLogoUrl: new FormControl<string | null>(null, [
        Validators.minLength(7),
        Validators.maxLength(255),
        Validators.pattern('^(http|https)://.{6,245}')
      ]),
      faviconUrl: new FormControl<string | null>(null, [
        Validators.minLength(7),
        Validators.maxLength(255),
        Validators.pattern('^(http|https)://.{6,245}')
      ])
    })

    for (const v of themeVariables.font) {
      const fc = new FormControl<string | null>(null)
      this.fontForm.addControl(v, fc)
    }
    for (const v of themeVariables.general) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) this.updateCssVar(v, formVal || '')
      })
      this.generalForm.addControl(v, fc)
    }
    for (const v of themeVariables.topbar) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) this.updateCssVar(v, formVal || '')
      })
      this.topbarForm.addControl(v, fc)
    }
    for (const v of themeVariables.sidebar) {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) this.updateCssVar(v, formVal || '')
      })
      this.sidebarForm.addControl(v, fc)
    }
  }

  private preparePageActions(): void {
    this.actions$ = this.translate
      .get([
        'ACTIONS.COPY_OF',
        'ACTIONS.CANCEL',
        'ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE',
        'ACTIONS.SAVE',
        'ACTIONS.TOOLTIPS.SAVE',
        'ACTIONS.SAVE_AS',
        'ACTIONS.TOOLTIPS.SAVE_AS'
      ])
      .pipe(
        map((data) => {
          this.copyOfPrefix = data['ACTIONS.COPY_OF']
          return [
            {
              id: 'th_designer_page_action_close',
              label: data['ACTIONS.CANCEL'],
              title: data['ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE'],
              actionCallback: () => this.onClose(),
              icon: 'pi pi-times',
              show: 'always',
              permission: 'THEME#VIEW'
            },
            {
              id: 'th_designer_page_action_save',
              label: data['ACTIONS.SAVE'],
              title: data['ACTIONS.TOOLTIPS.SAVE'],
              actionCallback: () => this.onSaveTheme(),
              icon: 'pi pi-save',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'EDIT' || this.changeMode === 'CREATE',
              permission: this.changeMode === 'EDIT' ? 'THEME#EDIT' : 'THEME#CREATE'
            },
            {
              id: 'th_designer_page_action_save_as',
              label: data['ACTIONS.SAVE_AS'],
              title: data['ACTIONS.TOOLTIPS.SAVE_AS'],
              actionCallback: () => this.onDisplaySaveAsDialog(),
              icon: 'pi pi-plus-circle',
              show: 'always',
              conditional: true,
              showCondition: this.changeMode === 'EDIT',
              permission: 'THEME#CREATE'
            }
          ]
        })
      )
  }
}
