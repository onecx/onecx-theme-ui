import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'
import { HttpHeaders } from '@angular/common/http'
import { TranslateService } from '@ngx-translate/core'
import { ActivatedRoute, Router } from '@angular/router'

import { ThemesAPIService } from './../../generated/api/themes.service'
import { Theme, ThemeSnapshot } from '../../generated'
import { PortalMessageService } from '@onecx/portal-integration-angular'

@Component({
  selector: 'tm-theme-import',
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
    this.getThemes(false)
  }

  public async onImportThemeSelect(event: { files: FileList }): Promise<void> {
    return event.files[0].text().then((text) => {
      this.themeSnapshot = null
      try {
        const themeSnapshot = JSON.parse(text)
        if (this.isThemeImportRequestDTO(themeSnapshot)) {
          this.themeSnapshot = themeSnapshot
          this.themeImportError = false
          if (themeSnapshot.themes !== undefined) {
            this.properties = themeSnapshot.themes[Object.keys(themeSnapshot.themes)[0]].properties
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
    this.themeNameExists = false
    if (this.themeSnapshot?.themes) {
      if (this.themes.find((theme) => Object.keys(this.themeSnapshot!.themes!).indexOf(theme.name!) > -1)) {
        this.themeNameExists = true
      }
    }
  }

  public onImportThemeHide(): void {
    this.displayThemeImportChange.emit(false)
  }
  public onImportThemeClear(): void {
    this.themeSnapshot = null
    this.themeImportError = false
  }
  public onThemeUpload(): void {
    this.themeApi
      .importThemes({
        themeSnapshot: this.themeSnapshot as ThemeSnapshot
      })
      .subscribe({
        next: (data) => {
          this.msgService.success({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_SUCCESS' })
          this.onImportThemeClear()
          this.displayThemeImport = false
          this.uploadEmitter.emit()
          this.router.navigate([`./${data.id}`], { relativeTo: this.route })
        },
        error: () => {
          this.msgService.error({ summaryKey: 'THEME.IMPORT.IMPORT_THEME_FAIL' })
        }
      })
  }

  private isThemeImportRequestDTO(obj: unknown): obj is ThemeSnapshot {
    const dto = obj as ThemeSnapshot
    return !!(typeof dto === 'object' && dto && dto.themes)
  }

  private getThemes(emit: boolean): void {
    this.themeApi.getThemes({}).subscribe((themes) => {
      if (themes.stream) {
        this.themes = themes.stream
      }
      if (emit) this.uploadEmitter.emit()
    })
  }
}
