import type { Metadata } from "next";
import PrivacyPage, { metadata as privacyMetadata } from "../privacy/page";

/**
 * Canonical path for the personal-data policy.
 * `/privacy` remains as a short alias so older links keep working.
 */
export const metadata: Metadata = privacyMetadata;

export default PrivacyPage;
