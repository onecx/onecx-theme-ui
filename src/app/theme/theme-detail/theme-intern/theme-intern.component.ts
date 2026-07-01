import { Component, Input, OnChanges } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'
import { CheckboxModule } from 'primeng/checkbox'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  standalone: true,
  imports: [CommonModule, CheckboxModule, FormsModule, ReactiveFormsModule, TooltipModule, TranslateModule],
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
