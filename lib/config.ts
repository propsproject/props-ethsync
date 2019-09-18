import { Config, settings as coreSettings } from 'props-lib-env-temp';
import settings from './settings/index';

const config = new Config();

config.merge([coreSettings, settings]);

export { config as default };
