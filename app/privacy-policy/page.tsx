import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Sevadar Pratapgarh',
  description: 'Privacy Policy for the Sevadar App and Website.',
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 bg-black text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-[#FF9933]">Privacy Policy</h1>
      <p className="mb-4 text-sm text-gray-500">Last Updated: January 02, 2026</p>

      <section className="mb-8 space-y-4">
        <p>
          <strong>UT Arts</strong> ("we," "our," or "us") operates the <strong>Sevadar</strong> mobile application and website (the "Service").
          This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
        </p>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Information We Collect</h2>
        <p>We collect several different types of information for various purposes to provide and improve our Service to you:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to: Name, Email address, Phone number.</li>
          <li><strong>Usage Data:</strong> We may also collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device ("Usage Data"). This may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, unique device identifiers, and other diagnostic data.</li>
        </ul>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. How We Use Your Data</h2>
        <p>UT Arts uses the collected data for various purposes:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>To provide and maintain the Service.</li>
          <li>To notify you about changes to our Service.</li>
          <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
          <li>To provide customer care and support.</li>
          <li>To monitor the usage of the Service.</li>
        </ul>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Data Security</h2>
        <p>
          The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
        </p>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Delete Your Account</h2>
        <p>
          You have the right to request the deletion of your account and all associated data. To do so, please follow these steps:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Send an email to <strong>info@utarts.in</strong> with the subject line "Account Deletion Request : Sevadar App".</li>
          <li>Include the Phone Number associated with your account.</li>
          <li>We will verify your identity and permanently delete your account and data within 30 days.</li>
        </ul>
      </section>
      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ul className="list-disc pl-5">
          <li>By email: <a href="mailto:info@utarts.in" className="text-[#FF9933] hover:underline">info@utarts.in</a></li>
          <li>By visiting this page on our website: <a href="https://www.utarts.in" className="text-[#FF9933] hover:underline">www.utarts.in</a> (Sevadar Project)</li>
        </ul>
      </section>
    </main>
  );
}