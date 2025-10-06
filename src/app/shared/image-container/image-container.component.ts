import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { Observable, map } from 'rxjs'

import { AppStateService } from '@onecx/angular-integration-interface'

import { environment } from 'src/environments/environment'
import { prepareUrlPath } from 'src/app/shared/utils'

/**
 * This component displays the image with given imageURL.
 * A default image is displayed (stored in assets/images), if
 *   - the image URL was not provided
 *   - the image was not found (http status: 404)
 */
@Component({
  selector: 'app-image-container',
  templateUrl: './image-container.component.html'
})
export class ImageContainerComponent implements OnChanges {
  @Input() public id = 'th_image_container'
  @Input() public title: string | undefined
  @Input() public bffUrl: string | undefined // uploaded image
  @Input() public imageUrl: string | undefined // external URL
  @Input() public styleClass: string | undefined
  @Output() public imageLoadResult = new EventEmitter<boolean>() // inform caller

  public url: string | undefined = undefined
  public defaultImageUrl$: Observable<string>
  private defaultImageUrl: string | undefined
  private urlType: 'ext-url' | 'bff-url' | 'def-url' = 'ext-url'

  constructor(appState: AppStateService) {
    this.defaultImageUrl$ = appState.currentMfe$.pipe(
      map((mfe) => prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH))
    )
    this.defaultImageUrl$.subscribe((data) => (this.defaultImageUrl = data))
  }

  public ngOnChanges(): void {
    if (this.imageUrl) {
      if (/^(http|https):\/\/.{6,245}$/.exec(this.imageUrl)) {
        this.url = this.imageUrl
        this.urlType = 'ext-url'
      } else {
        this.url = this.defaultImageUrl
        this.urlType = 'def-url'
      }
    } else if (this.bffUrl) {
      this.url = this.bffUrl
      this.urlType = 'bff-url'
    } else {
      this.url = this.defaultImageUrl
      this.urlType = 'def-url'
    }
  }

  /**
   * Emit image loading results
   */
  public onImageLoadSuccess(): void {
    if (this.url !== undefined && this.url !== this.defaultImageUrl) this.imageLoadResult.emit(true)
  }

  // on loading error switch URL
  public onImageLoadError(): void {
    if (this.url !== undefined) this.imageLoadResult.emit(false)

    // using ext-url not possible, use bff URL
    if (this.urlType === 'ext-url') {
      if (this.bffUrl) {
        this.url = this.bffUrl
        this.urlType = 'bff-url'
      } else {
        this.url = this.defaultImageUrl
        this.urlType = 'def-url'
      }
      // using bff-url not possible, use default URL
    } else if (this.urlType === 'bff-url' && this.defaultImageUrl) {
      this.url = this.defaultImageUrl
      this.urlType = 'def-url'
    }
  }
}
