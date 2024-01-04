import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms'
import { Observable, debounceTime, switchMap } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'
import { ConfirmationService, SelectItem } from 'primeng/api'

import { Action, ConfigurationService, ThemeService, PortalMessageService } from '@onecx/portal-integration-angular'

import { themeVariables } from '../theme-variables'
import { environment } from '../../../environments/environment'
import { GetThemeResponse, Theme, ThemesAPIService, ThemeUpdateCreate, UpdateThemeResponse } from '../../generated'
import { dropDownSortItemsByLabel, dropDownGetLabelByValue, setFetchUrls } from '../../shared/utils'

@Component({
  selector: 'tm-theme-designer',
  templateUrl: './theme-designer.component.html',
  styleUrls: ['./theme-designer.component.scss'],
  providers: [ConfirmationService]
})
export class ThemeDesignerComponent implements OnInit {
  @ViewChild('saveAsThemeName') saveAsThemeName: ElementRef | undefined
  @ViewChild('selectedFileInputLogo') selectedFileInputLogo: ElementRef | undefined
  @ViewChild('selectedFileInputFavicon') selectedFileInputFavicon: ElementRef | undefined

  public actions: Action[] = []
  themes: Theme[] = []
  theme: Theme | undefined
  themeId: string | null
  themeVars = themeVariables
  themeTemplates!: SelectItem[]
  themeTemplateSelectedId = ''
  themeIsCurrentUsedTheme = false

  mode: 'EDIT' | 'NEW' = 'NEW'
  autoApply = false
  apiPrefix = environment.apiPrefix
  saveAsNewPopupDisplay = false
  fetchingLogoUrl?: string
  fetchingFaviconUrl?: string

  fontForm: FormGroup
  basicForm: FormGroup
  sidebarForm: FormGroup
  topbarForm: FormGroup
  generalForm: FormGroup
  propertiesForm: FormGroup
  groups: {
    title: string
    formGroup: FormGroup
    key: keyof typeof themeVariables
  }[]
  public displayFileTypeErrorLogo = false
  public displayFileTypeErrorFavicon = false

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private themeApi: ThemesAPIService,
    private themeService: ThemeService,
    //private imageApi: ImageV1APIService,
    private config: ConfigurationService,
    private translate: TranslateService,
    private confirmation: ConfirmationService,
    private msgService: PortalMessageService
  ) {
    this.mode = route.snapshot.paramMap.has('id') ? 'EDIT' : 'NEW'
    this.themeId = route.snapshot.paramMap.get('id')
    this.themeIsCurrentUsedTheme = this.themeId === this.config.getPortal().themeId
    this.translate
      .get([
        'ACTIONS.CANCEL',
        'ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE',
        'ACTIONS.SAVE',
        'ACTIONS.TOOLTIPS.SAVE',
        'ACTIONS.SAVE_AS',
        'ACTIONS.TOOLTIPS.SAVE_AS'
      ])
      .subscribe((data) => {
        this.prepareActionButtons(data)
      })
    this.fontForm = new FormGroup({})
    this.topbarForm = new FormGroup({})
    this.generalForm = new FormGroup({})
    this.sidebarForm = new FormGroup({})
    this.groups = [
      {
        key: 'general',
        title: 'General Colors',
        formGroup: this.generalForm
      },
      {
        key: 'topbar',
        title: 'Topbar - Portal Header',
        formGroup: this.topbarForm
      },
      {
        key: 'sidebar',
        title: 'Sidebar / Menu',
        formGroup: this.sidebarForm
      }
    ]
    this.propertiesForm = this.fb.group({
      font: this.fontForm,
      topbar: this.topbarForm,
      general: this.generalForm,
      sidebar: this.sidebarForm
    })

    this.basicForm = this.fb.group({
      name: new FormControl<string>('', [Validators.required]),
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
    if (this.mode === 'EDIT' && this.themeId) {
      this.getThemeById(this.themeId).subscribe((data) => {
        this.theme = data.resource
        this.basicForm.patchValue(data)
        this.propertiesForm.reset()
        this.propertiesForm.patchValue(data.resource.properties || {})
        this.setFetchUrls()
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

  private prepareActionButtons(data: any): void {
    this.actions = [] // provoke change event
    this.actions.push(
      {
        label: data['ACTIONS.CANCEL'],
        title: data['ACTIONS.TOOLTIPS.CANCEL_AND_CLOSE'],
        actionCallback: () => this.close(),
        icon: 'pi pi-times',
        show: 'always',
        permission: 'THEME#VIEW'
      },
      {
        label: data['ACTIONS.SAVE'],
        title: data['ACTIONS.TOOLTIPS.SAVE'],
        actionCallback: () => this.updateTheme(),
        icon: 'pi pi-save',
        show: 'always',
        conditional: true,
        showCondition: this.mode === 'EDIT',
        permission: 'THEME#SAVE'
      },
      {
        label: data['ACTIONS.SAVE_AS'],
        title: data['ACTIONS.TOOLTIPS.SAVE_AS'],
        actionCallback: () => this.saveAsNewPopup(),
        icon: 'pi pi-plus-circle',
        show: 'always',
        permission: 'THEME#CREATE'
      }
    )
  }

  // DropDown Theme Template
  private loadThemeTemplates(): void {
    this.themeApi.getThemes({}).subscribe((data) => {
      if (data.stream !== undefined) {
        this.themeTemplates = [...data.stream.map(this.themeDropdownMappingFn).sort(dropDownSortItemsByLabel)]
      }
    })
  }

  private themeDropdownMappingFn = (theme: Theme) => {
    return {
      label: theme.name,
      value: theme.id
    }
  }

  public onThemeTemplateDropdownChange(): void {
    const themeName = dropDownGetLabelByValue(this.themeTemplates, this.themeTemplateSelectedId) ?? ''
    this.translate
      .get([
        'GENERAL.COPY_OF',
        'THEME.TEMPLATE.CONFIRMATION.HEADER',
        'THEME.TEMPLATE.CONFIRMATION.MESSAGE',
        'ACTIONS.CONFIRMATION.YES',
        'ACTIONS.CONFIRMATION.NO'
      ])
      .subscribe((data) => {
        this.confirmTemplateTheme(themeName, data)
      })
  }

  private confirmTemplateTheme(themeName: string, data: any) {
    this.confirmUseThemeAsTemplate(
      themeName,
      data,
      () => {
        this.getThemeById(this.themeTemplateSelectedId).subscribe((result) => {
          if (this.mode === 'NEW') {
            this.basicForm.controls['name'].setValue(data['GENERAL.COPY_OF'] + result.resource.name)
            this.basicForm.controls['description'].setValue(result.resource.description)
            this.basicForm.controls['faviconUrl'].setValue(result.resource.faviconUrl)
            this.basicForm.controls['logoUrl'].setValue(result.resource.logoUrl)
            this.setFetchUrls()
          }
          if (result.resource.properties) {
            this.propertiesForm.reset()
            this.propertiesForm.patchValue(result.resource.properties)
          }
        })
      },
      () => {
        // on reject
        this.themeTemplateSelectedId = ''
      }
    )
  }

  public confirmUseThemeAsTemplate(themeName: string, data: any, onConfirm: () => void, onReject: () => void): void {
    this.confirmation.confirm({
      icon: 'pi pi-question-circle',
      defaultFocus: 'reject',
      dismissableMask: true,
      header: data['THEME.TEMPLATE.CONFIRMATION.HEADER'],
      message: data['THEME.TEMPLATE.CONFIRMATION.MESSAGE'].replace('{{ITEM}}', themeName),
      acceptLabel: data['ACTIONS.CONFIRMATION.YES'],
      rejectLabel: data['ACTIONS.CONFIRMATION.NO'],
      accept: () => onConfirm(),
      reject: () => onReject()
    })
  }

  private close(): void {
    this.router.navigate(['./..'], { relativeTo: this.route })
  }

  private updateTheme(): void {
    if (this.propertiesForm.invalid) {
      this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.getThemeById(this.themeId!)
        .pipe(
          switchMap((data) => {
            data.resource.properties = this.propertiesForm.value
            Object.assign(data, this.basicForm.value)
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
            if (this.themeIsCurrentUsedTheme) {
              this.themeService.apply(data as object)
            }
          },
          // eslint-disable @typescript-eslint/no-unused-vars
          error: () => {
            this.msgService.error({ summaryKey: 'ACTIONS.EDIT.MESSAGE.CHANGE_NOK' })
          }
        })
    }
  }

  public saveTheme(newThemename: string): void {
    const newTheme: ThemeUpdateCreate = { ...this.basicForm.value }
    newTheme.name = newThemename
    newTheme.properties = this.propertiesForm.value

    this.themeApi.createTheme({ createThemeRequest: { resource: newTheme } }).subscribe({
      next: (data) => {
        if (this.mode === 'EDIT') {
          this.router.navigate([`../../${data.resource.id}`], {
            relativeTo: this.route
          })
        } else {
          this.router.navigate([`../${data.resource.id}`], { relativeTo: this.route })
        }
        this.msgService.success({ summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_OK' })
      },
      // eslint-disable @typescript-eslint/no-unused-vars
      error: (err) => {
        this.msgService.error({
          summaryKey: 'ACTIONS.CREATE.MESSAGE.CREATE_NOK',
          detailKey:
            err?.error?.key && err?.error?.key === 'PERSIST_ENTITY_FAILED'
              ? 'ACTIONS.CREATE.MESSAGE.THEME_ALREADY_EXISTS'
              : err.error
        })
      }
    })
  }

  // SAVE AS
  public saveAsNewPopup(): void {
    this.saveAsNewPopupDisplay = true
  }
  public onShowSaveAsDialog(): void {
    if (this.saveAsThemeName) {
      if (this.mode === 'NEW') this.saveAsThemeName.nativeElement.value = this.basicForm.controls['name'].value
      if (this.mode === 'EDIT')
        this.saveAsThemeName.nativeElement.value =
          this.translate.instant('GENERAL.COPY_OF') + this.basicForm.controls['name'].value
    }
  }

  private getThemeById(id: string): Observable<GetThemeResponse> {
    return this.themeApi.getThemeById({ id: id })
  }

  // Image Files
  public onFileUpload(ev: Event, fieldType: 'logo' | 'favicon'): void {
    this.displayFileTypeErrorLogo = false
    this.displayFileTypeErrorFavicon = false
    /**
    if (ev.target && (ev.target as HTMLInputElement).files) {
      const files = (ev.target as HTMLInputElement).files
      if (files) {
        if (files[0].name.match(/^.*.(jpg|jpeg|png)$/)) {
          Array.from(files).forEach((file) => {
            this.imageApi.uploadImage({ image: file }).subscribe((data) => {
              this.basicForm.controls[fieldType + 'Url'].setValue(data.imageUrl)
              this.setFetchUrls()
              this.msgService.info({ summaryKey: 'LOGO.UPLOADED' })
            })
          })
        } else {
          this.displayFileTypeErrorLogo = fieldType === 'logo'
          this.displayFileTypeErrorFavicon = fieldType === 'favicon'
        }
      }
    }
     */
  }
  private setFetchUrls(): void {
    this.fetchingLogoUrl = setFetchUrls(this.apiPrefix, this.basicForm.value.logoUrl)
    this.fetchingFaviconUrl = setFetchUrls(this.apiPrefix, this.basicForm.value.faviconUrl)
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
}
