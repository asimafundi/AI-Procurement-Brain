import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { analyzeProjectWithAI } from "./aiService";

const SmartIntakeForm = () => {

  // =========================
  // STATE
  // =========================
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    city: "",
    businessType: "",
    projectTypes: [],
    projectStatus: "",
    projectGoal: "",
    deadline: "",
    area: "",
    floors: "",
    buildingStatus: "",
    existingInfra: [],
    ceilingType: "",
    ceilingHeight: "",
    drillingRestrictions: "",
    serverRoom: "",
    employees: "",
    securityLevel: 3,
    googleMapsLink: "",
    planFile: null,
    walkthroughVideo: null,
    budget: "",
    aiReport: ""
  });

  // =========================
  // HANDLERS
  // =========================
  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key, value) => {
    setFormData(prev => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter(v => v !== value)
          : [...prev[key], value]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const result = await analyzeProjectWithAI(formData);

      setFormData(prev => ({
        ...prev,
        aiReport: result?.message || JSON.stringify(result)
      }));

      setSubmitted(true);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // WELCOME SCREEN
  // =========================
  if (step === 0) {
    return (
      <div>
        <h1>Welcome Screen</h1>
        <button onClick={() => setStep(1)}>ابدأ</button>
      </div>
    );
  }

  // =========================
  // SUBMITTED SCREEN
  // =========================
  if (submitted) {
    return (
      <div>
        <h1>تم الإرسال بنجاح ✅</h1>
        <pre>{formData.aiReport}</pre>
      </div>
    );
  }

  // =========================
  // MAIN FORM
  // =========================
  return (
    <div>
      <h2>Smart Intake Form</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>

        {/* مثال حقل */}
        <input
          placeholder="اسم الشركة"
          value={formData.companyName}
          onChange={(e) => handleInputChange("companyName", e.target.value)}
        />

        {/* زر إرسال */}
        <button type="submit" disabled={loading}>
          {loading ? "جاري الإرسال..." : "إرسال"}
        </button>

      </form>
    </div>
  );
};

export default SmartIntakeForm;