import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/public/LegalPage';
import { APP_NAME, SUPPORT_EMAIL } from '@/config/site';

export function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${APP_NAME} helps cancer patients and their caregivers coordinate care with a dedicated care team. Because we handle sensitive health information, we want to be clear about what we collect, why, and who can see it.`}
    >
      <h2>Who we are</h2>
      <p>
        {APP_NAME} is a cancer patient care-coordination service operating in
        Telangana and Andhra Pradesh, India. If you have any questions about this
        policy or your data, contact us at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Information we collect</h2>
      <p>We collect the information you and your care team provide so we can support your treatment:</p>

      <h3>Account and identity</h3>
      <ul>
        <li>
          <strong>Phone number</strong> — used as your primary login identifier
          (verified by a one-time password).
        </li>
        <li>Name, age, and gender.</li>
        <li>Alternate phone and emergency contact number.</li>
        <li>
          <strong>ABHA (Ayushman Bharat Health Account) number</strong>, where you choose to provide it.
        </li>
        <li>Profile photo, if you add one.</li>
      </ul>

      <h3>Health information</h3>
      <ul>
        <li>Cancer type, stage, date of diagnosis, and treatment status.</li>
        <li>Your hospital and treating doctor.</li>
        <li>Daily <strong>symptom check-ins</strong> you submit from the app.</li>
        <li>Appointments and your treatment and visit history.</li>
        <li>
          <strong>Medical documents you upload</strong> — such as prescriptions,
          lab reports, and discharge summaries (PDF, JPG, or PNG).
        </li>
      </ul>

      <h3>Communications</h3>
      <ul>
        <li>Messages you exchange with your care team (navigators).</li>
        <li>
          Caregiver details you provide when linking a caregiver — their name,
          phone number, and relationship to you.
        </li>
      </ul>

      <h3>Device information</h3>
      <ul>
        <li>
          A <strong>push-notification token</strong> for your device, so we can
          send medication and appointment reminders.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>To coordinate your care and support you through treatment.</li>
        <li>
          To monitor symptom check-ins, generate alerts, and prioritize care when
          thresholds are crossed.
        </li>
        <li>To send medication and appointment reminders.</li>
        <li>To let your care team and invited caregivers support you.</li>
      </ul>

      <h2>Who can see your information</h2>
      <p>
        Your information is visible to the care team responsible for you —
        specifically the <strong>navigator</strong> (care staff) assigned to you —
        and to any <strong>caregiver you personally invite</strong> by sharing an
        invite code. Some messages can be scoped so they are visible only to you or
        shared with your care team. We do not sell your personal or health
        information, and we do not use it for advertising.
      </p>

      <h2>Third-party services</h2>
      <p>We share limited data with service providers that help us run the app:</p>
      <ul>
        <li>
          <strong>Sarvam AI</strong> — when you upload a prescription or discharge
          summary, we send the document text to Sarvam AI to read it (OCR) and to
          extract structured items such as medicines, lab tests, and appointment
          details. This is used only to support your care, not for advertising.
        </li>
        <li>
          <strong>Google Firebase</strong> — used for push notifications (Cloud
          Messaging) and, where enabled, for phone-number verification (OTP/SMS).
        </li>
        <li>
          <strong>Expo</strong> — used to deliver push notifications to your device
          in some builds of the app.
        </li>
      </ul>
      <p>
        These providers process data on our behalf under their own terms. We do not
        currently use third-party analytics or crash-reporting services.
      </p>

      <h2>How we store and protect your data</h2>
      <p>
        Your medical documents and records are stored in our own database. Sensitive
        credentials are hashed, and data is transmitted over secure connections. No
        system is perfectly secure, but we take reasonable measures to protect your
        information.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        We keep your information for as long as your account is active or as needed
        to support your care. You can ask us to delete your account and associated
        data at any time — see our{' '}
        <Link to="/account-deletion">Account &amp; Data Deletion</Link> page for how
        to request this.
      </p>

      <h2>Children</h2>
      <p>
        {APP_NAME} is intended for use by patients and caregivers managing cancer
        care and is not directed at children.
      </p>

      <h2>Permissions the app requests</h2>
      <ul>
        <li>
          <strong>Notifications</strong> — to send medication and appointment
          reminders. You can decline, though you may then miss reminders.
        </li>
        <li>
          <strong>File access</strong> — to let you choose and upload medical
          documents.
        </li>
      </ul>
      <p>The app does not request access to your camera, microphone, or location.</p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be
        reflected here with a new “Last updated” date.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about your privacy? Email{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
