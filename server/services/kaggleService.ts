import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NormalizedHackathon } from '../types';

const KAGGLE_API_URL = 'https://www.kaggle.com/api/v1/competitions/list';

const getKaggleCredentials = () => {
  // 1. Try Environment Variables
  if (process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY) {
    return { username: process.env.KAGGLE_USERNAME, key: process.env.KAGGLE_KEY };
  }

  // 2. Try Local kaggle.json
  const localPath = path.join(process.cwd(), 'kaggle.json');
  if (fs.existsSync(localPath)) {
    try {
      console.log('Found local kaggle.json');
      return JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse local kaggle.json');
    }
  }

  // 3. Try Home Directory .kaggle/kaggle.json (Standard location)
  const homePath = path.join(os.homedir(), '.kaggle', 'kaggle.json');
  if (fs.existsSync(homePath)) {
    try {
      console.log('Found ~/.kaggle/kaggle.json');
      return JSON.parse(fs.readFileSync(homePath, 'utf8'));
    } catch (e) {
      console.warn('Failed to parse ~/.kaggle/kaggle.json');
    }
  }

  return null;
};

export const fetchKaggleCompetitions = async (): Promise<NormalizedHackathon[]> => {
  const creds = getKaggleCredentials();

  if (!creds || !creds.username || !creds.key) {
    console.warn('Kaggle credentials not found (checked ENV, local kaggle.json, and ~/.kaggle/kaggle.json). Skipping.');
    return [];
  }

  const { username, key } = creds;

  try {
    const response = await axios.get(KAGGLE_API_URL, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      params: {
        category: 'featured', // or 'all'
        sortBy: 'earliestDeadline',
        group: 'general'
      }
    });

    const competitions = response.data;

    return competitions.map((comp: any) => {
      return {
        title: comp.title,
        organizer: comp.organizationName || 'Kaggle',
        description: comp.description,
        startDate: new Date(comp.enabledDate),
        endDate: new Date(comp.deadline),
        mode: 'online',
        isPaid: false,
        skills: ['Data Science', 'Machine Learning'],
        registrationUrl: `https://www.kaggle.com/c/${comp.ref}`,
        source: 'kaggle',
        location: 'Virtual',
        prize: comp.reward || ''
      };
    });
  } catch (error) {
    console.error('Error fetching Kaggle competitions:', error);
    return [];
  }
};
