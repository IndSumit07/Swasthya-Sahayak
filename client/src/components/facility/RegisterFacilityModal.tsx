"use client";

import { useState } from "react";
import { facilitiesApi, type FacilityType } from "@/lib/api";
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Bed,
  Stethoscope,
  FlaskConical,
  Pill,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

interface RegisterFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDistrict?: string;
}

const MAHARASHTRA_DISTRICTS = [
  "Pune", "Nashik", "Satara", "Ahmednagar", "Nagpur", "Amravati",
  "Aurangabad", "Kolhapur", "Solapur", "Thane", "Mumbai City", "Mumbai Suburban", "Mathura"
];

const STANDARD_SERVICES = [
  "General Consultation",
  "Specialist Consultation",
  "Maternal Care",
  "Child Healthcare",
  "Diagnostics",
  "Pharmacy",
  "Emergency Services",
  "Vaccination",
  "Chronic Disease Care",
];

export function RegisterFacilityModal({
  isOpen,
  onClose,
  onSuccess,
  initialDistrict = "Pune",
}: RegisterFacilityModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<FacilityType>("PHC");
  const [district, setDistrict] = useState(initialDistrict);
  const [village, setVillage] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [lat, setLat] = useState<number | "">("");
  const [lng, setLng] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workingHours, setWorkingHours] = useState("24x7 Emergency / 09:00 - 17:00 OPD");

  // Services multi-select
  const [selectedServices, setSelectedServices] = useState<string[]>([
    "General Consultation",
    "Maternal Care",
    "Emergency Services",
    "Vaccination",
  ]);

  // Bed matrix
  const [totalBeds, setTotalBeds] = useState(20);
  const [availableBeds, setAvailableBeds] = useState(12);
  const [oxygenTotal, setOxygenTotal] = useState(5);
  const [oxygenAvailable, setOxygenAvailable] = useState(3);
  const [icuTotal, setIcuTotal] = useState(2);
  const [icuAvailable, setIcuAvailable] = useState(1);

  // Initial medicines & diagnostics
  const [includeDefaultMeds, setIncludeDefaultMeds] = useState(true);
  const [includeDefaultDiags, setIncludeDefaultDiags] = useState(true);

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Math.round(pos.coords.latitude * 10000) / 10000);
        setLng(Math.round(pos.coords.longitude * 10000) / 10000);
        setLocating(false);
      },
      () => {
        setLat(18.5204);
        setLng(73.8567);
        setLocating(false);
      }
    );
  };

  const toggleService = (srv: string) => {
    setSelectedServices((prev) =>
      prev.includes(srv) ? prev.filter((s) => s !== srv) : [...prev, srv]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Facility name is required.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    try {
      const initialMeds = includeDefaultMeds
        ? [
            { medicineName: "Paracetamol 500mg", category: "Analgesic", quantity: 500, unit: "tablets", stockThreshold: 50, isAvailable: true },
            { medicineName: "Amoxicillin 250mg", category: "Antibiotic", quantity: 300, unit: "capsules", stockThreshold: 30, isAvailable: true },
            { medicineName: "ORS Sachets", category: "Rehydration", quantity: 200, unit: "packets", stockThreshold: 25, isAvailable: true },
            { medicineName: "Iron & Folic Acid", category: "Maternal Supplement", quantity: 400, unit: "tablets", stockThreshold: 50, isAvailable: true },
          ]
        : undefined;

      const initialDiags = includeDefaultDiags
        ? [
            { testName: "Complete Blood Count (CBC)", category: "Pathology", isAvailable: true, turnaroundHours: 4, costInr: 0 },
            { testName: "Blood Glucose Fasting", category: "Biochemistry", isAvailable: true, turnaroundHours: 2, costInr: 0 },
            { testName: "X-Ray Chest", category: "Radiology", isAvailable: type !== "PHARMACY", turnaroundHours: 24, costInr: 0 },
            { testName: "Malaria Antigen Rapid", category: "Serology", isAvailable: true, turnaroundHours: 1, costInr: 0 },
          ]
        : undefined;

      const initialSlots = [
        { slotName: "Morning OPD Slot (09:00 - 11:30)", startTime: "09:00", endTime: "11:30", maxCapacity: 25, isAvailable: true },
        { slotName: "Afternoon OPD Slot (14:00 - 16:30)", startTime: "14:00", endTime: "16:30", maxCapacity: 20, isAvailable: true },
      ];

      await facilitiesApi.create({
        name: name.trim(),
        type,
        district: district.trim(),
        village: village.trim() || undefined,
        address: address.trim() || undefined,
        pincode: pincode.trim() || undefined,
        latitude: lat !== "" ? Number(lat) : undefined,
        longitude: lng !== "" ? Number(lng) : undefined,
        contactPhone: phone.trim() || undefined,
        contactEmail: email.trim() || undefined,
        workingHours: workingHours.trim() || undefined,
        services: selectedServices,
        totalBeds: Number(totalBeds),
        availableBeds: Number(availableBeds),
        oxygenBedsTotal: Number(oxygenTotal),
        oxygenBedsAvailable: Number(oxygenAvailable),
        icuBedsTotal: Number(icuTotal),
        icuBedsAvailable: Number(icuAvailable),
        medicines: initialMeds,
        diagnostics: initialDiags,
        slots: initialSlots,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register facility.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>FR-05 Institutional Registration</span>
            </div>
            <h3 className="text-xl font-black text-slate-900">Register Healthcare Facility</h3>
            <p className="text-xs text-slate-500">Add institutional metadata, beds, services, medicines, and diagnostics to live directory</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Classification & Name */}
          <div className="space-y-3">
            <div className="font-black text-slate-900 uppercase text-[11px]">1. Facility Classification &amp; Identity</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Primary Health Centre (PHC) Mathura"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Institutional Type (FR-05) *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FacilityType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  <option value="PHC">PHC (Primary Health Centre)</option>
                  <option value="CHC">CHC (Community Health Centre)</option>
                  <option value="RURAL_HOSPITAL">Rural Hospital</option>
                  <option value="DISTRICT_HOSPITAL">District Hospital</option>
                  <option value="DIAGNOSTIC_CENTER">Diagnostic Center</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="SUB_CENTRE">Sub Centre</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Contact Details */}
          <div className="space-y-3">
            <div className="font-black text-slate-900 uppercase text-[11px]">2. Location &amp; Contact Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                >
                  {MAHARASHTRA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Village / Taluka</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Manchar, Haveli"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 410503"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Postal Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. State Highway 50, Near Panchayat Bhavan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">GPS Coordinates (FR-08 Proximity)</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locating}
                    className="text-[#0E4A43] hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{locating ? "Acquiring..." : "Auto-Fill GPS"}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Latitude (e.g. 18.5204)"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value ? Number(e.target.value) : "")}
                    placeholder="Longitude (e.g. 73.8567)"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hotline / Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 020-2567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="phc.mathura@swasthya.gov.in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Working Hours</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  placeholder="24x7 Emergency / 09:00 - 17:00 OPD"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Clinical Services (FR-06) */}
          <div className="space-y-2">
            <div className="font-black text-slate-900 uppercase text-[11px]">3. Available Clinical Services (FR-06)</div>
            <p className="text-slate-500 text-[11px]">Select all medical disciplines available at this facility for patient directory search</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STANDARD_SERVICES.map((srv) => {
                const isSelected = selectedServices.includes(srv);
                return (
                  <label
                    key={srv}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      isSelected ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-black" : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleService(srv)}
                      className="w-4 h-4 rounded-sm text-[#0E4A43] focus:ring-[#0E4A43]"
                    />
                    <span className="truncate">{srv}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Bed Availability (FR-05 / FR-07) */}
          <div className="space-y-3">
            <div className="font-black text-slate-900 uppercase text-[11px]">4. Inpatient &amp; Critical Care Beds</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-emerald-700" />
                  <span>General Ward</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Total</span>
                    <input
                      type="number"
                      min="0"
                      value={totalBeds}
                      onChange={(e) => setTotalBeds(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Available</span>
                    <input
                      type="number"
                      min="0"
                      value={availableBeds}
                      onChange={(e) => setAvailableBeds(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-sky-700" />
                  <span>Oxygen Beds</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Total</span>
                    <input
                      type="number"
                      min="0"
                      value={oxygenTotal}
                      onChange={(e) => setOxygenTotal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Available</span>
                    <input
                      type="number"
                      min="0"
                      value={oxygenAvailable}
                      onChange={(e) => setOxygenAvailable(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="font-bold text-slate-700 flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-purple-700" />
                  <span>ICU Ventilator</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Total</span>
                    <input
                      type="number"
                      min="0"
                      value={icuTotal}
                      onChange={(e) => setIcuTotal(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Available</span>
                    <input
                      type="number"
                      min="0"
                      value={icuAvailable}
                      onChange={(e) => setIcuAvailable(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Drug & Diagnostic Provisions */}
          <div className="space-y-2">
            <div className="font-black text-slate-900 uppercase text-[11px]">5. Initial Resource Inventory Provisions</div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDefaultMeds}
                  onChange={(e) => setIncludeDefaultMeds(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-[#0E4A43]"
                />
                <span>Seed Essential Medicines (Paracetamol, Amoxicillin, ORS, IFA)</span>
              </label>

              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDefaultDiags}
                  onChange={(e) => setIncludeDefaultDiags(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-[#0E4A43]"
                />
                <span>Seed Core Diagnostics (CBC, Blood Sugar, X-Ray Chest, Malaria)</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-2.5 rounded-xl bg-[#0E4A43] text-white font-black hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#E5F973]" />
              <span>{loading ? "Registering in PostgreSQL..." : "Complete Registration"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
