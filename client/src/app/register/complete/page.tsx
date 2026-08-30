"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { profileApi, authApi, ApiError, type UserProfile, type PatientStep1Body, type PatientStep2Body } from "@/lib/api";

const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar","Akola","Amravati","Aurangabad","Beed","Bhandara","Buldhana","Chandrapur",
  "Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City",
  "Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Osmanabad","Palghar","Parbhani",
  "Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha",
  "Washim","Yavatmal",
];

const BLOOD_GROUPS = ["A+","A−","B+","B−","AB+","AB−","O+","O−","Don't know"];
const GENDERS      = ["MALE","FEMALE","OTHER","PREFER_NOT_TO_SAY"] as const;

type Step = 1 | 2 | "done";

export default function RegisterCompletePage() {
  const router = useRouter();

  const [profile, setProfile]         = useState<UserProfile | null>(null);
  const [step, setStep]               = useState<Step>(1);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Step 1 fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender]           = useState<string>("");
  const [village, setVillage]         = useState("");
  const [district, setDistrict]       = useState("Pune");
  const [pincode, setPincode]         = useState("");
  const [abhaId, setAbhaId]           = useState("");
  const [bloodGroup, setBloodGroup]   = useState("");
  const [ecName, setEcName]           = useState("");
  const [ecPhone, setEcPhone]         = useState("");

  // Step 2 fields
  const [allergies, setAllergies]                   = useState("");
  const [chronicConditions, setChronicConditions]   = useState("");
  const [currentMedications, setCurrentMedications] = useState("");
  const [notes, setNotes]                           = useState("");

  // Load current user profile to check progress
  useEffect(() => {
    authApi.me()
      .then((res) => {
        setProfile(res.data);
        const regStep = res.data.registrationProgress?.currentStep;
        if (regStep === "PROFILE_STEP_1") {
          setStep(2);
        } else {
          setStep(1);
        }
        // Pre-fill from existing patient data
        if (res.data.patient) {
          const p = res.data.patient;
          if (p.dateOfBirth) setDateOfBirth(p.dateOfBirth.split("T")[0]);
          if (p.gender)      setGender(p.gender);
          if (p.village)     setVillage(p.village);
          if (p.district)    setDistrict(p.district);
          if (p.pincode)     setPincode(p.pincode);
          if (p.abhaId)      setAbhaId(p.abhaId);
          if (p.bloodGroup)  setBloodGroup(p.bloodGroup);
          if (p.emergencyContactName)  setEcName(p.emergencyContactName);
          if (p.emergencyContactPhone) setEcPhone(p.emergencyContactPhone);
          if (p.medicalHistory) {
            setAllergies(p.medicalHistory.allergies.join(", "));
            setChronicConditions(p.medicalHistory.chronicConditions.join(", "));
            setCurrentMedications(p.medicalHistory.currentMedications.join(", "));
            setNotes(p.medicalHistory.notes ?? "");
          }
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSaving(true);
    const body: PatientStep1Body = {
      dateOfBirth: dateOfBirth ? dateOfBirth : undefined,
      gender: gender || undefined,
      village: village.trim() || undefined,
      district: district || undefined,
      pincode: pincode.trim() || undefined,
      abhaId: abhaId.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      emergencyContactName: ecName.trim() || undefined,
      emergencyContactPhone: ecPhone.trim() || undefined,
    };
    try {
      await profileApi.step1(body);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save details. Please try again.");
    } finally { setSaving(false); }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSaving(true);
    const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
    const body: PatientStep2Body = {
      allergies: split(allergies),
      chronicConditions: split(chronicConditions),
      currentMedications: split(currentMedications),
      notes: notes.trim() || undefined,
    };
    try {
      await profileApi.step2(body);
      setStep("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save medical history. Please try again.");
    } finally { setSaving(false); }
  };

  const handleSkipStep2 = async () => {
    setError(null); setSaving(true);
    try {
      await profileApi.step2({});
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0E4A43] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stepNum = step === "done" ? 3 : step;

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: "var(--font-quicksand, 'Quicksand', sans-serif)" }}>
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0E4A43] flex items-center justify-center text-[#E5F973]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 leading-none block">Swasthya Sahayak</span>
            <span className="text-[10px] font-semibold text-[#0E4A43] tracking-wide uppercase">Health Profile Setup</span>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Welcome, <strong className="text-slate-800">{profile?.fullName}</strong>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Progress Stepper */}
        <div className="flex items-center gap-0">
          {[{n:1,label:"Demographics"},{n:2,label:"Medical History"},{n:3,label:"Complete"}].map(({ n, label }, i) => (
            <div key={n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  stepNum > n ? "bg-[#0E4A43] text-white" :
                  stepNum === n ? "bg-[#E5F973] text-slate-950 ring-2 ring-[#0E4A43]/30" :
                  "bg-slate-200 text-slate-500"
                }`}>
                  {stepNum > n ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : n}
                </div>
                <span className={`text-[10px] font-semibold ${stepNum === n ? "text-[#0E4A43]" : "text-slate-400"}`}>{label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-5 ${stepNum > n ? "bg-[#0E4A43]" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* Step 1 — Demographics */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="bg-[#EFF2F5] rounded-[32px] p-8 space-y-5 border border-slate-200/50">
            <div>
              <h2 className="text-xl font-black text-slate-900">Step 1: Personal Details</h2>
              <p className="text-xs text-slate-600 mt-0.5">This helps doctors provide better, contextualised care. All fields are optional.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Date of Birth</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all">
                  <option value="">Select</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g.replace(/_/g," ")}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Village / Locality</label>
                <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="e.g. Ambegaon"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">District</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all">
                  {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Pincode</label>
                <input type="text" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))} placeholder="e.g. 411001"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Blood Group</label>
                <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">ABHA Health ID (Optional)</label>
              <input type="text" value={abhaId} onChange={(e) => setAbhaId(e.target.value)} placeholder="14-digit ABHA Number"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Emergency Contact Name</label>
                <input type="text" value={ecName} onChange={(e) => setEcName(e.target.value)} placeholder="Name"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Emergency Contact Phone</label>
                <input type="tel" maxLength={10} value={ecPhone} onChange={(e) => setEcPhone(e.target.value.replace(/\D/g,""))} placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Save &amp; Continue</span><span className="text-base">&rsaquo;</span></>}
              </button>
              <button type="button" onClick={() => setStep(2)}
                className="px-5 py-3.5 rounded-full text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-400 transition-all"
              >
                Skip for now
              </button>
            </div>
          </form>
        )}

        {/* Step 2 — Medical History */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="bg-[#EFF2F5] rounded-[32px] p-8 space-y-5 border border-slate-200/50">
            <div>
              <h2 className="text-xl font-black text-slate-900">Step 2: Medical History</h2>
              <p className="text-xs text-slate-600 mt-0.5">Enter comma-separated values for each field. All fields are optional but help your doctor give better care.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Known Allergies</label>
                <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Peanuts, Dust"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Chronic Conditions</label>
                <input type="text" value={chronicConditions} onChange={(e) => setChronicConditions(e.target.value)} placeholder="e.g. Hypertension, Diabetes Type 2"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Current Medications</label>
                <input type="text" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} placeholder="e.g. Metformin 500mg, Amlodipine"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Additional Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any other relevant medical information..." rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0E4A43]/20 focus:border-[#0E4A43] transition-all resize-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-3.5 rounded-full text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-400 transition-all">
                ← Back
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Complete Profile</span><span className="text-base">&rsaquo;</span></>}
              </button>
              <button type="button" onClick={handleSkipStep2} disabled={saving}
                className="px-5 py-3.5 rounded-full text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-slate-400 transition-all disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </form>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="bg-[#EFF2F5] rounded-[32px] p-10 border border-slate-200/50 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F973] text-[#0E4A43] mx-auto flex items-center justify-center shadow-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Profile Complete!</h2>
              <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
                Your health account is ready. Access your personalised dashboard to book appointments, track referrals, and manage your health records.
              </p>
            </div>
            <button onClick={() => router.push("/dashboard")}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold text-white bg-[#0E4A43] hover:bg-[#083530] transition-all shadow-sm active:scale-95"
            >
              <span>Go to My Dashboard</span>
              <span className="text-base">&rsaquo;</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
