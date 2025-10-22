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

    // Version 2: Add category, tags, isTemplate support
    this.version(2).stores({
      brandVoices: 'id, name, category, isTemplate, createdAt, updatedAt',
      userProfiles: 'id, username, lastAnalyzed',
      generatedTweets: 'id, brandVoiceId, targetProfileId, timestamp, posted',
    }).upgrade(async (tx) => {
      // Migrate existing brand voices to include new fields
      const voices = await tx.table('brandVoices').toArray();
      for (const voice of voices) {
        // Add new tone attributes if missing
        if (!voice.toneAttributes.empathy) {
          voice.toneAttributes.empathy = 50;
          voice.toneAttributes.energy = 50;
          voice.toneAttributes.authenticity = 50;
        }
        // Add category and tags
        if (!voice.category) {
          voice.category = 'custom';
        }
        if (!voice.tags) {
          voice.tags = [];
        }
        if (voice.isTemplate === undefined) {
          voice.isTemplate = false;
        }
        await tx.table('brandVoices').put(voice);
      }
    });
  }
}

export const db = new KotodamaDB();
