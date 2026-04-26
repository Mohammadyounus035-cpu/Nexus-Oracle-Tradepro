# Clinical AI Deployment Contract Template
## Hospital-Vendor Agreement for Safe, Monitored AI Deployment

---

## PREAMBLE

This agreement establishes binding requirements for deployment of clinical AI systems in hospital environments. It embeds interventions I1, I3, I7, and I10 from the Clinical AI Failure Surface v0.2 as enforceable contractual obligations.

**Parties:**
- **Hospital**: [Name], [Institution ID]
- **Vendor**: [AI Company], [License/Certification ID]
- **Model**: [Name and Version], FDA Clearance/De Novo reference: [ID]
- **Effective Date**: [Date]
- **Review Date**: [12 months from effective date]

**Governing Principle:**
Clinical AI is not a static device. This contract treats it as a dynamic, drifting system that requires continuous monitoring, periodic validation, and bounded deployment conditions. Safety requires mutual accountability: hospital for deployment within approved conditions, vendor for maintaining performance within those conditions.

---

## SECTION 1: APPROVED DEPLOYMENT BOUNDARY (Intervention I7)

The model is approved for deployment **only under the following conditions**. Any deviation requires explicit written amendment and re-validation.

### 1.1 Patient Population

**Approved Population Characteristics:**

| Characteristic | Approved Range | Measurement Method |
|---|---|---|
| Age | [e.g., 18–85 years] | Chart review, validated sample (n=100/month) |
| Primary diagnoses | [e.g., suspected pneumothorax, acute respiratory] | ICD-10 codes at admission |
| Comorbidity burden | [e.g., Charlson score <5] | Medical history extraction, validated sample |
| Exclusion criteria | [e.g., pregnancy, prior thoracic surgery] | Chart extraction, monthly audit |

**Population Drift Detection:**
- Hospital must measure actual patient population monthly
- If any characteristic drifts >20% from approved range: notify vendor within 2 business days
- Vendor has 10 business days to assess impact; if impact >0.05 AUC, hospital must enter Graduated Deployment (Section 4) or discontinue use
- Hospital maintains right to audit vendor's assessment

### 1.2 Imaging Protocol

**Approved Imaging Specifications:**

| Parameter | Approved Value | Drift Tolerance |
|---|---|---|
| Scanner manufacturer | [e.g., GE, Siemens, Philips] | Any change requires re-validation |
| Scanner model | [e.g., Optima XR240] | Any model change requires re-validation |
| Acquisition protocol | [e.g., standard chest PA/lateral] | Protocol changes require re-validation |
| Image format | [e.g., DICOM, resolution ≥1024×1024] | Format changes require re-validation |

**Protocol Change Process:**
- If hospital changes scanner or acquisition protocol: notify vendor ≥30 days in advance
- Vendor must validate model on ≥100 images from new protocol before hospital deployment
- Hospital may not deploy on new protocol without vendor validation AND independent audit (Section 3.3)

### 1.3 Clinical Workflow

**Approved Workflow Context:**

| Workflow Element | Approved Configuration | Change Notification |
|---|---|---|
| Clinician role | [e.g., radiologist review required] | Mandatory change notification |
| AI timing in workflow | [e.g., first-read assistance, not triage] | Mandatory change notification |
| Override authority | [e.g., radiologist, attending physician] | Mandatory change notification |
| Documentation requirement | [e.g., radiologist documents AI use/override] | Mandatory change notification |
| Time-to-action requirement | [e.g., ≤15 minutes from image acquisition] | Not to be exceeded without vendor approval |

**Workflow Deviation Monitoring:**
- Hospital samples 50 cases/month; documents actual workflow vs. approved workflow
- Deviation rate >10%: triggers requirement for re-training or workflow correction within 30 days
- Hospital tracks override rate (Section 2.5); if override rate >0.40: indicates possible workflow misalignment

---

## SECTION 2: MANDATORY REAL-TIME MONITORING (Intervention I1)

Vendor must deploy a monitoring system that reports the following metrics to hospital AND to a neutral registry (Registry details in Section 2.7).

### 2.1 Performance Metrics (Weekly Reporting)

**Metric Set: Accuracy Tracking**

| Metric | Calculation | Reporting Frequency | Alert Threshold | Action if Triggered |
|---|---|---|---|---|
| Overall Accuracy | Correct predictions / Total predictions | Weekly | Drift >0.05 from baseline | Vendor assessment + hospital audit within 5 days |
| Sensitivity (Recall) | TP / (TP + FN) | Weekly | Drift >0.10 from baseline | Immediate escalation; consider deployment pause |
| Specificity | TN / (TN + FP) | Weekly | Drift >0.10 from baseline | Escalation; assess false positive harm |
| AUC-ROC | Standard metric | Weekly | Drift >0.05 from baseline | Vendor assessment within 5 days |
| Calibration Error | Max \|predicted probability – observed frequency\| across risk bins | Weekly | >0.15 | Escalation; indicates miscalibration |

**Baseline Definition:**
Baseline = mean performance over first 4 weeks of deployment at this hospital.
Drift = current week performance – baseline, calculated via rolling 4-week window.

### 2.2 Fairness Metrics (Bi-Weekly Reporting)

Model performance stratified by protected classes. Hospital must have sufficient data to compute these metrics.

| Stratification | Metric | Reporting Frequency | Alert Threshold | Action if Triggered |
|---|---|---|---|---|
| Gender (M/F/Other) | Accuracy, Sensitivity, Specificity per group | Bi-weekly | AUC difference >0.10 between any two groups | Vendor assessment; fairness audit required |
| Age groups (18–40, 41–65, 66+) | Accuracy per group | Bi-weekly | Accuracy difference >0.10 between youngest and oldest | Vendor assessment; stratified retraining considered |
| Scanner model (if multi-scanner) | Overall AUC per scanner | Weekly | AUC difference >0.08 between scanners | Vendor assessment; may indicate hardware drift |
| Race/ethnicity (if available in EHR) | Sensitivity per group (for screening tasks) | Bi-weekly | Sensitivity difference >0.15 between groups | Escalation; fairness audit required within 7 days |

**Fairness Drift Definition:**
Fairness drift = systematic divergence in accuracy/sensitivity between demographic groups, even if overall performance stable.

### 2.3 Prediction Distribution Monitoring (Weekly)

**Purpose:** Detect population shift (F6 — Compounding Domain Drift).

| Metric | Calculation | Frequency | Alert Threshold |
|---|---|---|---|
| Prediction distribution shift | KL divergence between P(prediction\_this\_week) and P(prediction\_baseline) | Weekly | KL > 0.10 (custom threshold based on model) |
| Positive prediction rate | Fraction of predictions with positive class | Weekly | Drift >0.15 from baseline |
| Confidence distribution | Mean predicted probability, std dev | Weekly | Mean drift >0.10 or std dev change >20% |
| Feature distribution shift | Per-feature statistics (if available) | Monthly | Per-feature KL > threshold (vendor-specified) |

### 2.4 Clinician Feedback Loop (Weekly)

**Purpose:** Detect automation bias (F8) and capture failure modes (S6 knowledge asymmetry).

| Signal | Definition | Collection Method | Frequency | Alert Threshold |
|---|---|---|---|---|
| Override rate | # overrides / # AI predictions | Integrated with EHR; automatic logging | Weekly | >0.40 (indicates possible miscalibration or workflow issue) |
| Override reasons (structured) | Clinician selects reason: (a) wrong diagnosis, (b) wrong confidence, (c) doesn't fit workflow, (d) would order differently anyway, (e) other | Dropdown at override point | Weekly | If (a) + (b) >20% of overrides: escalate to vendor |
| Time to override decision | Minutes from AI presentation to override | Automatic timestamp | Weekly | >75th percentile indicates workflow friction |
| Non-override but review | Cases reviewed by clinician without override, but documented doubt | Optional clinician note field | Weekly | If >20% of cases: possible need for recalibration |
| Clinician confidence in AI | Periodic survey (quarterly): "How confident are you in this AI?" 1–5 scale | Quarterly survey | N/A | Declining trend triggers vendor + hospital meeting |

**Override Data Flow:**
- Hospital's EHR system logs every override with reason code
- Weekly aggregate report sent to Vendor + Registry
- Vendor must respond to override reasons; if (a)+(b) >20%: triggers root cause analysis within 10 days

### 2.5 Performance by Use Case (Weekly, if applicable)

If model is used for multiple tasks (e.g., pneumothorax detection + consolidation detection), report separately.

| Use Case | AUC | Sensitivity | Specificity | Override Rate | N Cases | Alert Threshold |
|---|---|---|---|---|---|---|
| Task A | [weekly] | [weekly] | [weekly] | [weekly] | [weekly] | AUC drift >0.05 |
| Task B | [weekly] | [weekly] | [weekly] | [weekly] | [weekly] | AUC drift >0.05 |

### 2.6 Data Quality Flags (Continuous)

| Flag | Condition | Action |
|---|---|---|
| Insufficient data | <10 cases/week | Warning; monitoring continues but statistical power limited |
| Missing labels | >20% cases missing ground truth label | Warning; labeled set only |
| Label disagreement | Inter-rater agreement <0.70 on sample | Warning; assessment may be noisy |
| Data anomaly | Sudden change in image quality, metadata, or feature distribution | Investigation required within 2 days |

### 2.7 Monitoring Infrastructure & Registry

**Hospital Obligations:**
- Deploy monitoring system (vendor-supplied) within 14 days of go-live
- Ensure monitoring captures all predictions on approved patient population
- Transmit weekly metrics to vendor + neutral registry
- Maintain audit log of all metric calculations

**Vendor Obligations:**
- Provide/maintain monitoring system (no additional cost to hospital)
- Review metrics within 5 business days
- If metric crosses alert threshold: vendor initiates assessment (provide within 10 days) including:
  - Likely cause (population shift, hardware drift, label noise, model bug)
  - Recommended action (retraining, deployment pause, no action)
  - Timeline for action (immediate, 1 week, 1 month)
- Publish summary metrics (de-identified) to Registry quarterly

**Neutral Registry:**
- Third-party organization (TBD: FDA, academic consortium, or approved vendor)
- Collects de-identified metrics from all hospitals using model
- Publishes quarterly aggregate report (e.g., "across 12 hospitals, mean AUC = 0.85, range 0.78–0.89")
- Alerts FDA if systematic drift detected across multiple sites

---

## SECTION 3: STRATIFIED PERFORMANCE REPORTING (Intervention I3)

### 3.1 Baseline Performance Report (Pre-Deployment)

Before hospital deployment, vendor must provide:

**Table A: Overall Performance on Hospital's Data**
- Test set: ≥100 images from hospital (or similar population if hospital new)
- Metrics: AUC, Sensitivity, Specificity, Positive Predictive Value, Negative Predictive Value, Accuracy
- Confidence intervals (95%)

**Table B: Performance Stratified by Demographics**

| Stratum | N | AUC | Sensitivity | Specificity | Notes |
|---|---|---|---|---|---|
| All | 100 | X | Y | Z | — |
| Male | 50 | X1 | Y1 | Z1 | — |
| Female | 50 | X2 | Y2 | Z2 | If X1–X2 >0.10, flag as concern |
| Age 18–40 | 30 | X3 | Y3 | Z3 | — |
| Age 41–65 | 40 | X4 | Y4 | Z4 | — |
| Age 66+ | 30 | X5 | Y5 | Z5 | — |

**Table C: Performance by Scanner (if multi-scanner deployment)**

| Scanner | N | AUC | Sensitivity | Specificity | Notes |
|---|---|---|---|---|---|
| GE Optima | 35 | X | Y | Z | — |
| Siemens SOMATOM | 35 | X' | Y' | Z' | If AUC difference >0.08, flag |
| Philips | 30 | X'' | Y'' | Z'' | — |

**Table D: Performance by Disease Severity (if applicable)**

| Severity | N | AUC | Sensitivity | Specificity | Definition |
|---|---|---|---|---|---|
| Mild | 20 | X | Y | Z | [Vendor-specified] |
| Moderate | 50 | X' | Y' | Z' | — |
| Severe | 30 | X'' | Y'' | Z'' | — |

### 3.2 Ongoing Stratified Reporting (Quarterly)

Every 13 weeks (or per hospital requirement), vendor must provide updated Tables A–D using most recent hospital deployment data.

**Change from Baseline:**
Vendor must highlight any stratum where performance has drifted >0.05 AUC or >0.10 sensitivity/specificity.

### 3.3 Annual Independent Audit (Intervention I5)

Once per year, hospital may commission independent audit by third party (e.g., academic radiology department, compliance firm).

**Audit Scope:**
- Vendor provides model + monitoring data
- Auditor tests model on fresh sample (≥200 images) from hospital deployment
- Auditor compares reported metrics vs. actual performance
- Auditor assesses drift since deployment
- Auditor provides written report to hospital + vendor

**Costs:**
- Vendor reimburses audit costs (up to $20k/year)
- Results are confidential between hospital + vendor (unless fraud detected)

**Trigger for Mandatory Audit:**
- Vendor-reported AUC >0.10 below baseline, OR
- Fairness drift detected (F7), OR
- Override rate >0.40, OR
- Hospital requests for any reason

---

## SECTION 4: GRADUATED DEPLOYMENT (Intervention I10)

Model deployment occurs in phases, with explicit exit ramps.

### 4.1 Deployment Phases

**Phase 0: Pilot (Weeks 1–4)**
- AI active on 5–10% of eligible cases
- Radiologist reviews every prediction (no override authority; AI is informational)
- Monitoring metrics collected continuously
- Hospital + vendor review metrics weekly
- Success criteria: no systematic failures, metrics stable

**Decision Point (End of Week 4):**
- If metrics stable AND no critical failures: advance to Phase 1
- If metrics concerning: extend pilot, investigate, defer Phase 1
- If critical failure detected: halt deployment, investigate, may terminate

**Phase 1: Expanded Deployment (Weeks 5–12)**
- AI active on 30% of eligible cases
- Radiologist may use AI to inform decision (override authority permitted)
- Monitoring continues; alert thresholds active
- If any alert threshold crossed: revert to Phase 0 or halt

**Decision Point (End of Week 12):**
- If performance metrics stable, override rate <0.30, fairness metrics stable: advance to Phase 2
- If concerning drift or fairness issues: remain in Phase 1, investigate, revert if needed
- If critical failure: revert to Phase 0 or halt

**Phase 2: Full Deployment (Weeks 13+)**
- AI active on 100% of eligible cases
- Ongoing monitoring with alert-based escalation
- Mandatory quarterly performance review
- Annual independent audit

**Pause/Halt Criteria (any phase):**
- AUC drops >0.10 below baseline
- Sensitivity drops >0.15 below baseline (for safety-critical tasks)
- Fairness drift detected (AUC difference >0.10 between demographic groups)
- Override rate >0.50 (suggests model not trustworthy or workflow misaligned)
- Critical failure in individual case (e.g., missed life-threatening condition correlated with AI use)
- Vendor fails to respond to assessment request within 10 days

If pause triggered: revert to previous phase, investigate root cause within 5 days.

### 4.2 Exit Ramp Process

**If metrics continue to decline or critical issues persist:**
1. Hospital may request discontinuation with 14 days notice
2. Vendor must provide data export and knowledge transfer within 7 days
3. Hospital may pursue retraining, alternative model, or manual process
4. Liability for harms during deployment subject to contract Section 6

---

## SECTION 5: RETRAINING & DOMAIN ADAPTATION (Intervention I2)

### 5.1 Hospital-Initiated Retraining

If hospital experiences performance drift, vendor may retrain model on hospital's data.

**Retraining Conditions:**
- Hospital provides ≥500 newly labeled cases from deployment site
- Hospital provides ground truth labels (radiologist consensus recommended)
- Vendor uses domain-adaptive methods to prevent regression on original training distribution
- Vendor tests new model on:
  - Hospital's new data (validation set)
  - Vendor's original validation set (ensure no regression)
  - Fairness metrics on both distributions
- Vendor provides written assurance: "New model maintains ≥X% of original performance while improving by ≥Y% on new distribution"

**Retraining Cost:**
- First retraining per year: included in contract
- Additional retraining: $10k per retraining (or per contract)

### 5.2 Vendor-Initiated Retraining

If vendor detects systematic drift across multiple deployment sites, vendor may initiate retraining without hospital request.

**Notification:**
- Vendor notifies hospital ≥30 days before deploying retrained model
- Vendor provides performance comparison: old vs. new model
- Hospital may opt-out (keep current model) or accept (deploy new model, restart Phase 1)

### 5.3 Bidirectional Drift Guarantee

Vendor commits that retraining on hospital data will not regress performance on original distribution by >0.05 AUC.

If regression >0.05 occurs, hospital may demand:
- Reversion to previous model version, OR
- Credit (reduction in contract cost), OR
- Termination with data return

---

## SECTION 6: LIABILITY & INDEMNIFICATION

### 6.1 Vendor Obligations

Vendor is responsible for:
- **Silent Degradation**: Vendor liable for harm if model degrades >0.10 AUC without detection due to vendor's failure to maintain monitoring system
- **Unvalidated Deployment**: Vendor liable if hospital deploys outside approved conditions AND vendor did not explicitly warn
- **Failure to Respond**: Vendor liable if metric alert triggered and vendor fails to assess within 10 days
- **Regression on Retraining**: Vendor liable if retraining causes regression >0.05 AUC (see Section 5.3)

Vendor indemnifies hospital against claims arising from vendor's failure to meet these obligations.

### 6.2 Hospital Obligations

Hospital is responsible for:
- **Deploying Within Approved Conditions**: Hospital liable if deployment diverges from Section 1 without vendor re-validation
- **Maintaining Monitoring**: Hospital liable if monitoring system disabled, manipulated, or not operational
- **Clinician Override Decisions**: Hospital liable for clinician's decision to override AI (vendor not liable for clinician actions)
- **Timely Notification**: Hospital liable if failure to notify vendor of population/protocol drift leads to undetected harm

Hospital indemnifies vendor against claims arising from hospital's failure to meet these obligations.

### 6.3 Shared Responsibility

**Harm Investigation Protocol:**
If adverse event occurs (patient harm potentially related to AI use):
1. Hospital + Vendor form joint investigation committee within 2 days
2. Committee reviews: case details, AI prediction, clinician action, monitoring metrics at time of event
3. Committee determines: was harm attributable to (a) AI failure, (b) clinician error, (c) joint failure, or (d) external factor?
4. Liability allocated per determination

**Insurance & Coverage:**
- Vendor maintains professional liability insurance covering AI systems (minimum $5M)
- Hospital maintains malpractice insurance covering AI-assisted diagnosis
- Both parties maintain notification obligations under state medical liability laws

---

## SECTION 7: TERM & TERMINATION

### 7.1 Initial Term
- **Duration**: 12 months from go-live date
- **Renewal**: Automatic renewal for 12 months unless either party provides 60 days notice of non-renewal

### 7.2 Termination for Cause

Hospital may terminate immediately if:
- Vendor fails to maintain monitoring system (>7 days downtime)
- Vendor fails to respond to metric alert within 15 days (twice)
- Critical patient safety issue identified
- Vendor ceases operations or loses FDA clearance

Vendor may terminate if:
- Hospital deploys outside approved conditions repeatedly and does not correct
- Hospital fails to pay (if any contract cost)
- Hospital's volume drops below [N] cases/month (indicating deployment below viability threshold)

### 7.3 Termination for Convenience

Either party may terminate with 30 days notice after initial 12-month term.

### 7.4 Data & Continuity Upon Termination
- Vendor must export all monitoring data, model artifacts, and documentation within 7 days
- Vendor must provide technical briefing to hospital on model behavior (optional, up to 4 hours)
- Hospital may use data for research/audit purposes (de-identified, with vendor consent if requested)

---

## SECTION 8: VENDOR SLA SCORECARD

Vendor commits to the following Service Level Agreements. Performance tracked quarterly.

### 8.1 Monitoring System Uptime

| SLA | Target | Measurement | Penalty if Missed |
|---|---|---|---|
| System availability | 99.5% uptime (excluding planned maintenance) | Continuous monitoring | Credit: $1k per 0.1% below target |
| Response time | Metric data available within 24 hours of collection | Weekly audit | Credit: $500 per 24-hour delay |
| Alert accuracy | <5% false alert rate (metrics crossing threshold incorrectly) | Monthly review | Credit: $250 per false alert cluster |

### 8.2 Vendor Assessment Timeliness

| SLA | Target | Measurement | Penalty if Missed |
|---|---|---|---|
| Initial response | Vendor acknowledges alert within 2 business days | Hospital record | Credit: $500 per missed deadline |
| Root cause analysis | Vendor completes assessment within 10 business days | Written report | Credit: $1k per missed deadline |
| Recommendation clarity | Assessment includes clear recommended action (retraining, monitor, no action) | Review by hospital | Rework (no cost to hospital) |

### 8.3 Performance Stability

| SLA | Target | Measurement | Penalty if Missed |
|---|---|---|---|
| Mean AUC drift | <0.02 AUC/quarter (averaged across all hospitals) | Quarterly summary | Credit: $1k per 0.01 AUC above target |
| Fairness stability | No stratum experiences >0.10 AUC drop | Quarterly audit | Credit: $2k per fairness event |
| Sensitivity stability | <0.05 sensitivity drop per quarter (safety-critical task) | Weekly monitoring | Alert escalation, possible pause |

### 8.4 Retraining Performance

If vendor initiates retraining:

| SLA | Target | Measurement | Penalty if Missed |
|---|---|---|---|
| Regression prevention | New model ≥95% of old model's performance | Validation test | Hospital may reject + demand reversion |
| Improvement delivery | New model improves by ≥5% on deployment distribution | Validation test | Hospital may reject + demand reversion |
| Deployment timeline | New model available ≥30 days after commitment | Calendar | Credit: $500 per week delay |

### 8.5 Credit Mechanism

Credits accumulate and are applied to following year's contract cost, or to audit/retraining fees.

---

## SECTION 9: GOVERNANCE & AMENDMENT

### 9.1 Quarterly Business Review

Vendor + Hospital meet quarterly (≥30 min call) to review:
- Monitoring metrics and trends
- Any alert events and resolutions
- Feedback from radiologists
- Planned protocol/population changes
- Retraining needs

Minutes documented and retained.

### 9.2 Annual Contract Review

At end of Year 1 (before renewal), full review of:
- Overall performance vs. baseline
- Fairness metrics and any disparities
- Clinician satisfaction (survey)
- Incident report summary
- Retraining frequency and effectiveness
- Recommended contract amendments

Result: either renewal as-is, renewal with modifications, or non-renewal.

### 9.3 Amendment Process

Changes to approved deployment boundary (Section 1) require:
1. Hospital + Vendor written agreement
2. Validation testing (if material change)
3. Update to monitoring baseline (if material change)
4. Amended contract signed by both parties

Examples of material changes:
- New scanner model
- Change in patient age/comorbidity range
- Different clinical workflow
- New use case

---

## SECTION 10: SIGNATURE & DATES

**Hospital:**
Name: _______________  
Title: _______________  
Date: _______________  
Authorized by: [Hospital Chief Medical Officer or equivalent]

**Vendor:**
Name: _______________  
Title: _______________  
Date: _______________  
Authorized by: [Vendor Legal/Compliance Officer]

---

## APPENDIX A: MONITORING METRIC CALCULATION SPECIFICATIONS

(Vendor to provide detailed formulas for each metric, including handling of edge cases, missing data, ties in predictions, etc.)

## APPENDIX B: ALERT ESCALATION WORKFLOW

(Hospital to provide escalation contacts; Vendor to confirm receipt and response protocol.)

## APPENDIX C: DATA SHARING & PRIVACY ADDENDUM

(HIPAA/HITECH compliance, de-identification protocol for registry, audit trail protection.)

## APPENDIX D: VENDOR PERFORMANCE DASHBOARD (TEMPLATE)

(Vendor to provide hospital with web-accessible dashboard showing real-time monitoring metrics, alerts, and assessment status. Hospital may share limited view with radiologists for transparency.)
