import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { map } from 'rxjs'

import { prepareUrl, prepareUrlPath } from 'src/app/shared/utils'
import { environment } from 'src/environments/environment'
import { AppStateService } from '@onecx/portal-integration-angular'

@Component({
  selector: 'app-image-container',
  styleUrls: ['./image-container.component.scss'],
  templateUrl: './image-container.component.html'
})
export class ImageContainerComponent implements OnChanges {
  @Input() public id = ''
  @Input() public imageUrl: string | undefined
  @Input() public small = false
  @Input() public styleClass: string | undefined

  public displayImageUrl: string | undefined
  public defaultImageUrl = ''
  public displayDefaultLogo = false

  prepareUrl = prepareUrl
  prepareUrlPath = prepareUrlPath

  constructor(private appState: AppStateService) {
    appState.currentMfe$
      .pipe(
        map((mfe) => {
          this.defaultImageUrl = this.prepareUrlPath(mfe.remoteBaseUrl, environment.DEFAULT_LOGO_URL)
        })
      )
      .subscribe()
  }

  public onImageError(): void {
    this.displayDefaultLogo = true
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] && this.imageUrl) {
      this.displayDefaultLogo = false
      this.displayImageUrl = prepareUrl(this.imageUrl)
    }
  }
}
