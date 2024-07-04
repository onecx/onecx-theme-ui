import { environment } from 'src/environments/environment'
import { OneCXThemeModule } from './app/onecx-theme-remote.module'
import { bootstrapModule } from '@onecx/angular-webcomponents'

bootstrapModule(OneCXThemeModule, 'microfrontend', environment.production)
