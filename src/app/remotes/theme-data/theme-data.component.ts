import { Component, DestroyRef, EventEmitter, Inject, Input, OnChanges } from '@angular/core'
import { AsyncPipe, Location } from '@angular/common'
import { UntilDestroy } from '@ngneat/until-destroy'
import { TranslateModule } from '@ngx-translate/core'
import { BehaviorSubject, catchError, first, map, Observable, of, ReplaySubject } from 'rxjs'

import {
  AngularRemoteComponentsModule,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  SLOT_SERVICE,
  SlotService
} from '@onecx/angular-remote-components'
import { AngularAcceleratorModule } from '@onecx/angular-accelerator'
import { REMOTE_COMPONENT_CONFIG, RemoteComponentConfig } from '@onecx/angular-utils'
import { AppConfigService } from '@onecx/angular-integration-interface'

import {
  Configuration,
  Theme,
  ThemesAPIService,
  SearchThemeRequest,
  SearchThemeResponse
} from 'src/app/shared/generated'
import { Utils, LogoRefType } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'

type DataType = 'logo' | 'favicon' | 'themes' | 'theme'

@Component({
  selector: 'app-theme-data',
  templateUrl: './theme-data.component.html',
  standalone: true,
  imports: [AngularAcceleratorModule, AngularRemoteComponentsModule, AsyncPipe, TranslateModule],
  providers: [{ provide: SLOT_SERVICE, useExisting: SlotService }]
})
@UntilDestroy()
export class OneCXThemeDataComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges {
  // input
  @Input() refresh: boolean | undefined = false // on any change here a reload is triggered
  @Input() dataType: DataType | undefined = undefined // which response data is expected
  @Input() themeName: string | undefined = undefined // search parameter
  @Input() imageId: string | undefined = undefined
  @Input() imageUrl: string | undefined = undefined
  @Input() imageStyleClass: string | undefined = undefined
  @Input() useDefaultLogo = false // used if logo loading failed
  @Input() logPrefix: string | undefined = undefined
  @Input() logEnabled = false
  @Input() set ocxRemoteComponentConfig(config: RemoteComponentConfig) {
    this.ocxInitRemoteComponent(config)
  }
  // output
  @Input() themes = new EventEmitter<Theme[]>()
  @Input() theme = new EventEmitter<Theme>()
  @Input() imageLoadingFailed = new EventEmitter<boolean>()

  public themes$: Observable<Theme[]> | undefined
  public theme$: Observable<Theme> | undefined
  public imageUrl$ = new BehaviorSubject<string | undefined>(undefined)
  public defaultImageUrl: string | undefined = undefined

  constructor(
    @Inject(REMOTE_COMPONENT_CONFIG)
    private readonly remoteComponentConfig: ReplaySubject<RemoteComponentConfig>,
    private readonly appConfigService: AppConfigService,
    private readonly destroyRef: DestroyRef,
    private readonly slotService: SlotService,
    private readonly themeApi: ThemesAPIService
  ) {}

  // initialize this component as remote
  public ocxInitRemoteComponent(config: RemoteComponentConfig): void {
    this.appConfigService.init(config.baseUrl)
    this.remoteComponentConfig.next(config)
    this.slotService.init()
    this.themeApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(config.baseUrl, environment.apiPrefix)
    })
    if (environment.DEFAULT_LOGO_PATH)
      this.defaultImageUrl = Utils.prepareUrlPath(config.baseUrl, environment.DEFAULT_LOGO_PATH)
  }

  /**
   * Prepare searches on each change
   */
  public ngOnChanges(): void {
    if (this.dataType === 'themes') this.getThemes()
    if (this.dataType === 'theme') this.getTheme()
    if (this.dataType === 'logo') {
      // start image existence life cycle here: url => image => default (opt)
      this.imageUrl$.next(this.getImageUrl(this.themeName, 'url'))
    }
  }

  /**
   * THEMES
   */
  private getThemes(): void {
    const criteria: SearchThemeRequest = {
      name: this.themeName,
      pageSize: 1000
    }
    this.themes$ = this.themeApi.searchThemes({ searchThemeRequest: criteria }).pipe(
      first(),
      map((response: SearchThemeResponse) => {
        return response.stream?.sort(Utils.sortByDisplayName) ?? []
      }),
      catchError((err) => {
        console.error('onecx-theme-data.searchThemes', err)
        return of([])
      })
    )
    this.themes$.subscribe(this.themes)
  }

  /**
   * THEME
   */
  private getTheme() {
    if (!this.themeName) return
    this.theme$ = this.themeApi.getThemeByName({ name: this.themeName }).pipe(
      first(),
      map((data) => data.resource),
      catchError((err) => {
        console.error('onecx-theme-data.getThemeByName', err)
        return of({})
      })
    )
    this.theme$.subscribe(this.theme)
  }

  /**
   * Image
   */
  public onImageLoad() {
    this.log('onImageLoad => ok')
    this.imageLoadingFailed.emit(false)
  }

  // try next prio level depending on previous used URL
  public onImageLoadError(usedUrl: string): void {
    this.log('onImageLoadError using => ' + usedUrl)
    if (usedUrl === this.imageUrl) {
      this.imageUrl$.next(this.getImageUrl(this.themeName, 'image'))
    } else if (usedUrl === this.getImageUrl(this.themeName, 'image')) {
      this.imageUrl$.next(this.getImageUrl(this.themeName, 'default'))
    }
  }

  public getImageUrl(themeName: string | undefined, prioType: string): string | undefined {
    if (!prioType || !['logo', 'favicon'].includes(this.dataType ?? 'unknown')) return undefined
    this.log('getImageUrl on prioType => ' + prioType)

    // if URL exist
    if (['url'].includes(prioType) && this.imageUrl && this.imageUrl !== '') {
      this.log('getImageUrl => ' + this.imageUrl)
      return this.imageUrl
    } else if (['url', 'image'].includes(prioType)) {
      this.log('getImageUrl => ' + Utils.bffImageUrl(this.themeApi.configuration.basePath, themeName, LogoRefType.Logo))
      return Utils.bffImageUrl(this.themeApi.configuration.basePath, themeName, LogoRefType.Logo)
    } else if (['url', 'image', 'default'].includes(prioType) && this.useDefaultLogo && this.defaultImageUrl !== '') {
      // if user wants to have the default (as asset)
      return this.defaultImageUrl
    }
    this.log('getImageUrl => stop')
    this.imageLoadingFailed.emit(true) // finally inform caller about impossibility
    return undefined
  }

  private log(text: string) {
    if (this.logEnabled) console.info('onecx-theme-data: ' + (this.logPrefix ?? '') + ' => ' + text)
  }
}
