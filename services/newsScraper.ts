
import axios from 'axios';
import * as cheerio from 'cheerio';
import { storage } from '../server/storage';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export async function scrapeLawNews(): Promise<NewsItem[]> {
  try {
    // Example: Scraping a legal news site (adjust URL as needed)
    const url = 'https://www.isna.ir/service/service-Judicial'; 
    const { data } = await axios.get(url, { timeout: 10000 }); 
    const $ = cheerio.load(data);
    const news: NewsItem[] = [];

    $('.items li').each((i, el) => {
      if (i < 5) {
        const title = $(el).find('h3 a').text().trim();
        const link = 'https://www.isna.ir' + $(el).find('h3 a').attr('href');
        const description = $(el).find('p').text().trim();
        const pubDate = $(el).find('.time').text().trim();
        
        if (title && link) {
          news.push({ title, link, description, pubDate });
        }
      }
    });

    return news;
  } catch (error) {
    console.error('Error scraping news:', error);
    return [];
  }
}

export async function postToTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    console.error('Telegram config missing');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      text: message,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error posting to Telegram:', error);
  }
}

export async function runNewsSync() {
  console.log('Running news sync...');
  const news = await scrapeLawNews();
  
  for (const item of news) {
    // Check if post already exists by title (simple check)
    const existing = await storage.getPostBySlug(encodeURIComponent(item.title.substring(0, 50)));
    if (!existing) {
      const post = await storage.createPost({
        title: item.title,
        content: item.description + `<br><br><a href="${item.link}">ادامه مطلب</a>`,
        slug: encodeURIComponent(item.title.substring(0, 50)),
        status: 'published',
        authorId: 'system',
        publishedAt: new Date()
      });

      const telegramMsg = `<b>${item.title}</b>\n\n${item.description}\n\n<a href="${item.link}">مشاهده خبر</a>`;
      await postToTelegram(telegramMsg);
    }
  }
}
