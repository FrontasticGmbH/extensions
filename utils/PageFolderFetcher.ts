import { Request } from '@frontastic/extension-types';
import { getLocale, getPath } from './Request';
import axios from 'axios';
import { ArtistSettings } from '../../types/umg/ArtistSettings';

export class ProductFolderFetcher {
  static fetchArtistSettingsFromPageFolderConfig = async (
    request: Request,
    artistPath?: string,
  ): Promise<ArtistSettings> => {
    // TODO: get default locale if empty from request
    const locale = getLocale(request) ?? 'en_GB';

    // If artistPath empty, try to get it from request.
    artistPath = artistPath ?? getPath(request)?.match(/[^\/]+/)[0];

    if (artistPath === undefined) {
      return undefined;
    }

    const url = `https://next-frontasticbeta.frontastic.io/frontastic/page?path=/${artistPath}&locale=${locale}`;

    return await axios
      .get(url)
      .then((response) => {
        const artistSettings: ArtistSettings = {
          artistPath: artistPath,
          artistStoreId: response.data?.pageFolder?.configuration?.artistStoreId
            ? response.data?.pageFolder.configuration?.artistStoreId
            : undefined,
          customerGroup: response.data?.pageFolder?.configuration?.customerGroup
            ? response.data?.pageFolder.configuration?.customerGroup
            : undefined,
          supplyChannel: response.data?.pageFolder?.configuration?.supplyChannel
            ? response.data?.pageFolder.configuration?.supplyChannel
            : undefined,
          distributionChannel: response.data?.pageFolder?.configuration?.distributionChannel
            ? response.data?.pageFolder.configuration?.distributionChannel
            : undefined,
        };

        return artistSettings;
      })
      .catch((reason) => {
        console.error(reason);
        return reason;
      });
  };
}
