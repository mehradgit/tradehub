// src/app/api/admin/email-users/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { getVmailPool } from "@/lib/vmailDb";
import { auth } from "@/auth";

const execAsync = promisify(exec);

// ===== Hash the password with SHA512-CRYPT =====
async function hashPassword(password) {
  const escaped = password.replace(/'/g, "'\\''");
  const { stdout } = await execAsync(
    `doveadm pw -s SHA512-CRYPT -p '${escaped}'`
  );
  return stdout.trim();
}

// ===== Guard: verify the admin =====
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return { ok: false, response: NextResponse.json(
      { message: "Unauthorized" }, { status: 401 }
    )};
  }
  return { ok: true };
}

// ============================================================
// GET: list the email users
// ============================================================
export async function GET() {
  const guard = await checkAdmin();
  if (!guard.ok) return guard.response;

  try {
    const pool = getVmailPool();
    const [users] = await pool.execute(
      "SELECT id, email, active, domain_id FROM users ORDER BY id DESC"
    );
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Email User List]", error);
    return NextResponse.json(
      { message: error.message }, { status: 500 }
    );
  }
}

// ============================================================
// POST: create a new email user
// ============================================================
export async function POST(request) {
  const guard = await checkAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" }, { status: 400 }
      );
    }

    const domain = process.env.VMAIL_DOMAIN || "bulkfoodtrade.ir";
    if (!email.toLowerCase().endsWith(`@${domain}`)) {
      return NextResponse.json(
        { message: `Email must be @${domain}` }, { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const pool = getVmailPool();

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Email already exists" }, { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const domainId = parseInt(process.env.VMAIL_DOMAIN_ID || "1");

    const [result] = await pool.execute(
      "INSERT INTO users (email, password, domain_id, active) VALUES (?, ?, ?, 1)",
      [email.toLowerCase(), hashedPassword, domainId]
    );

    return NextResponse.json({
      success: true,
      message: "Email user created",
      id: result.insertId,
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error("[Email User Create]", error);
    return NextResponse.json(
      { message: error.message }, { status: 500 }
    );
  }
}

// ============================================================
// PATCH: change the password or the active/inactive state
// ============================================================
export async function PATCH(request) {
  const guard = await checkAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { email, action, password, active } = await request.json();

    if (!email || !action) {
      return NextResponse.json(
        { message: "Email and action are required" },
        { status: 400 }
      );
    }

    const pool = getVmailPool();

    // Check that the user exists
    const [rows] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "User not found" }, { status: 404 }
      );
    }

    // ===== Change the password =====
    if (action === "change-password") {
      if (!password || password.length < 8) {
        return NextResponse.json(
          { message: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(password);
      await pool.execute(
        "UPDATE users SET password = ? WHERE email = ?",
        [hashedPassword, email.toLowerCase()]
      );

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    // ===== Toggle the active state =====
    if (action === "toggle-active") {
      if (typeof active !== "boolean") {
        return NextResponse.json(
          { message: "Active must be a boolean" }, { status: 400 }
        );
      }

      await pool.execute(
        "UPDATE users SET active = ? WHERE email = ?",
        [active ? 1 : 0, email.toLowerCase()]
      );

      return NextResponse.json({
        success: true,
        message: active ? "User activated" : "User deactivated",
      });
    }

    return NextResponse.json(
      { message: "Unknown action" }, { status: 400 }
    );
  } catch (error) {
    console.error("[Email User Patch]", error);
    return NextResponse.json(
      { message: error.message }, { status: 500 }
    );
  }
}

// ============================================================
// DELETE: delete an email user
// ============================================================
export async function DELETE(request) {
  const guard = await checkAdmin();
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" }, { status: 400 }
      );
    }

    const pool = getVmailPool();
    const [result] = await pool.execute(
      "DELETE FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "User not found" }, { status: 404 }
      );
    }

    // Remove the Maildir files
    const domain = process.env.VMAIL_DOMAIN || "bulkfoodtrade.ir";
    const username = email.split("@")[0];
    const maildir = `/var/mail/vhosts/${domain}/${username}`;
    await execAsync(`rm -rf "${maildir}"`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Email user deleted",
    });
  } catch (error) {
    console.error("[Email User Delete]", error);
    return NextResponse.json(
      { message: error.message }, { status: 500 }
    );
  }
}