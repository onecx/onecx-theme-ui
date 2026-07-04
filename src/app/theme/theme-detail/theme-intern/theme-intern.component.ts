import { Component, Input, OnChanges } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'
import { CommonModule } from '@angular/common'

import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  standalone: true,
  imports: [
    CommonModule,
    CheckboxModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  templateUrl: './theme-intern.component.html'
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
