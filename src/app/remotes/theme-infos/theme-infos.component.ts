import { Component, EventEmitter, Inject, Input, OnChanges } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { UntilDestroy } from '@ngneat/until-destroy'
import { TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { catchError, map, Observable, of, ReplaySubject } from 'rxjs'

import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent,
  provideTranslateServiceForRoot
} from '@onecx/angular-remote-components'
import { PortalCoreModule, createRemoteComponentTranslateLoader } from '@onecx/portal-integration-angular'

import {
  Configuration,
  RefType,
  Theme,
  ThemesAPIService,
  SearchThemeRequest,
  SearchThemeResponse
} from 'src/app/shared/generated'
import { SharedModule } from 'src/app/shared/shared.module'
import { bffImageUrl, prepareUrlPath, sortByDisplayName } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'

type DataType = 'logo' | 'favicon' | 'themes' | 'theme'

@Component({
  selector: 'app-theme-infos',
  templateUrl: './theme-infos.component.html',
  standalone: true,
  imports: [AngularRemoteComponentsModule, CommonModule, PortalCoreModule, TranslateModule, SharedModule],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    },
    provideTranslateServiceForRoot({
      isolate: true,
      loader: {
        provide: TranslateLoader,
        useFactory: createRemoteComponentTranslateLoader,
        deps: [HttpClient, BASE_URL]
      }
    })
  ]
})
@UntilDestroy()
export class OneCXThemeInfosComponent implements ocxRemoteComponent, ocxRemoteWebcomponent, OnChanges {
  // input
  @Input() refresh: boolean | undefined = false // on any change here a reload is triggered
  @Input() dataType: DataType | undefined = undefined // which response data is expected
  @Input() themeName: string | undefined = undefined // search parameter
  @Input() imageUrl: string | undefined = undefined
  @Input() imageStyleClass = ''
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
  public imageUrl$: Observable<string | undefined> = of(undefined)
  public defaultImageUrl: string | undefined = undefined

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly themeApi: ThemesAPIService
  ) {}

  ocxInitRemoteComponent(remoteComponentConfig: RemoteComponentConfig) {
    this.baseUrl.next(remoteComponentConfig.baseUrl)
    this.themeApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(remoteComponentConfig.baseUrl, environment.apiPrefix)
    })
    if (environment.DEFAULT_LOGO_PATH)
      this.defaultImageUrl = prepareUrlPath(remoteComponentConfig.baseUrl, environment.DEFAULT_LOGO_PATH)
  }

  /**
   * Prepare searches on each change
   */
  public ngOnChanges(): void {
    this.log('start => ' + this.dataType)
    if (this.dataType === 'themes') this.getThemes()
    if (this.dataType === 'theme') this.getTheme()
    if (this.dataType === 'logo') {
      // start image existence life cycle here: url => image => default (opt)
      this.imageUrl$ = of(this.getImageUrl(this.themeName, 'url'))
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
      map((response: SearchThemeResponse) => {
        return response.stream?.sort(sortByDisplayName) ?? []
      }),
      catchError((err) => {
        console.error('onecx-theme-infos.searchThemes', err)
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
      map((data) => data.resource),
      catchError((err) => {
        console.error('onecx-theme-infos.getThemeByName', err)
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
      this.imageUrl$ = of(this.getImageUrl(this.themeName, 'image'))
    } else if (usedUrl === this.getImageUrl(this.themeName, 'image')) {
      this.imageUrl$ = of(this.getImageUrl(this.themeName, 'default'))
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
      this.log('getImageUrl => ' + bffImageUrl(this.themeApi.configuration.basePath, themeName, RefType.Logo))
      return bffImageUrl(this.themeApi.configuration.basePath, themeName, RefType.Logo)
    } else if (['url', 'image', 'default'].includes(prioType) && this.useDefaultLogo && this.defaultImageUrl !== '') {
      // if user wants to have the default (as asset)
      return this.defaultImageUrl
    }
    this.log('getImageUrl => stop')
    this.imageLoadingFailed.emit(true) // finally inform caller about impossibility
    return undefined
  }

  private log(text: string) {
    if (this.logEnabled) console.log('onecx-theme-infos: ' + (this.logPrefix ?? '') + ' => ' + text)
  }
}
