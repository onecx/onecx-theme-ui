import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Theme } from '../../../generated'

@Component({
  selector: 'tm-theme-intern',
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'

  constructor(private translate: TranslateService) {}
}
