import { AfterViewInit, Component, ChangeDetectorRef, Input, ViewChild, OnChanges, model } from '@angular/core'
import { HttpHeaders } from '@angular/common/http'
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { TranslateModule, TranslateService } from '@ngx-translate/core'

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
  templateUrl: './theme-import.component.html',
  styleUrls: ['./theme-import.component.scss']
})
export class ThemeImportComponent implements OnChanges, AfterViewInit {
  @Input() public themes: Theme[] = []

  @ViewChild('themeNameInput') themeNameInput!: HTMLInputElement

  public visible = model.required<boolean>()
  public uploaded = model.required<boolean>()

  public themeNameExists = false
  public displayNameExists = false
  public themeImportError = false
  public themeSnapshot: ThemeSnapshot | null = null
  public httpHeaders!: HttpHeaders
  public properties: any = null
  public formGroup: FormGroup

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly themeApi: ThemesAPIService,
    public readonly translate: TranslateService,
    private readonly msgService: PortalMessageService,
    private readonly cd: ChangeDetectorRef
  ) {
    this.uploaded.set(false)
    this.formGroup = new FormGroup({
      themeName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)])
    })
  }

  ngOnChanges(): void {
    if (this.visible()) {
      this.httpHeaders = new HttpHeaders()
      this.httpHeaders = this.httpHeaders.set('Content-Type', 'application/json')
    }
  }

  ngAfterViewInit() {
    this.cd.detectChanges()
  }

  public async onImportThemeSelect(event: FileSelectEvent): Promise<void> {
    this.formGroup.reset()
    return event.files[0].text().then((text) => {
      this.themeSnapshot = null
      try {
        const themeSnapshot = JSON.parse(text)
        if (this.isThemeImportRequestDTO(themeSnapshot)) {
          this.themeSnapshot = themeSnapshot
          this.themeImportError = false
          if (themeSnapshot.themes) {
            const key: string[] = Object.keys(themeSnapshot.themes)
            this.properties = themeSnapshot.themes[key[0]].properties
            this.formGroup.controls['themeName'].setValue(key[0])
            this.formGroup.controls['displayName'].setValue(themeSnapshot.themes[key[0]].displayName)
          }
          this.onThemeNameChange()
        } else {
          console.error('Theme Import Error: not valid data ')
          this.themeImportError = true
        }
      } catch (err) {
        console.error('Theme Import Parse Error', err)
      }
    })
  }

  public onThemeNameChange() {
    if (this.themes.length === 0 || !this.formGroup.valid) return
    this.themeNameExists = this.themes.some((theme) => theme.name === this.formGroup.controls['themeName'].value)
    this.displayNameExists = this.themes.some(
      (theme) => theme.displayName === this.formGroup.controls['displayName'].value
    )
  }

  public onImportThemeClear(): void {
    this.themeSnapshot = null
    this.themeImportError = false
  }
  public onThemeUpload(): void {
    if (!this.formGroup.valid || !this.properties) return
    if (!this.themeSnapshot?.themes) return
    // Import data preparation
    const key: string[] = Object.keys(this.themeSnapshot?.themes)
    this.themeSnapshot.themes[key[0]].displayName = this.formGroup.controls['displayName'].value
    if (key[0] !== this.formGroup.controls['themeName'].value) {
      // save the theme properties to be reassigned on new key
      const themeProps = Object.getOwnPropertyDescriptor(this.themeSnapshot.themes, key[0])
      Object.defineProperty(this.themeSnapshot.themes, this.formGroup.controls['themeName'].value, themeProps!)
      delete this.themeSnapshot.themes[key[0]]
    }
    // Import execution: upload
    this.themeApi
      .importThemes({
        themeSnapshot: this.themeSnapshot
      })
      .subscribe({
        next: () => {
          this.msgService.success({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
          this.onImportThemeClear()
          this.uploaded.set(true)
          this.router.navigate([`./${this.formGroup.controls['themeName'].value}`], { relativeTo: this.route })
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
