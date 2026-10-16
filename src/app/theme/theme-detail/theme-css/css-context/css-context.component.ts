import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { ButtonModule } from 'primeng/button'
import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'

import { ChangeMode } from '../../theme-detail.component'

@Component({
  selector: 'app-css-context',
  standalone: true,
  imports: [
    ButtonModule,
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    TextareaModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './css-context.component.html',
  styleUrls: ['./css-context.component.scss']
})
export class CssContextComponent {
  // the 'context' and 'content' FormGroup of this entry, owned and validated by the parent FormArray
  public readonly group = input.required<FormGroup>()
  public readonly changeMode = input.required<ChangeMode>()
  public readonly index = input.required<number>()
  public readonly remove = output<void>()

  public onRemove(): void {
    this.remove.emit()
  }
}
