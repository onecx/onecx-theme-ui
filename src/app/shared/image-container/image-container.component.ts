import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
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
  @Input() public small = false
  @Input() public imageUrl: string | undefined
  @Input() public styleClass: string | undefined
  @Output() public imageLoadResult = new EventEmitter<boolean>() // inform caller

  public url: string | undefined
  public defaultImageUrl: string | undefined
  public defaultImageUrl$: Observable<string>

  constructor(appState: AppStateService) {
    this.defaultImageUrl$ = appState.currentMfe$.pipe(
      map((mfe) => prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH))
    )
    this.defaultImageUrl$.subscribe((data) => (this.defaultImageUrl = data))
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      if (changes['imageUrl'].currentValue) this.url = this.imageUrl
      if (!changes['imageUrl'].currentValue && changes['imageUrl'].previousValue) this.url = this.defaultImageUrl
    }
  }

  /**
   * Emit image loading results
   */
  public onImageLoadSuccess(): void {
    if (this.imageUrl !== undefined) this.imageLoadResult.emit(true)
  }

  public onImageLoadError(): void {
    if (this.imageUrl !== undefined) this.imageLoadResult.emit(false)
  }
}
