import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
    en: {
        translation: {
            "appTitle": "CitiAssist",
            "searchPlaceholder": "Search for services, documents, or information...",
            "heroTitle": "How can we help you today?",
            "quickLinks": {
                "payBills": "Pay Bills",
                "cityMap": "City Map",
                "events": "Events"
            },
            "language": "English",
            "listening": "Listening...",
            "micError": "Microphone error"
        }
    },
    te: {
        translation: {
            "appTitle": "సిటీఅసిస్ట్",
            "searchPlaceholder": "సేవలు, పత్రాలు లేదా సమాచారం కోసం వెతకండి...",
            "heroTitle": "ఈ రోజు మేము మీకు ఎలా సహాయపడగలము?",
            "quickLinks": {
                "payBills": "బిల్లులు చెల్లించండి",
                "cityMap": "నగర పటం",
                "events": "కార్యక్రమాలు"
            },
            "language": "తెలుగు",
            "listening": "వింటున్నాను...",
            "micError": "మైక్రోఫోన్ లోపం"
        }
    },
    hi: {
        translation: {
            "appTitle": "सिटी असिस्ट",
            "searchPlaceholder": "सेवाएं, दस्तावेज़ या जानकारी खोजें...",
            "heroTitle": "आज हम आपकी कैसे मदद कर सकते हैं?",
            "quickLinks": {
                "payBills": "बिल का भुगतान करें",
                "cityMap": "शहर का नक्शा",
                "events": "कार्यक्रम"
            },
            "language": "हिंदी",
            "listening": "सुन रहा हूँ...",
            "micError": "माइक्रोफ़ोन त्रुटि"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
