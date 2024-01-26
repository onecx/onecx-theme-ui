import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'
import { Location } from '@angular/common'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-image-container',
  styleUrls: ['./image-container.component.scss'],
  templateUrl: './image-container.component.html'
})
export class ImageContainerComponent implements OnChanges {
  @Input() public id = ''
  @Input() public imageUrl: string | undefined
  @Input() public small = false

  public displayPlaceHolder = false
  private apiPrefix = environment.apiPrefix

  public onImageError() {
    this.displayPlaceHolder = true
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.displayPlaceHolder = false
      // if image Url does not start with a http the api-prefix ...
      //   ...then it stored in the backend. So we need to put prefix in front
      if (this.imageUrl && !this.imageUrl.match(/^(http|https)/g) && !this.imageUrl.startsWith(this.apiPrefix)) {
        this.imageUrl = Location.joinWithSlash(this.apiPrefix, this.imageUrl)
      }
    }
  }
}
