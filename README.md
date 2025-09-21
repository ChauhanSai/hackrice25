# Doculabubu 🍵

**Remember your telehealth visits, effortlessly.**
AI-powered telehealth assistant that helps you **remember and understand your doctor visits** through intelligent voice queries and video analysis.

---

## 🌎 Social Impact

Telehealth has made healthcare more accessible, but remembering the details of a visit can be challenging—especially for **seniors, caregivers, and patients with complex care plans**. Doculabubu ensures that **no patient misses important medical instructions**, empowering individuals to **take control of their health** and follow care plans with confidence.  

---

## 🧠 Inspiration

Telehealth is convenient—but remembering what happened isn’t. Seniors, caregivers, and even busy patients often say:

> “I forgot how often to take it.”  
> “What were the side effects?”

Doculabubu makes it **easy, calm, and trustworthy** to **ask, see, and remember** your telehealth visits—with **video receipts** you can rely on.

---

## 💡 What it does

* 🗂️ **Doctor Upload:** Automatically fetch Zoom telehealth recordings via the Zoom API—no extra work for doctors or patients.  
* 🎙️ **Voice → Moment:** Ask a question, get a **12–20s video clip** with captions and a text summary showing exactly where your doctor answered.  
* 🗄️ **FHIR-Ready Records:** Converts each visit into JSON aligned with FHIR standards, ready for integration into healthcare systems.  
* 🧾 **Care Plan Builder:** Smart bot generates **next steps and medication timelines** via voice, personalized for the patient.  
* 🌑 **Gamified Dark Mode:** Learn about your health through a **3-heart, teach-back game**—answer questions, get hints, and watch video snippet reminders.

---

## 🌟 Key Benefits

* **Never Forget:** Always have a **video receipt** of what your doctor said.  
* **Voice-First Interaction:** Ask questions without navigating complex menus.  
* **Trustworthy AI:** Answers are **grounded in the original telehealth recording**.  
* **Accessibility:** Designed for **elderly and visually-impaired patients**.  
* **Social Impact:** Empowers patients to **understand and follow their treatment**, reducing medical errors and hospital readmissions.  

---

## 🚀 Use Cases

* Seniors who struggle to remember medication instructions.  
* Caregivers managing multiple patient visits.  
* Patients with complex care plans requiring detailed follow-up.  
* Telehealth providers looking to enhance **patient understanding and engagement**.  

---

## 🛠️ How we built it

**Frontend**  
* Raw HTML, CSS, JavaScript for simplicity and accessibility.  
* Web Speech API for push-to-talk mic capture and on-device hints.

**APIs & ML**  
* **TwelveLabs Pegasus + Marengo:** Semantic scene/moment search, precise video-to-text alignment, clip tagging.  
* **Zoom API:** Fetch cloud recordings automatically.  
* **Gemini API:** Lightweight quiz and answer-card synthesis, grounded to the retrieved transcript span.  
* **Google Cloud Text-to-Speech:** Reads back care instructions in a clear, natural voice.

**Media & Data**  
* **ffmpeg:** Auto-cut 12–20s clips and burn captions.  
* **Google Cloud Storage:** Store Zoom MP4s; serve signed/public URLs for processing.

---

## 🚧 Challenges we overcame

* Learning **TwelveLabs video models** and integrating them for precise retrieval.  
* Handling **public GCS URLs** compatible with TwelveLabs (CORS, signed URL lifetimes).  
* Achieving **precise clip segmentation** (±2s) with ASR alignment.  
* Designing an **elder-friendly UX**: minimal screens, one action at a time, clear audio prompts.

---

## 🏆 Accomplishments

* **Clip-backed answers:** Every answer links to a **timestamped video snippet**—no hallucinations.  
* **Teach-back in Dark Mode:** Auto-generated, safe, and easy to learn from your own telehealth visits.  
* **Care Plan Timeline:** Important next steps read back with one click.  
* **End-to-End Pipeline:** Zoom → Cloud Storage → TwelveLabs ingestion runs automatically.

---

## 📚 What we learned

* Multimodal, **video-grounded retrieval** is far more trustworthy than plain text summaries.  
* API plumbing (Zoom ↔ GCS ↔ TwelveLabs) is just as critical as the AI itself.  
* Accessibility is more than fonts—**voice-first interactions + clip receipts** transform the patient experience.

---

## 🚀 Next Steps

* FHIR sandbox integration for teach-back records and follow-up tasks.  
* Multilingual summaries and expanded red-flag libraries.  
* Caregiver portal with permissions, reminders, and `.ics` calendar exports for medications.  
* Cost/coverage estimates for new prescriptions.

---

## ❤️ Why Doculabubu

Doculabubu makes **telehealth visits actionable and understandable**—all in one platform.  **We are patient-obsessed: making healthcare more accessible one doctor visit at a time.**
