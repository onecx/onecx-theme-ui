import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { Theme } from 'src/app/generated'

@Component({
  selector: 'app-theme-intern',
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'

  constructor(private translate: TranslateService) {}
}
