"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Copy, Printer } from "lucide-react";
// import Header from "@/components/header";
import { useState, useEffect } from "react"; // Added
// import PrivacyPolicyContent from "@/components/privacy-policy-content"; // Added
// Import `useRouter` and `useSearchParams` from `next/navigation`
import { useRouter, useSearchParams } from "next/navigation";
import PrivacyPolicyContent from "../privacy-policy/page";
import Header from "../privacy-policy/header";

export default function TermsPrivacyPage() {
  // Initialize router and searchParams
  const router = useRouter();
  const searchParams = useSearchParams();

  // Modify the `useState` for `activeTab` to read from URL on initial load
  const [activeTab, setActiveTab] = useState("terms");

  // Add a `useEffect` hook to read the tab from the URL on component mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "privacy" || tab === "cookies") {
      setActiveTab(tab);
    } else {
      setActiveTab("terms"); // Default to terms if no valid tab is in URL
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-[#E0F2F7] relative overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-[#004d40]">
                {activeTab === "terms" && "Terms and Conditions"}
                {activeTab === "privacy" && "Privacy Policy"}
                {activeTab === "cookies" && "Cookies Policy"}
              </h1>
              <p className="text-lg text-gray-700 md:text-xl">
                {activeTab === "terms" &&
                  "These Terms and Conditions help define Qalio's relationship with you as you interact with our services."}
                {activeTab === "privacy" &&
                  "This Privacy Policy explains how Qalio collects, uses, and discloses information about you."}
                {activeTab === "cookies" &&
                  "This Cookies Policy explains how Qalio uses cookies and similar technologies."}
              </p>
            </div>
          </div>
        </section>

        <section className="w-full bg-white py-0">
          <div className="container px-4 md:px-6">
            <div className="flex border-b border-gray-200">
              <Link
                href="#"
                onClick={() => {
                  setActiveTab("terms");
                  router.push("/terms-privacy?tab=terms");
                }}
                className={`py-4 px-6 font-semibold -mb-[1px] ${
                  activeTab === "terms"
                    ? "text-[#004d40] border-b-2 border-[#004d40]"
                    : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
                }`}
                prefetch={false}
              >
                Terms and Conditions
              </Link>
              <Link
                href="#"
                onClick={() => {
                  setActiveTab("privacy");
                  router.push("/terms-privacy?tab=privacy");
                }}
                className={`py-4 px-6 font-semibold -mb-[1px] ${
                  activeTab === "privacy"
                    ? "text-[#004d40] border-b-2 border-[#004d40]"
                    : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
                }`}
                prefetch={false}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                onClick={() => {
                  setActiveTab("cookies");
                  router.push("/terms-privacy?tab=cookies");
                }}
                className={`py-4 px-6 font-semibold -mb-[1px] ${
                  activeTab === "cookies"
                    ? "text-[#004d40] border-b-2 border-[#004d40]"
                    : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
                }`}
                prefetch={false}
              >
                Cookies Policy
              </Link>
            </div>
          </div>
        </section>

        <section className="w-full py-8 md:py-12 lg:py-16 bg-white">
          <div className="container px-4 md:px-6 max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500">Updated on 02.06.2022</p>
            </div>
            {activeTab === "terms" && (
              <div className="prose prose-gray max-w-none dark:prose-invert text-gray-700">
                <p className="font-bold">
                  Thank you for your interest and willingness to use our
                  services. The following Terms and Conditions, along with the
                  documents listed herein, define the terms and conditions of
                  using our Service (the service is defined below) and is a
                  legally binding agreement between the User and Qalio. If
                  you have any questions regarding the terms of service, please
                  contact us at support@Qalio.net.
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                  cupidatat non proident, sunt in culpa qui officia deserunt
                  mollit anim id est laborum.
                </p>
                <h2>1. Definitions</h2>
                <p>
                  For the purpose of these Terms and Conditions, the following
                  definitions shall apply:
                </p>
                <ul>
                  <li>
                    <strong>Service:</strong> Refers to the Qalio platform
                    and all its associated features, tools, and functionalities.
                  </li>
                  <li>
                    <strong>User:</strong> Any individual or entity accessing or
                    using the Service.
                  </li>
                  <li>
                    <strong>Content:</strong> Any data, text, graphics, images,
                    audio, video, or other material uploaded, submitted, or
                    displayed on the Service.
                  </li>
                </ul>
                <h2>2. Acceptance of Terms</h2>
                <p>
                  By accessing or using the Service, you agree to be bound by
                  these Terms and Conditions and all applicable laws and
                  regulations. If you do not agree with any of these terms, you
                  are prohibited from using or accessing this site.
                </p>
                <h2>3. User Responsibilities</h2>
                <p>
                  Users are responsible for maintaining the confidentiality of
                  their account information and for all activities that occur
                  under their account. Users agree to use the Service only for
                  lawful purposes and in a manner that does not infringe the
                  rights of, or restrict or inhibit the use and enjoyment of the
                  Service by any third party.
                </p>
                <h2>4. Intellectual Property</h2>
                <p>
                  All content and materials available on the Service, including
                  but not limited to text, graphics, website name, code, images,
                  and logos are the intellectual property of Qalio and are
                  protected by applicable copyright and trademark law. Any
                  inappropriate use, including but not limited to the
                  reproduction, distribution, display or transmission of any
                  content on this site is strictly prohibited, unless
                  specifically authorized by Qalio.
                </p>
                <h2>5. Limitation of Liability</h2>
                <p>
                  In no event shall Qalio or its suppliers be liable for
                  any damages (including, without limitation, damages for loss
                  of data or profit, or due to business interruption) arising
                  out of the use or inability to use the materials on
                  Qalio&apos;s website, even if Qalio or a
                  Qalio authorized representative has been notified orally
                  or in writing of the possibility of such damage.
                </p>
                <h2>6. Changes to Terms</h2>
                <p>
                  Qalio reserves the right to revise these Terms and
                  Conditions at any time without notice. By using this Service
                  you are agreeing to be bound by the then current version of
                  these Terms and Conditions.
                </p>
                <h2>7. Governing Law</h2>
                <p>
                  These terms and conditions are governed by and construed in
                  accordance with the laws of the jurisdiction where Qalio
                  is located, and you irrevocably submit to the exclusive
                  jurisdiction of the courts in that State or location.
                </p>
              </div>
            )}
            {activeTab === "privacy" && <PrivacyPolicyContent />}
            {activeTab === "cookies" && (
              <div className="prose prose-gray max-w-none dark:prose-invert text-gray-700">
                <p className="font-bold">
                  This Cookies Policy explains how Qalio uses cookies and
                  similar technologies to recognize you when you visit our
                  websites. It explains what these technologies are and why we
                  use them, as well as your rights to control our use of them.
                </p>
                <h2>1. What are cookies?</h2>
                <p>
                  Cookies are small data files that are placed on your computer
                  or mobile device when you visit a website. Cookies are widely
                  used by website owners in order to make their websites work,
                  or to work more efficiently, as well as to provide reporting
                  information.
                </p>
                <h2>2. Why do we use cookies?</h2>
                <p>
                  We use first and third party cookies for several reasons. Some
                  cookies are required for technical reasons in order for our
                  Websites to operate, and we refer to these as
                  &quot;essential&quot; or &quot;strictly necessary&quot;
                  cookies. Other cookies also enable us to track and target the
                  interests of our users to enhance the experience on our Online
                  Properties. Third parties serve cookies through our Websites
                  for advertising, analytics and other purposes. This is
                  described in more detail below.
                </p>
                <h2>3. How can I control cookies?</h2>
                <p>
                  You have the right to decide whether to accept or reject
                  cookies. You can exercise your cookie rights by setting your
                  preferences in the Cookie Consent Manager. The Cookie Consent
                  Manager allows you to select which categories of cookies you
                  accept or reject. Essential cookies cannot be rejected as they
                  are strictly necessary to provide you with services.
                </p>
                <p>
                  The Cookie Consent Manager can be found in the notification
                  banner and on our website. If you choose to reject cookies,
                  you may still use our website though your access to some
                  functionality and areas of our website may be restricted. You
                  may also set or amend your web browser controls to accept or
                  refuse cookies.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
