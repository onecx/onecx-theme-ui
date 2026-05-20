import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ReplaySubject } from 'rxjs'
import { TranslateService } from '@ngx-translate/core'

import { getLocation } from '@onecx/accelerator'
import { PortalMessageService } from '@onecx/angular-integration-interface'

import { ImagesInternalAPIService, MimeType, RefType, Theme, UploadImageRequestParams } from 'src/app/shared/generated'
import { Utils } from 'src/app/shared/utils'
import { themeVariables } from '../theme-variables'

@Component({
  selector: 'app-theme-props',
  templateUrl: './theme-props.component.html',
  styleUrls: ['./theme-props.component.scss']
})
export class ThemePropsComponent implements OnChanges {
  @Input() theme: Theme | undefined
  @Input() changeMode: 'VIEW' | 'EDIT' | 'CREATE' = 'VIEW'
  @Output() headerImageUrl = new EventEmitter<string>() // send logo url to detail header

  // data
  public basicForm: FormGroup
  public fontForm: FormGroup
  public themeFormValues$ = new ReplaySubject<{ theme: string }>(1) // async storage of formgroup value to manage change detection
  // image
  public RefType = RefType
  public bffUrl: Partial<Record<RefType, string | undefined>> = {}
  public imageBasePath = this.imageApi.configuration.basePath
  public imageMaxSize = 100000
  // make it available in HTML
  public Utils = Utils
  public getLocation = getLocation

  constructor(
    private readonly msgService: PortalMessageService,
    private readonly translate: TranslateService,
    private readonly imageApi: ImagesInternalAPIService
  ) {
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
    this.fontForm = new FormGroup({})
    for (const v of themeVariables.font) {
      const fc = new FormControl<string | null>(null, [Validators.maxLength(255)])
      this.fontForm.addControl(v, fc)
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.basicForm.disable()
    this.fontForm.disable()
    if (this.theme) {
      if (changes['theme']) this.fillForm(this.theme)
      if (this.changeMode !== 'VIEW') {
        this.basicForm.enable()
        this.fontForm.enable()
      }
    } else {
      this.basicForm.reset()
      this.fontForm.reset()
    }
  }

  private fillForm(theme: Theme): void {
    this.basicForm.patchValue(theme)
    this.basicForm.get('name')?.disable()
    this.fontForm.reset()
    if (theme.properties) {
      const font = Utils.getPropertyValue(theme.properties, 'font')
      this.fontForm.patchValue(font)
    }
    // initialize image variables: used URLs and if logo URLs exist
    this.setBffImageUrl(theme, RefType.Logo)
    this.setBffImageUrl(theme, RefType.LogoSmall)
    this.setBffImageUrl(theme, RefType.Favicon)
  }

  // called by theme detail dialog: returns form values to theme detail component for saving
  public onSave(): boolean {
    if (this.theme) {
      if (this.basicForm.valid) {
        Object.assign(this.theme, this.getFormData(this.basicForm))
      } else {
        this.msgService.error({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
        return false
      }
      if (this.fontForm.valid)
        // add only font properties
        this.theme.properties = {
          font: this.fontForm.value
        }
      else {
        this.msgService.error({ summaryKey: 'VALIDATION.ERRORS.FORM_INVALID' })
        return false
      }
    }
    return true
  }

  // return the values that are different
  private getFormData(form: FormGroup): any {
    const changes: any = {}
    Object.keys(form.controls).forEach((key) => {
      if (form.value[key] !== undefined) {
        if (form.value[key] !== (this.theme as any)[key]) {
          changes[key] = form.value[key]
        }
      }
    })
    return changes
  }

  /***************************************************************************
   * IMAGE => LOGO, LOGO SMALL, FAVICON => uploaded images and/or URL
   */

  // LOAD AND DISPLAYING
  // Image component informs about loading result for image
  public onImageLoadResult(loaded: any, refType: RefType, extUrl?: string): void {
    if (loaded && refType === RefType.Logo) {
      this.headerImageUrl.emit(!extUrl || extUrl === '' ? this.bffUrl[refType] : extUrl)
    }
    if (!loaded) {
      if (refType === RefType.Logo) this.headerImageUrl.emit(undefined)
      // if no ext. URL then bff URL was used => reset
      if (!(extUrl && extUrl !== '') && this.bffUrl[refType]) this.bffUrl[refType] = undefined
    }
  }

  // initially prepare image URL based on theme
  public setBffImageUrl(theme: Theme | undefined, refType: RefType): void {
    if (!theme) return undefined
    this.bffUrl[refType] = Utils.bffImageUrl(this.imageBasePath, theme.name, refType)
  }

  // UPLOAD
  public onFileUpload(ev: Event, refType: RefType): void {
    if (ev.target) {
      const files = (ev.target as HTMLInputElement).files
      if (files?.length === 1) this.proccessFile(files[0], refType)
      else this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.FILE_MISSING' })
    }
  }
  private proccessFile(file: File, refType: RefType): void {
    const regex = /^.*.(jpg|jpeg|png|svg)$/
    if (file.size > this.imageMaxSize)
      this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.SIZE' })
    else if (!regex.exec(file.name))
      this.msgService.error({ summaryKey: 'IMAGE.CONSTRAINT.FAILED', detailKey: 'IMAGE.CONSTRAINT.FILE_TYPE' })
    else if (this.theme) this.saveImage(this.theme.name!, file, refType) // store image
  }

  // SAVE image
  private saveImage(name: string, file: File, refType: RefType) {
    this.bffUrl[refType] = undefined // reset - important to trigger the change in UI (props)
    if (refType === RefType.Logo) this.headerImageUrl.emit(undefined) // trigger the change in UI (header)
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

  private saveImageResponse(name: string, refType: RefType, err?: any): void {
    if (err) {
      console.error('uploadImage', err)
      this.msgService.error({ summaryKey: 'IMAGE.UPLOAD.NOK' })
    } else {
      this.msgService.success({ summaryKey: 'IMAGE.UPLOAD.OK' })
      this.bffUrl[refType] = Utils.bffImageUrl(this.imageBasePath, name, refType)
      if (refType === RefType.Logo) this.headerImageUrl.emit(this.bffUrl[refType])
    }
  }

  // REMOVING
  public onRemoveImageUrl(refType: RefType) {
    if (refType === RefType.Logo && this.basicForm.get('logoUrl')?.value) {
      this.basicForm.get('logoUrl')?.setValue(null)
    }
    if (refType === RefType.LogoSmall && this.basicForm.get('smallLogoUrl')?.value) {
      this.basicForm.get('smallLogoUrl')?.setValue(null)
    }
    this.bffUrl[refType] = Utils.bffImageUrl(this.imageBasePath, this.theme?.name, refType)
  }

  public onRemoveImage(refType: RefType) {
    if (this.theme?.name && this.bffUrl[refType]) {
      // On VIEW mode: manage image is enabled
      this.imageApi.deleteImage({ refId: this.theme?.name, refType: refType }).subscribe({
        next: () => {
          // reset - important to trigger the change in UI
          this.bffUrl[refType] = undefined
          if (refType === RefType.Logo) this.headerImageUrl.emit(undefined)
        },
        error: (err) => console.error('deleteImage', err)
      })
    }
  }
}
