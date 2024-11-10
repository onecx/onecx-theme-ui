import {
  AfterViewInit,
  Component,
  ChangeDetectorRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges
} from '@angular/core'
import { HttpHeaders } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'

import { PortalMessageService } from '@onecx/portal-integration-angular'

import { Theme, ThemesAPIService, ThemeSnapshot } from 'src/app/shared/generated'
import { FileSelectEvent } from 'primeng/fileupload'

@Component({
  selector: 'app-theme-import',
  templateUrl: './theme-import.component.html',
  styleUrls: ['./theme-import.component.scss']
})
export class ThemeImportComponent implements OnChanges, AfterViewInit {
  @Input() public displayThemeImport = false
  @Input() public themes: Theme[] = []
  @Output() public uploadEmitter = new EventEmitter<boolean>()

  @ViewChild('themeNameInput') themeNameInput!: HTMLInputElement

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
    this.formGroup = new FormGroup({
      themeName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
      displayName: new FormControl(null, [Validators.required, Validators.minLength(2), Validators.maxLength(100)])
    })
  }

  ngOnChanges(): void {
    if (this.displayThemeImport) {
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
    this.themeNameExists =
      this.themes.filter((theme) => theme.name === this.formGroup.controls['themeName'].value).length > 0
    this.displayNameExists =
      this.themes.filter((theme) => theme.displayName === this.formGroup.controls['displayName'].value).length > 0
  }

  public onImportThemeHide(): void {
    this.uploadEmitter.emit(false)
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
          this.uploadEmitter.emit(true)
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
