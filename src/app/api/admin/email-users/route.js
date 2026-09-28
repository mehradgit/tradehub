// src/app/api/admin/email-users/route.js
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { getVmailPool } from "@/lib/vmailDb";
import { auth } from "@/auth"; // مسیر auth خودتان را جایگزین کنید

const execAsync = promisify(exec);

// ===== تابع هش کردن رمز با SHA512-CRYPT =====
async function hashPassword(password) {
  // جلوگیری از تزریق در دستور shell
  const escaped = password.replace(/'/g, "'\\''");
  const { stdout } = await execAsync(
    `doveadm pw -s SHA512-CRYPT -p '${escaped}'`
  );
  return stdout.trim(); // مثل: {SHA512-CRYPT}$6$...
}

// ===== POST: ساخت کاربر ایمیل =====
export async function POST(request) {
  try {
    // ۱. احراز هویت و بررسی ادمین
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ۲. دریافت اطلاعات
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // ۳. اعتبارسنجی ایمیل
    const emailRegex = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // ۴. بررسی دامنه مجاز
    const domain = process.env.VMAIL_DOMAIN || "bulkfoodtrade.ir";
    if (!email.toLowerCase().endsWith(`@${domain}`)) {
      return NextResponse.json(
        { message: `Email must be @${domain}` },
        { status: 400 }
      );
    }

    // ۵. بررسی حداقل طول رمز
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const pool = getVmailPool();

    // ۶. بررسی تکراری نبودن ایمیل
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 409 }
      );
    }

    // ۷. هش کردن رمز
    const hashedPassword = await hashPassword(password);

    // ۸. ساخت کاربر
    const domainId = parseInt(process.env.VMAIL_DOMAIN_ID || "1");
    const [result] = await pool.execute(
      "INSERT INTO users (email, password, domain_id, active) VALUES (?, ?, ?, 1)",
      [email.toLowerCase(), hashedPassword, domainId]
    );

    return NextResponse.json({
      success: true,
      message: "Email user created successfully",
      id: result.insertId,
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error("[Email User Create] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ===== GET: لیست کاربران ایمیل =====
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const pool = getVmailPool();
    const [users] = await pool.execute(
      "SELECT id, email, active, domain_id FROM users ORDER BY id DESC"
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[Email User List] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ===== DELETE: حذف کاربر ایمیل =====
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const pool = getVmailPool();
    const [result] = await pool.execute(
      "DELETE FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // حذف فایل‌های Maildir (اختیاری)
    const domain = process.env.VMAIL_DOMAIN || "bulkfoodtrade.ir";
    const username = email.split("@")[0];
    const maildir = `/var/mail/vhosts/${domain}/${username}`;
    await execAsync(`rm -rf "${maildir}"`).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Email user deleted",
    });
  } catch (error) {
    console.error("[Email User Delete] Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}