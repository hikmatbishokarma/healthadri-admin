import { Link } from 'react-router-dom';
import { LegalPage } from '@/components/public/LegalPage';
import { APP_NAME, SUPPORT_EMAIL } from '@/config/site';

export function AboutPage() {
  return (
    <LegalPage
      title={`About ${APP_NAME}`}
      intro={`${APP_NAME} is a cancer patient care-coordination service built to support patients and their families through treatment in Telangana and Andhra Pradesh.`}
    >
      <h2>Our mission</h2>
      <p>
        A cancer diagnosis brings a flood of appointments, medications, symptoms,
        and decisions. {APP_NAME} exists to make that journey easier to manage — by
        keeping patients connected to a care team that knows them and can step in
        when they need help.
      </p>

      <h2>How it works</h2>
      <ul>
        <li>
          <strong>Patients</strong> submit daily symptom check-ins, track
          appointments, and upload medical documents from the mobile app.
        </li>
        <li>
          <strong>Navigators</strong> — trained care staff — monitor patient
          panels, respond to alerts, and coordinate next steps.
        </li>
        <li>
          <strong>Caregivers</strong> can be invited by patients to help manage
          their care.
        </li>
      </ul>

      <h2>Where we work</h2>
      <p>
        {APP_NAME} currently supports patients and care teams across Telangana and
        Andhra Pradesh, India.
      </p>

      <h2>Get in touch</h2>
      <p>
        Reach us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or visit
        our <Link to="/contact">Contact</Link> page.
      </p>
    </LegalPage>
  );
}
