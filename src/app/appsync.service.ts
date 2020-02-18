import { Injectable } from '@angular/core';
import AWSAppSyncClient from 'aws-appsync';
import awsmobile from '../aws-exports';

@Injectable({
  providedIn: 'root'
})
export class AppsyncService {

  hydrac;

  constructor() {
    const client = new AWSAppSyncClient({
      url: awsmobile.aws_appsync_graphqlEndpoint,
      region: awsmobile.aws_appsync_region,
      auth: {
        type: 'API_KEY',
        apiKey: awsmobile.aws_appsync_apiKey
      }
    });
    this.hydrac = client;
 }

 hc() {
  return this.hydrac.hydrated();
 }
}
