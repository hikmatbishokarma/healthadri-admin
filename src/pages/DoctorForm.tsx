import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

type AffiliationValue = {
  hospitalId: string;
  consultationDays: string[];
  consultationHoursStart: string;
  consultationHoursEnd: string;
  appointmentNumber: string;
};

type FormValues = {
  name: string;
  hprId: string;
  registrationNumber: string;
  stateMedicalCouncil: string;
  primarySpecialty: string;
  dmgs: string[];
  yearsOfExperience: string;
  keyProcedures: string;
  affiliations: [AffiliationValue, AffiliationValue];
  teleConsultation: boolean;
  insuranceAccepted: string[];
  dataConsent: boolean;
  phone: string;
  email: string;
};

const SPECIALTIES   = ['Medical Oncology (DM)', 'Surgical Oncology (MCh)', 'Radiation Oncology (MD)', 'Hematology-Oncology'];
const DMGS          = ['Breast Cancer', 'Head & Neck', 'Gastrointestinal (GI)', 'Thoracic (Lung)', 'Pediatric Oncology', 'Gynecological Oncology'];
const DAYS          = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// const INSURANCE  = ['PM-JAY', 'Aarogyasri', 'Private Insurance (Cashless)']; // not needed per client
const STATE_COUNCILS = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Other'];

const EMPTY_AFFILIATION: AffiliationValue = {
  hospitalId: '', consultationDays: [], consultationHoursStart: '', consultationHoursEnd: '', appointmentNumber: '',
};

// ── Accordion section ────────────────────────────────────────────────────────

function Section({
  num, title, summary, open, onToggle, children,
}: {
  num: number; title: string; summary: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            Section {num}
          </p>
          <p className="font-semibold text-foreground">{title}</p>
          {!open && summary && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{summary}</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <CardContent className="px-6 pb-6 pt-4 border-t space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// ── Checkbox group ───────────────────────────────────────────────────────────

function CheckboxGroup({
  label, options, name, register,
}: {
  label: string; options: string[]; name: string;
  register: ReturnType<typeof useForm<FormValues>>['register'];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" value={opt} {...register(name as keyof FormValues)} className="h-4 w-4 rounded border-input accent-primary" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Affiliation block ─────────────────────────────────────────────────────────

function AffiliationBlock({
  index, label, hospitals, register,
}: {
  index: 0 | 1; label: string;
  hospitals: { _id: string; name: string }[];
  register: ReturnType<typeof useForm<FormValues>>['register'];
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        <Label>Hospital</Label>
        <select
          {...register(`affiliations.${index}.hospitalId`)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— select hospital —</option>
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>{h.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Consultation Days</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
          {DAYS.map((d) => (
            <label key={d} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" value={d} {...register(`affiliations.${index}.consultationDays`)} className="h-4 w-4 rounded border-input accent-primary" />
              {d}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>From</Label>
          <Input {...register(`affiliations.${index}.consultationHoursStart`)} type="time" />
        </div>
        <div className="space-y-1.5">
          <Label>To</Label>
          <Input {...register(`affiliations.${index}.consultationHoursEnd`)} type="time" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Direct Appointment Number</Label>
        <Input {...register(`affiliations.${index}.appointmentNumber`)} placeholder="+91XXXXXXXXXX" maxLength={20} />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DoctorFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [openSection, setOpenSection] = useState<number | null>(1);
  const [hospitals, setHospitals] = useState<{ _id: string; name: string }[]>([]);

  const toggle = (n: number) => setOpenSection((prev) => (prev === n ? null : n));

  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      dmgs: [], insuranceAccepted: [],
      affiliations: [EMPTY_AFFILIATION, EMPTY_AFFILIATION],
    },
  });

  const watched = useWatch({ control });

  useEffect(() => {
    api.get('/hospitals', { params: { limit: 200 } }).then((res) => setHospitals(res.data.data ?? []));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/doctors/${id}`).then((res) => {
      const d = res.data;
      const aff = d.affiliations ?? [];
      reset({
        name: d.name ?? '',
        hprId: d.hprId ?? '',
        registrationNumber: d.registrationNumber ?? '',
        stateMedicalCouncil: d.stateMedicalCouncil ?? '',
        primarySpecialty: d.primarySpecialty ?? '',
        dmgs: d.dmgs ?? [],
        yearsOfExperience: d.yearsOfExperience?.toString() ?? '',
        keyProcedures: (d.keyProcedures ?? []).join(', '),
        affiliations: [
          { hospitalId: aff[0]?.hospitalId?._id ?? aff[0]?.hospitalId ?? '', consultationDays: aff[0]?.consultationDays ?? [], consultationHoursStart: aff[0]?.consultationHoursStart ?? '', consultationHoursEnd: aff[0]?.consultationHoursEnd ?? '', appointmentNumber: aff[0]?.appointmentNumber ?? '' },
          { hospitalId: aff[1]?.hospitalId?._id ?? aff[1]?.hospitalId ?? '', consultationDays: aff[1]?.consultationDays ?? [], consultationHoursStart: aff[1]?.consultationHoursStart ?? '', consultationHoursEnd: aff[1]?.consultationHoursEnd ?? '', appointmentNumber: aff[1]?.appointmentNumber ?? '' },
        ],
        teleConsultation: d.teleConsultation ?? false,
        insuranceAccepted: d.insuranceAccepted ?? [],
        dataConsent: d.dataConsent ?? false,
        phone: d.phone ?? '',
        email: d.email ?? '',
      });
    });
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      yearsOfExperience: Number(data.yearsOfExperience) || 0,
      keyProcedures: data.keyProcedures
        ? data.keyProcedures.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      affiliations: data.affiliations.filter((a) => a.hospitalId),
      specialty: data.primarySpecialty, // keep legacy field in sync
    };
    if (isEdit) {
      await api.patch(`/doctors/${id}`, payload);
    } else {
      await api.post('/doctors', payload);
    }
    navigate('/admin/doctors');
  };

  // Summary helpers
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  const s1 = [watched.name, watched.hprId].filter(Boolean).join(' · ');
  const s2 = [watched.primarySpecialty, arr(watched.dmgs).length ? `${arr(watched.dmgs).length} DMGs` : '', watched.yearsOfExperience ? `${watched.yearsOfExperience} yrs` : ''].filter(Boolean).join(' · ');
  const s3 = (watched.affiliations ?? []).filter((a) => a?.hospitalId).length + ' hospital(s) linked';
  const s4 = [watched.teleConsultation ? 'Tele-consult' : '', arr(watched.insuranceAccepted).join(', ')].filter(Boolean).join(' · ');
  const s5 = watched.dataConsent ? 'Consent given' : 'Pending consent';

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/doctors')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Doctor' : 'Add Doctor'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Update doctor profile.' : 'Onboard a new oncologist or specialist.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

        {/* Section 1 — Digital Identity */}
        <Section num={1} title="Digital Identity" summary={s1 || 'Name, HPR ID, registration'} open={openSection === 1} onToggle={() => toggle(1)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name *</Label>
              <Input {...register('name')} required minLength={2} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>HPR ID</Label>
              <Input {...register('hprId')} placeholder="dr.name@hpr" maxLength={60} />
            </div>
            <div className="space-y-1.5">
              <Label>Registration Number</Label>
              <Input {...register('registrationNumber')} placeholder="Medical Council Reg. No." maxLength={60} />
            </div>
            <div className="space-y-1.5">
              <Label>State Medical Council</Label>
              <select
                {...register('stateMedicalCouncil')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">— select —</option>
                {STATE_COUNCILS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input {...register('phone')} placeholder="+91XXXXXXXXXX" maxLength={16} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input {...register('email')} type="email" />
            </div>
          </div>
        </Section>

        {/* Section 2 — Clinical Expertise */}
        <Section num={2} title="Clinical Expertise" summary={s2 || 'Specialty, DMGs, experience'} open={openSection === 2} onToggle={() => toggle(2)}>
          <div className="space-y-1.5">
            <Label>Primary Specialty</Label>
            <div className="flex flex-col gap-2 pt-1">
              {SPECIALTIES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" value={s} {...register('primarySpecialty')} className="h-4 w-4 border-input accent-primary" />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <CheckboxGroup label="Disease Management Groups (DMGs)" options={DMGS} name="dmgs" register={register} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Years of Experience in Oncology</Label>
              <Input {...register('yearsOfExperience')} type="number" min={0} max={60} placeholder="0" className="w-28" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Key Procedures / Treatments (comma-separated)</Label>
            <Input {...register('keyProcedures')} placeholder="Bone Marrow Transplant, Robotic Surgery, Immunotherapy" />
          </div>
        </Section>

        {/* Section 3 — Hospital Affiliations */}
        <Section num={3} title="Hospital Affiliations" summary={s3} open={openSection === 3} onToggle={() => toggle(3)}>
          <AffiliationBlock index={0} label="Affiliation 1 — Primary" hospitals={hospitals} register={register} />
          <AffiliationBlock index={1} label="Affiliation 2 — Secondary / Clinic" hospitals={hospitals} register={register} />
        </Section>

        {/* Section 4 — Patient Support */}
        <Section num={4} title="Patient Support & Accessibility" summary={s4 || 'Tele-consult, insurance'} open={openSection === 4} onToggle={() => toggle(4)}>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('teleConsultation')} className="h-4 w-4 rounded border-input accent-primary" />
            Tele-Consultation Available
          </label>
          {/* Insurance / Schemes Accepted — not needed per client
          <CheckboxGroup label="Insurance / Schemes Accepted" options={INSURANCE} name="insuranceAccepted" register={register} />
          */}
        </Section>

        {/* Section 5 — Consent */}
        <Section num={5} title="Assignment & Privacy Consent" summary={s5} open={openSection === 5} onToggle={() => toggle(5)}>
          <label className="flex items-start gap-3 text-sm cursor-pointer">
            <input type="checkbox" {...register('dataConsent')} className="mt-0.5 h-4 w-4 rounded border-input accent-primary" />
            <span className="text-muted-foreground leading-relaxed">
              I agree to be listed in the directory and understand that patients can request to share their
              treatment records with my profile based on ABDM consent protocols.
            </span>
          </label>
        </Section>

        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/doctors')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Doctor'}
          </Button>
        </div>
      </form>
    </div>
  );
}
