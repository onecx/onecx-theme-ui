import { Component, Input } from '@angular/core'
import { TranslateService } from '@ngx-translate/core'

import { SlotService } from '@onecx/angular-remote-components'
import { Observable } from 'rxjs'
import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-use',
  templateUrl: './theme-use.component.html'
})
export class ThemeUseComponent {
  @Input() theme: Theme | undefined
  public isListWorkspacesUsingThemeComponentDefined$: Observable<boolean> | undefined
  public listWorkspacesUsingThemeSlotName = 'onecx-theme-list-workspaces-using-theme'

  public operator = false

  constructor(
    private readonly translate: TranslateService,
    private readonly slotService: SlotService
  ) {
    this.isListWorkspacesUsingThemeComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(
      this.listWorkspacesUsingThemeSlotName
    )
  }
}
