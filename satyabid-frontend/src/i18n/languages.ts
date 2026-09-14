import type { LangMeta } from '../types';

/**
 * English, plus all 22 languages listed in the Eighth Schedule of the
 * Constitution of India. Order follows the constitutional listing.
 */
export const LANGUAGES: LangMeta[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'brx', nativeName: 'बड़ो', englishName: 'Bodo' },
  { code: 'doi', nativeName: 'डोगरी', englishName: 'Dogri' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ks', nativeName: 'کٲشُر', englishName: 'Kashmiri', rtl: true },
  { code: 'kok', nativeName: 'कोंकणी', englishName: 'Konkani' },
  { code: 'mai', nativeName: 'मैथिली', englishName: 'Maithili' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'mni', nativeName: 'মৈতৈলোন্', englishName: 'Manipuri' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
  { code: 'sa', nativeName: 'संस्कृतम्', englishName: 'Sanskrit' },
  { code: 'sat', nativeName: 'संताली', englishName: 'Santali' },
  { code: 'sd', nativeName: 'سنڌي', englishName: 'Sindhi', rtl: true },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', rtl: true },
];
