import { Magic } from 'magic-sdk';
import { NearExtension } from "@magic-ext/near";
import { OAuthExtension } from '@magic-ext/oauth';

export const magic = new Magic(process.env.REACT_APP_MAGIC_PUBLISHABLE_KEY, {
  extensions: [
      new NearExtension({ 
        rpcUrl: '' 
      }),
      new OAuthExtension()
  ]}
);
