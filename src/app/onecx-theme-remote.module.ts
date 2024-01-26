import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'

import { addInitializeModuleGuard, InitializeModuleGuard, PortalCoreModule } from '@onecx/portal-integration-angular'

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./theme/theme.module').then((m) => m.ThemeModule)
  }
]
@NgModule({
  imports: [PortalCoreModule.forMicroFrontend(), RouterModule.forChild(addInitializeModuleGuard(routes))],
  exports: [],
  providers: [InitializeModuleGuard],
  schemas: []
})
export class OneCXThemeModule {
  constructor() {
    console.info('OneCX Theme Module constructor')
  }
}
