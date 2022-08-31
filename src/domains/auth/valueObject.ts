import { GraphQLClient } from "graphql-request";

export type GenerateRequestClientOptions = {
  firebaseId: string | null;
  token: string;
};

export class RequestClient {
  constructor(
    public readonly graphQLClient: GraphQLClient,
    public readonly firebaseId: string | null
  ) {}

  static generate({ firebaseId, token }: GenerateRequestClientOptions): RequestClient {
    const graphQLClient = new GraphQLClient(process.env.REACT_APP_GRAPHQL_ENDPOINT || '', {
      headers: { authorization: `Bearer ${token}` },
    });

    return new RequestClient(graphQLClient, firebaseId);
  }

  static anonymouse(): RequestClient {
    const graphQLClient = new GraphQLClient(process.env.REACT_APP_GRAPHQL_ENDPOINT || '');

    return new RequestClient(graphQLClient, null);
  }
}
