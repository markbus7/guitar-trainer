declare const __APP_VERSION__: string;
declare const __APP_COMMIT__: string;
declare const __APP_BUILT__: string;

/** Version shown in the app. Bump "version" in package.json for every release. */
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
export const APP_COMMIT = typeof __APP_COMMIT__ === 'string' ? __APP_COMMIT__ : 'dev';
export const APP_BUILT = typeof __APP_BUILT__ === 'string' ? __APP_BUILT__ : '';
