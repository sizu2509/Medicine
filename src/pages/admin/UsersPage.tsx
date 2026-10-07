import React, { useState } from 'react';
import { UserCheck, Shield, Check, X, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const UsersPage: React.FC = () => {
  const { role, switchRole } = useAuth();

  const staffMembers = [
    { name: 'Dr. Tarique Rahman', email: 'tarique@medistockpro.com', role: 'Super Admin', status: 'Active' },
    { name: 'Nasrin Akhter', email: 'nasrin@medistockpro.com', role: 'Pharmacist', status: 'Active' },
    { name: 'Mohammad Faruk', email: 'faruk@medistockpro.com', role: 'Salesman', status: 'Active' },
    { name: 'Saiful Islam', email: 'saiful@medistockpro.com', role: 'Accountant', status: 'Active' },
    { name: 'Tanvir Ahmed', email: 'tanvir@medistockpro.com', role: 'Manager', status: 'Active' },
  ];

  const permissionsMatrix = [
    { name: 'Manage Medicines & Catalog', super: true, admin: true, manager: true, pharm: true, sales: false, acct: false },
    { name: 'Execute POS Counter Sales', super: true, admin: true, manager: true, pharm: true, sales: true, acct: false },
    { name: 'Process Customer Returns', super: true, admin: true, manager: true, pharm: true, sales: true, acct: false },
    { name: 'Manage Batches & Expiry', super: true, admin: true, manager: true, pharm: true, sales: false, acct: false },
    { name: 'Create Supplier Purchases', super: true, admin: true, manager: true, pharm: false, sales: false, acct: false },
    { name: 'Purchase Returns to Depot', super: true, admin: true, manager: true, pharm: false, sales: false, acct: false },
    { name: 'Manage Expenses & Overhead', super: true, admin: true, manager: false, pharm: false, sales: false, acct: true },
    { name: 'Financial Accounting & P&L', super: true, admin: true, manager: false, pharm: false, sales: false, acct: true },
    { name: 'System Settings & Audit Log', super: true, admin: true, manager: false, pharm: false, sales: false, acct: false },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Staff Accounts & Role-Based Permissions (RBAC)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict multi-role authorization: Super Admin, Admin, Manager, Pharmacist, Salesman, Accountant.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 p-2 rounded-xl text-xs">
          <Shield className="w-4 h-4 text-amber-700" />
          <span className="text-amber-900 font-semibold">Your Current Active Role:</span>
          <span className="font-extrabold text-amber-950 uppercase">{role}</span>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Registered Staff</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Assignment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Switch Role (Test)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((member, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{member.name}</td>
                  <td className="py-3 px-4 text-slate-600">{member.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded text-[10px]">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] text-emerald-700 font-semibold">{member.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => switchRole(member.role as UserRole)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                        role === member.role
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {role === member.role ? 'Current Role' : `Switch to ${member.role}`}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Role Permission Access Matrix
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Enforced both in React interface and PostgreSQL Supabase Row-Level Security.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase">
                <th className="py-3 px-4 text-left">Module / Feature</th>
                <th className="py-3 px-3">Super Admin</th>
                <th className="py-3 px-3">Admin</th>
                <th className="py-3 px-3">Manager</th>
                <th className="py-3 px-3">Pharmacist</th>
                <th className="py-3 px-3">Salesman</th>
                <th className="py-3 px-3">Accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 text-left font-medium text-slate-800">{perm.name}</td>
                  <td className="py-3 px-3">
                    {perm.super ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-3">
                    {perm.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-3">
                    {perm.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-3">
                    {perm.pharm ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-3">
                    {perm.sales ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="py-3 px-3">
                    {perm.acct ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
