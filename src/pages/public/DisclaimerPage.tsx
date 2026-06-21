import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/public/LegalPage';
import { APP_NAME, SUPPORT_EMAIL } from '@/config/site';

export function DisclaimerPage() {
  return (
    <LegalPage
      title="Medical Disclaimer"
      intro={`${APP_NAME} supports the coordination of your cancer care. It does not provide medical advice and is not a substitute for professional care.`}
    >
      <h2>Not medical advice</h2>
      <p>
        The information and features in {APP_NAME} are for care coordination and
        general support only. They are <strong>not a substitute for professional
        medical advice, diagnosis, or treatment</strong>. Always seek the guidance
        of your doctor or other qualified health provider with any questions about
        your condition or treatment.
      </p>

      <h2>Never delay care</h2>
      <p>
        Never disregard professional medical advice or delay seeking it because of
        something you read or recorded in {APP_NAME}.
      </p>

      <h2>Emergencies</h2>
      <p>
        {APP_NAME} is not for emergencies. If you think you have a medical emergency,
        contact your doctor or your local emergency services immediately.
      </p>

      <h2>About our AI features</h2>
      <p>
        Some features use AI to help read documents and organize information. These
        features <strong>never diagnose conditions or recommend treatments or
        dosages</strong>. Any medication or appointment details extracted from your
        documents should always be confirmed with your care team.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. See
        also our <Link to="/privacy">Privacy Policy</Link> and{' '}
        <Link to="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
