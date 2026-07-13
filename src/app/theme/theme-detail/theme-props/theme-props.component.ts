import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  OnChanges,
  output,
  Signal,
  SimpleChanges
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { combineLatest, map, ReplaySubject, startWith } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputGroupModule } from 'primeng/inputgroup'
import { InputGroupAddonModule } from 'primeng/inputgroupaddon'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { ToastModule } from 'primeng/toast'
import { TooltipModule } from 'primeng/tooltip'

import { getLocation } from '@onecx/accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Utils, LogoRefType } from 'src/app/shared/utils'
import { ImagesInternalAPIService, MimeType, Theme, UploadImageRequestParams } from 'src/app/shared/generated'
import { ImageContainerComponent } from 'src/app/shared/image-container/image-container.component'

import { themeVariables } from '../theme-variables'
import { ChangeMode } from '../theme-detail.component'
import { DictionaryObject } from 'src/app/shared/models/theme.model'

@Component({
  selector: 'app-theme-props',
  standalone: true,
  imports: [
    ButtonModule,
    CheckboxModule,
    FloatLabelModule,
    FormsModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    ToastModule,
    TooltipModule,
    TranslateModule,
    ImageContainerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-props.component.html',
  styleUrl: './theme-props.component.scss'
})
export class ThemePropsComponent implements OnChanges {
  private readonly msgService = inject(PortalMessageService)
  private readonly translate = inject(TranslateService)
  private readonly imageApi = inject(ImagesInternalAPIService)
  // signals
  public readonly theme = model.required<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  public readonly headerImageUrl = output<string | undefined>()
  // signals for forms, initialized in constructor
  public isBasicFormValid!: Signal<boolean>
  public isFontFormValid!: Signal<boolean>
  public isComponentValid!: Signal<Theme>
  public combinedFormValues!: Signal<Theme>
  // image
  public bffUrl: Partial<Record<LogoRefType, string | undefined>> = {}
  public imageBasePath = this.imageApi.configuration.basePath
  public imageMaxSize = 100000
  // make it available in HTML
  public Utils = Utils
  public getLocation = getLocation
  public LogoRefType = LogoRefType
  // data
  public basicForm: FormGroup = new FormGroup({})
  public fontForm: FormGroup = new FormGroup({})
  public themeFormValues$ = new ReplaySubject<{ theme: string }>(1) // async storage of formgroup value to manage change detection

  constructor() {
    this.initForms()
    // build signals for form validation: basic and font form, for internal use in this component only
    this.isBasicFormValid = toSignal(
      this.basicForm.statusChanges.pipe(
        map((status) => status === 'VALID'),
        startWith(this.basicForm.valid) // initial state on component init
      ),
      { requireSync: true }
    )
    this.isFontFormValid = toSignal(
      this.fontForm.statusChanges.pipe(
        map((status) => status === 'VALID'),
        startWith(this.fontForm.valid) // initial state on component init
      ),
      { requireSync: true }
    )
    // build a combined signal for overall form validation: for use in detail component
    this.isComponentValid = computed(() => {
      return this.isBasicFormValid() && this.isFontFormValid()
    })
    // Combine the form values to a Theme
    this.combinedFormValues = toSignal<Theme>(
      combineLatest([
        this.basicForm.valueChanges.pipe(startWith(this.basicForm.value)),
        this.fontForm.valueChanges.pipe(startWith(this.fontForm.value))
      ]).pipe(
        map(([basicValue, fontValue]) => {
          return { ...basicValue, properties: { font: fontValue } } as Theme
        })
      ),
      { requireSync: true }
    )
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.basicForm.disable()
    this.fontForm.disable()
    if (this.theme() !== undefined) {
      if (changes['theme']) this.fillForm(this.theme()!)
      if (this.changeMode() !== 'VIEW') {
        this.basicForm.enable()
        this.fontForm.enable()
      }
    } else {
      this.basicForm.reset()
      this.fontForm.reset()
    }
  }

  private initForms() {
    this.basicForm = new FormGroup({
      name: new FormControl<string | null>(null, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      displayName: new FormControl<string | null>(null, [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]),
      description: new FormControl<string | null>(null, [Validators.maxLength(255)]),
      mandatory: new FormControl<boolean | null>({ value: null, disabled: true }),
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
    this.basicForm.valueChanges.subscribe(this.themeFormValues$)
    // font
    for (const v of themeVariables.font) {
      const fc = new FormControl<string | null>(null, [Validators.maxLength(255)])
      this.fontForm.addControl(v, fc)
    }
  }

  private fillForm(theme: Theme): void {
    this.basicForm.patchValue(theme)
    this.basicForm.get('name')?.disable()
    this.fontForm.reset()
    if (theme.properties) {
      const font = Utils.getThemePropertyValue<DictionaryObject>(theme.properties, 'font')
      if (font) this.fontForm.patchValue(font)
    }
    // initialize image variables: used URLs and if logo URLs exist
    this.setBffImageUrl(theme, LogoRefType.Logo)
    this.setBffImageUrl(theme, LogoRefType.LogoSmall)
    this.setBffImageUrl(theme, LogoRefType.Favicon)
  }

  /***************************************************************************
   * IMAGE => LOGO, LOGO SMALL, FAVICON => uploaded images and/or URL
   */

  // LOAD AND DISPLAYING
  // Image component informs about loading result for image
  public onImageLoadResult(loaded: boolean, refType: LogoRefType, extUrl?: string): void {
    if (loaded && refType === LogoRefType.Logo) {
      this.headerImageUrl.emit(!extUrl || extUrl === '' ? this.bffUrl[refType] : extUrl)
    }
    if (!loaded) {
      if (refType === LogoRefType.Logo) this.headerImageUrl.emit(undefined)
      // if no ext. URL then bff URL was used => reset
      if (!(extUrl && extUrl !== '') && this.bffUrl[refType]) this.bffUrl[refType] = undefined
    }
  }

  // initially prepare image URL based on theme
  public setBffImageUrl(theme: Theme | undefined, refType: LogoRefType): void {
    if (!theme) return undefined
    this.bffUrl[refType] = Utils.bffImageUrl(this.imageBasePath, theme.name, refType)
  }

  // UPLOAD
  public onFileUpload(ev: Event, refType: LogoRefType): void {
    if (ev.target) {
      const files = (ev.target as HTMLInputElement).files
      if (files?.length === 1) this.proccessFile(files[0], refType)
      else this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.FILE_MISSING' })
    }
  }
  private proccessFile(file: File, refType: LogoRefType): void {
    const regex = /^.*.(jpg|jpeg|png|svg)$/
    if (file.size > this.imageMaxSize)
      this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.SIZE' })
    else if (!regex.exec(file.name))
      this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.FILE_TYPE' })
    else if (this.theme()) this.saveImage(this.theme()!.name!, file, refType) // store image
  }

  // SAVE image
  private saveImage(name: string, file: File, refType: LogoRefType) {
    this.bffUrl[refType] = undefined // reset - important to trigger the change in UI (props)
    if (refType === LogoRefType.Logo) this.headerImageUrl.emit(undefined) // trigger the change in UI (header)
    function mapMimeType(type: string): MimeType {
      switch (type) {
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
    // prepare request
    const mType = mapMimeType(file.type)
    const data = mType === MimeType.Svgxml ? file : new Blob([file], { type: file.type })
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

  private saveImageResponse(name: string, refType: LogoRefType, err?: unknown): void {
    if (err) {
      console.error('uploadImage', err)
      this.msgService.error({ summaryKey: 'IMAGE.UPLOAD.NOK' })
    } else {
      this.msgService.success({ summaryKey: 'IMAGE.UPLOAD.OK' })
      this.bffUrl[refType] = Utils.bffImageUrl(this.imageBasePath, name, refType)
      if (refType === LogoRefType.Logo) this.headerImageUrl.emit(this.bffUrl[refType])
    }
  }

  // REMOVING
  public onRemoveImageUrl(refType: LogoRefType) {
    if (refType === LogoRefType.Logo && this.basicForm.get('logoUrl')?.value) {
      this.basicForm.get('logoUrl')?.setValue(null)
    }
    if (refType === LogoRefType.LogoSmall && this.basicForm.get('smallLogoUrl')?.value) {
      this.basicForm.get('smallLogoUrl')?.setValue(null)
    }
    this.bffUrl[refType] = Utils.bffImageUrl(this.imageBasePath, this.theme?.name, refType)
  }

  public onRemoveImage(refType: LogoRefType) {
    if (this.theme?.name && this.bffUrl[refType]) {
      // On VIEW mode: manage image is enabled
      this.imageApi.deleteImage({ refId: this.theme?.name, refType: refType }).subscribe({
        next: () => {
          // reset - important to trigger the change in UI
          this.bffUrl[refType] = undefined
          if (refType === LogoRefType.Logo) this.headerImageUrl.emit(undefined)
        },
        error: (err) => console.error('deleteImage', err)
      })
    }
  }
}
