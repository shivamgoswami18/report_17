import { pageTitles } from "@/components/constants/PageTitles";
import ProfessionalProfilePage from "@/components/project/UserDetail";
import { createMetadata } from "@/lib/metadata/metadataHelper";
import React from "react";

export const metadata = createMetadata(pageTitles.userProfilePageTitle);
function page() {
  return <ProfessionalProfilePage/>
}

export default page;
