import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service - ClipSaaS",
  description: "Terms of Service for using ClipSaaS",
};

export default function TermsOfService() {
  return (
    <>
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          Welcome to ClipSaaS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our productivity software and services,
          you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read these Terms carefully.
        </p>
        <p>
          Our services are designed to enhance your productivity by providing clipboard history management capabilities.
          We offer both free and premium versions of our service.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Eligibility</h2>
        <p>
          Our services are available to anyone worldwide. By using our services, you represent and warrant that you have the legal capacity to enter into a binding agreement with us and are not prohibited from using the services under the laws of your jurisdiction.
        </p>
        <p>
          If you are using our services on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. Free and Premium Services</h2>
        <p>
          We offer a free version of our service with basic functionality. Premium features are available through paid subscription plans. The specific features available in each version are described on our website and are subject to change.
        </p>
        <p>
          We reserve the right to modify, suspend, or discontinue any aspect of our services at any time, including the availability of any features, database, or content.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. User Accounts</h2>
        <p>
          You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
        <p>
          You agree to provide accurate and complete information when creating your account and to update your information to keep it accurate and current.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Privacy and Data Protection</h2>
        <p>
          Our Privacy Policy explains how we collect, use, and protect your personal information. By using our services, you consent to our collection and use of data as described in our Privacy Policy.
        </p>
        <p>
          When you access our services, we collect certain information about you, including your email address, device information (such as browser type and operating system), and geographic location information (such as your country). This information helps us provide a better service and comply with data protection requirements.
        </p>
        <p>
          We comply with applicable data protection laws, including the General Data Protection Regulation (GDPR) for users in the European Union and the California Consumer Privacy Act (CCPA) for California residents.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. User Content</h2>
        <p>
          Our service may allow you to store, manage, and access content through your clipboard history. You retain ownership of any intellectual property rights you hold in that content.
        </p>
        <p>
          You are solely responsible for the content you create, copy, upload, or otherwise make available through our services. You represent and warrant that you have all necessary rights to such content and that it does not violate any laws or infringe on any third-party rights.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Acceptable Use</h2>
        <p>
          You agree not to use our services to:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe upon or violate the intellectual property rights or other rights of others</li>
          <li>Transmit any material that is harmful, offensive, or otherwise objectionable</li>
          <li>Interfere with or disrupt the integrity or performance of our services</li>
          <li>Attempt to gain unauthorized access to our services, systems, or networks</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Payment Terms</h2>
        <p>
          If you subscribe to our premium services, you agree to pay all fees according to the pricing and terms displayed at the time of your purchase. All payments are non-refundable unless otherwise specified or required by law.
        </p>
        <p>
          We may change our prices at any time, but we will provide notice of any price changes in advance and give you an opportunity to cancel your subscription before the new prices take effect.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Intellectual Property</h2>
        <p>
          Our services and all related content, features, and functionality are owned by us or our licensors and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </p>
        <p>
          You may not copy, modify, create derivative works of, publicly display, publicly perform, republish, or transmit any of our material without our explicit consent.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. Disclaimers and Limitations of Liability</h2>
        <p>
          Our services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied. We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </p>
        <p>
          To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our services.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless our company, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising from your use of our services or violation of these Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">12. Changes to these Terms</h2>
        <p>
          We may modify these Terms at any time by posting the revised terms on our website. Your continued use of our services after the effective date of any changes constitutes your acceptance of the modified Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">13. Termination</h2>
        <p>
          We may terminate or suspend your access to our services at any time, without prior notice or liability, for any reason, including if you breach these Terms.
        </p>
        <p>
          You may cancel your subscription or delete your account at any time. Upon termination, your right to use our services will immediately cease.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">14. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is registered, without regard to its conflict of law provisions.
        </p>
        <p>
          Any disputes arising from these Terms or your use of our services shall be resolved in the courts located within that jurisdiction.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">15. International Use</h2>
        <p>
          Our services are designed for global use. However, we make no representations that our services are appropriate or available for use in locations outside your country. Those who access or use our services from other jurisdictions do so at their own risk and are responsible for compliance with local laws.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">16. Contact Information</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p className="font-medium">
          support@clipsaas.com
        </p>
      </div>

      <div className="mt-12 border-t pt-6">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
    <Footer />
    </>
  );
}
