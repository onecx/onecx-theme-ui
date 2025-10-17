import { Component, Input, OnChanges } from '@angular/core'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  templateUrl: './theme-intern.component.html',
  styleUrls: ['./theme-intern.component.scss']
})
export class ThemeInternComponent implements OnChanges {
  @Input() theme: Theme | undefined
  @Input() dateFormat = 'medium'

  public mandatory = false
  public operator = false

  constructor() {}

  public ngOnChanges(): void {
    if (this.theme) {
      this.mandatory = this.theme.mandatory ?? false
      this.operator = this.theme.operator ?? false
    }
  }
}
