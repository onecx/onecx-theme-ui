import { bootstrapModule } from '@onecx/angular-webcomponents'

import { environment } from 'src/environments/environment'
import { OneCXThemeModule } from './app/onecx-theme-remote.module'

bootstrapModule(OneCXThemeModule, 'microfrontend', environment.production)
