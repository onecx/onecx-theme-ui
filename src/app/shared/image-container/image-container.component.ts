import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core'
import { map } from 'rxjs'

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
  styleUrls: ['./image-container.component.scss'],
  templateUrl: './image-container.component.html'
})
export class ImageContainerComponent implements OnChanges {
  @Input() public id = ''
  @Input() public title = ''
  @Input() public small = false
  @Input() public imageUrl: string | undefined
  @Input() public styleClass: string | undefined
  @Output() public imageLoadResult = new EventEmitter<boolean>() // inform caller

  public displayImageUrl: string | undefined
  public defaultImageUrl = ''
  public displayDefault = false

  prepareUrlPath = prepareUrlPath

  constructor(private readonly appState: AppStateService) {
    appState.currentMfe$
      .pipe(
        map((mfe) => {
          this.defaultImageUrl = this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_PATH)
        })
      )
      .subscribe()
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Hint: there are more changes (e.g. on title) => ignore them
    if (changes['imageUrl']) {
      if (this.imageUrl) {
        this.displayDefault = false
        this.displayImageUrl = this.imageUrl
      } else this.displayDefault = true
    }
  }

  /**
   * Image loading Results
   */
  public onImageLoadSuccess(): void {
    if (this.displayImageUrl !== undefined) this.imageLoadResult.emit(true)
  }

  public onImageLoadError(): void {
    if (this.displayImageUrl !== undefined) this.imageLoadResult.emit(false)
    this.displayDefault = true
    this.displayImageUrl = undefined
  }
}
