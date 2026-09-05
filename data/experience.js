(function () {
  'use strict';

  window.resumeExperience = [
    {
      role: 'Maintenance System Optimisation (MSO) – Consultant Engineer',
      org: 'Deloitte · Global Iron Ore Producer (Pilbara)',
      dates: 'January 2026 – Present',
      tags: 'strategy reliability masterdata software sap',
      paragraphs: [
        'As part of a multi-disciplinary delivery team, I helped build a full-stack, cloud-native AI application that modernises and automates maintenance strategy processes across Heavy Mobile Equipment (HME) and Fixed Plant (FXP) assets. It replaces fragmented, manual engineering workflows with AI-augmented data review, statistical reliability modelling and data-driven maintenance optimisation.'
      ],
      bullets: [
        '<b>Maintenance master data</b> – human-in-the-loop review workflows for AI-generated material classifications, FLOC BOM validation and work order classification.',
        '<b>Reliability engineering</b> – Weibull analysis, MTBF/MTTF calculation, Asset Health Index scoring, component age analysis and replacement projection modelling.',
        '<b>Maintenance strategy optimisation</b> – turning reliability outputs into data-driven maintenance tactic and component replacement recommendations.',
        '<b>Full-stack development</b> – React/TypeScript front-end features and Python/FastAPI REST endpoints.',
        '<b>Data engineering and cloud</b> – Databricks Gold-layer products and SAP work order data into PostgreSQL, deployed on Azure Container Apps.',
        '<b>Data visualisation</b> – interactive reliability charts including Weibull curves, age analysis timelines and health index dashboards.'
      ]
    },
    {
      role: 'Group Asset Management Framework (Phase 1 & 2) – Consultant Engineer',
      org: 'Deloitte · Global Gold Mining Operator',
      dates: 'September 2025 – January 2026',
      tags: 'strategy leadership',
      bullets: [
        'Rolled out the group Asset Management Framework and System Definition, defining Key Practice Areas, system requirements and documentation layout.',
        'Supported Asset Management System documentation and global standardisation.',
        'Facilitated international workshops across Australia, Chile, South Africa, Ghana and Canada.'
      ]
    },
    {
      role: 'Asset Health Index Rollout (Fixed Plant) – Consultant Engineer',
      org: 'Deloitte · Global Iron Ore Producer (Pilbara)',
      dates: 'March 2025 – September 2025',
      tags: 'reliability strategy leadership',
      paragraphs: ['4/3 roster fly-in fly-out build and rollout of an Asset Health Index across two Pilbara sites, covering wet plant assets and low-grade fixed plant.'],
      bullets: [
        'Power BI dashboard development to track and communicate asset health scores across sites.',
        'Engagement with reliability engineers and site stakeholders to validate AHI scoring methodologies.',
        'Aligned the Asset Health Index with existing site maintenance strategies.'
      ]
    },
    {
      role: 'Labour Benchmarking Review – Data & Reporting Analyst',
      org: 'Deloitte · Iron Ore Producer (Pilbara)',
      dates: 'January 2025 – March 2025',
      tags: 'leadership',
      bullets: [
        'Built a national database of labour quantity information to draw conclusions on industry standards.',
        'Broke each site down into major assets using exports from multiple sources, enabling like-for-like comparison.',
        'Maintained direct client engagement to keep scope aligned with desired outcomes.'
      ]
    },
    {
      role: 'Asset Management Plans (Substations) – Engineering Analyst',
      org: 'Deloitte · Global Iron Ore Producer (Pilbara)',
      dates: 'September 2024 – December 2024',
      tags: 'strategy',
      bullets: [
        'Built reports and collated large datasets using appendices and supporting tools to improve readability.',
        'Performed substation site validation and checked regulatory precautions in low-voltage substations.',
        'Developed replacement recommendations from historical costing and asset changeout analysis.'
      ]
    },
    {
      role: 'Asset Management Uplift Programme (Asset Tactics Review) – Graduate Team Member',
      org: 'Deloitte · Global Iron Ore Producer (Pilbara)',
      dates: 'June 2024 – September 2024',
      tags: 'strategy reliability sap',
      bullets: [
        '<b>Defect elimination</b> – bad actor review identifying the worst-performing site assets by downtime and criticality.',
        '<b>Work management</b> – SAP PM01, PM02 and PM03 changeout analysis to find incomplete changeouts and causes of unnecessary downtime.',
        '<b>Maintenance strategy documentation</b> – PRT and task description review to find gaps and missing information.'
      ]
    },
    {
      role: 'Closed Work Order and Parts Reallocation – Storefront',
      org: 'Macmahon',
      dates: 'November 2022 – March 2024 · part time / ad hoc',
      tags: 'sap masterdata',
      bullets: [
        'Used SAP to re-issue unfitted stock items from maintenance orders back into the storefront and prepare work orders for maintenance crews.',
        'Associated parts with SAP IDs, assembled service kits, ran stock takes and adjusted SAP accordingly.'
      ]
    }
  ];

  var jobs = document.querySelectorAll('#jobs .job');
  window.resumeExperience.slice(0, jobs.length).forEach(function (job, index) {
    var card = jobs[index];
    card.dataset.tags = job.tags;
    card.innerHTML = '<summary><span class="role">' + job.role + '</span>' +
      '<span class="org">' + job.org + '</span><span class="dates">' + job.dates + '</span></summary>' +
      '<div class="job-body">' + (job.paragraphs || []).map(function (paragraph) { return '<p>' + paragraph + '</p>'; }).join('') +
      '<ul>' + (job.bullets || []).map(function (bullet) { return '<li>' + bullet + '</li>'; }).join('') + '</ul></div>';
  });
})();