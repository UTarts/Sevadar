import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety Standards | Sevadar Pratapgarh',
  description: 'Child Safety Standards and Community Guidelines for Sevadar.',
};

export default function SafetyStandards() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-[#FF9933]">Safety Standards & Community Guidelines</h1>
      <p className="mb-4 text-sm text-gray-500">Last Updated: January 02, 2026</p>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Zero Tolerance for Child Exploitation</h2>
        <p>
          <strong>Sevadar</strong> has a zero-tolerance policy against Child Sexual Abuse Material (CSAM) and exploitation. 
          We are committed to maintaining a safe environment for all users. Any content that depicts, promotes, or facilitates the sexual exploitation of children is strictly prohibited.
        </p>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Content Monitoring & Removal</h2>
        <p>
          We actively monitor user-generated content (comments and profile images). If any content is found to violate our child safety standards:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>The content will be removed immediately.</li>
          <li>The user account responsible will be permanently banned.</li>
          <li>We will report the incident to the appropriate authorities, including the National Center for Missing & Exploited Children (NCMEC) and local law enforcement.</li>
        </ul>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. How to Report Violations</h2>
        <p>
          We encourage users to report any safety concerns immediately. You can report inappropriate content or behavior by:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Using the "Contact Us" form within the app.</li>
          <li>Emailing our Safety Team directly at: <a href="mailto:info@utarts.in" className="text-[#FF9933] hover:underline">info@utarts.in</a></li>
        </ul>
        <p className="mt-2">
          All reports are reviewed within 24 hours.
        </p>
      </section>

      <section className="mb-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Cooperation with Law Enforcement</h2>
        <p>
          We will fully cooperate with law enforcement agencies in investigating and prosecuting any individuals who use our platform to exploit or harm children.
        </p>
      </section>
    </main>
  );
}