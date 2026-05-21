export * from './iconsInternal.service';
import { IconsInternalAPIService } from './iconsInternal.service';
export * from './imagesInternal.service';
import { ImagesInternalAPIService } from './imagesInternal.service';
export * from './themes.service';
import { ThemesAPIService } from './themes.service';
export const APIS = [IconsInternalAPIService, ImagesInternalAPIService, ThemesAPIService];
