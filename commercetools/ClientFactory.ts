import { ClientBuilder, Client, AuthMiddlewareOptions, HttpMiddlewareOptions } from '@commercetools/sdk-client-v2';
// @ts-ignore
import fetch from 'node-fetch';
import { ClientConfig } from '../interfaces/ClientConfig';

export class ClientFactory {
  static factor: (clientConfig: ClientConfig, environment: string | undefined) => Client = (
    clientConfig: ClientConfig,
    environment: string | undefined,
  ) => {
    const authMiddlewareOptions: AuthMiddlewareOptions = {
      host: clientConfig.authBaseURL,
      projectKey: clientConfig.projectKey,
      credentials: {
        clientId: clientConfig.clientId,
        clientSecret: clientConfig.clientSecret,
      },
      oauthUri: clientConfig.authURL,
      // scopes: ['manage_project:' + projectKey],
      fetch,
    };

    const httpMiddlewareOptions: HttpMiddlewareOptions = {
      host: clientConfig.baseURL,
      fetch,
    };

    let clientBuilder: ClientBuilder = new ClientBuilder()
      // .withProjectKey(projectKey) // Not necessary if the projectKey was already passed in the authMiddlewareOptions
      .withClientCredentialsFlow(authMiddlewareOptions)
      .withHttpMiddleware(httpMiddlewareOptions);

    // To avoid logging sensible data, only enable the logger
    // if the environment is defined and not production.
    if (environment !== undefined && environment !== 'prod' && environment !== 'production') {
      clientBuilder = clientBuilder.withLoggerMiddleware();
    }

    return clientBuilder.build();
  };
}
