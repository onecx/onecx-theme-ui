import { Component, EventEmitter, Inject, Input } from '@angular/core'
import { CommonModule, Location } from '@angular/common'
import { UntilDestroy } from '@ngneat/until-destroy'
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs'

import {
  AngularRemoteComponentsModule,
  BASE_URL,
  RemoteComponentConfig,
  ocxRemoteComponent,
  ocxRemoteWebcomponent
} from '@onecx/angular-remote-components'
import { Theme, ThemeService } from '@onecx/angular-integration-interface'
import { PortalCoreModule } from '@onecx/portal-integration-angular'

import { Configuration, RefType, ThemesAPIService } from 'src/app/shared/generated'
import { bffImageUrl, prepareUrlPath } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'

@Component({
  selector: 'app-current-theme-logo',
  templateUrl: './current-theme-logo.component.html',
  standalone: true,
  imports: [AngularRemoteComponentsModule, CommonModule, PortalCoreModule],
  providers: [
    {
      provide: BASE_URL,
      useValue: new ReplaySubject<string>(1)
    }
  ]
})
@UntilDestroy()
export class OneCXCurrentThemeLogoComponent implements ocxRemoteComponent, ocxRemoteWebcomponent {
  // input
  @Input() refresh: boolean | undefined = false // on any change here a reload is triggered
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
  @Input() imageLoadingFailed = new EventEmitter<boolean>()

  public currentTheme$: Observable<Theme | undefined>
  public themeName: string | undefined
  public imageUrl$ = new BehaviorSubject<string | undefined>(undefined)
  public defaultImageUrl: string | undefined = undefined

  constructor(
    @Inject(BASE_URL) private readonly baseUrl: ReplaySubject<string>,
    private readonly themeApi: ThemesAPIService,
    private readonly themeService: ThemeService
  ) {
    this.currentTheme$ = this.themeService.currentTheme$.asObservable()
    this.currentTheme$.subscribe((theme) => {
      this.themeName = theme?.name
      this.imageUrl$.next(this.getImageUrl(this.themeName, 'url'))
    })
  }

  ocxInitRemoteComponent(remoteComponentConfig: RemoteComponentConfig) {
    this.baseUrl.next(remoteComponentConfig.baseUrl)
    this.themeApi.configuration = new Configuration({
      basePath: Location.joinWithSlash(remoteComponentConfig.baseUrl, environment.apiPrefix)
    })
    if (environment.DEFAULT_LOGO_PATH)
      this.defaultImageUrl = prepareUrlPath(remoteComponentConfig.baseUrl, environment.DEFAULT_LOGO_PATH)
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
    if (this.logEnabled) console.info('onecx-current-theme-logo: ' + (this.logPrefix ?? '') + ' => ' + text)
  }
}
