import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { LegalPage } from '@/components/public/LegalPage';
import { APP_NAME, SUPPORT_EMAIL } from '@/config/site';

export function ContactPage() {
  return (
    <LegalPage
      title="Contact us"
      intro={`We’re happy to help patients, caregivers, and care teams using ${APP_NAME}.`}
    >
      <h2>Support</h2>
      <p>
        For help with your account, the app, or your data, email us. We aim to
        respond within a few business days.
      </p>
      <p className="!text-base">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 font-medium"
        >
          <Mail className="w-4 h-4" />
          {SUPPORT_EMAIL}
        </a>
      </p>

      <h2>Account deletion</h2>
      <p>
        To delete your account and data, see our{' '}
        <Link to="/account-deletion">Account &amp; Data Deletion</Link> page.
      </p>
    </LegalPage>
  );
}
