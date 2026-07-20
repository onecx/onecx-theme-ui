import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnChanges,
  model,
  input,
  output
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { HttpHeaders } from '@angular/common/http'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { TranslateModule, TranslateService } from '@ngx-translate/core'
import { map, startWith } from 'rxjs'

import { ButtonModule } from 'primeng/button'
import { DialogModule } from 'primeng/dialog'
import { FileUploadModule, FileSelectEvent } from 'primeng/fileupload'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { MessageModule } from 'primeng/message'
import { ToastModule } from 'primeng/toast'
import { TooltipModule } from 'primeng/tooltip'

import { PortalMessageService } from '@onecx/angular-integration-interface'

import { Theme, ThemesAPIService, ThemeSnapshot } from 'src/app/shared/generated'
import { ThemeColorBoxComponent } from 'src/app/shared/theme-color-box/theme-color-box.component'
import { ThemeProperties } from 'src/app/shared/models/theme.model'

@Component({
  selector: 'app-theme-import',
  standalone: true,
  imports: [
    ButtonModule,
    DialogModule,
    FileUploadModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    MessageModule,
    ReactiveFormsModule,
    TranslateModule,
    TooltipModule,
    ToastModule,
    ThemeColorBoxComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-import.component.html',
  styleUrl: './theme-import.component.scss'
})
export class ThemeImportComponent implements OnChanges, AfterViewInit {
  private readonly themeApi = inject(ThemesAPIService)
  public readonly translate = inject(TranslateService)
  private readonly msgService = inject(PortalMessageService)
  private readonly cd = inject(ChangeDetectorRef)
  // signals
  public readonly themes = input.required<Theme[] | undefined>()
  public readonly visible = model.required<boolean>()
  public readonly uploaded = output<Theme | undefined>()
  public readonly importError = model<'GENERAL' | 'CONTENT' | 'NONE'>()
  // dialog
  public themeNameExists = false
  public displayNameExists = false
  public themeSnapshot: ThemeSnapshot | null = null
  public httpHeaders!: HttpHeaders
  public properties: ThemeProperties | null = null
  public formGroup = new FormGroup({
    themeName: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ]),
    displayName: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100)
    ])
  })
  // signals
  public readonly isFormValid = toSignal(
    this.formGroup.statusChanges.pipe(
      map((status) => status === 'VALID'),
      startWith(this.formGroup.valid) // initial state on component init
    ),
    { requireSync: true }
  )

  ngOnChanges(): void {
    if (this.visible()) {
      this.httpHeaders = new HttpHeaders()
      this.httpHeaders = this.httpHeaders.set('Content-Type', 'application/json')
    }
    this.onImportClear()
  }

  ngAfterViewInit() {
    this.cd.detectChanges()
  }

  public async onImportSelectFile(event: FileSelectEvent): Promise<void> {
    this.onImportClear()
    return event.files[0].text().then((text) => {
      try {
        this.themeSnapshot = JSON.parse(text)
        if (this.isThemeImportRequestDTO(this.themeSnapshot)) {
          if (this.themeSnapshot.themes) {
            // the theme export does not include more than one theme, so we can safely take the first key
            const key: string[] = Object.keys(this.themeSnapshot.themes)
            this.properties = this.themeSnapshot.themes[key[0]].properties as ThemeProperties
            this.formGroup.controls['themeName'].setValue(key[0])
            this.formGroup.controls['displayName'].setValue(this.themeSnapshot.themes[key[0]].displayName ?? null)
            if (this.formGroup.controls['displayName'].value === null) {
              this.formGroup.controls['displayName'].setErrors({ required: true })
              this.formGroup.controls['displayName'].markAsDirty()
            }
          }
          this.onThemeNameChange()
        } else {
          console.error('Theme Import Error: not valid data ')
          this.importError.set('CONTENT')
        }
        this.cd.markForCheck() // force change detection to update the view with the new properties
      } catch (err) {
        console.error('Theme Import Parse Error', err)
        this.importError.set('GENERAL')
      }
    })
  }

  public onThemeNameChange() {
    if (this.themes()?.length === 0 || !this.formGroup.valid) return
    this.themeNameExists = this.themes()!.some((theme) => theme.name === this.formGroup.controls['themeName'].value)
    this.displayNameExists = this.themes()!.some(
      (theme) => theme.displayName === this.formGroup.controls['displayName'].value
    )
  }

  public onImportClear(): void {
    this.formGroup.reset()
    this.importError.set('NONE')
    this.themeSnapshot = null
    this.themeNameExists = false
    this.displayNameExists = false
  }

  public onThemeUpload(): void {
    if (!this.formGroup.valid || !this.properties) return
    if (!this.themeSnapshot?.themes) return
    // Import data preparation
    const key: string[] = Object.keys(this.themeSnapshot?.themes)
    if (this.formGroup.controls['displayName'].value)
      this.themeSnapshot.themes[key[0]].displayName = this.formGroup.controls['displayName'].value
    if (key[0] !== this.formGroup.controls['themeName'].value) {
      // save the theme properties to be reassigned on new key
      const themeProps = Object.getOwnPropertyDescriptor(this.themeSnapshot.themes, key[0])
      Object.defineProperty(this.themeSnapshot.themes, this.formGroup.controls['themeName'].value!, themeProps!)
      delete this.themeSnapshot.themes[key[0]]
    }
    // Import execution: upload
    this.themeApi.importThemes({ themeSnapshot: this.themeSnapshot }).subscribe({
      next: () => {
        this.msgService.success({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
        this.uploaded.emit({
          name: this.formGroup.controls['themeName'].value!,
          displayName: this.formGroup.controls['displayName'].value!
        })
        this.onImportClear()
      },
      error: () => {
        this.msgService.error({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_FAIL' })
      }
    })
  }

  private isThemeImportRequestDTO(obj: unknown): obj is ThemeSnapshot {
    const dto = obj as ThemeSnapshot
    return !!(typeof dto === 'object' && dto?.themes)
  }
}
