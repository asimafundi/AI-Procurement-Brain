import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { analyzeProjectWithAI } from './aiService';

const SmartIntakeForm = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    companyName: '', contactName: '', phone: '', email: '', city: '',
    businessType: '', projectTypes: [], projectStatus: '', projectGoal: '',
    deadline: '', area: '', floors: '', buildingStatus: '',
    ceilingType: '', ceilingHeight: '', drillingRestrictions: '',
    serverRoom: '', employees: '', securityLevel: 3, googleMapsLink: '',
    budget: '', notes: '', aiReport: ''
  });

  const PRIMARY = '#378ADD';
  const PRIMARY_DARK = '#042C53';
  const PRIMARY_LIGHT = '#E6F1FB';
  const SUCCESS = '#27500A';
  const SUCCESS_BG = '#EAF3DE';
  const SUCCESS_BORDER = '#97C459';

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key, value) => {
    setFormData(prev => {
      const exists = prev[key].includes(value);
      return { ...prev, [key]: exists ? prev[key].filter(v => v !== value) : [...prev[key], value] };
    });
  };

  const needsSiteSurvey = () => {
    return parseInt(formData.area) > 500 || formData.securityLevel >= 4;
  };

  const validateStep = () => {
    switch (step) {
      case 1: return formData.companyName && formData.contactName && formData.phone && formData.email && formData.city;
      case 2: return formData.businessType && formData.projectTypes.length > 0 && formData.projectStatus && formData.projectGoal;
      case 3: return formData.area && formData.floors && formData.buildingStatus;
      case 4: return formData.ceilingType && formData.ceilingHeight && formData.drillingRestrictions && formData.serverRoom && formData.employees;
      case 5: return formData.googleMapsLink;
      case 6: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) { setError(''); setStep(prev => prev + 1); }
    else { setError('\u064a\u0631\u062c\u0649 \u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629'); }
  };

  const prevStep = () => { setError(''); setStep(prev => prev - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const dataToSend = {
        company_name: formData.companyName, contact_name: formData.contactName,
        phone: formData.phone, email: formData.email, city: formData.city,
        business_type: formData.businessType, project_types: formData.projectTypes.join(', '),
        project_status: formData.projectStatus, project_goal: formData.projectGoal,
        deadline: formData.deadline || '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
        area: parseInt(formData.area), floors: formData.floors,
        building_status: formData.buildingStatus, ceiling_type: formData.ceilingType,
        ceiling_height: formData.ceilingHeight, drilling_restrictions: formData.drillingRestrictions,
        server_room: formData.serverRoom, employees: parseInt(formData.employees),
        security_level: parseInt(formData.securityLevel), google_maps_link: formData.googleMapsLink,
        budget: formData.budget || '\u063a\u064a\u0631 \u0645\u062d\u062f\u062f',
        site_survey_required: needsSiteSurvey(), status: 'pending', notes: ''
      };

      const { data, error: insertError } = await supabase.from('intakes').insert([dataToSend]).select();
      if (insertError) throw insertError;

      let aiReport = '';
      try {
        aiReport = await analyzeProjectWithAI(dataToSend);
        if (data && data[0]) {
          await supabase.from('intakes').update({ ai_scope: aiReport }).eq('id', data[0].id);
        }
      } catch (aiErr) {
        console.warn('AI failed:', aiErr);
        aiReport = '\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a. \u0633\u064a\u062a\u0645 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u064a\u062f\u0648\u064a\u0627\u064b.';
      }

      setFormData(prev => ({ ...prev, aiReport }));
      setSubmitted(true);
    } catch (err) {
      setError(err.message || '\u062d\u062f\u062b \u062e\u0637\u0623');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const S = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #E6F1FB 0%, #F0F7FF 50%, #FAFCFF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Segoe UI', Tahoma, sans-serif", direction: 'rtl' },
    card: { maxWidth: '700px', width: '100%', background: '#fff', borderRadius: '16px', padding: '40px 32px', boxShadow: '0 8px 40px rgba(55,138,221,0.12)', border: '1px solid #378ADD22' },
    title: { fontSize: '28px', fontWeight: '700', color: PRIMARY_DARK, marginBottom: '8px', textAlign: 'center' },
    subtitle: { fontSize: '15px', color: '#666', textAlign: 'center', marginBottom: '24px' },
    label: { display: 'block', fontSize: '14px', fontWeight: '600', color: PRIMARY_DARK, marginBottom: '6px' },
    input: { width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', direction: 'rtl' },
    select: { width: '100%', padding: '12px 16px', border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '15px', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', background: '#fff', direction: 'rtl' },
    btnP: { padding: '14px 32px', background: PRIMARY, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    btnO: { padding: '14px 32px', background: '#fff', color: PRIMARY_DARK, border: '1.5px solid #ddd', borderRadius: '10px', fontSize: '16px', cursor: 'pointer' },
    btnS: { padding: '14px 32px', background: SUCCESS, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    err: { background: '#FFF0F0', border: '1px solid #FFB3B3', borderRadius: '10px', padding: '12px 16px', color: '#CC0000', marginBottom: '16px', fontSize: '14px' },
    cbG: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
    cb: (c) => ({ padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', border: c ? '2px solid '+PRIMARY : '2px solid #E0E0E0', background: c ? PRIMARY_LIGHT : '#FAFAFA', color: c ? PRIMARY : '#555', fontWeight: c ? '600' : '400' }),
    rG: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    ri: (c) => ({ padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', border: c ? '2px solid '+PRIMARY : '2px solid #E0E0E0', background: c ? PRIMARY_LIGHT : '#FAFAFA', color: c ? PRIMARY : '#555', fontWeight: c ? '600' : '400' }),
    footer: { display: 'flex', justifyContent: 'space-between', marginTop: '24px' },
    icon: { fontSize: '40px', marginBottom: '8px', textAlign: 'center' },
    pBar: { width: '100%', height: '4px', background: '#E8E8E8', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' },
    pFill: (s) => ({ height: '100%', background: 'linear-gradient(90deg, #378ADD, #5BA3E6)', borderRadius: '2px', transition: 'width 0.5s', width: (s/7*100)+'%' })
  };

  if (step === 0) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: 'center', maxWidth: '600px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎯</div>
          <h1 style={{ ...S.title, fontSize: '32px', marginBottom: '12px' }}>احصل على تقييم أولي لمشروعك التقني</h1>
          <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.8', marginBottom: '24px' }}>استبيان ذكي يحلل احتياجاتك ويعطيك تقرير احترافي فوري بقوة الذكاء الاصطناعي</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {['⏱️ 5 دقائق فقط', '🔒 بياناتك آمنة', '🤖 تقرير AI فوري'].map((t,i) => <div key={i} style={{ fontSize: '14px', color: '#555' }}>{t}</div>)}
          </div>
          <button style={{ ...S.btnP, padding: '16px 48px', fontSize: '18px' }} onClick={() => setStep(1)}>ابدأ التقييم الآن →</button>
          <p style={{ fontSize: '12px', color: '#AAA', marginTop: '24px' }}>بياناتك آمنة ومحمية تماماً ✓<br/>للمساعدة: <strong>support@company.com</strong></p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, maxWidth: '700px' }}>
          {formData.aiReport && formData.aiReport !== '\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a. \u0633\u064a\u062a\u0645 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u064a\u062f\u0648\u064a\u0627\u064b.' && (
            <div style={{ background: SUCCESS_BG, borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid '+SUCCESS_BORDER, maxHeight: '400px', overflowY: 'auto', textAlign: 'right' }}>
              <h3 style={{ color: SUCCESS, marginBottom: '12px', fontSize: '18px' }}>📊 تقرير المستشار الذكي</h3>
              <div style={{ fontSize: '14px', color: SUCCESS, lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{formData.aiReport}</div>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '26px', fontWeight: '600', color: PRIMARY_DARK, marginBottom: '12px' }}>تم استلام طلبكم بنجاح!</h2>
            <p style={{ fontSize: '15px', color: '#888', marginBottom: '24px', lineHeight: '1.8' }}>شكراً لكم. سيتم تحليل المشروع وإرسال التقرير الكامل خلال 24–48 ساعة.</p>
            <div style={{ background: SUCCESS_BG, borderRadius: '8px', padding: '20px', marginBottom: '24px', border: '0.5px solid '+SUCCESS_BORDER, textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: SUCCESS, marginBottom: '8px' }}>ستتلقى:</div>
              <div style={{ fontSize: '13px', color: '#3B6D11', lineHeight: '1.8' }}>✅ تقييم أولي شامل<br/>✅ Scope مبدئي للمشروع<br/>✅ تقدير تكلفة أولي<br/>✅ تحليل المخاطر المحتملة<br/>✅ توصية بشأن الحاجة لموقع سيرفي</div>
            </div>
            <p style={{ fontSize: '13px', color: '#777' }}>سيتم الاتصال بكم على: <strong>{formData.phone}</strong><br/>أو عبر البريد: <strong>{formData.email}</strong></p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
          <h2 style={{ ...S.title, marginBottom: '12px' }}>المستشار الذكي يحلل مشروعك...</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>قد يستغرق 10-15 ثانية</p>
          <div style={{ width: '200px', height: '4px', background: '#E8E8E8', borderRadius: '2px', margin: '0 auto', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: PRIMARY, borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1: return (<div>
        <div style={S.icon}>🏢</div>
        <h2 style={S.title}>معلومات العميل</h2>
        <p style={S.subtitle}>أخبرنا عن شركتك وكيف نتواصل معك</p>
        <label style={S.label}>اسم الشركة / المؤسسة *</label>
        <input style={S.input} placeholder="مثال: شركة الأمان للتقنية" value={formData.companyName} onChange={e => handleInputChange('companyName', e.target.value)} />
        <label style={S.label}>اسم المسؤول *</label>
        <input style={S.input} placeholder="الاسم الكامل" value={formData.contactName} onChange={e => handleInputChange('contactName', e.target.value)} />
        <label style={S.label}>رقم الهاتف *</label>
        <input style={S.input} placeholder="05xxxxxxxx" type="tel" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} />
        <label style={S.label}>البريد الإلكتروني *</label>
        <input style={S.input} placeholder="email@example.com" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
        <label style={S.label}>المدينة *</label>
        <select style={S.select} value={formData.city} onChange={e => handleInputChange('city', e.target.value)}>
          <option value="">اختر المدينة</option>
          {['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الطائف','تبوك','أبها','نجران','جازان','حائل','ينبع','القصيم','أخرى'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>);
      case 2: return (<div>
        <div style={S.icon}>📋</div>
        <h2 style={S.title}>نوع المشروع</h2>
        <p style={S.subtitle}>حدد نوع المشروع التقني المطلوب</p>
        <label style={S.label}>نوع النشاط *</label>
        <select style={S.select} value={formData.businessType} onChange={e => handleInputChange('businessType', e.target.value)}>
          <option value="">اختر نوع النشاط</option>
          {['تجاري','صناعي','سكني','حكومي','تعليمي','صحي','ترفيهي','أخرى'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <label style={S.label}>نوع المشروع التقني * (اختر واحد أو أكثر)</label>
        <div style={S.cbG}>
          {['كاميرات مراقبة','شبكات','Wi-Fi','أنظمة دخول','إنذار حريق','صوتيات','غرفة سيرفرات','أنظمة حضور وانصراف'].map(type => (
            <div key={type} style={S.cb(formData.projectTypes.includes(type))} onClick={() => handleCheckboxChange('projectTypes', type)}>
              {formData.projectTypes.includes(type) ? '✓ ' : ''}{type}
            </div>
          ))}
        </div>
        <label style={S.label}>حالة المشروع *</label>
        <div style={S.rG}>
          {['مشروع جديد','توسعة لمشروع قائم','صيانة وتحديث','تقييم وضع حالي'].map(s => (
            <div key={s} style={S.ri(formData.projectStatus === s)} onClick={() => handleInputChange('projectStatus', s)}>
              {formData.projectStatus === s ? '● ' : '○ '}{s}
            </div>
          ))}
        </div>
        <label style={S.label}>هدف المشروع *</label>
        <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical' }} placeholder="مثال: تأمين المستودع بكاميرات مراقبة عالية الدقة..." value={formData.projectGoal} onChange={e => handleInputChange('projectGoal', e.target.value)} />
        <label style={S.label}>الموعد المطلوب</label>
        <input style={S.input} type="date" value={formData.deadline} onChange={e => handleInputChange('deadline', e.target.value)} />
      </div>);
      case 3: return (<div>
        <div style={S.icon}>🏗️</div>
        <h2 style={S.title}>تفاصيل الموقع</h2>
        <p style={S.subtitle}>أخبرنا عن المبنى والموقع</p>
        <label style={S.label}>المساحة التقريبية (م²) *</label>
        <input style={S.input} type="number" placeholder="مثال: 500" value={formData.area} onChange={e => handleInputChange('area', e.target.value)} />
        <label style={S.label}>عدد الطوابق *</label>
        <select style={S.select} value={formData.floors} onChange={e => handleInputChange('floors', e.target.value)}>
          <option value="">اختر</option>
          {['طابق واحد','طابقين','3 طوابق','4 طوابق','5 طوابق','أكثر من 5'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <label style={S.label}>حالة المبنى *</label>
        <div style={S.rG}>
          {['قيد الإنشاء (عظم)','قيد التشطيب','جاهز ومشغّل','قديم ويحتاج تجديد'].map(s => (
            <div key={s} style={S.ri(formData.buildingStatus === s)} onClick={() => handleInputChange('buildingStatus', s)}>
              {formData.buildingStatus === s ? '● ' : '○ '}{s}
            </div>
          ))}
        </div>
      </div>);
      case 4: return (<div>
        <div style={S.icon}>⚙️</div>
        <h2 style={S.title}>تفاصيل تقنية</h2>
        <p style={S.subtitle}>معلومات تقنية مهمة للتقييم الدقيق</p>
        <label style={S.label}>نوع السقف *</label>
        <div style={S.rG}>
          {['جبس','خرسانة','حديد (هنجر)','مستعار','مفتوح'].map(t => (
            <div key={t} style={S.ri(formData.ceilingType === t)} onClick={() => handleInputChange('ceilingType', t)}>
              {formData.ceilingType === t ? '● ' : '○ '}{t}
            </div>
          ))}
        </div>
        <label style={S.label}>ارتفاع السقف *</label>
        <select style={S.select} value={formData.ceilingHeight} onChange={e => handleInputChange('ceilingHeight', e.target.value)}>
          <option value="">اختر</option>
          {['أقل من 3 متر','3-4 متر','4-6 متر','6-10 متر','أكثر من 10 متر'].map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <label style={S.label}>هل يوجد قيود على التثقيب؟ *</label>
        <div style={S.rG}>
          {['لا يوجد قيود','ممنوع التثقيب في بعض المناطق','ممنوع التثقيب نهائياً'].map(d => (
            <div key={d} style={S.ri(formData.drillingRestrictions === d)} onClick={() => handleInputChange('drillingRestrictions', d)}>
              {formData.drillingRestrictions === d ? '● ' : '○ '}{d}
            </div>
          ))}
        </div>
        <label style={S.label}>هل تتوفر غرفة سيرفر؟ *</label>
        <div style={S.rG}>
          {['نعم، جاهزة','نعم، تحتاج تجهيز','لا تتوفر'].map(s => (
            <div key={s} style={S.ri(formData.serverRoom === s)} onClick={() => handleInputChange('serverRoom', s)}>
              {formData.serverRoom === s ? '● ' : '○ '}{s}
            </div>
          ))}
        </div>
        <label style={S.label}>عدد الموظفين / المستخدمين *</label>
        <input style={S.input} type="number" placeholder="مثال: 50" value={formData.employees} onChange={e => handleInputChange('employees', e.target.value)} />
        <label style={S.label}>مستوى الأمان المطلوب: {formData.securityLevel}/5</label>
        <input type="range" min="1" max="5" value={formData.securityLevel} onChange={e => handleInputChange('securityLevel', parseInt(e.target.value))} style={{ width: '100%', marginBottom: '16px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999', marginTop: '-12px', marginBottom: '16px' }}>
          <span>1 - أساسي</span><span>3 - متوسط</span><span>5 - عالي جداً</span>
        </div>
      </div>);
      case 5: return (<div>
        <div style={S.icon}>📍</div>
        <h2 style={S.title}>الموقع على الخريطة</h2>
        <p style={S.subtitle}>ساعدنا في تحديد موقع المشروع</p>
        <label style={S.label}>رابط Google Maps *</label>
        <input style={S.input} placeholder="https://maps.google.com/..." value={formData.googleMapsLink} onChange={e => handleInputChange('googleMapsLink', e.target.value)} />
        <div style={{ background: PRIMARY_LIGHT, borderRadius: '8px', padding: '16px', fontSize: '13px', color: PRIMARY, lineHeight: '1.8' }}>
          💡 كيف تحصل على الرابط:<br/>1. افتح Google Maps<br/>2. ابحث عن موقع المشروع<br/>3. اضغط "مشاركة"<br/>4. انسخ الرابط والصقه هنا
        </div>
      </div>);
      case 6: return (<div>
        <div style={S.icon}>💰</div>
        <h2 style={S.title}>الميزانية</h2>
        <p style={S.subtitle}>ما الميزانية المتوقعة؟</p>
        <div style={{ background: PRIMARY_LIGHT, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: PRIMARY }}>
          💡 هذا السؤال اختياري - ساعدنا بمعرفة التوقعات تقريبياً
        </div>
        <label style={S.label}>الميزانية التقريبية:</label>
        <div style={S.rG}>
          {['أقل من 50 ألف','50–100 ألف','100–250 ألف','250–500 ألف','500 ألف+'].map(b => (
            <div key={b} style={S.ri(formData.budget === b)} onClick={() => handleInputChange('budget', b)}>
              {formData.budget === b ? '● ' : '○ '}{b}
            </div>
          ))}
        </div>
      </div>);
      default: return null;
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#999', marginBottom: '8px' }}>الخطوة {step} من 7</div>
        <div style={S.pBar}><div style={S.pFill(step)}></div></div>
        {error && <div style={S.err}>❌ {error}</div>}
        {renderStep()}
        <div style={S.footer}>
          {step > 1 && <button style={S.btnO} onClick={prevStep}>→ السابق</button>}
          <div style={{ flex: 1 }}></div>
          {step < 6 ? (
            <button style={S.btnP} onClick={nextStep}>التالي ←</button>
          ) : (
            <button style={S.btnS} onClick={handleSubmit} disabled={loading}>✓ إرسال الطلب</button>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#AAA' }}>
          بياناتك آمنة ومحمية تماماً ✓<br/>للمساعدة: <strong>support@company.com</strong>
        </div>
      </div>
    </div>
  );
};

export default SmartIntakeForm;
