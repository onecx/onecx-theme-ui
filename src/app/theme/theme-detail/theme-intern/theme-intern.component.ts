import { ChangeDetectionStrategy, Component, computed, inject, input, OnChanges } from '@angular/core'
import { DatePipe } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { CheckboxModule } from 'primeng/checkbox'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-intern',
  standalone: true,
  imports: [
    CheckboxModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    TooltipModule,
    TranslateModule
  ],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-intern.component.html'
})
export class ThemeInternComponent implements OnChanges {
  private readonly datePipe = inject(DatePipe)
  // signals
  public readonly theme = input.required<Theme | undefined>()
  public readonly dateFormat = input.required<string>()
  // calculated signals
  public readonly creationDate = computed(() => {
    const date = this.theme()?.creationDate
    if (!date) return '' // fallback
    return this.datePipe.transform(date, this.dateFormat() ?? 'medium') || ''
  })
  public readonly modificationDate = computed(() => {
    const date = this.theme()?.modificationDate
    if (!date) return '' // fallback
    return this.datePipe.transform(date, this.dateFormat() ?? 'medium') || ''
  })
  // data
  public mandatory = false
  public operator = false

  public ngOnChanges(): void {
    if (this.theme()) {
      this.mandatory = this.theme()!.mandatory ?? false
      this.operator = this.theme()!.operator ?? false
    }
  }
}
