import Dexie, { Table } from 'dexie';
import { BrandVoice, UserProfile, GeneratedTweet } from '../types';

export class KotodamaDB extends Dexie {
  brandVoices!: Table<BrandVoice, string>;
  userProfiles!: Table<UserProfile, string>;
  generatedTweets!: Table<GeneratedTweet, string>;

  constructor() {
    super('KotodamaDB');

    this.version(1).stores({
      brandVoices: 'id, name, createdAt, updatedAt',
      userProfiles: 'id, username, lastAnalyzed',
      generatedTweets: 'id, brandVoiceId, targetProfileId, timestamp, posted',
    });
  }
}

export const db = new KotodamaDB();
