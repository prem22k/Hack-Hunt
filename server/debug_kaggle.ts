
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const KAGGLE_API_URL = 'https://www.kaggle.com/api/v1/competitions/list';

const run = async () => {
  try {
    const response = await axios.get(KAGGLE_API_URL, {
      auth: {
        username: process.env.KAGGLE_USERNAME || '',
        password: process.env.KAGGLE_KEY || ''
      },
      params: {
        category: 'featured',
        sortBy: 'earliestDeadline',
        group: 'general'
      }
    });

    if (response.data && response.data.length > 0) {
        console.log('Keys of first competition:', Object.keys(response.data[0]));
        console.log('First competition data:', JSON.stringify(response.data[0], null, 2));
    } else {
        console.log('No competitions found');
    }
  } catch (error) {
    console.error(error);
  }
};

run();
