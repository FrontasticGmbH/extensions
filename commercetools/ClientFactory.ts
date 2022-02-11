import { ClientBuilder, Client, AuthMiddlewareOptions, HttpMiddlewareOptions } from '@commercetools/sdk-client-v2';
// @ts-ignore
import fetch from 'node-fetch';
import { ClientConfig } from '../interfaces/ClientConfig';

export class ClientFactory {
  static factor: (clientConfig: ClientConfig) => Client = (clientConfig: ClientConfig) => {
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

    return (
      new ClientBuilder()
        // .withProjectKey(projectKey) // not necessary if the projectKey was already passed in the authMiddlewareOptions
        .withClientCredentialsFlow(authMiddlewareOptions)
        .withHttpMiddleware(httpMiddlewareOptions)
        .withLoggerMiddleware()
        .build()
    );
  };
}
