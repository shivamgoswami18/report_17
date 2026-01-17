"use client";

import DOMPurify from "dompurify";
import React from "react";

export type SanitizedTextProps = {
  text?: string | null;
};

const SanitizedText: React.FC<SanitizedTextProps> = ({ text }) => {
  const sanitized = React.useMemo(() => {
    if (!text) return "";
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }, [text]);

  return sanitized || "";
};

export default SanitizedText;
