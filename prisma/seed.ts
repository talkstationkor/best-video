import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Demo data only. These names are NEVER referenced anywhere in
// application code (routes, permissions, UI) — they exist purely as
// rows in the database so the app has something to look at on first run.
// An Admin can rename, deactivate, or add to this list at any time from
// Settings > Members without touching code.
async function main() {
  console.log("Seeding…");

  const jimmy = await prisma.member.upsert({
    where: { name_team: { name: "Jimmy", team: "BEST_VIDEO_TEAM" } },
    update: {},
    create: { name: "Jimmy", team: "BEST_VIDEO_TEAM", role: "SUBMITTER" }
  });
  const maria = await prisma.member.upsert({
    where: { name_team: { name: "Maria", team: "BEST_VIDEO_TEAM" } },
    update: {},
    create: { name: "Maria", team: "BEST_VIDEO_TEAM", role: "SUBMITTER" }
  });
  const paul = await prisma.member.upsert({
    where: { name_team: { name: "Paul", team: "TMT" } },
    update: {},
    create: { name: "Paul", team: "TMT", role: "REVIEWER" }
  });
  const hanna = await prisma.member.upsert({
    where: { name_team: { name: "Hanna", team: "TMT" } },
    update: {},
    create: { name: "Hanna", team: "TMT", role: "REVIEWER" }
  });
  await prisma.member.upsert({
    where: { name_team: { name: "Sarah", team: "TMT" } },
    update: {},
    create: { name: "Sarah", team: "TMT", role: "ADMIN" }
  });

  const sampleDrive = "https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view";

  // Project 1 — currently sitting in Revision Requested at V2, matching
  // the walkthrough in the spec (section 8).
  const p1 = await prisma.project.create({
    data: {
      projectName: "Leading Effective Discussion #20",
      details: "Classroom discussion facilitation training video.",
      team: "BEST_VIDEO_TEAM",
      status: "REVISION_REQUESTED",
      currentVersion: 2,
      createdById: jimmy.id
    }
  });
  const p1v1 = await prisma.projectVersion.create({
    data: {
      projectId: p1.id,
      versionNumber: 1,
      videoUrl: sampleDrive,
      submittedById: jimmy.id,
      status: "REVISION_REQUESTED",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4)
    }
  });
  await prisma.feedback.createMany({
    data: [
      {
        versionId: p1v1.id,
        authorId: paul.id,
        message: "Intro runs long — trim the first 30 seconds.",
        timestamp: "00:30",
        status: "RESOLVED",
        resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        resolvedById: paul.id
      }
    ]
  });
  const p1v2 = await prisma.projectVersion.create({
    data: {
      projectId: p1.id,
      versionNumber: 2,
      videoUrl: sampleDrive,
      submittedById: jimmy.id,
      status: "REVISION_REQUESTED",
      submittedAt: new Date(Date.now() - 1000 * 60 * 12)
    }
  });
  await prisma.feedback.createMany({
    data: [
      {
        versionId: p1v2.id,
        authorId: paul.id,
        message: "강사의 설명이 너무 길어서 해당 부분을 줄여주세요.",
        timestamp: "02:13",
        status: "OPEN"
      },
      {
        versionId: p1v2.id,
        authorId: paul.id,
        message: "학생 반응 장면을 조금 더 추가해주세요.",
        timestamp: "03:42",
        status: "OPEN"
      },
      {
        versionId: p1v2.id,
        authorId: hanna.id,
        message: "Audio levels dip around the midpoint — please normalize.",
        timestamp: "05:10",
        status: "OPEN"
      }
    ]
  });
  await prisma.activityLog.createMany({
    data: [
      { actorId: jimmy.id, team: "BEST_VIDEO_TEAM", action: "PROJECT_CREATED", projectId: p1.id, versionId: p1v1.id },
      { actorId: paul.id, team: "TMT", action: "FEEDBACK_ADDED", projectId: p1.id, versionId: p1v1.id },
      { actorId: paul.id, team: "TMT", action: "REVISION_REQUESTED", projectId: p1.id, versionId: p1v1.id },
      { actorId: jimmy.id, team: "BEST_VIDEO_TEAM", action: "VERSION_SUBMITTED", projectId: p1.id, versionId: p1v2.id },
      { actorId: paul.id, team: "TMT", action: "FEEDBACK_ADDED", projectId: p1.id, versionId: p1v2.id },
      { actorId: paul.id, team: "TMT", action: "REVISION_REQUESTED", projectId: p1.id, versionId: p1v2.id }
    ]
  });
  await prisma.notification.createMany({
    data: [
      {
        recipientId: jimmy.id,
        type: "REVISION_REQUESTED",
        message: `Paul requested a revision on V2 of "${p1.projectName}"`,
        projectId: p1.id,
        versionId: p1v2.id
      },
      {
        recipientId: maria.id,
        type: "REVISION_REQUESTED",
        message: `Paul requested a revision on V2 of "${p1.projectName}"`,
        projectId: p1.id,
        versionId: p1v2.id
      }
    ]
  });

  // Project 2 — freshly submitted V3, waiting for review.
  const p2 = await prisma.project.create({
    data: {
      projectName: "Phonics Class #17",
      details: "Early literacy phonics lesson.",
      team: "BEST_VIDEO_TEAM",
      status: "REVIEW_REQUIRED",
      currentVersion: 3,
      createdById: maria.id
    }
  });
  await prisma.projectVersion.create({
    data: { projectId: p2.id, versionNumber: 1, videoUrl: sampleDrive, submittedById: maria.id, status: "REVISION_REQUESTED", submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6) }
  });
  await prisma.projectVersion.create({
    data: { projectId: p2.id, versionNumber: 2, videoUrl: sampleDrive, submittedById: maria.id, status: "REVISION_REQUESTED", submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) }
  });
  const p2v3 = await prisma.projectVersion.create({
    data: { projectId: p2.id, versionNumber: 3, videoUrl: sampleDrive, submittedById: maria.id, status: "REVIEW_REQUIRED", submittedAt: new Date(Date.now() - 1000 * 60 * 60) }
  });
  await prisma.activityLog.create({
    data: { actorId: maria.id, team: "BEST_VIDEO_TEAM", action: "VERSION_SUBMITTED", projectId: p2.id, versionId: p2v3.id }
  });
  await prisma.notification.create({
    data: {
      recipientId: paul.id,
      type: "VERSION_SUBMITTED",
      message: `Maria submitted V3 for "${p2.projectName}"`,
      projectId: p2.id,
      versionId: p2v3.id
    }
  });

  // Project 3 — approved.
  const p3 = await prisma.project.create({
    data: {
      projectName: "Small Talk #23",
      details: "Conversational English practice segment.",
      team: "BEST_VIDEO_TEAM",
      status: "APPROVED",
      currentVersion: 3,
      createdById: jimmy.id,
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      approvedById: hanna.id
    }
  });
  await prisma.projectVersion.create({
    data: { projectId: p3.id, versionNumber: 1, videoUrl: sampleDrive, submittedById: jimmy.id, status: "REVISION_REQUESTED", submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) }
  });
  await prisma.projectVersion.create({
    data: { projectId: p3.id, versionNumber: 2, videoUrl: sampleDrive, submittedById: jimmy.id, status: "REVISION_REQUESTED", submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }
  });
  const p3v3 = await prisma.projectVersion.create({
    data: {
      projectId: p3.id,
      versionNumber: 3,
      videoUrl: sampleDrive,
      submittedById: jimmy.id,
      status: "APPROVED",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      approvedById: hanna.id
    }
  });
  await prisma.activityLog.create({
    data: { actorId: hanna.id, team: "TMT", action: "VIDEO_APPROVED", projectId: p3.id, versionId: p3v3.id }
  });
  await prisma.notification.createMany({
    data: [
      {
        recipientId: jimmy.id,
        type: "VIDEO_APPROVED",
        message: `Hanna approved V3 of "${p3.projectName}"`,
        projectId: p3.id,
        versionId: p3v3.id
      },
      {
        recipientId: maria.id,
        type: "VIDEO_APPROVED",
        message: `Hanna approved V3 of "${p3.projectName}"`,
        projectId: p3.id,
        versionId: p3v3.id
      }
    ]
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
