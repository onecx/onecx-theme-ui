import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { HttpHeaders } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core'
import { ActivatedRoute, Router } from '@angular/router'

import { PortalMessageService } from '@onecx/portal-integration-angular'

import { Theme, ThemesAPIService, ThemeSnapshot } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-import',
  templateUrl: './theme-import.component.html',
  styleUrls: ['./theme-import.component.scss']
})
export class ThemeImportComponent implements OnInit {
  @Input() public displayThemeImport = false
  @Output() public displayThemeImportChange = new EventEmitter<boolean>()
  @Output() public uploadEmitter = new EventEmitter()

  public themes!: Theme[]
  public themeName = ''
  public themeNameExists = false
  public themeImportError = false
  public themeSnapshot: ThemeSnapshot | null = null
  public httpHeaders!: HttpHeaders
  public properties: any = null

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private themeApi: ThemesAPIService,
    public translate: TranslateService,
    private msgService: PortalMessageService
  ) {}

  ngOnInit(): void {
    this.httpHeaders = new HttpHeaders()
    this.httpHeaders = this.httpHeaders.set('Content-Type', 'application/json')
    this.getThemes()
  }

  public async onImportThemeSelect(event: { files: FileList }): Promise<void> {
    return event.files[0].text().then((text) => {
      this.themeSnapshot = null
      try {
        const themeSnapshot = JSON.parse(text)
        if (this.isThemeImportRequestDTO(themeSnapshot)) {
          this.themeSnapshot = themeSnapshot
          this.themeImportError = false
          if (themeSnapshot.themes) {
            let key: string[] = Object.keys(themeSnapshot.themes)
            this.themeName = key[0]
            this.properties = themeSnapshot.themes[key[0]].properties
          }
          this.checkThemeExistence()
        } else {
          console.error('Theme Import Error: not valid data ')
          this.themeImportError = true
        }
      } catch (err) {
        console.error('Theme Import Parse Error', err)
      }
    })
  }

  public checkThemeExistence() {
    this.themeNameExists = this.themes.filter((theme) => theme.name === this.themeName).length > 0
  }

  public onImportThemeHide(): void {
    this.displayThemeImportChange.emit(false)
  }
  public onImportThemeClear(): void {
    this.themeSnapshot = null
    this.themeImportError = false
  }
  public onThemeUpload(): void {
    if (!this.themeSnapshot?.themes) return
    let key: string[] = Object.keys(this.themeSnapshot?.themes)
    if (key[0] !== this.themeName) {
      // save the theme properties to be reassigned on new key
      let themeProps = Object.getOwnPropertyDescriptor(this.themeSnapshot.themes, key[0])
      Object.defineProperty(this.themeSnapshot.themes, this.themeName, themeProps ?? {})
      delete this.themeSnapshot.themes[key[0]]
    }
    this.themeApi
      .importThemes({
        themeSnapshot: this.themeSnapshot
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
          this.onImportThemeClear()
          this.displayThemeImport = false
          this.uploadEmitter.emit()
          this.router.navigate([`./${this.themeName}`], { relativeTo: this.route })
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

  private getThemes(): void {
    this.themeApi.getThemes({}).subscribe((themes) => {
      if (themes.stream) {
        this.themes = themes.stream
      }
    })
  }
}
