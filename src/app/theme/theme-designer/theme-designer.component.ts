import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, combineLatest, debounceTime, first, map, switchMap } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { ConfirmationService, SelectItem } from 'primeng/api'

import { Action, PortalMessageService, ThemeService } from '@onecx/portal-integration-angular'
import { bffImageUrl, dropDownSortItemsByLabel, dropDownGetLabelByValue } from 'src/app/shared/utils'
import {
  GetThemeResponse,
  ImagesInternalAPIService,
  RefType,
  Theme,
  ThemesAPIService,
  ThemeUpdateCreate,
  UpdateThemeResponse
} from 'src/app/shared/generated'
import { themeVariables } from './theme-variables'

@Component({
  selector: 'app-theme-designer',
  templateUrl: './theme-designer.component.html',
  styleUrls: ['./theme-designer.component.scss'],
  providers: [ConfirmationService]
})
export class ThemeDesignerComponent implements OnInit {
  @ViewChild('saveAsThemeName') saveAsThemeName: ElementRef | undefined
  @ViewChild('saveAsThemeDisplayName') saveAsThemeDisplayName: ElementRef | undefined
  @ViewChild('selectedFileInputLogo') selectedFileInputLogo: ElementRef | undefined
  @ViewChild('selectedFileInputFavicon') selectedFileInputFavicon: ElementRef | undefined

  public RefType = RefType
  public actions$: Observable<Action[]> | undefined
  public themes: Theme[] = []
  public theme: Theme | undefined
  public themeId: string | undefined
  public themeName: string | null
  public copyOfPrefix: string | undefined
  public themeVars = themeVariables
  public themeTemplates!: SelectItem[]
  public bffImagePath: string | undefined
  public fetchingLogoUrl?: string
  public fetchingFaviconUrl?: string
  public imageLogoUrlExists = false
  public imageFaviconUrlExists = false

  public changeMode: 'EDIT' | 'CREATE' = 'CREATE'
  public isCurrentTheme = false
  public autoApply = false
  public saveAsNewPopupDisplay = false
  public displayFileTypeErrorLogo = false
  public displayFileTypeErrorFavicon = false

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
    private readonly msgService: PortalMessageService
  ) {
    this.changeMode = route.snapshot.paramMap.has('name') ? 'EDIT' : 'CREATE'
    this.themeName = route.snapshot.paramMap.get('name')
    this.bffImagePath = this.imageApi.configuration.basePath
    this.preparePageActions()

    this.fontForm = new FormGroup({})
    this.topbarForm = new FormGroup({})
    this.generalForm = new FormGroup({})
    this.sidebarForm = new FormGroup({})
    this.groups = [
      { key: 'general', title: 'General Colors', formGroup: this.generalForm },
      { key: 'topbar', title: 'Topbar - Workspace Header', formGroup: this.topbarForm },
      { key: 'sidebar', title: 'Sidebar / Menu', formGroup: this.sidebarForm }
    ]
    this.propertiesForm = this.fb.group({
      font: this.fontForm,
      topbar: this.topbarForm,
      general: this.generalForm,
      sidebar: this.sidebarForm
    })

    this.basicForm = this.fb.group({
      name: new FormControl<string>('', [Validators.required]),
      displayName: new FormControl<string>('', [Validators.required]),
      description: new FormControl<string | null>(null),
      logoUrl: new FormControl<string | null>(null),
      faviconUrl: new FormControl<string | null>(null)
    })

    themeVariables.font.forEach((v: string) => {
      const fc = new FormControl<string | null>(null)
      this.fontForm.addControl(v, fc)
    })

    themeVariables.general.forEach((v: string) => {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) {
          this.updateCssVar(v, formVal || '')
        }
      })
      this.generalForm.addControl(v, fc)
    })

    themeVariables.topbar.forEach((v: string) => {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) {
          this.updateCssVar(v, formVal || '')
        }
      })
      this.topbarForm.addControl(v, fc)
    })

    themeVariables.sidebar.forEach((v: string) => {
      const fc = new FormControl<string | null>(null)
      fc.valueChanges.pipe(debounceTime(300)).subscribe((formVal) => {
        if (this.autoApply) {
          this.updateCssVar(v, formVal || '')
        }
      })
      this.sidebarForm.addControl(v, fc)
    })
  }

  ngOnInit(): void {
    this.imageLogoUrlExists = false
    this.imageFaviconUrlExists = false
    if (this.changeMode === 'EDIT' && this.themeName) {
      combineLatest([
        this.themeService.currentTheme$.pipe(first()),
        this.themeApi.getThemeByName({ name: this.themeName })
      ]).subscribe(([currentTheme, data]) => {
        this.theme = data.resource
        this.themeId = this.theme.id
        this.basicForm.patchValue(this.theme)
        this.basicForm.controls['name'].disable()
        this.propertiesForm.reset()
        this.propertiesForm.patchValue(this.theme.properties ?? {})
        this.isCurrentTheme = this.theme.name === currentTheme.name
        this.autoApply = this.isCurrentTheme
        // images
        this.fetchingLogoUrl = this.getImageUrl(this.theme, RefType.Logo)
        this.fetchingFaviconUrl = this.getImageUrl(this.theme, RefType.Favicon)
        this.imageLogoUrlExists = !this.theme.logoUrl || this.theme.logoUrl === ''
        this.imageFaviconUrlExists = !this.theme.faviconUrl || this.theme.faviconUrl === ''
      })
    } else {
      const currentVars: { [key: string]: { [key: string]: string } } = {}
      Object.entries(themeVariables).forEach(([key, val]: [string, string[]]) => {
        currentVars[key] = {}
        val.forEach((v) => {
          currentVars[key][v] = getComputedStyle(document.documentElement).getPropertyValue(`--${v}`)
        })
      })
      this.propertiesForm.reset()
      this.propertiesForm.patchValue(currentVars)
    }
    this.loadThemeTemplates()
  }

  private preparePageActions(): void {
    this.actions$ = this.translate
      .get([
        'GENERAL.COPY_OF',
        'ACTIONS.CANCEL',
        'ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE',
        'ACTIONS.SAVE',
        'ACTIONS.TOOLTIPS.SAVE',
        'ACTIONS.SAVE_AS',
        'ACTIONS.TOOLTIPS.SAVE_AS'
      ])
      .pipe(
        map((data) => {
          this.copyOfPrefix = data['GENERAL.COPY_OF']
          return [
            {
              label: data['ACTIONS.CANCEL'],
              title: data['ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE'],
              actionCallback: () => this.onClose(),
              icon: 'pi pi-times',
              show: 'always',
              permission: 'THEME#VIEW'
            },
            {
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
              label: data['ACTIONS.SAVE_AS'],
              title: data['ACTIONS.TOOLTIPS.SAVE_AS'],
              actionCallback: () => this.onOpenSaveAsPopup(),
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

  // DropDown Theme Template
  private loadThemeTemplates(): void {
    this.themeApi.getThemes({}).subscribe((data) => {
      if (data.stream !== undefined) {
        this.themeTemplates = [
          ...data.stream
            .map((theme) => ({
              label: theme.displayName,
              value: theme.id
            }))
            .sort(dropDownSortItemsByLabel)
        ]
      }
    })
  }

  public onThemeTemplateDropdownChange(ev: any): void {
    const themeName = dropDownGetLabelByValue(this.themeTemplates, ev.value)
    this.confirmTemplateTheme(themeName, ev.value)
  }

  private confirmTemplateTheme(name: string, id: string) {
    this.translate
      .get([
        'GENERAL.COPY_OF',
        'THEME.TEMPLATE.CONFIRMATION.HEADER',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE',
        'ACTIONS.CONFIRMATION.YES',
        'ACTIONS.CONFIRMATION.NO'
      ])
      .pipe(
        map((data) => {
          this.confirmUseThemeAsTemplate(name, data, () => {
            this.getThemeById(id).subscribe((result) => {
              if (this.changeMode === 'CREATE') {
                this.basicForm.controls['name'].setValue(data['GENERAL.COPY_OF'] + result.resource.name)
                this.basicForm.controls['displayName'].setValue(result.resource.displayName)
                this.basicForm.controls['description'].setValue(result.resource.description)
                this.basicForm.controls['logoUrl'].setValue(result.resource.logoUrl)
                this.basicForm.controls['faviconUrl'].setValue(result.resource.faviconUrl)
                this.fetchingLogoUrl = this.getImageUrl(result.resource, RefType.Logo)
                this.fetchingFaviconUrl = this.getImageUrl(result.resource, RefType.Favicon)
              }
              if (result.resource.properties) {
                this.propertiesForm.reset()
                this.propertiesForm.patchValue(result.resource.properties)
              }
            })
          })
        })
      )
      .subscribe()
  }

  private confirmUseThemeAsTemplate(themeName: string, data: any, onConfirm: () => void): void {
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

  public saveAsTheme(newThemename: string, newDisplayName: string): void {
    const newTheme: ThemeUpdateCreate = { ...this.basicForm.value }
    newTheme.name = newThemename
    newTheme.displayName = newDisplayName
    newTheme.properties = this.propertiesForm.value
    if (this.imageFaviconUrlExists) newTheme.faviconUrl = undefined
    if (this.imageLogoUrlExists) newTheme.logoUrl = undefined
    this.createTheme(newTheme)
  }

  // SAVE AS => EDIT mode
  public onOpenSaveAsPopup(): void {
    this.saveAsNewPopupDisplay = true
  }
  public onShowSaveAsDialog(): void {
    const basicFormName = this.basicForm.controls['name'].value
    const basicFormDisplayName = this.basicForm.controls['displayName'].value
    this.saveAsThemeName!.nativeElement.value = this.copyOfPrefix + basicFormName
    this.saveAsThemeDisplayName!.nativeElement.value = this.copyOfPrefix + basicFormDisplayName
  }

  // EDIT
  private updateTheme(): void {
    this.themeApi
      .getThemeByName({ name: this.themeName! })
      .pipe(
        switchMap((data) => {
          data.resource.properties = this.propertiesForm.value
          if (this.imageFaviconUrlExists) {
            data.resource.faviconUrl = undefined
          } else {
            data.resource.faviconUrl = this.basicForm.controls['faviconUrl'].value
          }
          if (this.imageLogoUrlExists) {
            data.resource.logoUrl = undefined
          } else {
            data.resource.logoUrl = this.basicForm.controls['logoUrl'].value
          }
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
          this.msgService.success({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_OK' })
          // apply theme changes immediately if it is the theme of the current portal
          if (this.autoApply) {
            this.themeService.apply(data as object)
          }
        },
        error: (err) => {
          console.error('updateTheme', err)
          this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })
        }
      })
  }

  // CREATE
  private createTheme(theme: ThemeUpdateCreate): void {
    this.themeApi.createTheme({ createThemeRequest: { resource: theme } }).subscribe({
      next: (data) => {
        // new:  go to theme detail
        // edit: stay on designer => update theme with data?
        this.router.navigate([(this.changeMode === 'EDIT' ? '../' : '') + `../${data.resource.name}`], {
          relativeTo: this.route
        })
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_OK' })
      },
      error: (err) => {
        console.error('createTheme', err)
        this.msgService.error({
          summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_NOK',
          detailKey:
            err?.error?.errorCode && err?.error?.errorCode === 'PERSIST_ENTITY_FAILED'
              ? 'ACTIONS.CREATE.MESSAGE.THEME_ALREADY_EXISTS'
              : err.error
        })
      }
    })
  }

  private getThemeById(id: string): Observable<GetThemeResponse> {
    return this.themeApi.getThemeById({ id: id })
  }

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
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null
  }

  // Image Files
  public onFileUpload(ev: Event, fieldType: RefType): void {
    const currThemeName = this.basicForm.controls['name'].value
    if (!currThemeName || currThemeName === '') {
      this.msgService.error({
        summaryKey: 'IMAGE.CONSTRAINT_FAILED',
        detailKey: 'IMAGE.CONSTRAINT_NAME'
      })
      return
    }
    this.displayFileTypeErrorLogo = false
    this.displayFileTypeErrorFavicon = false

    if (ev.target && (ev.target as HTMLInputElement).files) {
      const files = (ev.target as HTMLInputElement).files
      if (files) {
        if (files[0].size > 100000) {
          this.msgService.error({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_SIZE'
          })
        } else if (!/^.*.(ico|jpg|jpeg|png)$/.exec(files[0].name)) {
          this.displayFileTypeErrorLogo = fieldType === RefType.Logo
          this.displayFileTypeErrorFavicon = fieldType === RefType.Favicon
          this.msgService.error({
            summaryKey: 'IMAGE.CONSTRAINT_FAILED',
            detailKey: 'IMAGE.CONSTRAINT_FILE_TYPE'
          })
        } else {
          this.saveImage(currThemeName, fieldType, files) // store image
        }
      }
    } else {
      this.msgService.error({
        summaryKey: 'IMAGE.CONSTRAINT_FAILED',
        detailKey: 'IMAGE.CONSTRAINT_FILE_MISSING'
      })
    }
  }

  private saveImage(name: string, refType: RefType, files: FileList) {
    const blob = new Blob([files[0]], { type: files[0].type })
    if (refType === RefType.Logo) {
      this.fetchingLogoUrl = undefined
    } else {
      this.fetchingFaviconUrl = undefined
    }
    const saveRequestParameter = {
      refId: name,
      refType: refType,
      body: blob
    }
    this.imageApi.getImage({ refId: name, refType: refType }).subscribe({
      next: () => {
        this.imageApi.updateImage(saveRequestParameter).subscribe(() => {
          this.prepareImageResponse(name, refType)
        })
      },
      error: () => {
        this.imageApi.uploadImage(saveRequestParameter).subscribe(() => {
          this.prepareImageResponse(name, refType)
        })
      }
    })
  }

  private prepareImageResponse(name: string, refType: RefType): void {
    if (refType === RefType.Logo) {
      this.fetchingLogoUrl = bffImageUrl(this.bffImagePath, name, refType)
    }
    if (refType === RefType.Favicon) {
      this.fetchingFaviconUrl = bffImageUrl(this.bffImagePath, name, refType)
    }
    this.msgService.info({ summaryKey: 'IMAGE.UPLOADED' })
    this.basicForm.controls[refType + 'Url'].setValue(null)
  }

  public getImageUrl(theme: Theme | undefined, refType: RefType): string | undefined {
    if (!theme) {
      return undefined
    }
    let url
    if (refType === RefType.Logo && theme.logoUrl !== null && theme.logoUrl !== '') {
      url = theme.logoUrl
    } else if (refType === RefType.Favicon && theme.faviconUrl !== null && theme.faviconUrl !== '') {
      url = theme.faviconUrl
    } else url = bffImageUrl(this.bffImagePath, theme.name, refType)
    return url
  }

  public onInputChange(refType: RefType) {
    let url: string | undefined = undefined
    if (refType === RefType.Logo) {
      url = this.basicForm.controls['logoUrl'].value
      // external
      if (url && url !== '' && /^(http|https).*/.exec(url)) this.fetchingLogoUrl = url
      // internal
      else this.fetchingLogoUrl = bffImageUrl(this.bffImagePath, this.theme?.name, refType)
    }
    if (refType === RefType.Favicon) {
      url = this.basicForm.controls['faviconUrl'].value
      // external
      if (url && url !== '' && /^(http|https).*/.exec(url)) this.fetchingFaviconUrl = url
      // internal
      else this.fetchingFaviconUrl = bffImageUrl(this.bffImagePath, this.theme?.name, refType)
    }
  }
}
