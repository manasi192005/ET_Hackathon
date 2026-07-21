/**
 * generate-sample-pdfs.mjs
 * Run: node scripts/generate-sample-pdfs.mjs
 * Creates 5 demo PDFs in the project root that work perfectly with the AI pipeline.
 */
import PDFDocument from "pdfkit"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, "..", "sample-pdfs")
fs.mkdirSync(outDir, { recursive: true })

function makePDF(filename, buildFn) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" })
    const stream = fs.createWriteStream(path.join(outDir, filename))
    doc.pipe(stream)
    buildFn(doc)
    doc.end()
    stream.on("finish", () => { console.log(`✓ Created: ${filename}`); resolve() })
    stream.on("error", reject)
  })
}

function header(doc, title, subtitle) {
  doc.fontSize(20).fillColor("#1a1a2e").text(title, { underline: false })
  doc.fontSize(11).fillColor("#555").text(subtitle)
  doc.moveDown(0.5)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#0d7377").lineWidth(2).stroke()
  doc.moveDown(1).fillColor("#000")
}

function section(doc, title) {
  doc.moveDown(0.8)
  doc.fontSize(13).fillColor("#0d7377").text(title, { underline: false })
  doc.moveDown(0.3).fillColor("#000").fontSize(10)
}

function row(doc, label, value) {
  doc.fontSize(10).fillColor("#333").text(`${label}: `, { continued: true }).fillColor("#000").text(value)
}

// ── PDF 1: Project Schedule & Delay Report ───────────────────────────────────
await makePDF("01_Project_Schedule_Delay_Report.pdf", (doc) => {
  header(doc, "Project Schedule & Delay Impact Report", "Hyperscale Data Centre Phase II — Week 28 Status")

  section(doc, "Executive Summary")
  doc.text("This report covers the Week 28 schedule review for the Hyperscale Data Centre Phase II EPC project. A critical delay has been identified on the UPS Unit A delivery from Vendor Schneider Electric, impacting the commissioning start date by 14 days. The delay originates from manufacturing quality hold at the OEM factory in Germany, with revised dispatch expected on Aug 10, 2026.")
  doc.moveDown(0.5)
  doc.text("The critical path tasks — UPS installation, electrical integration, and commissioning readiness — are all directly affected. Project completion has shifted from Sep 15, 2026 to Sep 29, 2026 unless mitigation actions are executed this week.")

  section(doc, "Delayed Item Details")
  row(doc, "Delayed Item", "UPS Unit A (800kVA Schneider Electric Galaxy VM)")
  row(doc, "Planned Delivery Date", "Jul 25, 2026")
  row(doc, "Revised Actual Date", "Aug 10, 2026")
  row(doc, "Slip Days", "14 days")
  row(doc, "Expected Impact", "Commissioning start delayed by 2 weeks — project completion moves to Sep 29, 2026")
  row(doc, "Root Cause", "Manufacturing quality hold — insulation testing failure at OEM factory, Germany")
  row(doc, "Responsible Vendor", "Schneider Electric — Purchase Order PO-2026-0441")

  section(doc, "Critical Path Analysis")
  doc.text("The following tasks sit on the critical path and are directly impacted by the UPS delivery delay:")
  doc.moveDown(0.3)
  const cpTasks = [
    ["Task C", "UPS Unit A Delivery", "Jul 25 → Aug 10", "14-day slip", "DELAYED"],
    ["Task D", "UPS Installation & Cabling", "Aug 01 → Aug 15", "14-day slip", "AT RISK"],
    ["Task E", "Electrical Integration & Testing", "Aug 08 → Aug 22", "14-day slip", "AT RISK"],
    ["Task F", "Commissioning Readiness Sign-off", "Aug 15 → Aug 29", "14-day slip", "AT RISK"],
    ["Task G", "Final Handover & HAT", "Aug 20 → Sep 03", "14-day slip", "AT RISK"],
  ]
  cpTasks.forEach(([id, name, dates, slip, status]) => {
    doc.fontSize(9).text(`  ${id}: ${name} | ${dates} | Slip: ${slip} | Status: ${status}`)
  })

  section(doc, "Non-Critical Tasks (Float Available)")
  doc.text("Task H: Internal fit-out and raised floor works — 6 days float, currently on programme.")
  doc.text("Task A: Design freeze — complete, no impact.")
  doc.text("Task B: Long-lead procurement (Transformer, Switchgear) — 2-day float remaining.")

  section(doc, "Mitigation Actions Required")
  doc.text("1. Procurement to escalate to Schneider Electric VP-level by Jul 22, 2026 for expedited dispatch.")
  doc.text("2. Construction to pre-mobilise UPS installation crew for standby from Aug 08, 2026.")
  doc.text("3. Commissioning team to revise IST schedule and notify client of revised handover date.")
  doc.text("4. Consider parallel activities — begin Switchgear and BMS integration ahead of UPS arrival.")

  section(doc, "Schedule Summary Table")
  row(doc, "Overall Project Duration (baseline)", "120 days")
  row(doc, "Current Projected Duration", "134 days (+14 days)")
  row(doc, "Schedule Adherence", "68% (down from 82% last week)")
  row(doc, "Budget Impact", "Expediting costs estimated at $45,000 additional")
  row(doc, "Revised Completion Date", "Sep 29, 2026")
  row(doc, "Original Completion Date", "Sep 15, 2026")
  row(doc, "Report Prepared By", "Project Controls — Ahmad Al-Rashidi, PMP")
  row(doc, "Report Date", "Jul 21, 2026")
})

// ── PDF 2: Commissioning IST Checklist ───────────────────────────────────────
await makePDF("02_Commissioning_IST_Checklist.pdf", (doc) => {
  header(doc, "Integrated System Test (IST) Commissioning Checklist", "Hyperscale Data Centre Phase II — Temporary Power & Critical Systems")

  section(doc, "Commissioning Scope & Status")
  doc.text("This IST checklist covers all critical systems required for Temporary Power Energization, Switchgear Functional Testing, BMS Integration, and Fire Alarm Interface Verification. The checklist has been cross-referenced against the open punch list and pre-commissioning inspection records as of Jul 21, 2026.")
  doc.moveDown(0.3)
  doc.text("Overall Commissioning Readiness: AT RISK — 3 of 5 test packages blocked by open punch list items.")

  section(doc, "Test Package 1: Temporary Power Energization")
  row(doc, "Test ID", "IST-001")
  row(doc, "Expected Status", "Ready for test")
  row(doc, "Current Status", "BLOCKED — Likely Fail")
  row(doc, "Open Punch List Item", "UPS Unit A delivery delayed to Aug 10, 2026 — temporary power bus cannot be energised without UPS in place")
  row(doc, "Responsible Party", "Procurement + Electrical Contractor (Al Fara'a)")
  row(doc, "Prerequisite", "UPS delivery, installation, and pre-commissioning check must complete first")
  row(doc, "Recommended Action", "Reschedule IST-001 to no earlier than Aug 17, 2026")

  section(doc, "Test Package 2: Switchgear Functional Test")
  row(doc, "Test ID", "IST-002")
  row(doc, "Expected Status", "Ready for test")
  row(doc, "Current Status", "BLOCKED — Likely Fail")
  row(doc, "Open Punch List Item", "Incomplete installation in MV panel room — Bus coupler CB3 not yet landed, 3 cable terminations outstanding (ref: Punch List PL-0047)")
  row(doc, "Responsible Party", "Electrical Contractor (Al Fara'a)")
  row(doc, "Recommended Action", "Close PL-0047 by Aug 01, 2026 to unlock test")

  section(doc, "Test Package 3: BMS Integration Test")
  row(doc, "Test ID", "IST-003")
  row(doc, "Expected Status", "Ready for test")
  row(doc, "Current Status", "AT RISK — Watch")
  row(doc, "Open Punch List Item", "Pending I/O tag verification for 47 BMS points — Honeywell contractor has submitted revised schedule for completion by Aug 05, 2026")
  row(doc, "Responsible Party", "BMS Contractor (Honeywell)")
  row(doc, "Recommended Action", "Confirm I/O tag completion by Aug 05 and re-test signal mapping before IST-003")

  section(doc, "Test Package 4: Fire Alarm Interface Check")
  row(doc, "Test ID", "IST-004")
  row(doc, "Expected Status", "Ready for test")
  row(doc, "Current Status", "PASS — Ready to proceed")
  row(doc, "Open Punch List Item", "No open punch list items. Pre-commissioning record signed off Jul 18, 2026")
  row(doc, "Responsible Party", "Fire Systems Contractor (Gunnebo)")
  row(doc, "Recommended Action", "Proceed with IST-004 — schedule for Aug 03, 2026")

  section(doc, "Test Package 5: CRAC Unit Cooling Verification")
  row(doc, "Test ID", "IST-005")
  row(doc, "Expected Status", "Ready for test")
  row(doc, "Current Status", "WATCH — Minor risk")
  row(doc, "Open Punch List Item", "CRAC Unit #3 refrigerant top-up outstanding — scheduled for Jul 25, 2026")
  row(doc, "Responsible Party", "Mechanical Contractor (Petrofac MEP)")
  row(doc, "Recommended Action", "Confirm refrigerant works complete before scheduling IST-005")

  section(doc, "Commissioning Summary")
  row(doc, "Total Test Packages", "5")
  row(doc, "Ready to Proceed", "1 (IST-004)")
  row(doc, "At Risk", "2 (IST-003, IST-005)")
  row(doc, "Likely to Fail / Blocked", "2 (IST-001, IST-002)")
  row(doc, "Revised IST Start Date", "Aug 17, 2026 (subject to UPS delivery)")
  row(doc, "Commissioning Manager", "Priya Nair, CEng")
  row(doc, "Report Date", "Jul 21, 2026")
})

// ── PDF 3: Shipment & Geospatial Tracking Log ─────────────────────────────────
await makePDF("03_Shipment_Tracking_Log.pdf", (doc) => {
  header(doc, "Long-Lead Equipment Shipment & Tracking Log", "Hyperscale Data Centre Phase II — Week 28 Logistics Report")

  section(doc, "Logistics Overview")
  doc.text("This tracking log covers all long-lead equipment shipments for the data centre EPC project. Four major equipment packages are currently in transit or at various delivery stages. One item (UPS Unit A) is classified as DELAYED with confirmed 14-day slip. All other items are tracking within acceptable tolerance bands as of Jul 21, 2026.")

  section(doc, "Equipment 1: UPS Unit A (800kVA)")
  row(doc, "Equipment", "UPS Unit A — Schneider Electric Galaxy VM 800kVA")
  row(doc, "Purchase Order", "PO-2026-0441")
  row(doc, "Current Location", "Jebel Ali Port, Dubai — Customs clearance hold")
  row(doc, "Delivery Stage", "In transit — customs clearance")
  row(doc, "Status", "DELAYED")
  row(doc, "Planned Delivery Date", "Jul 25, 2026")
  row(doc, "Revised Delivery Date", "Aug 10, 2026")
  row(doc, "Delay Reason", "Manufacturing quality hold at OEM factory (Germany) — insulation test failure now resolved. Vessel departed Hamburg Jul 12. Customs release expected Aug 08.")
  row(doc, "Risk to Schedule", "CRITICAL — 14-day slip propagates to commissioning start")
  row(doc, "Action Required", "Procurement to expedite customs clearance agent and confirm priority delivery to site")

  section(doc, "Equipment 2: 33kV Power Transformer")
  row(doc, "Equipment", "33kV/11kV Transformer — ABB ONAN 5MVA")
  row(doc, "Purchase Order", "PO-2026-0388")
  row(doc, "Current Location", "Factory yard — ABB Zurich, Switzerland")
  row(doc, "Delivery Stage", "At dispatch hub — awaiting truck loading")
  row(doc, "Status", "AT RISK")
  row(doc, "Planned Delivery Date", "Jul 28, 2026")
  row(doc, "Latest Expected Delivery", "Aug 01, 2026")
  row(doc, "Delay Reason", "Haulage contractor truck availability — 3-day delay at dispatch hub. Air freight option being evaluated.")
  row(doc, "Risk to Schedule", "HIGH — 2-day float on Task B, any further slip enters critical path")

  section(doc, "Equipment 3: Precision Cooling CRAC Units")
  row(doc, "Equipment", "CRAC Units x4 — Schneider Electric InRow RD 30kW")
  row(doc, "Purchase Order", "PO-2026-0412")
  row(doc, "Current Location", "Local warehouse — Jebel Ali Free Zone, Dubai")
  row(doc, "Delivery Stage", "On site — pre-commissioning in progress")
  row(doc, "Status", "ON TRACK")
  row(doc, "Actual Delivery Date", "Jul 15, 2026 (3 days ahead of plan)")
  row(doc, "Note", "All 4 units delivered and positioned. Pre-commissioning started Jul 18. Refrigerant top-up for CRAC #3 scheduled Jul 25.")

  section(doc, "Equipment 4: MV Switchgear Panel")
  row(doc, "Equipment", "MV Switchgear — Siemens NXPLUS C 12kV, 8 panels")
  row(doc, "Purchase Order", "PO-2026-0356")
  row(doc, "Current Location", "OEM plant — Siemens Regensburg, Germany")
  row(doc, "Delivery Stage", "Customs clearance — Rotterdam port")
  row(doc, "Status", "WATCH")
  row(doc, "Planned Delivery Date", "Aug 05, 2026")
  row(doc, "Note", "Customs documentation complete. Vessel ETD Rotterdam Jul 24. Monitor weekly.")
  row(doc, "Risk", "Low — 5-day float. Escalate if customs delay exceeds 2 days.")

  section(doc, "Logistics Summary")
  row(doc, "Total Shipments Tracked", "4 major equipment packages")
  row(doc, "On Track", "1 (CRAC Units — delivered)")
  row(doc, "At Risk / Watch", "2 (Transformer, Switchgear)")
  row(doc, "Delayed", "1 (UPS Unit A — CRITICAL)")
  row(doc, "Logistics Coordinator", "Fatima Al-Hassan, CILT")
  row(doc, "Report Date", "Jul 21, 2026")
})

// ── PDF 4: Equipment Specification Sheet ─────────────────────────────────────
await makePDF("04_Equipment_Spec_Sheet_UPS_Systems.pdf", (doc) => {
  header(doc, "Equipment Specification Sheet — UPS & Power Systems", "Hyperscale Data Centre Phase II — Vendor Submittal Review")

  section(doc, "Document Purpose")
  doc.text("This submittal covers the technical specification and vendor compliance review for the Uninterruptible Power Supply (UPS) systems specified for the Hyperscale Data Centre Phase II project. The document includes spec compliance check against the Engineer of Record (EOR) specification Clause 16.4.")

  section(doc, "UPS Unit A — Primary Specification")
  row(doc, "Manufacturer", "Schneider Electric")
  row(doc, "Model", "Galaxy VM 800kVA 3-phase Online Double Conversion")
  row(doc, "Rated Power", "800 kVA / 720 kW at 0.9 power factor")
  row(doc, "Input Voltage", "380V / 400V / 415V (±10%) 3-phase")
  row(doc, "Output Voltage", "400V ±1% 3-phase")
  row(doc, "Efficiency", "97.0% at full load (ECO mode: 99.0%)")
  row(doc, "Battery Runtime", "10 minutes at full load (2N configuration)")
  row(doc, "Battery Type", "VRLA AGM sealed lead-acid, 10-year design life")
  row(doc, "Compliance", "IEC 62040-1, IEC 62040-3 Class VFI-SS-111 — COMPLIANT")
  row(doc, "EOR Spec Reference", "Clause 16.4.2 — Online double conversion, min 800kVA, Class VFI")
  row(doc, "Submittal Status", "APPROVED with comments — Rev 3 accepted Jul 05, 2026")

  section(doc, "Spec Compliance Checklist")
  const checks = [
    ["Online double-conversion topology", "Required", "Galaxy VM — VFI-SS-111", "PASS"],
    ["Min 800kVA capacity", "800 kVA min", "800 kVA", "PASS"],
    ["Input power factor ≥ 0.99", "≥ 0.99", "0.99 at full load", "PASS"],
    ["Efficiency ≥ 96% at full load", "≥ 96%", "97.0%", "PASS"],
    ["Output voltage regulation ±1%", "±1%", "±1%", "PASS"],
    ["SNMP monitoring card", "Required", "Included (EcoStruxure)", "PASS"],
    ["Battery runtime 10 min at 100%", "≥ 10 min", "10 min (2N)", "PASS"],
    ["IP rating for battery cabinet", "IP20 min", "IP20", "PASS"],
    ["SEISMIC zone 1 rated", "Required", "Zone 1 certified", "PASS"],
    ["Footprint ≤ 1200mm x 800mm", "≤ 1200x800mm", "1105mm x 765mm", "PASS"],
  ]
  checks.forEach(([req, spec, provided, status]) => {
    doc.fontSize(9).text(`  ${req} | Spec: ${spec} | Provided: ${provided} | ${status}`)
  })

  section(doc, "Risk Items Identified in Submittal Review")
  doc.text("RISK 1 — Lead time: OEM confirms 18-week lead time from order (Feb 15, 2026). Original schedule assumed 16 weeks. 2-week risk now confirmed as 14-day delay (see Schedule Report).")
  doc.text("RISK 2 — Battery compatibility: Ensure battery strings are compatible with existing DCIM monitoring system (Nlyte Software). Vendor to provide BACnet/Modbus mapping document by Aug 01, 2026.")
  doc.text("RISK 3 — Weight distribution: UPS unit weight 3,200kg — structural engineer to confirm raised floor loading capacity in Room DC-02 before installation.")

  section(doc, "PDU & Distribution Board Specification")
  row(doc, "PDU Manufacturer", "Raritan")
  row(doc, "PDU Model", "PX3-5190R 3-phase 60A per phase")
  row(doc, "Quantity", "48 units per data hall (2 per rack aisle)")
  row(doc, "Outlet Configuration", "12x C13, 6x C19 per PDU")
  row(doc, "Monitoring", "Per-outlet power monitoring, SNMP v3 — COMPLIANT")
  row(doc, "Submittal Status", "APPROVED — Rev 1 accepted Jun 28, 2026")

  section(doc, "Document Control")
  row(doc, "Prepared By", "Mechanical & Electrical Engineering — Hamid Tehrani, IEng")
  row(doc, "Reviewed By", "EOR — Arcadis Engineering")
  row(doc, "Document Date", "Jul 21, 2026")
  row(doc, "Revision", "Rev 3")
})

// ── PDF 5: Risk Register ─────────────────────────────────────────────────────
await makePDF("05_Risk_Register_DC_Phase2.pdf", (doc) => {
  header(doc, "Project Risk Register — Week 28", "Hyperscale Data Centre Phase II EPC — Risk & Opportunity Management")

  section(doc, "Risk Register Summary")
  doc.text("This risk register captures all active risks as of the Week 28 review. Total active risks: 6. Of these, 2 are rated Critical (requiring immediate action), 2 are High, 1 is Medium, and 1 is Low. The two critical risks are directly linked to the UPS delivery delay and commissioning readiness. Budget contingency consumption is tracking at 38% of the allocated $2.1M risk contingency.")

  section(doc, "Risk 1 — CRITICAL: UPS Delivery Delay")
  row(doc, "Risk ID", "RSK-001")
  row(doc, "Risk Description", "UPS Unit A (Schneider Electric 800kVA) delivery delayed by 14 days due to manufacturing quality hold")
  row(doc, "Priority", "CRITICAL")
  row(doc, "Probability", "HIGH — Delay is confirmed, vessel has departed")
  row(doc, "Impact", "14-day slip on critical path, commissioning delayed, handover to client moved to Sep 29, 2026")
  row(doc, "Affected Milestone", "UPS Installation → Electrical Integration → Commissioning Start → Final Handover")
  row(doc, "Owner", "Procurement — Fatima Al-Hassan")
  row(doc, "Recommendation", "1) Expedite customs clearance at Jebel Ali Port. 2) Pre-mobilise installation crew. 3) Notify client and update programme. 4) Claim extension of time under contract Clause 14.3.")

  section(doc, "Risk 2 — CRITICAL: Commissioning Test Failure")
  row(doc, "Risk ID", "RSK-002")
  row(doc, "Risk Description", "IST cannot proceed as scheduled — 2 of 5 test packages blocked by open punch list items and UPS delay")
  row(doc, "Priority", "CRITICAL")
  row(doc, "Probability", "HIGH — Confirmed blocked based on current programme")
  row(doc, "Impact", "IST delay cascades to HAT, client acceptance, and go-live date for cloud tenant (Google Cloud, Phase 1 racks)")
  row(doc, "Affected Milestone", "IST Completion, Final Handover, Client Acceptance")
  row(doc, "Owner", "Commissioning — Priya Nair")
  row(doc, "Recommendation", "Revise commissioning sequence — start with IST-004 (Fire Alarm, ready to go) and IST-003 (BMS, minimal risk). Issue revised IST programme to client by Jul 25, 2026.")

  section(doc, "Risk 3 — HIGH: Transformer Dispatch Delay")
  row(doc, "Risk ID", "RSK-003")
  row(doc, "Risk Description", "33kV Transformer haulage delay at ABB Zurich factory — 3-day truck availability issue")
  row(doc, "Priority", "HIGH")
  row(doc, "Probability", "MEDIUM — 3-day delay confirmed, air freight being evaluated")
  row(doc, "Impact", "Task B float (2 days) will be consumed. Any further delay enters the critical path")
  row(doc, "Affected Milestone", "Long-Lead Procurement Completion")
  row(doc, "Owner", "Procurement — Ahmad Al-Rashidi")
  row(doc, "Recommendation", "Approve air freight option for transformer (cost: ~$18,000) if truck not confirmed by Jul 24, 2026.")

  section(doc, "Risk 4 — HIGH: Subcontractor Resource Gap")
  row(doc, "Risk ID", "RSK-004")
  row(doc, "Risk Description", "Electrical subcontractor (Al Fara'a) reporting 15% labour shortage on site due to competing project demands")
  row(doc, "Priority", "HIGH")
  row(doc, "Probability", "MEDIUM")
  row(doc, "Impact", "Switchgear installation and cable terminations may fall behind, blocking IST-002")
  row(doc, "Affected Milestone", "Switchgear Functional Test, Commissioning Readiness")
  row(doc, "Owner", "Construction — Rajan Mehta")
  row(doc, "Recommendation", "Review subcontractor resource plan by Jul 23. Mobilise second crew from Al Fara'a Sharjah depot if needed.")

  section(doc, "Risk 5 — MEDIUM: BMS I/O Tag Delay")
  row(doc, "Risk ID", "RSK-005")
  row(doc, "Risk Description", "47 BMS I/O tags pending verification — Honeywell contractor submitted revised completion date of Aug 05, 2026")
  row(doc, "Priority", "MEDIUM")
  row(doc, "Probability", "LOW — Contractor confident of Aug 05 delivery")
  row(doc, "Impact", "IST-003 (BMS Integration) may be delayed if tags not complete")
  row(doc, "Affected Milestone", "BMS Integration Test (IST-003)")
  row(doc, "Owner", "BMS — Honeywell")
  row(doc, "Recommendation", "Weekly check-in with Honeywell BMS lead. Confirm tag list completion by Jul 30.")

  section(doc, "Risk 6 — LOW: MV Switchgear Customs")
  row(doc, "Risk ID", "RSK-006")
  row(doc, "Risk Description", "Siemens MV Switchgear at Rotterdam port for customs clearance — low risk but monitor")
  row(doc, "Priority", "LOW")
  row(doc, "Probability", "LOW")
  row(doc, "Impact", "5-day float available on Task B — manageable unless port delay exceeds 3 days")
  row(doc, "Affected Milestone", "MV Switchgear Installation")
  row(doc, "Owner", "Logistics — Fatima Al-Hassan")
  row(doc, "Recommendation", "Monitor weekly. Escalate if customs confirmation not received by Jul 26, 2026.")

  section(doc, "Risk Register Summary Table")
  row(doc, "Total Active Risks", "6")
  row(doc, "Critical", "2 (RSK-001, RSK-002)")
  row(doc, "High", "2 (RSK-003, RSK-004)")
  row(doc, "Medium", "1 (RSK-005)")
  row(doc, "Low", "1 (RSK-006)")
  row(doc, "Budget Contingency Used", "$798,000 of $2,100,000 (38%)")
  row(doc, "Risk Register Owner", "Ahmad Al-Rashidi, PMP — Project Controls Manager")
  row(doc, "Next Review", "Jul 28, 2026 — Week 29 PMT Meeting")
  row(doc, "Report Date", "Jul 21, 2026")
})

console.log("\n✅ All 5 sample PDFs created in ./sample-pdfs/")
console.log("   Upload them to the Documents page to test the full AI pipeline.")
