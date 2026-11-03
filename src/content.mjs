// Page copy. Region pages share the structure and swap these values.

export const services = [
  {
    code: "A · OFFENSIVE SECURITY",
    title: "VAPT & penetration testing",
    items: [
      "Web, mobile and API testing (OWASP Top 10 & API Top 10)",
      "Cloud and Kubernetes reviews on AWS, Azure, EKS and AKS",
      "Active Directory attack-path assessment",
      "LLM and AI application red-teaming",
      "Free retest of fixed findings within 30 days",
    ],
  },
  {
    code: "B · GRC & ISO",
    title: "ISO 27001, ISO 42001 & frameworks",
    items: [
      "Gap assessment against the standard and local regulation",
      "ISMS / AIMS implementation: scope, risk, SoA, policies",
      "Internal audits by an IRCA-trained ISO 27001 Lead Auditor",
      "{{svcLocal}}",
      "Certification-audit support through to the certificate",
    ],
  },
  {
    code: "C · AI GOVERNANCE & DELIVERY",
    title: "AI governance & PMP-led programmes",
    items: [
      "AI inventory, risk register and impact assessments",
      "{{svcAi}}",
      "PMP-certified delivery of security and compliance programmes",
      "Fractional vCISO and PMO for growing teams",
      "Secure MLOps and DevSecOps pipeline reviews",
    ],
  },
];

export const agents = [
  ["Recon agent", "Maps your attack surface, runs scanners and removes duplicate results", "Every finding verified by hand"],
  ["Evidence mapper", "Matches your policies, logs and screenshots to Annex A and local controls", "Lead auditor review"],
  ["Policy drafter", "Writes first drafts of policies and procedures from your context", "Reviewed with your team"],
  ["Report writer", "Turns verified findings into executive and technical reports", "Signed off before release"],
];

export const credentials = [
  "PMP", "ISO/IEC 27001 Lead Auditor (CQI/IRCA course)", "AWS Security Specialty",
  "AWS ML Specialty", "CKA", "AZ-400", "CEH", "CCNP Security", "eJPT", "MSc Artificial Intelligence",
];

const baseQuestions = (privacy, incident) => [
  ["Cl. 4.3", "We have a written ISMS scope covering people, sites and systems"],
  ["Cl. 6.1", "We keep a risk register with owners and treatment plans"],
  ["Cl. 6.1.3", "We have a Statement of Applicability for Annex A controls"],
  ["A.5.9", "We keep an up-to-date asset inventory, including cloud and SaaS"],
  ["A.8.8", "We patch and scan for vulnerabilities on a set schedule"],
  ["A.5.24", incident],
  ["A.8.15", "Security logs are centralised and kept for a set period"],
  ["A.5.34", privacy],
  ["A.8.29", "We had an independent penetration test in the last 12 months"],
  ["Cl. 9.2", "We have run an internal audit and a management review"],
];

export const regions = {
  ae: {
    slug: "ae", lang: "en-AE", label: "UAE", name: "United Arab Emirates",
    title: "VAPT, ISO 27001 & AI Governance in the UAE",
    description: "VAPT, ISO 27001 and ISO 42001 readiness, and alignment with UAE IA, Dubai ISR, ADHICS and UAE PDPL. Fixed fees in AED.",
    eyebrow: "United Arab Emirates · Pricing in AED",
    h1: "Security and AI governance for UAE organisations.",
    lead: "Penetration testing, ISO 27001 and ISO 42001 readiness, and alignment with UAE and emirate-level standards. Delivered from Sharjah by a certified practitioner, sped up by AI agents, and checked by a human.",
    cur: "Fixed fee · AED",
    svcLocal: "Mapping to UAE IA Standard, Dubai ISR, ADHICS and UAE PDPL",
    svcAi: "ISO 42001 readiness for AI products sold in the UAE and EU",
    noteLocal: "Where a regulator requires an approved or licensed assessor, we prepare you and work alongside that provider.",
    dataLocal: "Data can be kept in UAE cloud regions on request.",
    fwTitle: "UAE frameworks we map to",
    fw: [
      ["UAE IA Standard", "Federal entities, critical sectors and their suppliers", "Gap assessment, control mapping, evidence pack"],
      ["Dubai ISR", "Dubai government entities and suppliers", "Readiness review against ISR domains"],
      ["ADHICS", "Abu Dhabi healthcare providers", "Control gap analysis and remediation plan"],
      ["UAE PDPL", "Organisations processing personal data in the UAE", "Data mapping, records of processing, DPIAs"],
      ["ISO 27001:2022", "Any organisation needing a recognised ISMS", "Implementation, internal audit, certification support"],
      ["ISO 42001:2023", "Teams building or deploying AI", "AIMS design, AI impact assessments, internal audit"],
    ],
    pkgLead: "Quoted in AED within two working days of a scoping call. VAT invoiced where applicable.",
    pkg: [
      ["Pentest Sprint", "2 weeks", "Web or API application, verified findings, executive debrief and a free retest."],
      ["ISO 27001 Ready-90", "90 days", "Gap assessment, ISMS build, internal audit and certification body hand-off."],
      ["AI Governance Kickstart", "6 weeks", "AI inventory, risk register, ISO 42001 gap report and board-ready policy set."],
    ],
    contact: "In person in Sharjah and Dubai, or remote across the Emirates. Sunday to Thursday, Gulf Standard Time.",
    checkTitle: "ISO 27001 & UAE IA readiness check",
    questions: baseQuestions(
      "We know what personal data we hold and our lawful basis under UAE PDPL",
      "We have a tested incident response plan with named roles",
    ),
    foot: "Sharjah, United Arab Emirates",
  },
  in: {
    slug: "in", lang: "en-IN", label: "India", name: "India",
    title: "VAPT, ISO 27001, SOC 2 & DPDP in India",
    description: "VAPT, ISO 27001, SOC 2 and ISO 42001 readiness, mapped to the DPDP Act, CERT-In, RBI and SEBI CSCRF. Fixed fees in INR.",
    eyebrow: "India · Pricing in INR",
    h1: "Pass your customer's security review and your regulator's audit.",
    lead: "Penetration testing, ISO 27001, SOC 2 and ISO 42001 readiness, with mapping to the DPDP Act, CERT-In and RBI, SEBI or IRDAI requirements. Remote-first, sped up by AI agents, and checked by a human.",
    cur: "Fixed fee · INR",
    svcLocal: "Mapping to DPDP Act, CERT-In Directions, RBI, SEBI CSCRF and IRDAI",
    svcAi: "ISO 42001 and EU AI Act readiness for Indian AI products sold abroad",
    noteLocal: "Audits that must be done by a CERT-In empanelled auditor are delivered with an empanelled partner. We get you ready first.",
    dataLocal: "Data can be kept in Indian cloud regions to support DPDP obligations.",
    fwTitle: "Indian frameworks we map to",
    fw: [
      ["DPDP Act 2023", "Any business processing digital personal data in India", "Consent and notice review, data mapping, breach-response plan"],
      ["CERT-In Directions", "Service providers, intermediaries, data centres, corporates", "Log retention, 6-hour incident reporting runbook"],
      ["RBI frameworks", "Banks, NBFCs, payment system operators", "Gap assessment and remediation roadmap"],
      ["SEBI CSCRF", "SEBI-regulated entities", "Control mapping and evidence readiness"],
      ["SOC 2", "SaaS companies selling to US customers", "Readiness, control design, auditor hand-off"],
      ["ISO 27001 / 42001", "Any organisation, and AI product teams", "Implementation, internal audit, certification support"],
    ],
    pkgLead: "Quoted in INR within two working days of a scoping call. GST invoiced where applicable.",
    pkg: [
      ["Pentest Sprint", "2 weeks", "Web or API application, verified findings, executive debrief and a free retest."],
      ["Trust Pack for SaaS", "90 days", "ISO 27001 or SOC 2 readiness plus a security questionnaire library for sales."],
      ["DPDP & AI Kickstart", "6 weeks", "DPDP gap report, AI risk register and ISO 42001 starter policies."],
    ],
    contact: "Remote across India, with on-site visits for audits by arrangement. Monday to Friday, Indian Standard Time.",
    checkTitle: "ISO 27001 & DPDP readiness check",
    questions: baseQuestions(
      "We know what personal data we hold and have DPDP-compliant notices and consent",
      "We can report a cyber incident to CERT-In within 6 hours",
    ),
    foot: "Serving clients across India",
  },
};
