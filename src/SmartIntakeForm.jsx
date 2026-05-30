import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { analyzeProjectWithAI } from './aiService';

export default function SmartIntakeForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
    businessType: '',
    projectTypes: [],
    projectStatus: '',
    projectGoal: '',
    deadline: '',
    area: '',
    floors: '',
    buildingStatus: '',
    existingInfra: [],
    ceilingType: '',
    ceilingHeight: '',
    drillingRestrictions: '',
    serverRoom: '',
    employees: '',
    securityLevel: '',
    cameraDetails: {},
    wifiDetails: {},
    accessDetails: {},
    planFile: null,
    walkthroughVideo: null,
    googleMapsLink: '',
    budget: '',
  });

  const steps = [
    { title: 'الترحيب', icon: '🎯' },
    { title: 'معلومات العميل', icon: '👤' },
    { title: 'نوع المشروع', icon: '🏗️' },
    { title: 'تفاصيل الموقع', icon: '📍' },
    { title: 'أسئلة إضافية', icon: '💡' },
    { title: 'رفع الملفات', icon: '📁' },
    { title: 'الميزانية', icon: '💰' },
  ];

  const cities = ['جدة', 'الرياض', 'مكة', 'المدينة', 'الدمام', 'الخبر', 'الجبيل', 'أبها', 'أخرى'];
  const businessTypes = ['مستودع', 'مصنع', 'مكتب', 'شركة متعددة الفروع', 'مدرسة', 'جامعة', 'مستشفى', 'مركز طبي', 'مجمع تجاري', 'متجر', 'فندق', 'جمعية غير ربحية', 'أخرى'];
  const projectTypesList = ['كاميرات مراقبة (CCTV)', 'شبكة LAN', 'Wi-Fi', 'نظام دخول (Access Control)', 'بصمة حضور وانصراف', 'غرفة سيرفرات', 'Data Center', 'سنترال واتصالات', 'شاشات واجتماعات', 'Cybersecurity', 'أخرى'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleFileChange = (field, file) => {
    if (file && file.size <= 10485760) {
      setFormData(prev => ({ ...prev, [field]: file }));
    } else {
      setError('حجم الملف يجب أن يكون أقل من 10 MB');
    }
  };

  const handleVideoChange = (file) => {
    if (file && file.size <= 104857600) {
      setFormData(prev => ({ ...prev, walkthroughVideo: file }));
    } else {
      setError('حجم الفيديو يجب أن يكون أقل من 100 MB');
    }
  };

  const validateStep = () => {
    if (step === 1) {
      return formData.companyName && formData.contactName && formData.phone && formData.email && formData.city && formData.businessType;
    }
    if (step === 2) {
      return formData.projectTypes.length > 0 && formData.projectStatus && formData.projectGoal && formData.deadline;
    }
    if (step === 3) {
      return formData.area && formData.floors && formData.buildingStatus && formData.ceilingType && formData.ceilingHeight && formData.drillingRestrictions && formData.serverRoom && formData.employees && formData.securityLevel;
    }
    if (step === 5) {
      return formData.googleMapsLink;
    }
    return true;
  };

  const needsSiteSurvey = () => {
    return (parseInt(formData.area) > 3000 || parseInt(formData.ceilingHeight) > 6) && 
           !formData.planFile && 
           formData.existingInfra.length === 0 && 
           formData.businessType === 'مستودع';
  };

  // تحميل الملفات إلى Supabase Storage
  const uploadFiles = async () => {
    const uploadedFiles = {};

    if (formData.planFile) {
      const fileName = `plans/${Date.now()}_${formData.planFile.name}`;
      const { error } = await supabase.storage
        .from('intake-files')
        .upload(fileName, formData.planFile);
      
      if (error) throw error;
      uploadedFiles.planFile = fileName;
    }

    if (formData.walkthroughVideo) {
      const fileName = `videos/${Date.now()}_${formData.walkthroughVideo.name}`;
      const { error } = await supabase.storage
        .from('intake-files')
        .upload(fileName, formData.walkthroughVideo);
      
      if (error) throw error;
      uploadedFiles.walkthroughVideo = fileName;
    }

    return uploadedFiles;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateStep()) {
    setError('يرجى ملء جميع الحقول المطلوبة');
    return;
  }

  setLoading(true);
  setError(null);

  try {
    // تحضير البيانات
const dataToSend = {
  company_name: formData.companyName,
  contact_name: formData.contactName,
  phone: formData.phone,
  email: formData.email,
  city: formData.city,
  business_type: formData.businessType,
  project_types: formData.projectTypes.join(', '),
  project_status: formData.projectStatus,
  project_goal: formData.projectGoal,
  deadline: formData.deadline,
  area: parseInt(formData.area),
  floors: formData.floors,
  building_status: formData.buildingStatus,
  ceiling_type: formData.ceilingType,
  ceiling_height: formData.ceilingHeight,
  drilling_restrictions: formData.drillingRestrictions,
  server_room: formData.serverRoom,
  employees: parseInt(formData.employees),
  security_level: parseInt(formData.securityLevel),
  google_maps_link: formData.googleMapsLink,
  budget: formData.budget,
  site_survey_required: needsSiteSurvey(),
  status: 'pending',
  notes: ''
};

    // 1️⃣ حفظ البيانات في Supabase
    const { data, error: insertError } = await supabase
      .from('intakes')
      .insert([dataToSend])
      .select();

    if (insertError) throw insertError;

    // 2️⃣ تحليل المشروع بـ AI
    setLoading(true);
    const aiAnalysis = await analyzeProjectWithAI(dataToSend);
    
    // 3️⃣ حفظ التحليل في Supabase
    await supabase
      .from('intakes')
      .update({ ai_analysis: aiAnalysis })
      .eq('id', data[0].id);

    setLoading(false);
    setSubmitted(true);
    setFormData({...formData, aiReport: aiAnalysis}); // حفظ محلي للعرض

  } catch (err) {
    setError(err.message || 'حدث خطأ أثناء إرسال البيانات');
    setLoading(false);
    console.error('Error:', err);
  }
};

  // إرسال الإشعارات
  const sendNotifications = async (dataToSend) => {
    // إرسال بريد إلكتروني باستخدام Formspree (مثال)
    if (process.env.REACT_APP_FORMSPREE_ID) {
      await fetch(`https://api.formspree.io/f/${process.env.REACT_APP_FORMSPREE_ID}`, {
        method: 'POST',
        body: JSON.stringify({
          ...dataToSend,
          _subject: `طلب تقييم جديد من ${dataToSend.company_name}`
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // إرسال إشعار Slack (اختياري)
    if (process.env.REACT_APP_SLACK_WEBHOOK) {
      await fetch(process.env.REACT_APP_SLACK_WEBHOOK, {
        method: 'POST',
        body: JSON.stringify({
          text: `🎉 طلب تقييم جديد من ${dataToSend.company_name}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${dataToSend.company_name}*\n📞 ${dataToSend.phone}\n📧 ${dataToSend.email}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*المشروع:* ${dataToSend.project_types}\n*الموقع:* ${dataToSend.city}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: dataToSend.site_survey_required ? '⚠️ *يحتاج Site Survey*' : '✅ تقييم مباشر'
              }
            }
          ]
        })
      });
    }
  };

  // Welcome Screen
  if (step === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #E6F1FB 0%, #F0F7FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '600px',
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'bounce 1s ease-in-out infinite'
          }}>
            🎯
          </div>
          
          <h1 style={{
            fontSize: '36px',
            fontWeight: '600',
            color: '#042C53',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}>
            احصل على تقييم أولي لمشروعك التقني
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: '#185FA5',
            marginBottom: '32px',
            lineHeight: '1.8'
          }}>
            قبل شراء أي مشروع تقني، قم بتحليل احتياجك وتقليل المخاطر والمبالغات في عروض الموردين.
          </p>

          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '0.5px solid #85B7EB'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#5F5E5A',
              marginBottom: '16px'
            }}>
              ⏱️ المدة المستهدفة: <strong>4–6 دقائق</strong>
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              fontSize: '13px',
              color: '#888780'
            }}>
              <div>✅ تقييم شامل</div>
              <div>✅ Scope مبدئي</div>
              <div>✅ تقدير تكلفة</div>
              <div>✅ تحليل مخاطر</div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            style={{
              background: '#378ADD',
              color: '#fff',
              border: 'none',
              padding: '16px 48px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(55, 138, 221, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(55, 138, 221, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 4px 12px rgba(55, 138, 221, 0.3)';
            }}
          >
            ابدأ التقييم الآن
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  // Submitted Screen
  if (submitted) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #E6F1FB 0%, #F0F7FF 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        background: '#fff',
        borderRadius: '12px',
        padding: '48px 32px',
        textAlign: 'center',
        border: '2px solid #85B7EB',
        animation: 'slideUp 0.5s ease-out'
      }}>
        
        {/* التقرير الذكي */}
        {formData.aiReport && (
          <div style={{
            background: '#EAF3DE',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #97C459',
            maxHeight: '400px',
            overflowY: 'auto',
            textAlign: 'right'
          }}>
            <h3 style={{color: '#27500A', marginBottom: '12px'}}>
              📊 تقرير المستشار الذكي
            </h3>
            <div style={{
              fontSize: '14px',
              color: '#27500A',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {formData.aiReport}
            </div>
          </div>
        )}

        {/* رسالة الشكر */}
        <div style={{fontSize: '72px', marginBottom: '24px'}}>
          ✅
        </div>
        
        <h2 style={{
          fontSize: '28px',
          fontWeight: '600',
          color: '#042C53',
          marginBottom: '16px'
        }}>
          تم استلام طلبكم بنجاح!
        </h2>

        <p style={{
          fontSize: '16px',
          color: '#888780',
          marginBottom: '32px',
          lineHeight: '1.8'
        }}>
          شكراً لكم على الثقة. سيتم تحليل المشروع بعناية عالية وإرسال التقرير الكامل خلال 24–48 ساعة.
        </p>

        <div style={{
          background: '#EAF3DE',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px',
          border: '0.5px solid #97C459'
        }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#27500A',
            marginBottom: '12px'
          }}>
            ستتلقى:
          </h3>
          <div style={{
            fontSize: '13px',
            color: '#3B6D11',
            lineHeight: '1.8'
          }}>
            ✅ تقييم أولي شامل<br/>
            ✅ Scope مبدئي للمشروع<br/>
            ✅ تقدير تكلفة أولي<br/>
            ✅ تحليل المخاطر المحتملة<br/>
            ✅ توصية بشأن الحاجة لموقع سيرفي
          </div>
        </div>

        <p style={{
          fontSize: '13px',
          color: '#5F5E5A',
          marginBottom: '0'
        }}>
          سيتم الاتصال بكم على الرقم: <strong>{formData.phone}</strong><br/>
          أو عبر البريد: <strong>{formData.email}</strong>
        </p>
      </div>
    </div>
  );
}

  // Main Form Steps
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F7FF',
      padding: '32px 20px'
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        {/* Progress Bar */}
        <div style={{
          marginBottom: '32px'
        }}>
          <div style={{
            background: '#E6F1FB',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '6px'
          }}>
            <div style={{
              width: `${(step / 7) * 100}%`,
              background: '#378ADD',
              height: '100%',
              transition: 'width 0.3s ease'
            }}/>
          </div>
          <p style={{
            fontSize: '12px',
            color: '#5F5E5A',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            الخطوة {step} من 7
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#FCEBEB',
            border: '0.5px solid #F09595',
            color: '#501313',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Step Content */}
        <form onSubmit={handleSubmit} style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '32px',
          border: '0.5px solid #85B7EB',
          animation: 'fadeIn 0.3s ease'
        }}>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#042C53',
            marginBottom: '8px'
          }}>
            {steps[step].icon} {steps[step].title}
          </h2>
          
          <p style={{
            fontSize: '14px',
            color: '#888780',
            marginBottom: '24px'
          }}>
            {step === 1 && 'أخبرنا عن نفسك وعن منشأتك'}
            {step === 2 && 'حدد نوع المشروع والأهداف'}
            {step === 3 && 'تفاصيل الموقع والبنية التحتية'}
            {step === 4 && 'أسئلة تفصيلية حسب نوع مشروعك'}
            {step === 5 && 'ارفع المخططات والصور والفيديو'}
            {step === 6 && 'ما الميزانية المتوقعة؟'}
          </p>

          {/* Step 1: معلومات العميل */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>اسم المنشأة *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="مثال: شركة الأمن والمراقبة"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>اسم الشخص المسؤول *</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="اسمك الكامل"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>رقم الجوال *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+966 XX XXX XXXX"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>المدينة *</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر المدينة</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>نوع المنشأة *</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر النوع</option>
                  {businessTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: نوع المشروع */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '12px' }}>ما نوع المشروع المطلوب؟ *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {projectTypesList.map(type => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={formData.projectTypes.includes(type)}
                        onChange={(e) => handleCheckboxChange('projectTypes', type)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>هل المشروع جديد أم تطوير؟ *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {['جديد بالكامل', 'توسعة', 'استبدال نظام قديم', 'صيانة وتحسين'].map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="radio"
                        name="projectStatus"
                        value={option}
                        checked={formData.projectStatus === option}
                        onChange={(e) => handleInputChange('projectStatus', e.target.value)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>ما الهدف الرئيسي للمشروع؟ *</label>
                <textarea
                  value={formData.projectGoal}
                  onChange={(e) => handleInputChange('projectGoal', e.target.value)}
                  placeholder="مثال: تحسين التغطية، رفع مستوى الأمان، تغطية مستودع بالكامل..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>هل يوجد موعد مستهدف للتنفيذ؟ *</label>
                <select
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر الموعد</option>
                  <option value="خلال شهر">خلال شهر</option>
                  <option value="1–3 أشهر">1–3 أشهر</option>
                  <option value="3–6 أشهر">3–6 أشهر</option>
                  <option value="لا يوجد موعد محدد">لا يوجد موعد محدد</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: تفاصيل الموقع */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>المساحة التقريبية للموقع (م²) *</label>
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="مثال: 2500"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>عدد الطوابق *</label>
                <select
                  value={formData.floors}
                  onChange={(e) => handleInputChange('floors', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر عدد الطوابق</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4+">4+</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>هل المبنى قائم أم تحت الإنشاء؟ *</label>
                <select
                  value={formData.buildingStatus}
                  onChange={(e) => handleInputChange('buildingStatus', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر الحالة</option>
                  <option value="قائم">قائم</option>
                  <option value="تحت الإنشاء">تحت الإنشاء</option>
                  <option value="تجديد">تجديد</option>
                </select>
              </div>

              {formData.buildingStatus === 'قائم' && (
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>هل توجد بنية تحتية تقنية حالية؟</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {['تمديدات شبكة', 'كاميرات', 'راك/غرفة سيرفر', 'نقاط كهرباء جاهزة', 'لا يوجد'].map(option => (
                      <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px' }}>
                        <input
                          type="checkbox"
                          checked={formData.existingInfra.includes(option)}
                          onChange={(e) => handleCheckboxChange('existingInfra', option)}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>نوع السقف *</label>
                <select
                  value={formData.ceilingType}
                  onChange={(e) => handleInputChange('ceilingType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر نوع السقف</option>
                  <option value="خرسانة">خرسانة</option>
                  <option value="جبس">جبس</option>
                  <option value="سقف صناعي مكشوف">سقف صناعي مكشوف</option>
                  <option value="Ceiling tiles">Ceiling tiles</option>
                  <option value="غير متأكد">غير متأكد</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>ارتفاع السقف التقريبي *</label>
                <select
                  value={formData.ceilingHeight}
                  onChange={(e) => handleInputChange('ceilingHeight', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر الارتفاع</option>
                  <option value="3">أقل من 3 متر</option>
                  <option value="6">3–6 متر</option>
                  <option value="10">6–10 متر</option>
                  <option value="11">أكثر من 10 متر</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>هل توجد قيود تمنع الحفر أو التكسير؟ *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {['نعم', 'لا', 'غير متأكد'].map(option => (
                    <label key={option} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                      <input
                        type="radio"
                        name="drillingRestrictions"
                        value={option}
                        checked={formData.drillingRestrictions === option}
                        onChange={(e) => handleInputChange('drillingRestrictions', e.target.value)}
                        style={{ marginRight: '8px', cursor: 'pointer' }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>هل توجد غرفة سيرفرات؟ *</label>
                <select
                  value={formData.serverRoom}
                  onChange={(e) => handleInputChange('serverRoom', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">اختر الخيار</option>
                  <option value="نعم جاهزة">نعم جاهزة</option>
                  <option value="نعم تحتاج تطوير">نعم تحتاج تطوير</option>
                  <option value="لا">لا</option>
                  <option value="سيتم إنشاؤها">سيتم إنشاؤها</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>عدد الموظفين/المستخدمين التقريبي *</label>
                <input
                  type="number"
                  value={formData.employees}
                  onChange={(e) => handleInputChange('employees', e.target.value)}
                  placeholder="مثال: 50"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>مستوى الأمان المطلوب *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.securityLevel}
                    onChange={(e) => handleInputChange('securityLevel', e.target.value)}
                    style={{ flex: 1, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500', minWidth: '80px', color: '#042C53' }}>
                    {formData.securityLevel ? (['أساسي', 'منخفض', 'متوسط', 'عالي', 'عالي جداً'][formData.securityLevel - 1] || '') : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: أسئلة ديناميكية */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.projectTypes.includes('كاميرات مراقبة (CCTV)') && (
                <div style={{ padding: '16px', background: '#EAF3DE', borderRadius: '8px', border: '0.5px solid #97C459' }}>
                  <h4 style={{ color: '#27500A', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>أسئلة عن الكاميرات</h4>
                  <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                    <input
                      type="number"
                      placeholder="عدد المداخل"
                      onChange={(e) => setFormData(prev => ({ ...prev, cameraDetails: { ...prev.cameraDetails, entrances: e.target.value } }))}
                      style={{
                        padding: '10px',
                        border: '0.5px solid #97C459',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => setFormData(prev => ({ ...prev, cameraDetails: { ...prev.cameraDetails, nightVision: e.target.checked } }))}
                      />
                      هل تحتاج رؤية ليلية؟
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => setFormData(prev => ({ ...prev, cameraDetails: { ...prev.cameraDetails, licensePlate: e.target.checked } }))}
                      />
                      هل تحتاج قراءة لوحات سيارات؟
                    </label>
                  </div>
                </div>
              )}

              {formData.projectTypes.includes('Wi-Fi') && (
                <div style={{ padding: '16px', background: '#E6F1FB', borderRadius: '8px', border: '0.5px solid #85B7EB' }}>
                  <h4 style={{ color: '#042C53', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>أسئلة عن Wi-Fi</h4>
                  <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                    <input
                      type="number"
                      placeholder="عدد المستخدمين المتزامنين المتوقع"
                      onChange={(e) => setFormData(prev => ({ ...prev, wifiDetails: { ...prev.wifiDetails, users: e.target.value } }))}
                      style={{
                        padding: '10px',
                        border: '0.5px solid #85B7EB',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => setFormData(prev => ({ ...prev, wifiDetails: { ...prev.wifiDetails, metalRacks: e.target.checked } }))}
                      />
                      هل يوجد مستودع معدني؟
                    </label>
                  </div>
                </div>
              )}

              {formData.projectTypes.includes('نظام دخول (Access Control)') && (
                <div style={{ padding: '16px', background: '#FAEEDA', borderRadius: '8px', border: '0.5px solid #EF9F27' }}>
                  <h4 style={{ color: '#854F0B', marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>أسئلة عن نظام الدخول</h4>
                  <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
                    <input
                      type="number"
                      placeholder="عدد الأبواب"
                      onChange={(e) => setFormData(prev => ({ ...prev, accessDetails: { ...prev.accessDetails, doors: e.target.value } }))}
                      style={{
                        padding: '10px',
                        border: '0.5px solid #EF9F27',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <select
                      onChange={(e) => setFormData(prev => ({ ...prev, accessDetails: { ...prev.accessDetails, type: e.target.value } }))}
                      style={{
                        padding: '10px',
                        border: '0.5px solid #EF9F27',
                        borderRadius: '6px',
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">اختر نوع المفتاح</option>
                      <option value="بصمة">بصمة</option>
                      <option value="بطاقة">بطاقة</option>
                      <option value="وجه">وجه</option>
                      <option value="مزيج">مزيج</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.projectTypes.length === 0 && (
                <p style={{ fontSize: '13px', color: '#888780', textAlign: 'center' }}>
                  ✓ لم تختر أي نوع مشروع محدد. يمكنك الاستمرار!
                </p>
              )}
            </div>
          )}

          {/* Step 5: رفع الملفات */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#EAF3DE', borderRadius: '8px', border: '0.5px solid #97C459', fontSize: '13px', color: '#27500A' }}>
                📌 رابط Google Maps إجباري - باقي الملفات اختيارية
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>رابط موقع Google Maps *</label>
                <input
                  type="text"
                  value={formData.googleMapsLink}
                  onChange={(e) => handleInputChange('googleMapsLink', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>مخطط الموقع (PDF/صورة) - أقصى 10 MB</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('planFile', e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                />
                {formData.planFile && <p style={{ fontSize: '12px', color: '#27500A', marginTop: '4px' }}>✓ {formData.planFile.name}</p>}
              </div>

              <div>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block', marginBottom: '6px' }}>فيديو Walkthrough للموقع (3–5 دقائق) - أقصى 100 MB</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleVideoChange(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '0.5px solid #B4B2A9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                />
                {formData.walkthroughVideo && <p style={{ fontSize: '12px', color: '#27500A', marginTop: '4px' }}>✓ {formData.walkthroughVideo.name}</p>}
              </div>
            </div>
          )}

          {/* Step 6: الميزانية */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#E6F1FB', borderRadius: '8px', border: '0.5px solid #85B7EB', fontSize: '13px', color: '#042C53' }}>
                💡 هذا السؤال اختياري - ساعدنا بمعرفة التوقعات تقريبياً
              </div>

              <label style={{ fontSize: '14px', fontWeight: '500', color: '#042C53', display: 'block' }}>الميزانية التقريبية:</label>
              <div style={{ display: 'grid', gap: '8px' }}>
                {['أقل من 50 ألف', '50–100 ألف', '100–250 ألف', '250–500 ألف', '500 ألف+'].map(range => (
                  <label key={range} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="budget"
                      value={range}
                      checked={formData.budget === range}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {range}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '0.5px solid #E6F1FB'
          }}>
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              style={{
                padding: '12px 24px',
                border: '0.5px solid #B4B2A9',
                background: '#fff',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                color: step === 1 ? '#B4B2A9' : '#042C53',
                opacity: step === 1 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              ← السابق
            </button>

            {step < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep()) {
                    setStep(step + 1);
                  } else {
                    setError('يرجى ملء جميع الحقول المطلوبة');
                  }
                }}
                style={{
                  padding: '12px 32px',
                  background: '#378ADD',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2969B3'}
                onMouseLeave={(e) => e.target.style.background = '#378ADD'}
              >
                التالي →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  background: loading ? '#B4B2A9' : '#27500A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.background = '#1d3a07')}
                onMouseLeave={(e) => !loading && (e.target.style.background = '#27500A')}
              >
                {loading ? '⏳ جاري الإرسال...' : '✓ إرسال الطلب'}
              </button>
            )}
          </div>
        </form>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '12px',
          color: '#888780'
        }}>
          <p>✓ بياناتك آمنة ومحمية تماماً</p>
          <p>للمساعدة: <strong>support@company.com</strong></p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}