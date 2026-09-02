import React, { Suspense } from "react";
import TermsPrivacyPage from "./termsPrivacyPage";

const page = () => {
  return (
    <Suspense>
      <TermsPrivacyPage />
    </Suspense>
  );
};

export default page;
