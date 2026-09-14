# -*- coding: utf-8 -*-
"""
SIH GeM Bid Compliance Platform
i18n / Translations Module
---------------------------------------------------------

Covers English + all 22 languages listed in the Eighth Schedule of
the Constitution of India, matching what a GeM-facing government
platform is expected to support.

USAGE
-----
    from translations import t, LANGUAGES

    t("verdict_compliant", "hi")   -> "अनुपालक"
    t("verdict_compliant", "ta")   -> "இணக்கமானது"
    t("verdict_compliant", "xx")   -> falls back to English

IMPORTANT - TRANSLATION CONFIDENCE
-----------------------------------
Acronyms and proper nouns (GST, PAN, CIN, BIS, ISO, MSME, Udyam,
GeM) are intentionally left in Roman script in every language, since
that mirrors how GeM and other Indian government portals localize:
these identifiers are used verbatim by vendors regardless of UI
language, and transliterating them would make cross-referencing an
actual GST/PAN number harder, not easier.

For the everyday UI text, translation quality is NOT uniform across
all 23 entries. Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam,
Marathi, Gujarati, Punjabi, Urdu, Odia and Assamese are widely-used
languages with large training corpora and the phrasing here should
be solid administrative-register text. Bodo, Dogri, Kashmiri,
Konkani, Maithili, Manipuri (Meitei), Sanskrit, Santali and Sindhi
are lower-resource languages; the translations below are a genuine
best effort but are MORE LIKELY to contain register or word-choice
issues. Before this ships in a real GeM-facing product, get every
non-major-language entry checked by a native speaker - for a
hackathon prototype it's fine as-is, but flag this in your demo/
README so judges see it as a known, honestly-disclosed limitation
rather than a silent gap.

Manipuri is included in Bengali script here (the script the Eighth
Schedule / Sahitya Akademi most commonly render it in for this kind
of context); Meitei Mayek is the other officially recognized script
and may be preferable depending on your target users.
"""

from __future__ import annotations

# ---------------------------------------------------------
# Supported languages: English (working/source language) +
# all 22 Eighth Schedule languages, ISO 639-1/639-2 codes.
# ---------------------------------------------------------

LANGUAGES: dict[str, str] = {
    "en":  "English",
    "as":  "Assamese (অসমীয়া)",
    "bn":  "Bengali (বাংলা)",
    "brx": "Bodo (बड़ो)",
    "doi": "Dogri (डोगरी)",
    "gu":  "Gujarati (ગુજરાતી)",
    "hi":  "Hindi (हिन्दी)",
    "kn":  "Kannada (ಕನ್ನಡ)",
    "ks":  "Kashmiri (کٲشُر)",
    "kok": "Konkani (कोंकणी)",
    "mai": "Maithili (मैथिली)",
    "ml":  "Malayalam (മലയാളം)",
    "mni": "Manipuri (মৈতৈলোন্)",
    "mr":  "Marathi (मराठी)",
    "ne":  "Nepali (नेपाली)",
    "or":  "Odia (ଓଡ଼ିଆ)",
    "pa":  "Punjabi (ਪੰਜਾਬੀ)",
    "sa":  "Sanskrit (संस्कृतम्)",
    "sat": "Santali (ᱥᱟᱱᱛᱟᱲᱤ)",
    "sd":  "Sindhi (سنڌي)",
    "ta":  "Tamil (தமிழ்)",
    "te":  "Telugu (తెలుగు)",
    "ur":  "Urdu (اردو)",
}

DEFAULT_LANGUAGE = "en"


# ---------------------------------------------------------
# Translation table
# ---------------------------------------------------------
# Keys match the strings actually used in compliance_engine.py,
# extractor.py and api.py, so this module can be dropped in
# without renaming anything elsewhere.

TRANSLATIONS: dict[str, dict[str, str]] = {

    # --- App / platform level -------------------------------------
    "app_title": {
        "en": "GeM Bid Compliance Platform",
        "as": "GeM বিড সংগতি প্লেটফৰ্ম",
        "bn": "GeM বিড কমপ্লায়েন্স প্ল্যাটফর্ম",
        "brx": "GeM बिड कम्प्लायेंस प्लेटफर्म",
        "doi": "GeM बिड कम्प्लायंस प्लेटफार्म",
        "gu": "GeM બિડ કમ્પ્લાયન્સ પ્લેટફોર્મ",
        "hi": "GeM बिड अनुपालन प्लेटफ़ॉर्म",
        "kn": "GeM ಬಿಡ್ ಅನುಸರಣೆ ವೇದಿಕೆ",
        "ks": "GeM بِڈ کمپلائنس پلیٹفارم",
        "kok": "GeM बिड कंप्लायन्स प्लॅटफॉर्म",
        "mai": "GeM बिड अनुपालन मंच",
        "ml": "GeM ബിഡ് കംപ്ലയൻസ് പ്ലാറ്റ്‌ഫോം",
        "mni": "GeM বিড কমপ্লায়েন্স প্লাটফরম",
        "mr": "GeM बिड अनुपालन प्लॅटफॉर्म",
        "ne": "GeM बिड अनुपालन प्लेटफर्म",
        "or": "GeM ବିଡ୍ ଅନୁପାଳନ ପ୍ଲାଟଫର୍ମ",
        "pa": "GeM ਬਿਡ ਪਾਲਣਾ ਪਲੇਟਫਾਰਮ",
        "sa": "GeM बिड-अनुपालन-सञ्चालनतन्त्रम्",
        "sat": "GeM ᱵᱤᱰ ᱠᱚᱢᱯᱞᱟᱭᱮᱱᱥ ᱯᱞᱮᱴᱯᱷᱚᱨᱢ",
        "sd": "GeM بِڊ تعميل پليٽ فارم",
        "ta": "GeM ஏலப் பொருத்தநிலை தளம்",
        "te": "GeM బిడ్ కంప్లయన్స్ ప్లాట్‌ఫారమ్",
        "ur": "GeM بولی تعمیل پلیٹ فارم",
    },

    # --- Verdicts ----------------------------------------------------
    "verdict_compliant": {
        "en": "Compliant",
        "as": "সংগতিপূৰ্ণ",
        "bn": "সঙ্গতিপূর্ণ",
        "brx": "मानो जायो",
        "doi": "अनुपालत",
        "gu": "સુસંગત",
        "hi": "अनुपालक",
        "kn": "ಅನುಸರಣೆಯಾಗಿದೆ",
        "ks": "مطابقت٘",
        "kok": "अनुपालीत",
        "mai": "अनुपालित",
        "ml": "പാലിക്കുന്നു",
        "mni": "কমপ্লায়েন্ত",
        "mr": "अनुपालित",
        "ne": "अनुपालनयुक्त",
        "or": "ଅନୁପାଳିତ",
        "pa": "ਪਾਲਣਾ ਕਰਦਾ ਹੈ",
        "sa": "अनुपालितम्",
        "sat": "ᱠᱚᱢᱯᱞᱟᱭᱮᱱᱴ",
        "sd": "تعميل ٿيل",
        "ta": "இணக்கமானது",
        "te": "అనుకూలత",
        "ur": "تعمیل شدہ",
    },
    "verdict_non_compliant": {
        "en": "Non-Compliant",
        "as": "অসংগতিপূৰ্ণ",
        "bn": "অসঙ্গতিপূর্ণ",
        "brx": "मानो जायोब्लै",
        "doi": "गैर-अनुपालत",
        "gu": "અસુસંગત",
        "hi": "अननुपालक",
        "kn": "ಅನುಸರಣೆಯಾಗಿಲ್ಲ",
        "ks": "غیر مطابقت٘",
        "kok": "अनुपालीत ना",
        "mai": "गैर-अनुपालित",
        "ml": "പാലിക്കുന്നില്ല",
        "mni": "নন-কমপ্লায়েন্ত",
        "mr": "अनुपालित नाही",
        "ne": "अनुपालन नभएको",
        "or": "ଅନୁପାଳିତ ନୁହେଁ",
        "pa": "ਪਾਲਣਾ ਨਹੀਂ ਕਰਦਾ",
        "sa": "अननुपालितम्",
        "sat": "ᱫᱚ ᱠᱚᱢᱯᱞᱟᱭᱮᱱᱴ ᱵᱟᱹᱱᱩᱜ ᱠᱟᱱᱟ",
        "sd": "غير تعميل ٿيل",
        "ta": "இணக்கமற்றது",
        "te": "అననుకూలత",
        "ur": "غیر تعمیل شدہ",
    },
    "verdict_ineligible": {
        "en": "Ineligible for Tender",
        "as": "টেণ্ডাৰৰ বাবে অযোগ্য",
        "bn": "টেন্ডারের জন্য অযোগ্য",
        "brx": "टेण्डारनि थाखाय गोरोनसे नङा",
        "doi": "टैंडर आस्तै अयोग्य",
        "gu": "ટેન્ડર માટે અયોગ્ય",
        "hi": "निविदा हेतु अपात्र",
        "kn": "ಟೆಂಡರ್‌ಗೆ ಅನರ್ಹ",
        "ks": "ٹینڈر خٲطرٕ نااہل",
        "kok": "टेंडरा खातीर अपात्र",
        "mai": "निविदा लेल अपात्र",
        "ml": "ടെൻഡറിന് അയോഗ്യൻ",
        "mni": "টেন্ডরগীদমক অযোগ্য",
        "mr": "निविदेसाठी अपात्र",
        "ne": "टेन्डरका लागि अयोग्य",
        "or": "ଟେଣ୍ଡର ପାଇଁ ଅଯୋଗ୍ୟ",
        "pa": "ਟੈਂਡਰ ਲਈ ਅਯੋਗ",
        "sa": "निविदायाः अयोग्यः",
        "sat": "ᱴᱮᱸᱰᱚᱨ ᱞᱟᱹᱜᱤᱫ ᱟᱹᱭᱚᱜ ᱟᱠᱟᱱᱟ",
        "sd": "ٽينڊر لاءِ نااهل",
        "ta": "டெண்டருக்கு தகுதியற்றது",
        "te": "టెండర్‌కు అనర్హత",
        "ur": "ٹینڈر کے لیے نااہل",
    },
    "verdict_compliant_with_warnings": {
        "en": "Compliant with Warnings",
        "as": "সতৰ্কতাসহ সংগতিপূৰ্ণ",
        "bn": "সতর্কতাসহ সঙ্গতিপূর্ণ",
        "brx": "फोसावनायजों मानो जायो",
        "doi": "चेतावनी सुद्धां अनुपालत",
        "gu": "ચેતવણી સાથે સુસંગત",
        "hi": "चेतावनी सहित अनुपालक",
        "kn": "ಎಚ್ಚರಿಕೆಗಳೊಂದಿಗೆ ಅನುಸರಣೆ",
        "ks": "خطرہ سیتؠ مطابقت٘",
        "kok": "इशाऱ्या सयत अनुपालीत",
        "mai": "चेतावनी सहित अनुपालित",
        "ml": "മുന്നറിയിപ്പുകളോടെ പാലിക്കുന്നു",
        "mni": "ৱার্নিংগা লোয়ননা কমপ্লায়েন্ত",
        "mr": "इशाऱ्यांसह अनुपालित",
        "ne": "चेतावनीसहित अनुपालनयुक्त",
        "or": "ଚେତାବନୀ ସହିତ ଅନୁପାଳିତ",
        "pa": "ਚੇਤਾਵਨੀਆਂ ਨਾਲ ਪਾਲਣਾ",
        "sa": "चेतावनीयुक्तम् अनुपालितम्",
        "sat": "ᱥᱟᱹᱵᱰᱟᱹᱱ ᱥᱟᱶ ᱠᱚᱢᱯᱞᱟᱭᱮᱱᱴ",
        "sd": "خبردارين سان تعميل ٿيل",
        "ta": "எச்சரிக்கைகளுடன் இணக்கமானது",
        "te": "హెచ్చరికలతో అనుకూలత",
        "ur": "انتباہات کے ساتھ تعمیل شدہ",
    },

    # --- Compliance check labels -------------------------------------
    "check_gst_active": {
        "en": "GST registration status",
        "hi": "GST पंजीकरण स्थिति",
        "bn": "GST নিবন্ধন অবস্থা",
        "ta": "GST பதிவு நிலை",
        "te": "GST నమోదు స్థితి",
        "kn": "GST ನೋಂದಣಿ ಸ್ಥಿತಿ",
        "ml": "GST രജിസ്ട്രേഷൻ നില",
        "mr": "GST नोंदणी स्थिती",
        "gu": "GST નોંધણી સ્થિતિ",
        "pa": "GST ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਸਥਿਤੀ",
        "or": "GST ପଞ୍ଜୀକରଣ ସ୍ଥିତି",
        "as": "GST পঞ্জীয়ন অৱস্থা",
        "ur": "GST رجسٹریشن کی حیثیت",
        "sa": "GST पञ्जीकरण-स्थितिः",
        "ne": "GST दर्ता स्थिति",
        "kok": "GST नोंदणी स्थिती",
        "mai": "GST पंजीकरण स्थिति",
        "brx": "GST रजिस्ट्रेसन दिशा",
        "doi": "GST रजिस्ट्रेशन स्थिति",
        "ks": "GST رجسٽریشن حالت",
        "mni": "GST রেজিস্ট্রেসন অবস্থা",
        "sat": "GST ᱨᱮᱡᱤᱥᱴᱨᱮᱥᱚᱱ ᱚᱵᱚᱥᱛᱟ",
        "sd": "GST رجسٽريشن جي حالت",
    },
    "check_pan_filed": {
        "en": "Income-tax return filed",
        "hi": "आयकर रिटर्न दाखिल",
        "bn": "আয়কর রিটার্ন দাখিল",
        "ta": "வருமான வரி அறிக்கை தாக்கல்",
        "te": "ఆదాయపు పన్ను రిటర్న్ దాఖలు",
        "kn": "ಆದಾಯ ತೆರಿಗೆ ರಿಟರ್ನ್ ಸಲ್ಲಿಕೆ",
        "ml": "ആദായനികുതി റിട്ടേൺ സമർപ്പിച്ചു",
        "mr": "आयकर विवरणपत्र दाखल",
        "gu": "આવકવેરા રિટર્ન ફાઇલ",
        "pa": "ਆਮਦਨ ਕਰ ਰਿਟਰਨ ਦਾਖਲ",
        "or": "ଆୟକର ରିଟର୍ନ ଦାଖଲ",
        "as": "আয়কৰ ৰিটাৰ্ণ দাখিল",
        "ur": "انکم ٹیکس ریٹرن جمع",
        "sa": "आयकर-विवरणी दत्ता",
        "ne": "आयकर विवरण दाखिला",
        "kok": "आयकर परतावो जमो केला",
        "mai": "आयकर रिटर्न दाखिल",
        "brx": "आयकर रिटार्न फाइल खालामनाय",
        "doi": "आयकर रिटर्न फाइल",
        "ks": "انکم ٹیکس ریٹرن داخل",
        "mni": "ইনকাম-টেক্স রিটার্ন ফাইল",
        "sat": "ᱟᱭᱠᱚᱢ ᱴᱮᱠᱥ ᱨᱤᱴᱚᱨᱱ ᱯᱷᱟᱭᱤᱞ",
        "sd": "انڪم ٽيڪس ريٽرن داخل",
    },
    "check_mca_active": {
        "en": "MCA21 company status",
        "hi": "MCA21 कंपनी स्थिति",
        "bn": "MCA21 কোম্পানি অবস্থা",
        "ta": "MCA21 நிறுவன நிலை",
        "te": "MCA21 కంపెనీ స్థితి",
        "kn": "MCA21 ಕಂಪನಿ ಸ್ಥಿತಿ",
        "ml": "MCA21 കമ്പനി നില",
        "mr": "MCA21 कंपनी स्थिती",
        "gu": "MCA21 કંપની સ્થિતિ",
        "pa": "MCA21 ਕੰਪਨੀ ਸਥਿਤੀ",
        "or": "MCA21 କମ୍ପାନୀ ସ୍ଥିତି",
        "as": "MCA21 কোম্পানী অৱস্থা",
        "ur": "MCA21 کمپنی کی حیثیت",
        "sa": "MCA21 कम्पनी-स्थितिः",
        "ne": "MCA21 कम्पनी स्थिति",
        "kok": "MCA21 कंपनी स्थिती",
        "mai": "MCA21 कंपनी स्थिति",
        "brx": "MCA21 कोम्फानि दिशा",
        "doi": "MCA21 कंपनी स्थिति",
        "ks": "MCA21 کمپنی حالت",
        "mni": "MCA21 কোম্পানী অবস্থা",
        "sat": "MCA21 ᱠᱚᱢᱯᱟᱱᱤ ᱚᱵᱚᱥᱛᱟ",
        "sd": "MCA21 ڪمپني جي حالت",
    },
    "check_not_debarred": {
        "en": "Debarment registry check",
        "hi": "प्रतिबंध रजिस्ट्री जाँच",
        "bn": "নিষেধাজ্ঞা রেজিস্ট্রি পরীক্ষা",
        "ta": "தடைப்பட்டியல் சரிபார்ப்பு",
        "te": "నిషేధ నమోదు తనిఖీ",
        "kn": "ನಿಷೇಧ ನೋಂದಣಿ ಪರಿಶೀಲನೆ",
        "ml": "വിലക്ക് രജിസ്ട്രി പരിശോധന",
        "mr": "बंदी नोंदणी तपासणी",
        "gu": "પ્રતિબંધ રજિસ્ટ્રી તપાસ",
        "pa": "ਪਾਬੰਦੀ ਰਜਿਸਟਰੀ ਜਾਂਚ",
        "or": "ନିଷେଧ ପଞ୍ଜୀକରଣ ଯାଞ୍ଚ",
        "as": "নিষেধাজ্ঞা পঞ্জীয়ন পৰীক্ষা",
        "ur": "پابندی رجسٹری کی جانچ",
        "sa": "प्रतिबन्ध-सूची-परीक्षा",
        "ne": "प्रतिबन्ध रजिस्ट्री जाँच",
        "kok": "बंदी नोंदणी तपासणी",
        "mai": "प्रतिबंध रजिस्ट्री जाँच",
        "brx": "बन्द रजिस्टरि सोलेननाय",
        "doi": "पाबंदी रजिस्ट्री जांच",
        "ks": "پابندی رجسٹری چیک",
        "mni": "ডিবারমেন্ত রেজিস্ট্রী চেক",
        "sat": "ᱰᱮᱵᱟᱨᱢᱮᱱᱴ ᱨᱮᱡᱤᱥᱴᱨᱭ ᱪᱮᱠ",
        "sd": "بيدخلي رجسٽري جي چڪاس",
    },
    "check_turnover": {
        "en": "Minimum annual turnover",
        "hi": "न्यूनतम वार्षिक कारोबार",
        "bn": "ন্যূনতম বার্ষিক টার্নওভার",
        "ta": "குறைந்தபட்ச ஆண்டு விற்றுமுதல்",
        "te": "కనీస వార్షిక టర్నోవర్",
        "kn": "ಕನಿಷ್ಠ ವಾರ್ಷಿಕ ವಹಿವಾಟು",
        "ml": "ഏറ്റവും കുറഞ്ഞ വാർഷിക വിറ്റുവരവ്",
        "mr": "किमान वार्षिक उलाढाल",
        "gu": "ન્યૂનતમ વાર્ષિક ટર્નઓવર",
        "pa": "ਘੱਟੋ-ਘੱਟ ਸਾਲਾਨਾ ਟਰਨਓਵਰ",
        "or": "ସର୍ବନିମ୍ନ ବାର୍ଷିକ ଟର୍ଣ୍ଣଓଭର",
        "as": "নূন্যতম বাৰ্ষিক টাৰ্ণঅভাৰ",
        "ur": "کم از کم سالانہ ٹرن اوور",
        "sa": "न्यूनतम-वार्षिक-आवर्तनम्",
        "ne": "न्यूनतम वार्षिक कारोबार",
        "kok": "किमान वार्सिक टर्नओवर",
        "mai": "न्यूनतम वार्षिक कारोबार",
        "brx": "गोबां जोबथाव बोसोरनि टर्नओभार",
        "doi": "घट्टोघट्ट सालाना टर्नओवर",
        "ks": "کم ازکم سالانہ ٹرن اوور",
        "mni": "মিনিমাম এনুৱাল টার্নওভার",
        "sat": "ᱠᱟᱢ ᱠᱟᱢ ᱥᱮᱨᱢᱟ ᱴᱚᱨᱱᱚᱣᱟᱨ",
        "sd": "گھٽ ۾ گھٽ سالياني ٽرن اوور",
    },
    "check_local_content": {
        "en": "Minimum local content %",
        "hi": "न्यूनतम स्थानीय सामग्री %",
        "bn": "ন্যূনতম স্থানীয় বিষয়বস্তু %",
        "ta": "குறைந்தபட்ச உள்ளூர் உள்ளடக்கம் %",
        "te": "కనీస స్థానిక కంటెంట్ %",
        "kn": "ಕನಿಷ್ಠ ಸ್ಥಳೀಯ ಅಂಶ %",
        "ml": "ഏറ്റവും കുറഞ്ഞ പ്രാദേശിക ഉള്ളടക്കം %",
        "mr": "किमान स्थानिक घटक %",
        "gu": "ન્યૂનતમ સ્થાનિક સામગ્રી %",
        "pa": "ਘੱਟੋ-ਘੱਟ ਸਥਾਨਕ ਸਮੱਗਰੀ %",
        "or": "ସର୍ବନିମ୍ନ ସ୍ଥାନୀୟ ବିଷୟବସ୍ତୁ %",
        "as": "নূন্যতম স্থানীয় সমল %",
        "ur": "کم از کم مقامی مواد %",
        "sa": "न्यूनतम-स्थानीय-अंशः %",
        "ne": "न्यूनतम स्थानीय सामग्री %",
        "kok": "किमान स्थानीक वस्तूं %",
        "mai": "न्यूनतम स्थानीय सामग्री %",
        "brx": "गोबां जोबथाव थां-थां हार %",
        "doi": "घट्टोघट्ट स्थानीय सामग्री %",
        "ks": "کم ازکم مقامی مواد %",
        "mni": "মিনিমাম লোকেল কনটেন্ত %",
        "sat": "ᱠᱟᱢ ᱠᱟᱢ ᱞᱚᱠᱟᱞ ᱠᱚᱱᱴᱮᱸᱴ %",
        "sd": "گھٽ ۾ گھٽ مقامي مواد %",
    },
    "check_cert_valid": {
        "en": "certificate valid",
        "hi": "प्रमाणपत्र मान्य",
        "bn": "সার্টিফিকেট বৈধ",
        "ta": "சான்றிதழ் செல்லுபடியாகும்",
        "te": "సర్టిఫికేట్ చెల్లుతుంది",
        "kn": "ಪ್ರಮಾಣಪತ್ರ ಮಾನ್ಯವಾಗಿದೆ",
        "ml": "സർട്ടിഫിക്കറ്റ് സാധുവാണ്",
        "mr": "प्रमाणपत्र वैध",
        "gu": "પ્રમાણપત્ર માન્ય",
        "pa": "ਸਰਟੀਫਿਕੇਟ ਵੈਧ",
        "or": "ପ୍ରମାଣପତ୍ର ବୈଧ",
        "as": "প্ৰমাণপত্ৰ বৈধ",
        "ur": "سرٹیفکیٹ درست",
        "sa": "प्रमाणपत्रं वैधम्",
        "ne": "प्रमाणपत्र मान्य",
        "kok": "प्रमाणपत्र वैध",
        "mai": "प्रमाणपत्र वैध",
        "brx": "प्रमाणफत्र लाबोन",
        "doi": "प्रमाणपत्र वैध",
        "ks": "سرٹیفکیٹ جائز",
        "mni": "সার্টিফিকেত ভেলিদ",
        "sat": "ᱥᱚᱨᱴᱤᱯᱤᱠᱮᱴ ᱵᱮᱥ",
        "sd": "سرٽيفڪيٽ جائز",
    },

    # --- Common labels -------------------------------------------------
    "label_vendor": {
        "en": "Vendor", "hi": "विक्रेता", "bn": "বিক্রেতা", "ta": "விற்பனையாளர்",
        "te": "విక్రేత", "kn": "ಮಾರಾಟಗಾರ", "ml": "വെണ്ടർ", "mr": "विक्रेता",
        "gu": "વિક્રેતા", "pa": "ਵਿਕਰੇਤਾ", "or": "ବିକ୍ରେତା", "as": "বিক্ৰেতা",
        "ur": "فروخت کنندہ", "sa": "विक्रेता", "ne": "विक्रेता", "kok": "विक्रेतो",
        "mai": "विक्रेता", "brx": "बेसायग्रा", "doi": "विक्रेता", "ks": "فروختہ کار",
        "mni": "ভেন্ডর", "sat": "ᱵᱤᱠᱨᱤ ᱠᱟᱹᱨᱤᱭᱟᱹ", "sd": "وڪرو ڪندڙ",
    },
    "label_tender": {
        "en": "Tender", "hi": "निविदा", "bn": "টেন্ডার", "ta": "டெண்டர்",
        "te": "టెండర్", "kn": "ಟೆಂಡರ್", "ml": "ടെൻഡർ", "mr": "निविदा",
        "gu": "ટેન્ડર", "pa": "ਟੈਂਡਰ", "or": "ଟେଣ୍ଡର", "as": "টেণ্ডাৰ",
        "ur": "ٹینڈر", "sa": "निविदा", "ne": "टेन्डर", "kok": "टेंडर",
        "mai": "निविदा", "brx": "टेण्डार", "doi": "टैंडर", "ks": "ٹینڈر",
        "mni": "টেন্ডর", "sat": "ᱴᱮᱸᱰᱚᱨ", "sd": "ٽينڊر",
    },
    "label_pass": {
        "en": "Pass", "hi": "उत्तीर्ण", "bn": "উত্তীর্ণ", "ta": "தேர்ச்சி",
        "te": "ఉత్తీర్ణత", "kn": "ಉತ್ತೀರ್ಣ", "ml": "പാസ്", "mr": "उत्तीर्ण",
        "gu": "પાસ", "pa": "ਪਾਸ", "or": "ପାସ", "as": "উত্তীৰ্ণ",
        "ur": "پاس", "sa": "उत्तीर्णः", "ne": "उत्तीर्ण", "kok": "पास",
        "mai": "उत्तीर्ण", "brx": "पास", "doi": "पास", "ks": "پاس",
        "mni": "পাস", "sat": "ᱯᱟᱥ", "sd": "پاس",
    },
    "label_fail": {
        "en": "Fail", "hi": "अनुत्तीर्ण", "bn": "অকৃতকার্য", "ta": "தேர்ச்சியடையவில்லை",
        "te": "అపజయం", "kn": "ಅನುತ್ತೀರ್ಣ", "ml": "പരാജയം", "mr": "अनुत्तीर्ण",
        "gu": "નિષ્ફળ", "pa": "ਫੇਲ੍ਹ", "or": "ଅନୁତ୍ତୀର୍ଣ୍ଣ", "as": "অকৃতকাৰ্য",
        "ur": "فیل", "sa": "अनुत्तीर्णः", "ne": "अनुत्तीर्ण", "kok": "फेल",
        "mai": "अनुत्तीर्ण", "brx": "फेल", "doi": "फेल", "ks": "ناکام",
        "mni": "ফেইল", "sat": "ᱯᱷᱮᱞ", "sd": "فيل",
    },
    "label_warning": {
        "en": "Warning", "hi": "चेतावनी", "bn": "সতর্কতা", "ta": "எச்சரிக்கை",
        "te": "హెచ్చరిక", "kn": "ಎಚ್ಚರಿಕೆ", "ml": "മുന്നറിയിപ്പ്", "mr": "इशारा",
        "gu": "ચેતવણી", "pa": "ਚੇਤਾਵਨੀ", "or": "ଚେତାବନୀ", "as": "সতৰ্কবাণী",
        "ur": "انتباہ", "sa": "चेतावनी", "ne": "चेतावनी", "kok": "इशारो",
        "mai": "चेतावनी", "brx": "फोसावनाय", "doi": "चेतावनी", "ks": "خطرہ",
        "mni": "ৱার্নিং", "sat": "ᱥᱟᱹᱵᱰᱟᱹᱱ", "sd": "خبردار",
    },
}


# ---------------------------------------------------------
# Lookup helper
# ---------------------------------------------------------

def t(key: str, lang: str = DEFAULT_LANGUAGE) -> str:
    """Translate `key` into `lang`. Falls back to English, then to the
    raw key itself, so a missing translation never crashes the UI -
    it just visibly shows English or the key, which is easy to spot
    and backfill."""
    entry = TRANSLATIONS.get(key)
    if entry is None:
        return key
    return entry.get(lang) or entry.get(DEFAULT_LANGUAGE) or key


def available_languages() -> dict[str, str]:
    """Return the supported language code -> display name map."""
    return dict(LANGUAGES)


def coverage_report() -> dict[str, list[str]]:
    """Which language codes are missing a translation for each key -
    useful for tracking down gaps as more keys get added."""
    gaps: dict[str, list[str]] = {}
    for key, entry in TRANSLATIONS.items():
        missing = [code for code in LANGUAGES if code not in entry]
        if missing:
            gaps[key] = missing
    return gaps


if __name__ == "__main__":
    print(f"{len(LANGUAGES)} languages supported: {', '.join(LANGUAGES)}")
    print(f"{len(TRANSLATIONS)} translation keys defined.\n")

    gaps = coverage_report()
    if gaps:
        print("Coverage gaps (key -> missing language codes):")
        for key, missing in gaps.items():
            print(f"  {key}: {missing}")
    else:
        print("All keys fully translated for all languages.")

    print("\nExample - verdict_compliant in every language:")
    for code, name in LANGUAGES.items():
        print(f"  {code:4s} {name:28s} {t('verdict_compliant', code)}")