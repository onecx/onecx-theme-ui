import { Component, EventEmitter, Input, Output } from '@angular/core'
import { Observable } from 'rxjs'

import { SlotService } from '@onecx/angular-remote-components'

import { Theme } from 'src/app/shared/generated'

@Component({
  selector: 'app-theme-use',
  templateUrl: './theme-use.component.html'
})
export class ThemeUseComponent {
  @Input() theme: Theme | undefined
  @Output() used = new EventEmitter<boolean>()

  public workspaceListEmitter = new EventEmitter<string[]>()

  public isListWorkspacesUsingThemeComponentDefined$: Observable<boolean> | undefined
  public listWorkspacesUsingThemeSlotName = 'onecx-theme-list-workspaces-using-theme'

  public operator = false

  constructor(private readonly slotService: SlotService) {
    this.isListWorkspacesUsingThemeComponentDefined$ = this.slotService.isSomeComponentDefinedForSlot(
      this.listWorkspacesUsingThemeSlotName
    )

    // get the list of workspaces which using the theme: if so then emit true
    this.workspaceListEmitter.subscribe((list) => {
      this.used.emit(list.length > 0)
    })
  }
}
