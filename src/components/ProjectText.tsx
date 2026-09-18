"use client";

import { useLanguage } from "@/components/LanguageProvider";

type ProjectTextProps = {
ko: string;
en: string;
className?: string;
};

export default function ProjectText({
ko,
en,
className
}: ProjectTextProps) {
const { language } = useLanguage();

return ( <span className={className}>
{language === "English" ? en : ko} </span>
);
}
