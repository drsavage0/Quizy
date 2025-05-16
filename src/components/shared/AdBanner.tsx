
"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function AdBanner() {
  const { t } = useLanguage();
  return (
    <div className="w-full h-16 sm:h-20 md:h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600 shadow-inner my-2">
      {/* This is a placeholder for an ad.
          In a real application, you would replace this div's content
          with ad code from an ad network like Google AdSense.
      */}
      <span data-ai-hint="advertisement banner">{t('advertisement')}</span>
    </div>
  );
}
