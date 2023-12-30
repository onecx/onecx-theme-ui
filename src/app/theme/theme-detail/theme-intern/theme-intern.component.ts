import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { ThemeDTO } from '../../../generated/model/themeDTO'

@Component({
  selector: 'tm-theme-intern',
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent {
  @Input() theme: ThemeDTO | undefined
  @Input() dateFormat = 'medium'

  constructor(private translate: TranslateService) {}
}
