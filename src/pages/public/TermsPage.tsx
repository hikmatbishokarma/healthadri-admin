import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/public/LegalPage';
import { APP_NAME, SUPPORT_EMAIL } from '@/config/site';

export function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These terms govern your use of the ${APP_NAME} app and services. By using ${APP_NAME}, you agree to them.`}
    >
      <h2>Using {APP_NAME}</h2>
      <p>
        {APP_NAME} provides care-coordination tools for cancer patients and their
        caregivers. You agree to use the service only for its intended purpose and
        in compliance with applicable laws.
      </p>

      <h2>Your account</h2>
      <p>
        You are responsible for the activity on your account and for keeping access
        to your phone and account secure. Please provide accurate information and
        keep it up to date so your care team can support you effectively.
      </p>

      <h2>Medical disclaimer</h2>
      <p>
        {APP_NAME} does not provide medical advice and is not a substitute for
        professional care. Please read our{' '}
        <Link to="/disclaimer">Medical Disclaimer</Link>.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not misuse the service or attempt to disrupt or gain unauthorized access to it.</li>
        <li>Do not upload content you do not have the right to share.</li>
        <li>Do not use the service to harass or harm others.</li>
      </ul>

      <h2>No warranty</h2>
      <p>
        The service is provided “as is” and “as available,” without warranties of
        any kind, to the fullest extent permitted by law.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, {APP_NAME} and its operators are not
        liable for any indirect, incidental, or consequential damages arising from
        your use of the service.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the service
        after changes take effect constitutes acceptance of the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India, with jurisdiction in
        Telangana.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
