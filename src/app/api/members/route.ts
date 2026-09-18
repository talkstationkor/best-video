import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentMember } from "@/lib/session";
import { permissions, ForbiddenError } from "@/lib/permissions";
import { requireNonEmpty, ValidationError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const team = req.nextUrl.searchParams.get("team");
    const full = req.nextUrl.searchParams.get("full") === "1";

    if (full) {
      const member = await getCurrentMember();

      if (!member || !permissions.canManageMembers(member)) {
        return NextResponse.json(
          { error: "You don't have permission to view this." },
          { status: 403 }
        );
      }

      const members = await prisma.member.findMany({
        orderBy: [{ team: "asc" }, { name: "asc" }]
      });

      return NextResponse.json({ members });
    }

    const members = await prisma.member.findMany({
      where: {
        isActive: true,
        ...(team ? { team } : {})
      },
      select: {
        id: true,
        name: true,
        team: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json({ members });
  } catch (err) {
    console.error("GET /api/members failed:", err);
    return NextResponse.json(
      { error: "Failed to load members." },
      { status: 500 }
    );
  }
}

// POST — Admin only: create a new Member record.
export async function POST(req: NextRequest) {
  try {
    const member = await getCurrentMember();

    if (!member) {
      return NextResponse.json(
        { error: "Please choose who you are." },
        { status: 401 }
      );
    }

    if (!permissions.canManageMembers(member)) {
      throw new ForbiddenError();
    }

    const body = await req.json();

    const name = requireNonEmpty(body.name, "Name");
    const team = requireNonEmpty(body.team, "Team");
    const role = requireNonEmpty(body.role, "Role");

    const validTeams = [
      "BEST_VIDEO_TEAM",
      "EDITOR_TEAM",
      "TMT"
    ];

    const validRoles = [
      "SUBMITTER",
      "EDITOR",
      "REVIEWER",
      "ADMIN"
    ];

    if (!validTeams.includes(team)) {
      throw new ValidationError("A valid team is required.");
    }

    if (!validRoles.includes(role)) {
      throw new ValidationError("A valid role is required.");
    }

    const created = await prisma.member.create({
      data: {
        name,
        team,
        role
      }
    });

    return NextResponse.json(
      { member: created },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json(
        { error: err.message },
        { status: 403 }
      );
    }

    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    console.error(err);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}