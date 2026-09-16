import type { Member } from "@prisma/client";

// -----------------------------------------------------------------------
// Permission rules
// -----------------------------------------------------------------------

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

function isReviewerOrAdmin(role: string) {
  return role === "REVIEWER" || role === "ADMIN";
}

function isBestVideoMember(member: Member) {
  return (
    member.team === "Best Video Team" ||
    member.team === "BEST_VIDEO_TEAM"
  );
}

export function canReview(member: Member) {
  return isReviewerOrAdmin(member.role) || isBestVideoMember(member);
}

export const permissions = {
  canCreateProject(member: Member) {
    return (
      member.role === "SUBMITTER" ||
      isReviewerOrAdmin(member.role) ||
      isBestVideoMember(member)
    );
  },

  canSubmitVersion(member: Member) {
    return (
      member.role === "SUBMITTER" ||
      member.role === "EDITOR" ||
      isReviewerOrAdmin(member.role) ||
      isBestVideoMember(member)
    );
  },

  canAddFeedback(member: Member) {
    return canReview(member);
  },

  canEditOrDeleteFeedback(
    member: Member,
    feedbackAuthorId: string
  ) {
    if (member.role === "ADMIN") return true;

    if (canReview(member)) {
      return member.id === feedbackAuthorId;
    }

    return false;
  },

  canResolveFeedback(member: Member) {
    return canReview(member);
  },

  canRequestRevision(member: Member) {
    return canReview(member);
  },

  canApprove(member: Member) {
    return canReview(member);
  },

  canAssignEditor(member: Member) {
    return canReview(member);
  },

  canViewAllProjects(member: Member) {
    return canReview(member);
  },

  canManageMembers(member: Member) {
    return member.role === "ADMIN";
  },

  canAccessSettings(member: Member) {
    return member.role === "ADMIN";
  }
};

export function assert(
  condition: boolean,
  message?: string
): void {
  if (!condition) {
    throw new ForbiddenError(message);
  }
}