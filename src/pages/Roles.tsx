import { ShieldCheck, Users, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

const ROLES = [
  {
    name: 'patient',
    label: 'Patient',
    icon: UserCheck,
    tint: 'text-blue-600 bg-blue-50',
    description:
      'Mobile-app users enrolled in the platform. Patients log in via OTP, submit daily symptom check-ins, and receive playbook-driven follow-ups from their assigned navigator.',
    capabilities: [
      'Submit symptom check-ins',
      'View playbook tasks assigned to them',
      'Chat with their navigator',
      'Access medical records and reminders',
    ],
  },
  {
    name: 'navigator',
    label: 'Navigator',
    icon: Users,
    tint: 'text-emerald-600 bg-emerald-50',
    description:
      'Health navigators are the care-coordination staff. They are provisioned here by a super-admin and log in via OTP on the mobile app. Each navigator manages a panel of patients.',
    capabilities: [
      'View priority patient dashboard',
      'Acknowledge and resolve alerts',
      'Run playbooks for patients',
      'Add clinical notes and draft summaries',
    ],
  },
  {
    name: 'super-admin',
    label: 'Super Admin',
    icon: ShieldCheck,
    tint: 'text-violet-600 bg-violet-50',
    description:
      'Full administrative access to this web dashboard. Super-admins manage navigators, hospitals, doctors, playbooks, and symptom thresholds. Seeded at deployment via environment variables.',
    capabilities: [
      'All CRUD operations in this dashboard',
      'Create and manage navigator accounts',
      'Configure playbooks and symptom thresholds',
      'View system-wide data',
    ],
  },
];

export function RolesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Roles"
        description="The three roles in the Healthadri system and what each can do."
      />

      <div className="space-y-4">
        {ROLES.map(({ name, label, icon: Icon, tint, description, capabilities }) => (
          <Card key={name}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${tint}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-semibold text-foreground">{label}</h2>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                      {name}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{description}</p>
                  <ul className="space-y-1">
                    {capabilities.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Role assignment is controlled at the data level. To promote a navigator to
            super-admin, update their <code className="text-xs bg-muted px-1 py-0.5 rounded">role</code> field
            directly in the database or extend this dashboard with a role-management action.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
