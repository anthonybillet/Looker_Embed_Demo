import type { IApiSettings, IAuthSession, ITransport } from '@looker/sdk-rtl';
import { Looker40SDK } from './4.0/methods';
export declare const BrowserSettings: () => IApiSettings;
export declare class LookerBrowserSDK {
    static init40(settings?: IApiSettings, transport?: ITransport, session?: IAuthSession): Looker40SDK;
}
