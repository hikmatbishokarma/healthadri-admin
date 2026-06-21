import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

type FormValues = {
  name: string;
  city: string;
  address: string;
  landmark: string;
  type: string;
  facilityType: string;
  hfrId: string;
  accreditations: string[];
  hasDedicatedOncologyWing: boolean;
  chemoBedsCount: number;
  coldCapTherapy: boolean;
  radiotherapy: string[];
  diagnostics: string[];
  dmgs: string[];
  supportiveCare: string[];
  latitude: string;
  longitude: string;
  emergencyServices: string[];
  opdContact: string;
  emergencyContact: string;
  whatsappContact: string;
  patientNavigatorName: string;
  govtSchemes: string[];
  privateInsurance: string;
};

const ACCREDITATIONS    = ['NABH', 'JCI', 'NCG Member'];
const RADIOTHERAPY      = ['LINAC', 'Brachytherapy', 'CyberKnife / Gamma Knife'];
const DIAGNOSTICS       = ['PET-CT Scan', '3T MRI', 'IHC Lab', 'Digital Mammography'];
const DMGS              = ['Hematology', 'Solid Tumors', 'Pediatric Oncology', 'BMT Unit'];
const SUPPORTIVE_CARE   = ['Onco-Nutritionist', 'Pain & Palliative Care', 'Oncology Nursing Staff'];
const EMERGENCY_SERVICES= ['24/7 Oncology ER', 'Dedicated Oncology Ambulance'];
const GOVT_SCHEMES      = ['PM-JAY', 'Aarogyasri', 'CGHS', 'ECHS'];

// ── Accordion ────────────────────────────────────────────────────────────────

function Section({
  num,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  num: number;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
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
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
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
  label,
  options,
  name,
  register,
}: {
  label: string;
  options: string[];
  name: keyof FormValues;
  register: ReturnType<typeof useForm<FormValues>>['register'];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              value={opt}
              {...register(name)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function HospitalFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Section 1 open by default; only one section open at a time
  const [openSection, setOpenSection] = useState<number | null>(1);

  const toggle = (n: number) =>
    setOpenSection((prev) => (prev === n ? null : n));

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      type: 'private',
      facilityType: 'Tertiary Care Hospital',
      accreditations: [],
      radiotherapy: [],
      diagnostics: [],
      dmgs: [],
      supportiveCare: [],
      emergencyServices: [],
      govtSchemes: [],
    },
  });

  // Watch values for accordion summary lines
  const watched = useWatch({ control });

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/hospitals/${id}`).then((res) => {
      const h = res.data;
      reset({
        name: h.name ?? '',
        city: h.city ?? '',
        address: h.address ?? '',
        landmark: h.landmark ?? '',
        type: h.type ?? 'private',
        facilityType: h.facilityType ?? 'Tertiary Care Hospital',
        hfrId: h.hfrId ?? '',
        accreditations: h.accreditations ?? [],
        hasDedicatedOncologyWing: h.hasDedicatedOncologyWing ?? false,
        chemoBedsCount: h.chemoBedsCount ?? 0,
        coldCapTherapy: h.coldCapTherapy ?? false,
        radiotherapy: h.radiotherapy ?? [],
        diagnostics: h.diagnostics ?? [],
        dmgs: h.dmgs ?? [],
        supportiveCare: h.supportiveCare ?? [],
        latitude: h.latitude?.toString() ?? '',
        longitude: h.longitude?.toString() ?? '',
        emergencyServices: h.emergencyServices ?? [],
        opdContact: h.opdContact ?? '',
        emergencyContact: h.emergencyContact ?? '',
        whatsappContact: h.whatsappContact ?? '',
        patientNavigatorName: h.patientNavigatorName ?? '',
        govtSchemes: h.govtSchemes ?? [],
        privateInsurance: (h.privateInsurance ?? []).join(', '),
      });
    });
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      ...data,
      chemoBedsCount: Number(data.chemoBedsCount) || 0,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      privateInsurance: data.privateInsurance
        ? data.privateInsurance.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };
    if (isEdit) {
      await api.patch(`/hospitals/${id}`, payload);
    } else {
      await api.post('/hospitals', payload);
    }
    navigate('/admin/hospitals');
  };

  // Summary helpers
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  const s1 = [watched.name, arr(watched.accreditations).join(', ')].filter(Boolean).join(' · ');
  const s2 = [
    arr(watched.radiotherapy).length ? `${arr(watched.radiotherapy).length} radiotherapy` : '',
    arr(watched.diagnostics).length ? `${arr(watched.diagnostics).length} diagnostics` : '',
    watched.chemoBedsCount ? `${watched.chemoBedsCount} chemo beds` : '',
  ].filter(Boolean).join(' · ');
  const s3 = [...arr(watched.dmgs), ...arr(watched.supportiveCare)].join(', ');
  const s4 = [watched.city, watched.address].filter(Boolean).join(', ');
  const s5 = [watched.opdContact, watched.emergencyContact].filter(Boolean).join(' · ');
  const s6 = arr(watched.govtSchemes).join(', ');

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/hospitals')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Hospital' : 'Add Hospital'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Update hospital information.' : 'Onboard a new hospital or cancer centre.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

        {/* Section 1 — Identity */}
        <Section num={1} title="National Health Identity" summary={s1 || 'Name, HFR ID, accreditations'} open={openSection ===(1)} onToggle={() => toggle(1)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Official Facility Name *</Label>
              <Input {...register('name')} required minLength={2} maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>HFR ID</Label>
              <Input {...register('hfrId')} placeholder="e.g. IN12345678" maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label>Facility Type</Label>
              <select
                {...register('facilityType')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option>Tertiary Care Hospital</option>
                <option>Daycare Centre</option>
                <option>Diagnostic Lab</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Ownership Type</Label>
              <select
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="private">Private</option>
                <option value="government">Government</option>
                <option value="trust">Trust</option>
              </select>
            </div>
          </div>
          <CheckboxGroup label="Accreditations" options={ACCREDITATIONS} name="accreditations" register={register} />
        </Section>

        {/* Section 2 — Oncology Infrastructure */}
        <Section num={2} title="Oncology Infrastructure" summary={s2 || 'Beds, radiotherapy, diagnostics'} open={openSection ===(2)} onToggle={() => toggle(2)}>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('hasDedicatedOncologyWing')} className="h-4 w-4 rounded border-input accent-primary" />
              Dedicated Oncology Wing
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('coldCapTherapy')} className="h-4 w-4 rounded border-input accent-primary" />
              Cold-Cap Therapy Available
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Chemotherapy Daycare Beds</Label>
            <Input {...register('chemoBedsCount')} type="number" min={0} className="w-32" placeholder="0" />
          </div>
          <CheckboxGroup label="Radiotherapy Units" options={RADIOTHERAPY} name="radiotherapy" register={register} />
          <CheckboxGroup label="Diagnostic Capabilities (In-house)" options={DIAGNOSTICS} name="diagnostics" register={register} />
        </Section>

        {/* Section 3 — Clinical Specializations */}
        <Section num={3} title="Clinical Specializations" summary={s3 || 'DMGs, supportive care'} open={openSection ===(3)} onToggle={() => toggle(3)}>
          <CheckboxGroup label="Disease Management Groups (DMGs)" options={DMGS} name="dmgs" register={register} />
          <CheckboxGroup label="Supportive Care Team" options={SUPPORTIVE_CARE} name="supportiveCare" register={register} />
        </Section>

        {/* Section 4 — Location */}
        <Section num={4} title="Location & Logistics" summary={s4 || 'Address, GPS coordinates'} open={openSection ===(4)} onToggle={() => toggle(4)}>
          <div className="space-y-1.5">
            <Label>City *</Label>
            <Input {...register('city')} required minLength={2} maxLength={80} />
          </div>
          <div className="space-y-1.5">
            <Label>Full Address</Label>
            <Input {...register('address')} maxLength={300} />
          </div>
          <div className="space-y-1.5">
            <Label>Landmark</Label>
            <Input {...register('landmark')} placeholder="e.g. Near Kukatpally Metro Station" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input {...register('latitude')} placeholder="17.3850" />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input {...register('longitude')} placeholder="78.4867" />
            </div>
          </div>
          <CheckboxGroup label="Emergency Services" options={EMERGENCY_SERVICES} name="emergencyServices" register={register} />
        </Section>

        {/* Section 5 — Contact */}
        <Section num={5} title="Contact & Appointment Desk" summary={s5 || 'OPD, emergency, WhatsApp'} open={openSection ===(5)} onToggle={() => toggle(5)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Oncology OPD Contact</Label>
              <Input {...register('opdContact')} placeholder="+91XXXXXXXXXX" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>Emergency Contact (24/7)</Label>
              <Input {...register('emergencyContact')} placeholder="+91XXXXXXXXXX" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp for Reports</Label>
              <Input {...register('whatsappContact')} placeholder="+91XXXXXXXXXX" maxLength={20} />
            </div>
            <div className="space-y-1.5">
              <Label>Patient Navigator / Counselor Name</Label>
              <Input {...register('patientNavigatorName')} maxLength={100} />
            </div>
          </div>
        </Section>

        {/* Section 6 — Financials */}
        <Section num={6} title="Financials & Schemes" summary={s6 || 'Govt schemes, private insurance'} open={openSection ===(6)} onToggle={() => toggle(6)}>
          <CheckboxGroup label="Government Schemes Accepted" options={GOVT_SCHEMES} name="govtSchemes" register={register} />
          <div className="space-y-1.5">
            <Label>Private Insurance / TPAs (comma-separated)</Label>
            <Input {...register('privateInsurance')} placeholder="Star Health, HDFC Ergo, Medi Assist" />
          </div>
        </Section>

        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/hospitals')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Hospital'}
          </Button>
        </div>
      </form>
    </div>
  );
}
