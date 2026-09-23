import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { Router, RouterModule } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { combineLatest, map, Observable, of, switchMap } from 'rxjs'

import { MessageModule } from 'primeng/message'
import { TooltipModule } from 'primeng/tooltip'

import { WorkspaceService } from '@onecx/angular-integration-interface'

import { Utils } from 'src/app/shared/utils'
import { LoadingState } from '../theme-detail.component'

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

export const WORKSPACE_DETAIL_ENDPOINT = {
  productName: 'onecx-workspace',
  appId: 'onecx-workspace-ui',
  endpointName: 'workspace-detail'
}

@Component({
  selector: 'app-theme-use',
  standalone: true,
  imports: [MessageModule, RouterModule, TooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-use.component.html'
})
export class ThemeUseComponent {
  private readonly router = inject(Router)
  private readonly workspaceService = inject(WorkspaceService)
  // signals
  public workspaces = input<Workspace[]>()
  public isComponentDefined = input<boolean>(false)
  public useLoadingState = input.required<LoadingState>()
  // dialog
  public readonly workspaceEndpointExist = toSignal(
    Utils.doesEndpointExist(
      this.workspaceService,
      WORKSPACE_DETAIL_ENDPOINT.productName,
      WORKSPACE_DETAIL_ENDPOINT.appId,
      WORKSPACE_DETAIL_ENDPOINT.endpointName
    ),
    { initialValue: false }
  )
  // resolved workspace-detail URLs keyed by workspace name; resolved once per workspaces/endpoint change instead of per row in the template
  private readonly workspaceUrls$: Observable<Map<string, string | undefined>> = combineLatest([
    toObservable(this.workspaces),
    toObservable(this.workspaceEndpointExist)
  ]).pipe(
    switchMap(([workspaces, exists]) => {
      if (!exists || !workspaces?.length) return of(new Map<string, string | undefined>())
      return combineLatest(
        workspaces.map((workspace) =>
          this.workspaceService
            .getUrl(
              WORKSPACE_DETAIL_ENDPOINT.productName,
              WORKSPACE_DETAIL_ENDPOINT.appId,
              WORKSPACE_DETAIL_ENDPOINT.endpointName,
              { 'workspace-name': workspace.name }
            )
            .pipe(map((url) => [workspace.name, url] as const))
        )
      ).pipe(map((entries) => new Map(entries)))
    })
  )
  public readonly workspaceUrls = toSignal(this.workspaceUrls$, {
    initialValue: new Map<string, string | undefined>()
  })
}
