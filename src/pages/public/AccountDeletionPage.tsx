import { LegalPage } from '@/components/public/LegalPage';
import { APP_NAME, SUPPORT_EMAIL } from '@/config/site';

export function AccountDeletionPage() {
  return (
    <LegalPage
      title="Account & Data Deletion"
      intro={`You can ask us to delete your ${APP_NAME} account and the data associated with it at any time. This page explains what gets deleted and how to request it.`}
    >
      <h2>What gets deleted</h2>
      <p>When we process a deletion request, we remove:</p>
      <ul>
        <li>Your account and profile (name, phone, age, gender, and related details).</li>
        <li>Your health information — cancer details, symptom check-ins, appointments, and visit history.</li>
        <li>Medical documents you uploaded (prescriptions, lab reports, discharge summaries).</li>
        <li>Messages exchanged with your care team.</li>
      </ul>

      <h2>What we may retain</h2>
      <p>
        We may retain limited information where we are required to by law, or in
        de-identified form that can no longer be linked to you, for legitimate
        record-keeping. Where retention applies, we keep only what is necessary and
        for no longer than required.
      </p>

      <h2>How to request deletion</h2>
      <p>You can request deletion in either of these ways:</p>
      <ul>
        <li>
          <strong>Email us</strong> at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`}>
            {SUPPORT_EMAIL}
          </a>{' '}
          from the phone number or email registered with your account, with the
          subject “Account deletion request.”
        </li>
        <li>
          <strong>Ask your navigator</strong> (care team member) through the app to
          start the deletion process for you.
        </li>
      </ul>
      <p>
        To protect your data, we may need to verify your identity before processing
        the request. We aim to complete deletion requests within <strong>30 days</strong>.
      </p>

      <h2>Questions</h2>
      <p>
        If you have any questions about deleting your account or data, contact{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
