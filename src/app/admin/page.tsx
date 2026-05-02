import React from 'react';
import { cookies } from "next/headers";
import Link from 'next/link';
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { ShieldAlert, Users, Mail, Clock, Lock, Key } from "lucide-react";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("hidayah_token")?.value;

  if (!token) {
    redirect("/");
  }

  let decoded: any;
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_change_me_in_production';
    decoded = jwt.verify(token, secret);
  } catch (e) {
    redirect("/");
  }

  // Security Gate - Only allow your specific email
  if (decoded.email !== "huzaifsayed454@gmail.com") {
    return (
      <div className="min-h-screen bg-[var(--color-hidayah-primary)] flex items-center justify-center p-6 text-center">
        <div className="bg-[var(--color-hidayah-secondary)] p-8 rounded-3xl max-w-md shadow-lg border border-[var(--color-hidayah-border)]">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-[var(--color-hidayah-dark)] mb-2">Access Denied</h1>
          <p className="text-[var(--color-hidayah-dark)]/70">This area is highly restricted. Only the master administrator can view this page.</p>
        </div>
      </div>
    );
  }

  // Fetch users if authorized
  await dbConnect();
  // We use .select('+password') to force Mongoose to return the password field
  const users = await User.find({}).select('+password').sort({ createdAt: -1 }).lean();

  const Report = (await import('@/models/Report')).default;
  const pendingReportsCount = await Report.countDocuments({ status: 'pending' });

  return (
    <main className="min-h-screen bg-[var(--color-hidayah-primary)] p-6 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <Logo className="mb-8" />
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 bg-[var(--color-hidayah-secondary)] p-6 rounded-[32px] border border-[var(--color-hidayah-border)]/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[var(--color-hidayah-dark)] rounded-full flex items-center justify-center text-[var(--color-hidayah-gold)] shadow-md">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-[var(--color-hidayah-dark)]">Admin Control Panel</h1>
              <p className="text-sm font-medium text-[var(--color-hidayah-dark)]/60">Authorized as: {decoded.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/reports"
              className={`flex items-center gap-3 px-6 py-4 rounded-full border transition-all ${pendingReportsCount > 0 ? 'bg-red-50 border-red-200 shadow-sm animate-pulse-slow' : 'bg-[var(--color-hidayah-primary)] border-[var(--color-hidayah-border)]/50 opacity-60'}`}
            >
              <ShieldAlert className={`w-5 h-5 ${pendingReportsCount > 0 ? 'text-red-500' : 'text-[var(--color-hidayah-gold)]'}`} />
              <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${pendingReportsCount > 0 ? 'text-red-500' : 'text-[var(--color-hidayah-dark)]/40'}`}>Moderation</span>
                <span className="font-bold text-[var(--color-hidayah-dark)] text-sm">{pendingReportsCount} Reports</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 px-6 py-4 bg-[var(--color-hidayah-primary)] rounded-full border border-[var(--color-hidayah-border)]/50 shadow-sm">
              <Users className="w-5 h-5 text-[var(--color-hidayah-gold)]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-hidayah-dark)]/40">Community</span>
                <span className="font-bold text-[var(--color-hidayah-dark)] text-sm">{users.length} Users</span>
              </div>
            </div>
          </div>
        </header>

        {/* Users Table */}
        <div className="bg-[var(--color-hidayah-secondary)] rounded-[32px] overflow-hidden shadow-sm border border-[var(--color-hidayah-border)]/40 backdrop-blur-sm">
          <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--color-hidayah-secondary)] border-b border-[var(--color-hidayah-border)]/60 shadow-sm">
                  <th className="p-4 font-bold text-xs text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-[var(--color-hidayah-gold)]"/> User</span>
                  </th>
                  <th className="p-4 font-bold text-xs text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--color-hidayah-gold)]"/> Joined</span>
                  </th>
                  <th className="p-4 font-bold text-xs text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-[var(--color-hidayah-gold)]"/> Security Key</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-hidayah-border)]/20">
                {users.map((user: any) => (
                  <tr key={user._id.toString()} className="hover:bg-[var(--color-hidayah-dark)]/[0.02] dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-hidayah-dark)] text-sm">{user.username || user.email.split('@')[0]}</div>
                      <div className="text-[10px] text-[var(--color-hidayah-dark)]/50 font-medium">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-semibold text-[var(--color-hidayah-dark)]/80">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-[var(--color-hidayah-dark)]/40">
                        {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="bg-[var(--color-hidayah-primary)]/50 dark:bg-white/5 text-[var(--color-hidayah-dark)]/40 font-mono text-[10px] px-3 py-2 rounded-lg truncate max-w-[200px] border border-[var(--color-hidayah-border)]/30 group-hover:border-[var(--color-hidayah-gold)]/30 transition-colors" title={user.password}>
                        {user.password}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-12 text-center text-[var(--color-hidayah-dark)]/40 text-sm font-medium">
                No sanctuary residents found.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
