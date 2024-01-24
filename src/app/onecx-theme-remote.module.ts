import { Inject, NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { MFE_INFO, MfeInfo, PortalCoreModule } from '@onecx/portal-integration-angular'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./theme/theme.module').then((m) => m.ThemeModule)
  }
]
@NgModule({
  imports: [PortalCoreModule.forMicroFrontend(), RouterModule.forChild(routes)],
  exports: [],
  providers: [],
  schemas: []
})
export class OneCXThemeModule {
  constructor(@Inject(MFE_INFO) mfeInfo?: MfeInfo) {
    console.info('OneCX Theme Module constructor', mfeInfo)
  }
}
