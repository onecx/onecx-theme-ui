import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { AsyncPipe } from '@angular/common'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { Observable, of } from 'rxjs'

import { TooltipModule } from 'primeng/tooltip'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Utils } from 'src/app/shared/utils'

export type Workspace = {
  name: string
  displayName: string
  description?: string
  theme?: string
  homePage?: string
  baseUrl?: string
  companyName?: string
  phoneNumber?: string
  rssFeedUrl?: string
  footerLabel?: string
  logoUrl?: string
  mandatory?: boolean
  operator?: boolean
  disabled?: boolean
}

@Component({
  selector: 'app-theme-use',
  standalone: true,
  imports: [AsyncPipe, RouterModule, TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-use.component.html'
})
export class ThemeUseComponent {
  // signals
  public workspaces = input<Workspace[]>()
  public isComponentDefined = input<boolean>(false)
  // dialog
  public workspaceEndpointExist = false

  constructor(
    private readonly router: Router,
    private readonly workspaceService: WorkspaceService
  ) {
    // check endpoint exists
    this.workspaceEndpointExist = Utils.doesEndpointExist(
      this.workspaceService,
      'onecx-workspace',
      'onecx-workspace-ui',
      'workspace-detail'
    )
  }

  public getWorkspaceEndpointUrl$(name?: string): Observable<string | undefined> {
    if (this.workspaceEndpointExist && name)
      return this.workspaceService.getUrl('onecx-workspace', 'onecx-workspace-ui', 'workspace-detail', {
        'workspace-name': name
      })
    return of(undefined)
  }
}
