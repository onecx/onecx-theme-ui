import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, input } from '@angular/core'
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { TranslateModule } from '@ngx-translate/core'

import { FloatLabelModule } from 'primeng/floatlabel'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { TooltipModule } from 'primeng/tooltip'

import { Theme } from 'src/app/shared/generated'
import { ChangeMode } from '../theme-detail.component'

// a single top-level entry of the customCssVariables JSON: context (key) and content (value)
export type CustomCssVariableEntry = { context: string; content: string }

@Component({
  selector: 'app-theme-css',
  standalone: true,
  imports: [
    FloatLabelModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    TextareaModule,
    TooltipModule,
    TranslateModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-css.component.html',
  styleUrl: './theme-css.component.scss'
})
export class ThemeCssComponent implements OnChanges {
  public readonly theme = input<Theme | undefined>()
  public readonly changeMode = input.required<ChangeMode>()
  // data: one form group per top-level property of the parsed customCssVariables JSON
  public cssForm = new FormArray<FormGroup>([])

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.theme() !== undefined) {
      if (changes['theme']) this.fillForm(this.theme()!)
    } else {
      this.cssForm.clear()
    }
    // (re-)apply the enabled/disabled state after the form entries have been (re-)built
    if (this.theme() !== undefined && this.changeMode() !== 'VIEW') {
      this.cssForm.enable()
    } else {
      this.cssForm.disable()
    }
  }

  public get entries(): FormGroup[] {
    return this.cssForm.controls
  }

  private fillForm(theme: Theme): void {
    this.cssForm.clear()
    for (const entry of this.parseCustomCssVariables(theme.customCssVariables)) {
      this.cssForm.push(
        new FormGroup({
          context: new FormControl<string>(entry.context),
          content: new FormControl<string>(entry.content)
        })
      )
    }
  }

  // parse the JSON string of customCssVariables into a list of { context, content } pairs
  private parseCustomCssVariables(json: string | undefined): CustomCssVariableEntry[] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([context, value]) => ({
          context,
          content: typeof value === 'string' ? value : JSON.stringify(value, null, 2)
        }))
      }
    } catch (err) {
      console.error('parseCustomCssVariables', err)
    }
    return []
  }
}
