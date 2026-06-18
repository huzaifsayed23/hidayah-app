"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, Mail, Clock, Lock, Key, Loader2, Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { hidayahFetch } from '@/lib/api';


export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [decoded, setDecoded] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await hidayahFetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/');
          return;
        }
        const meData = await meRes.json();

        setDecoded(meData);

        if (meData.email?.toLowerCase() !== "huzaifsayed454@gmail.com") {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);

        const [usersRes, reportsRes] = await Promise.all([
          hidayahFetch('/api/admin/users'),
          hidayahFetch('/api/reports/count?status=pending')
        ]);


        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users);
        }
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setPendingReportsCount(reportsData.count);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user @${username}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await hidayahFetch(`/api/admin/users/?userId=${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUsers(users.filter(u => u._id.toString() !== userId));
      } else {
        const data = await res.json();
        alert(`Failed to delete user: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting the user.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-hidayah-primary)]">
        <Loader2 className="w-8 h-8 animate-spin text-hidayah-gold" />
      </div>
    );
  }

  if (!isAuthorized) {
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


  return (
    <main className="h-[100dvh] bg-[var(--color-hidayah-primary)] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-12 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">
          <Logo className="mb-4 sm:mb-8" />
          
          {/* Header */}
          <header className="flex flex-col gap-6 mb-8 bg-[var(--color-hidayah-secondary)] p-5 sm:p-8 rounded-[2.5rem] border border-[var(--color-hidayah-border)]/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-hidayah-dark)] rounded-full flex items-center justify-center text-[var(--color-hidayah-gold)] shadow-md shrink-0">
                <Key className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--color-hidayah-dark)]">Admin Control Panel</h1>
                <p className="text-[10px] sm:text-sm font-medium text-[var(--color-hidayah-dark)]/60 line-clamp-1">Authorized as: {decoded.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
              <Link 
                href="/admin/reports"
                className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl sm:rounded-full border transition-all flex-1 ${pendingReportsCount > 0 ? 'bg-red-50 border-red-200 shadow-sm animate-pulse-slow' : 'bg-[var(--color-hidayah-primary)] border-[var(--color-hidayah-border)]/50 opacity-60'}`}
              >
                <ShieldAlert className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${pendingReportsCount > 0 ? 'text-red-500' : 'text-[var(--color-hidayah-gold)]'}`} />
                <div className="flex flex-col">
                  <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${pendingReportsCount > 0 ? 'text-red-500' : 'text-[var(--color-hidayah-dark)]/40'}`}>Moderation</span>
                  <span className="font-bold text-[var(--color-hidayah-dark)] text-xs sm:text-sm">{pendingReportsCount} Reports</span>
                </div>
              </Link>
              <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-[var(--color-hidayah-primary)] rounded-2xl sm:rounded-full border border-[var(--color-hidayah-border)]/50 shadow-sm flex-1">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[var(--color-hidayah-gold)]" />
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-hidayah-dark)]/40">Community</span>
                  <span className="font-bold text-[var(--color-hidayah-dark)] text-xs sm:text-sm">{users.length} Users</span>
                </div>
              </div>
            </div>
          </header>
  
          {/* Users Table */}
          <div className="bg-[var(--color-hidayah-secondary)] rounded-[2.5rem] overflow-hidden shadow-sm border border-[var(--color-hidayah-border)]/40 backdrop-blur-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[var(--color-hidayah-secondary)] border-b border-[var(--color-hidayah-border)]/60 shadow-sm">
                    <th className="p-4 font-bold text-[10px] text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[var(--color-hidayah-gold)]"/> User</span>
                    </th>
                    <th className="p-4 font-bold text-[10px] text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[var(--color-hidayah-gold)]"/> Joined</span>
                    </th>
                    <th className="p-4 font-bold text-[10px] text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-[var(--color-hidayah-gold)]"/> Key</span>
                    </th>
                    <th className="p-4 font-bold text-[10px] text-[var(--color-hidayah-dark)]/70 uppercase tracking-widest text-right">
                      <span className="flex items-center gap-2 justify-end">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hidayah-border)]/20">
                  {users.map((user: any) => (
                    <tr key={user._id.toString()} className="hover:bg-black/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-[var(--color-hidayah-dark)] text-xs sm:text-sm">{user.username || user.email.split('@')[0]}</div>
                        <div className="text-[9px] sm:text-[10px] text-[var(--color-hidayah-dark)]/50 font-medium">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] sm:text-xs font-semibold text-[var(--color-hidayah-dark)]/80">
                          {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[9px] text-[var(--color-hidayah-dark)]/40">
                          {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="bg-[var(--color-hidayah-primary)]/50 text-[var(--color-hidayah-dark)]/40 font-mono text-[9px] sm:text-[10px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg truncate max-w-[120px] sm:max-w-[200px] border border-[var(--color-hidayah-border)]/30 group-hover:border-[var(--color-hidayah-gold)]/30 transition-colors">
                          {user.password}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(user._id.toString(), user.username || user.email)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-60 group-hover:opacity-100"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <div className="h-20" /> {/* Spacer for bottom nav */}
      </div>
    </main>
  );
}
