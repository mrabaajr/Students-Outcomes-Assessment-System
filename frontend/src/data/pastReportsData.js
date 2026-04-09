const createDownloadFilename = (title, schoolYear, extension = "html") => {
  const normalizedTitle = `${title}-${schoolYear}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedTitle || "past-report"}.${extension}`;
};

const defaultVariables = [
  { key: "distribution", label: "Distribution (i)" },
  { key: "studentsAnswered", label: "Students Answered" },
  { key: "got80OrHigher", label: "Got 80% or Higher" },
];

const buildSummaryTable = ({
  soId,
  soNumber,
  soTitle,
  soDescription,
  program,
  sourceAssessment,
  schoolYear,
  courses,
  attainmentPercent,
  targetLevel = 80,
}) => ({
  so_id: soId,
  so_number: soNumber,
  so_title: soTitle,
  so_description: soDescription,
  institution: "TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES",
  program,
  source_assessment: sourceAssessment,
  time_of_data_collection: schoolYear,
  courses,
  totals: {
    actual_student_total: courses.reduce((sum, course) => sum + Number(course.actual_class_size || 0), 0),
    virtual_class_size_total: Number(
      courses.reduce((sum, course) => sum + Number(course.virtual_class_size || 0), 0).toFixed(4)
    ),
    weighted_satisfactory_total: Number(
      courses.reduce((sum, course) => sum + Number(course.weighted_total || 0), 0).toFixed(4)
    ),
    attainment_percent: attainmentPercent,
    target_level: targetLevel,
    target_statement: `${targetLevel}% of the class gets satisfactory rating or higher`,
    conclusion: `${attainmentPercent}% of the class got satisfactory rating or higher. Thus, the level of attainment is ${
      attainmentPercent >= targetLevel ? "higher than" : "lower than"
    } the target level of ${targetLevel}%.`,
  },
  report_config_id: null,
  formula: "(got80OrHigher / studentsAnswered) * distribution",
  variables: defaultVariables,
});

const buildCourseRow = ({
  courseId,
  courseCode,
  courseName,
  actualClassSize,
  cli,
  answeredCount,
  indicators,
}) => ({
  course_id: courseId,
  course_code: courseCode,
  course_name: courseName,
  actual_class_size: actualClassSize,
  cli,
  answered_count: answeredCount,
  virtual_class_size: Number((actualClassSize * cli).toFixed(4)),
  indicators,
  weighted_total: Number(
    indicators.reduce((sum, indicator) => sum + Number(indicator.weighted_value || 0), 0).toFixed(4)
  ),
});

const buildIndicatorRow = ({
  indicatorId,
  label,
  distribution,
  answeredCount,
  satisfactoryCount,
}) => ({
  indicator_id: indicatorId,
  indicator_label: label,
  distribution,
  answered_count: answeredCount,
  satisfactory_count: satisfactoryCount,
  weighted_value: Number(
    ((satisfactoryCount / Math.max(answeredCount, 1)) * distribution).toFixed(4)
  ),
});

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const renderReportHtml = (report, audienceLabel) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${report.title}</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        font-family: Arial, sans-serif;
        color: #231f20;
        background: #f8f7f2;
      }
      .card {
        max-width: 880px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        overflow: hidden;
      }
      .hero {
        background: #231f20;
        color: #ffffff;
        padding: 28px 32px;
      }
      .hero p {
        margin: 6px 0 0;
        color: #d1d5db;
      }
      .content {
        padding: 28px 32px 32px;
      }
      .meta {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .meta-card {
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 14px 16px;
        background: #fafafa;
      }
      .meta-card span {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
        color: #6b7280;
        margin-bottom: 6px;
      }
      .summary {
        margin-bottom: 20px;
        line-height: 1.6;
      }
      ul {
        margin: 0;
        padding-left: 20px;
        line-height: 1.7;
      }
      .footer {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="hero">
        <h1>${report.title}</h1>
        <p>${audienceLabel} archived report sample</p>
      </div>
      <div class="content">
        <div class="meta">
          <div class="meta-card">
            <span>School Year</span>
            <strong>${report.schoolYear}</strong>
          </div>
          <div class="meta-card">
            <span>Semester</span>
            <strong>${report.semester}</strong>
          </div>
          <div class="meta-card">
            <span>Submitted</span>
            <strong>${new Date(report.dateSubmitted).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</strong>
          </div>
          <div class="meta-card">
            <span>Report Type</span>
            <strong>${report.reportType}</strong>
          </div>
          <div class="meta-card">
            <span>Courses Assessed</span>
            <strong>${report.coursesAssessed}</strong>
          </div>
          <div class="meta-card">
            <span>Students Assessed</span>
            <strong>${report.studentsAssessed}</strong>
          </div>
        </div>

        <div class="summary">
          <h2>Summary</h2>
          <p>${report.summary}</p>
        </div>

        <div>
          <h2>Highlights</h2>
          <ul>
            ${report.highlights.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>

        <div class="footer">
          Generated by: ${report.generatedBy}<br />
          Average Score: ${report.avgScore}%<br />
          Format: ${report.fileFormat}
        </div>
      </div>
    </div>
  </body>
</html>
`;

export const programChairPastReports = [
  {
    id: 101,
    title: "Assessment Reports and Performance Summary",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    dateSubmitted: "2026-03-24",
    reportType: "Program Summary",
    status: "Completed",
    coursesAssessed: 12,
    studentsAssessed: 148,
    avgScore: 76.4,
    fileFormat: "Sample HTML Report",
    generatedBy: "Program Chair Office",
    summary:
      "This archived snapshot summarizes the strongest and weakest student outcome trends across active Computer Engineering sections during the second semester.",
    highlights: [
      "SO 2 and SO 5 exceeded the 80% attainment threshold in most mapped courses.",
      "Lower attainment remained concentrated in first-year gateway subjects.",
      "Faculty follow-up actions were recommended for three sections with incomplete assessment coverage.",
    ],
    soSummaryTables: [
      buildSummaryTable({
        soId: 2,
        soNumber: 2,
        soTitle: "Design solutions for computer engineering problems",
        soDescription: "Students demonstrate structured design decisions supported by technical evidence.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 312, CPE 401, CPE 412",
        schoolYear: "2025-2026",
        attainmentPercent: 82.4,
        courses: [
          buildCourseRow({
            courseId: 312,
            courseCode: "CPE 312",
            courseName: "Embedded Systems",
            actualClassSize: 36,
            cli: 0.3333,
            answeredCount: 34,
            indicators: [
              buildIndicatorRow({ indicatorId: 21, label: "P1", distribution: 0.3333, answeredCount: 34, satisfactoryCount: 28 }),
              buildIndicatorRow({ indicatorId: 22, label: "P2", distribution: 0.3333, answeredCount: 34, satisfactoryCount: 27 }),
              buildIndicatorRow({ indicatorId: 23, label: "P3", distribution: 0.3334, answeredCount: 34, satisfactoryCount: 29 }),
            ],
          }),
          buildCourseRow({
            courseId: 401,
            courseCode: "CPE 401",
            courseName: "Computer Design",
            actualClassSize: 28,
            cli: 0.3333,
            answeredCount: 26,
            indicators: [
              buildIndicatorRow({ indicatorId: 24, label: "P1", distribution: 0.3333, answeredCount: 26, satisfactoryCount: 21 }),
              buildIndicatorRow({ indicatorId: 25, label: "P2", distribution: 0.3333, answeredCount: 26, satisfactoryCount: 22 }),
              buildIndicatorRow({ indicatorId: 26, label: "P3", distribution: 0.3334, answeredCount: 26, satisfactoryCount: 23 }),
            ],
          }),
          buildCourseRow({
            courseId: 412,
            courseCode: "CPE 412",
            courseName: "Capstone Design 2",
            actualClassSize: 24,
            cli: 0.3334,
            answeredCount: 24,
            indicators: [
              buildIndicatorRow({ indicatorId: 27, label: "P1", distribution: 0.3333, answeredCount: 24, satisfactoryCount: 20 }),
              buildIndicatorRow({ indicatorId: 28, label: "P2", distribution: 0.3333, answeredCount: 24, satisfactoryCount: 21 }),
              buildIndicatorRow({ indicatorId: 29, label: "P3", distribution: 0.3334, answeredCount: 24, satisfactoryCount: 22 }),
            ],
          }),
        ],
      }),
      buildSummaryTable({
        soId: 5,
        soNumber: 5,
        soTitle: "Function effectively on teams",
        soDescription: "Students collaborate, communicate, and contribute within multidisciplinary contexts.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 302, CPE 401, CPE 412",
        schoolYear: "2025-2026",
        attainmentPercent: 79.6,
        courses: [
          buildCourseRow({
            courseId: 302,
            courseCode: "CPE 302",
            courseName: "Software Design",
            actualClassSize: 33,
            cli: 0.3333,
            answeredCount: 31,
            indicators: [
              buildIndicatorRow({ indicatorId: 51, label: "P1", distribution: 0.5, answeredCount: 31, satisfactoryCount: 24 }),
              buildIndicatorRow({ indicatorId: 52, label: "P2", distribution: 0.5, answeredCount: 31, satisfactoryCount: 25 }),
            ],
          }),
          buildCourseRow({
            courseId: 401,
            courseCode: "CPE 401",
            courseName: "Computer Design",
            actualClassSize: 28,
            cli: 0.3333,
            answeredCount: 26,
            indicators: [
              buildIndicatorRow({ indicatorId: 53, label: "P1", distribution: 0.5, answeredCount: 26, satisfactoryCount: 20 }),
              buildIndicatorRow({ indicatorId: 54, label: "P2", distribution: 0.5, answeredCount: 26, satisfactoryCount: 21 }),
            ],
          }),
          buildCourseRow({
            courseId: 412,
            courseCode: "CPE 412",
            courseName: "Capstone Design 2",
            actualClassSize: 24,
            cli: 0.3334,
            answeredCount: 24,
            indicators: [
              buildIndicatorRow({ indicatorId: 55, label: "P1", distribution: 0.5, answeredCount: 24, satisfactoryCount: 19 }),
              buildIndicatorRow({ indicatorId: 56, label: "P2", distribution: 0.5, answeredCount: 24, satisfactoryCount: 20 }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: 102,
    title: "Student Outcome Review for First Semester",
    schoolYear: "2025-2026",
    semester: "1st Semester",
    dateSubmitted: "2026-01-16",
    reportType: "SO Summary",
    status: "Completed",
    coursesAssessed: 10,
    studentsAssessed: 131,
    avgScore: 74.9,
    fileFormat: "Sample HTML Report",
    generatedBy: "Program Chair Office",
    summary:
      "This report compared outcome attainment across early-term subjects and highlighted sections needing remediation planning before the next assessment cycle.",
    highlights: [
      "SO 1 performance improved after rubric alignment updates.",
      "SO 4 still lagged in design-heavy classes with large enrollments.",
      "Two course mappings were flagged for review before the next term.",
    ],
    soSummaryTables: [
      buildSummaryTable({
        soId: 1,
        soNumber: 1,
        soTitle: "Apply knowledge of mathematics and engineering",
        soDescription: "Students apply foundational principles to analyze computing and hardware problems.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 201, CPE 202, CPE 211",
        schoolYear: "2025-2026",
        attainmentPercent: 77.1,
        courses: [
          buildCourseRow({
            courseId: 201,
            courseCode: "CPE 201",
            courseName: "Digital Logic",
            actualClassSize: 38,
            cli: 0.3333,
            answeredCount: 34,
            indicators: [
              buildIndicatorRow({ indicatorId: 11, label: "P1", distribution: 0.5, answeredCount: 34, satisfactoryCount: 25 }),
              buildIndicatorRow({ indicatorId: 12, label: "P2", distribution: 0.5, answeredCount: 34, satisfactoryCount: 26 }),
            ],
          }),
          buildCourseRow({
            courseId: 202,
            courseCode: "CPE 202",
            courseName: "Signals and Systems",
            actualClassSize: 35,
            cli: 0.3333,
            answeredCount: 32,
            indicators: [
              buildIndicatorRow({ indicatorId: 13, label: "P1", distribution: 0.5, answeredCount: 32, satisfactoryCount: 23 }),
              buildIndicatorRow({ indicatorId: 14, label: "P2", distribution: 0.5, answeredCount: 32, satisfactoryCount: 24 }),
            ],
          }),
          buildCourseRow({
            courseId: 211,
            courseCode: "CPE 211",
            courseName: "Computer Architecture",
            actualClassSize: 29,
            cli: 0.3334,
            answeredCount: 27,
            indicators: [
              buildIndicatorRow({ indicatorId: 15, label: "P1", distribution: 0.5, answeredCount: 27, satisfactoryCount: 21 }),
              buildIndicatorRow({ indicatorId: 16, label: "P2", distribution: 0.5, answeredCount: 27, satisfactoryCount: 20 }),
            ],
          }),
        ],
      }),
      buildSummaryTable({
        soId: 4,
        soNumber: 4,
        soTitle: "Communicate effectively",
        soDescription: "Students present technical work clearly in oral, written, and visual formats.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 203, CPE 211, CPE 302",
        schoolYear: "2025-2026",
        attainmentPercent: 72.8,
        courses: [
          buildCourseRow({
            courseId: 203,
            courseCode: "CPE 203",
            courseName: "Technical Documentation",
            actualClassSize: 31,
            cli: 0.3333,
            answeredCount: 29,
            indicators: [
              buildIndicatorRow({ indicatorId: 41, label: "P1", distribution: 0.5, answeredCount: 29, satisfactoryCount: 20 }),
              buildIndicatorRow({ indicatorId: 42, label: "P2", distribution: 0.5, answeredCount: 29, satisfactoryCount: 21 }),
            ],
          }),
          buildCourseRow({
            courseId: 211,
            courseCode: "CPE 211",
            courseName: "Computer Architecture",
            actualClassSize: 29,
            cli: 0.3333,
            answeredCount: 27,
            indicators: [
              buildIndicatorRow({ indicatorId: 43, label: "P1", distribution: 0.5, answeredCount: 27, satisfactoryCount: 18 }),
              buildIndicatorRow({ indicatorId: 44, label: "P2", distribution: 0.5, answeredCount: 27, satisfactoryCount: 19 }),
            ],
          }),
          buildCourseRow({
            courseId: 302,
            courseCode: "CPE 302",
            courseName: "Software Design",
            actualClassSize: 33,
            cli: 0.3334,
            answeredCount: 30,
            indicators: [
              buildIndicatorRow({ indicatorId: 45, label: "P1", distribution: 0.5, answeredCount: 30, satisfactoryCount: 22 }),
              buildIndicatorRow({ indicatorId: 46, label: "P2", distribution: 0.5, answeredCount: 30, satisfactoryCount: 21 }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: 103,
    title: "Course-Level Historical Performance Snapshot",
    schoolYear: "2024-2025",
    semester: "2nd Semester",
    dateSubmitted: "2025-05-22",
    reportType: "Course Summary",
    status: "Completed",
    coursesAssessed: 9,
    studentsAssessed: 118,
    avgScore: 75.2,
    fileFormat: "Sample HTML Report",
    generatedBy: "Program Chair Office",
    summary:
      "This historical export tracked course-level attainment and assessment completion to support curriculum review planning before year-end reporting.",
    highlights: [
      "Capstone and laboratory courses posted the highest average attainment.",
      "Assessment completion improved after consolidating section handling per faculty member.",
      "Three mid-program subjects showed stable but below-target attainment patterns.",
    ],
    soSummaryTables: [
      buildSummaryTable({
        soId: 3,
        soNumber: 3,
        soTitle: "Conduct experiments and interpret data",
        soDescription: "Students gather evidence and analyze results using appropriate engineering methods.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 311, CPE 314, CPE 321",
        schoolYear: "2024-2025",
        attainmentPercent: 75.9,
        courses: [
          buildCourseRow({
            courseId: 311,
            courseCode: "CPE 311",
            courseName: "Microprocessors Laboratory",
            actualClassSize: 30,
            cli: 0.3333,
            answeredCount: 28,
            indicators: [
              buildIndicatorRow({ indicatorId: 31, label: "P1", distribution: 0.5, answeredCount: 28, satisfactoryCount: 22 }),
              buildIndicatorRow({ indicatorId: 32, label: "P2", distribution: 0.5, answeredCount: 28, satisfactoryCount: 21 }),
            ],
          }),
          buildCourseRow({
            courseId: 314,
            courseCode: "CPE 314",
            courseName: "Instrumentation",
            actualClassSize: 26,
            cli: 0.3333,
            answeredCount: 24,
            indicators: [
              buildIndicatorRow({ indicatorId: 33, label: "P1", distribution: 0.5, answeredCount: 24, satisfactoryCount: 18 }),
              buildIndicatorRow({ indicatorId: 34, label: "P2", distribution: 0.5, answeredCount: 24, satisfactoryCount: 19 }),
            ],
          }),
          buildCourseRow({
            courseId: 321,
            courseCode: "CPE 321",
            courseName: "Control Systems",
            actualClassSize: 27,
            cli: 0.3334,
            answeredCount: 25,
            indicators: [
              buildIndicatorRow({ indicatorId: 35, label: "P1", distribution: 0.5, answeredCount: 25, satisfactoryCount: 19 }),
              buildIndicatorRow({ indicatorId: 36, label: "P2", distribution: 0.5, answeredCount: 25, satisfactoryCount: 18 }),
            ],
          }),
        ],
      }),
    ],
  },
  {
    id: 104,
    title: "Annual Program Assessment Archive",
    schoolYear: "2023-2024",
    semester: "Full Year",
    dateSubmitted: "2024-05-18",
    reportType: "Program Summary",
    status: "Completed",
    coursesAssessed: 14,
    studentsAssessed: 165,
    avgScore: 73.7,
    fileFormat: "Sample HTML Report",
    generatedBy: "Program Chair Office",
    summary:
      "This end-of-year archive consolidated all major assessment findings for accreditation review and department planning.",
    highlights: [
      "Full-year coverage reached all mapped student outcomes.",
      "The largest gap remained in sections with inconsistent rubric completion.",
      "Improvement priorities focused on assessment timing and evidence consistency.",
    ],
    soSummaryTables: [
      buildSummaryTable({
        soId: 6,
        soNumber: 6,
        soTitle: "Recognize professional and ethical responsibility",
        soDescription: "Students identify ethical issues and respond using professional standards.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 101, CPE 205, CPE 402",
        schoolYear: "2023-2024",
        attainmentPercent: 81.2,
        courses: [
          buildCourseRow({
            courseId: 101,
            courseCode: "CPE 101",
            courseName: "Introduction to Computer Engineering",
            actualClassSize: 40,
            cli: 0.3333,
            answeredCount: 39,
            indicators: [
              buildIndicatorRow({ indicatorId: 61, label: "P1", distribution: 0.5, answeredCount: 39, satisfactoryCount: 31 }),
              buildIndicatorRow({ indicatorId: 62, label: "P2", distribution: 0.5, answeredCount: 39, satisfactoryCount: 32 }),
            ],
          }),
          buildCourseRow({
            courseId: 205,
            courseCode: "CPE 205",
            courseName: "Engineering Economy",
            actualClassSize: 34,
            cli: 0.3333,
            answeredCount: 31,
            indicators: [
              buildIndicatorRow({ indicatorId: 63, label: "P1", distribution: 0.5, answeredCount: 31, satisfactoryCount: 24 }),
              buildIndicatorRow({ indicatorId: 64, label: "P2", distribution: 0.5, answeredCount: 31, satisfactoryCount: 25 }),
            ],
          }),
          buildCourseRow({
            courseId: 402,
            courseCode: "CPE 402",
            courseName: "Engineering Management",
            actualClassSize: 29,
            cli: 0.3334,
            answeredCount: 27,
            indicators: [
              buildIndicatorRow({ indicatorId: 65, label: "P1", distribution: 0.5, answeredCount: 27, satisfactoryCount: 23 }),
              buildIndicatorRow({ indicatorId: 66, label: "P2", distribution: 0.5, answeredCount: 27, satisfactoryCount: 22 }),
            ],
          }),
        ],
      }),
      buildSummaryTable({
        soId: 7,
        soNumber: 7,
        soTitle: "Engage in life-long learning",
        soDescription: "Students recognize the need for continuous professional development and self-improvement.",
        program: "Computer Engineering",
        sourceAssessment: "CPE 205, CPE 402, CPE 411",
        schoolYear: "2023-2024",
        attainmentPercent: 78.3,
        courses: [
          buildCourseRow({
            courseId: 205,
            courseCode: "CPE 205",
            courseName: "Engineering Economy",
            actualClassSize: 34,
            cli: 0.3333,
            answeredCount: 31,
            indicators: [
              buildIndicatorRow({ indicatorId: 71, label: "P1", distribution: 0.5, answeredCount: 31, satisfactoryCount: 23 }),
              buildIndicatorRow({ indicatorId: 72, label: "P2", distribution: 0.5, answeredCount: 31, satisfactoryCount: 24 }),
            ],
          }),
          buildCourseRow({
            courseId: 402,
            courseCode: "CPE 402",
            courseName: "Engineering Management",
            actualClassSize: 29,
            cli: 0.3333,
            answeredCount: 27,
            indicators: [
              buildIndicatorRow({ indicatorId: 73, label: "P1", distribution: 0.5, answeredCount: 27, satisfactoryCount: 20 }),
              buildIndicatorRow({ indicatorId: 74, label: "P2", distribution: 0.5, answeredCount: 27, satisfactoryCount: 21 }),
            ],
          }),
          buildCourseRow({
            courseId: 411,
            courseCode: "CPE 411",
            courseName: "Capstone Design 1",
            actualClassSize: 22,
            cli: 0.3334,
            answeredCount: 21,
            indicators: [
              buildIndicatorRow({ indicatorId: 75, label: "P1", distribution: 0.5, answeredCount: 21, satisfactoryCount: 17 }),
              buildIndicatorRow({ indicatorId: 76, label: "P2", distribution: 0.5, answeredCount: 21, satisfactoryCount: 16 }),
            ],
          }),
        ],
      }),
    ],
  },
];

export const facultyPastReports = [
  {
    id: 201,
    title: "Section A Course Summary Archive",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    dateSubmitted: "2026-03-21",
    reportType: "Course Summary",
    status: "Completed",
    coursesAssessed: 2,
    studentsAssessed: 34,
    avgScore: 78.1,
    fileFormat: "Sample HTML Report",
    generatedBy: "Assigned Faculty",
    summary:
      "This archived faculty report captures the most recent section-level attainment and student response coverage for handled courses.",
    highlights: [
      "Section participation remained above target throughout the term.",
      "Performance on applied indicators was stronger than on written-analysis indicators.",
      "Follow-up remediation was recommended for five students with repeated low scores.",
    ],
  },
  {
    id: 202,
    title: "Midterm Assessment Course Detail",
    schoolYear: "2025-2026",
    semester: "1st Semester",
    dateSubmitted: "2025-11-14",
    reportType: "Course Detailed",
    status: "Completed",
    coursesAssessed: 1,
    studentsAssessed: 18,
    avgScore: 74.6,
    fileFormat: "Sample HTML Report",
    generatedBy: "Assigned Faculty",
    summary:
      "This detailed archive was prepared to review rubric-level trends before final grades and end-term assessment consolidation.",
    highlights: [
      "Most missed criteria were concentrated in documentation and communication tasks.",
      "Students improved after formative feedback in weeks six through nine.",
      "No assessment rows were left incomplete at archive time.",
    ],
  },
  {
    id: 203,
    title: "End-of-Term Faculty Assessment Summary",
    schoolYear: "2024-2025",
    semester: "2nd Semester",
    dateSubmitted: "2025-05-08",
    reportType: "Annual Report",
    status: "Completed",
    coursesAssessed: 3,
    studentsAssessed: 42,
    avgScore: 75.8,
    fileFormat: "Sample HTML Report",
    generatedBy: "Assigned Faculty",
    summary:
      "This faculty archive collected the final section summaries used for turnover, reflection, and next-term planning.",
    highlights: [
      "All handled sections reached complete assessment submission status.",
      "SO attainment rose most in team-based project work.",
      "Recommended next-step focused on strengthening lower-performing written indicators.",
    ],
  },
];

export const buildPastReportFilterOptions = (reports) => ({
  schoolYears: ["All Years", ...new Set(reports.map((report) => report.schoolYear))],
  reportTypes: ["All Types", ...new Set(reports.map((report) => report.reportType))],
});

export const downloadSamplePastReport = (report, audienceLabel) => {
  const html = renderReportHtml(report, audienceLabel);
  downloadBlob(
    html,
    createDownloadFilename(report.title, report.schoolYear),
    "text/html;charset=utf-8;"
  );
};
