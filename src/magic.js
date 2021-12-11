import { Magic } from 'magic-sdk';
import { NearExtension } from "@magic-ext/near";

export const magic = new Magic(process.env.REACT_APP_MAGIC_PUBLISHABLE_KEY, {
  extensions: [
      new NearExtension({
          rpcUrl: '',
      }),
  ]}
);
