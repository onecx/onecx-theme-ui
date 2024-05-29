import { Component, Input, OnChanges } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent implements OnChanges {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'

  public operator = false

  constructor(private translate: TranslateService) {}

  public ngOnChanges(): void {
    if (this.theme) this.operator = this.theme.operator ?? false
  }
}
