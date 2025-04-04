import Link from "next/link";
import Footer from "@/components/Footer";
export const metadata = {
  title: "Privacy Policy - ClipSaaS",
  description: "Privacy Policy for using ClipSaaS",
};

export default function PrivacyPolicy() {
  return (
    <>
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <h2 className="text-xl font-semibold mt-8 mb-4">1. Introduction</h2>
        <p>
          At Instant ClipBoard, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our productivity software and services.
        </p>
        <p>
          Please read this Privacy Policy carefully. By using our services, you acknowledge that you have read and understood this Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
        <p>
          We collect the following types of information:
        </p>
        <h3 className="text-lg font-medium mt-4 mb-2">2.1 Information You Provide to Us</h3>
        <ul className="list-disc pl-6 my-4">
          <li>Account information (such as name, email address, and password) when you create an account</li>
          <li>Billing information if you subscribe to our premium services</li>
          <li>Feedback, support requests, or correspondence you send to us</li>
          <li>Content you copy to your clipboard while using our services</li>
        </ul>

        <h3 className="text-lg font-medium mt-4 mb-2">2.2 Information We Collect Automatically</h3>
        <ul className="list-disc pl-6 my-4">
          <li>Usage information about how you interact with our services</li>
          <li>Device information such as IP address, browser type, operating system, and device type</li>
          <li>Geographic location information such as your country</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
        <p>
          We use your information for the following purposes:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>To provide and maintain our services</li>
          <li>To process transactions and manage your account</li>
          <li>To improve and personalize your experience</li>
          <li>To communicate with you about our services</li>
          <li>To comply with legal obligations</li>
          <li>To detect, prevent, and address technical issues or security breaches</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">4. Clipboard Data</h2>
        <p>
          Our service functions by accessing and storing your clipboard history. This includes text, links, and images you copy while using our service.
        </p>
        <p>
          We understand the sensitive nature of clipboard data and take the following measures to protect it:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Your clipboard data is stored locally on your device by default</li>
          <li>If you enable cloud sync (premium feature), your data is encrypted in transit and at rest</li>
          <li>We do not analyze, process, or access your clipboard content except to provide the service to you</li>
          <li>You can delete your clipboard history at any time</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">5. Data Sharing and Disclosure</h2>
        <p>
          We do not sell your personal information. We may share your information in the following limited circumstances:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>With service providers who help us operate our business</li>
          <li>If required by law or to protect rights and safety</li>
          <li>In connection with a business transaction such as a merger or acquisition</li>
          <li>With your consent or at your direction</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-4">6. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">7. Data Retention</h2>
        <p>
          We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. You can request deletion of your account and associated data at any time.
        </p>
        <p>
          Clipboard history is stored according to your preferences. By default, clipboard items are automatically removed after 48 hours, but you can modify this setting or manually delete items at any time.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">8. Your Privacy Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul className="list-disc pl-6 my-4">
          <li>Right to access and receive a copy of your personal information</li>
          <li>Right to correct inaccurate information</li>
          <li>Right to deletion of your personal information</li>
          <li>Right to restrict or object to processing</li>
          <li>Right to data portability</li>
          <li>Right to withdraw consent</li>
        </ul>
        <p>
          To exercise these rights, please contact us using the information in the &quot;Contact Us&quot; section.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">9. Children&apos;s Privacy</h2>
        <p>
          Our services are available to users of all ages. We are committed to protecting the privacy of all our users, including children. If you are a parent or guardian and have concerns about your child&apos;s use of our services, please contact us.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">10. International Data Transfers</h2>
        <p>
          We may transfer, store, and process your information in countries other than your own. If you are located in the European Economic Area (EEA), we ensure that such transfers comply with applicable data protection laws, including the use of standard contractual clauses approved by the European Commission.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">11. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and, if the changes are significant, we will provide additional notice such as through email or an in-app notification.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">12. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
        </p>
        <p className="font-medium">
          privacy@clipsaas.com
        </p>
        <p>
          Data Protection Officer<br />
          ClipSaaS Inc.<br />
          123 Productivity Street<br />
          San Francisco, CA 94103<br />
          United States
        </p>
      </div>

      <div className="mt-12 border-t pt-6 flex space-x-4">
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Home
        </Link>
        <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
          Terms of Service
        </Link>
      </div>
    </div>

    <Footer />
    </>
  );
}
