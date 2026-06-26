"use client";

import React, { useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  X,
  Printer,
  Download,
  Loader2,
  Building,
  Calendar,
  Clock,
  User,
  Wallet,
} from "lucide-react";

// Convert number to words in Indian Numbering System
function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Rupees Zero Only";

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  };

  return "Rupees " + convert(Math.floor(num)) + " Only";
}

interface PayslipModalProps {
  payrollId: string;
  onClose: () => void;
}

export function PayslipModal({ payrollId, onClose }: PayslipModalProps) {
  const data = useQuery(api.employee.getPayslipDetails, { payrollId: payrollId as Id<"payroll"> });

  if (data === undefined) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400 max-w-sm w-full shadow-2xl">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold">Generating pixel-perfect preview…</span>
        </div>
      </div>
    );
  }

  if (data === null) return null;

  const { payroll, user, employee, salary, departmentName, attendanceSummary } = data;

  const basicSalary = salary?.basicSalary ?? payroll.baseSalary;
  const hra = salary?.hra ?? 0;
  const allowances = salary?.allowances ?? payroll.allowances;
  const perksAndBenefits = salary?.perksAndBenefits ?? 0;
  const bonus = salary?.bonus ?? 0;

  const pf = salary?.pf ?? 0;
  const esi = salary?.esi ?? 0;
  const tds = salary?.tds ?? payroll.deductions;
  const otherDeductions = salary?.deductions ?? 0;

  const totalEarnings = basicSalary + hra + allowances + perksAndBenefits + bonus;
  const totalDeductions = pf + esi + tds + otherDeductions;
  const netPay = totalEarnings - totalDeductions;

  // Round values for table format
  const basicSalaryVal = Math.round(basicSalary);
  const hraVal = Math.round(hra);
  const allowancesVal = Math.round(allowances);
  const bonusVal = Math.round(bonus);
  const totalEarningsVal = Math.round(totalEarnings);

  const pfVal = Math.round(pf);
  const esiVal = Math.round(esi);
  const tdsVal = Math.round(tds);
  const otherDeductionsVal = Math.round(otherDeductions);
  const totalDeductionsVal = Math.round(totalDeductions);

  const netPayVal = Math.round(netPay);

  // Format date
  const [monthName, yearStr] = payroll.month.split(" ");
  const monthMap: Record<string, number> = {
    January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
    July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
  };
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const monthIndex = monthMap[monthName] ?? new Date().getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const payPeriodStart = `01 ${payroll.month}`;
  const payPeriodEnd = `${lastDay} ${payroll.month}`;

  let payDateStr = "--";
  if (payroll.paymentDate) {
    const pDate = new Date(payroll.paymentDate);
    payDateStr = pDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  }

  const workModeStr = employee?.employmentType === "Intern" || employee?.officeLocation === "Remote"
    ? "Work From Home (WFH)"
    : "Office Bounds";

  const handlePrint = () => {
    const printContent = document.getElementById("bizwoke-payslip-print-content");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Salary Slip - ${payroll.month}</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 20mm;
              }
              body {
                margin: 0;
                font-family: Arial, sans-serif;
                color: #0f172a;
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid #94a3b8;
                padding: 6px 8px;
                font-size: 10px;
                text-align: left;
              }
              th {
                background-color: #f1f5f9;
              }
              .lbl {
                font-weight: bold;
                background-color: #f8fafc;
                width: 18%;
              }
              .val {
                width: 32%;
              }
              .text-right {
                text-align: right;
              }
              .font-mono {
                font-family: monospace;
              }
              .font-bold {
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <img src="${window.location.origin}/Bizwoke.jpg" alt="Bizwoke Logo" style="height: 40px; object-fit: contain;" />
              <div style="text-align: right; font-size: 10px; color: #334155; line-height: 1.4;">
                <strong style="font-size: 12px; color: #0f172a;">Bizwoke Nova Private Limited</strong><br/>
                ITHUM Tower, 3rd Floor, Office 307B, A-40, Sector 62,<br/>
                Noida, Uttar Pradesh 201301
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
              <tr>
                <td class="lbl">Employee Id</td>
                <td class="val">${employee?.employeeId ?? "--"}</td>
                <td class="lbl">Employee Name</td>
                <td class="val">${user.name}</td>
              </tr>
              <tr>
                <td class="lbl">Date of Birth</td>
                <td class="val">${employee?.dateOfBirth ?? "--"}</td>
                <td class="lbl">Date of Joining</td>
                <td class="val">${employee?.joiningDate ?? "--"}</td>
              </tr>
              <tr>
                <td class="lbl">Designation</td>
                <td class="val">${employee?.designation ?? "--"}</td>
                <td class="lbl">Department</td>
                <td class="val">${departmentName}</td>
              </tr>
              <tr>
                <td class="lbl">Employment Type</td>
                <td class="val">${employee?.employmentType ?? "Full-Time"}</td>
                <td class="lbl">Work Mode</td>
                <td class="val">${workModeStr}</td>
              </tr>
              <tr>
                <td class="lbl">Gender</td>
                <td class="val">${employee?.gender ?? "--"}</td>
                <td class="lbl">No of Days / LOP</td>
                <td class="val">${attendanceSummary.totalWorkingDays}.00 / ${attendanceSummary.unpaidLeave}.00</td>
              </tr>
            </table>

            <div style="font-size: 11px; font-weight: bold; padding: 6px 8px; border: 1px solid #cbd5e1; border-bottom: 0; background-color: #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px;">
              Payslip for the month of ${payroll.month}
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px;">
              <thead>
                <tr style="background-color: #f1f5f9; font-weight: bold; text-align: left;">
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; width: 20%;">Earnings</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; width: 11%; white-space: nowrap;">Reference Amount</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; width: 10%;">Amount</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; width: 11%; white-space: nowrap;">Arrear Amount</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; width: 11%; white-space: nowrap;">Year to Date</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; width: 16%;">Deductions</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; width: 10%;">Amount</th>
                  <th style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; width: 11%; white-space: nowrap;">Year to Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Basic</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${basicSalaryVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${basicSalaryVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${basicSalaryVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Provident Fund (PF)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${pfVal > 0 ? pfVal.toLocaleString("en-IN") : "-"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${pfVal > 0 ? pfVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">H.R.A</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${hraVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${hraVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${hraVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Employee State Insurance (ESI)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${esiVal > 0 ? esiVal.toLocaleString("en-IN") : "-"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${esiVal > 0 ? esiVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f8fafc;">
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Sub Total (A)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(basicSalaryVal + hraVal).toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(basicSalaryVal + hraVal).toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(basicSalaryVal + hraVal).toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Sub Total (C)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(pfVal + esiVal) > 0 ? (pfVal + esiVal).toLocaleString("en-IN") : "0"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(pfVal + esiVal) > 0 ? (pfVal + esiVal).toLocaleString("en-IN") : "0"}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f1f5f9;">
                  <td colspan="5" style="border: 1px solid #cbd5e1; padding: 4px 8px; text-transform: uppercase; font-size: 9px;">Other Incentives</td>
                  <td colspan="3" style="border: 1px solid #cbd5e1; padding: 4px 8px; text-transform: uppercase; font-size: 9px;">Other Deductions</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Allowances</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${allowancesVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${allowancesVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${allowancesVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Income Tax (TDS)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${tdsVal > 0 ? tdsVal.toLocaleString("en-IN") : "-"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${tdsVal > 0 ? tdsVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Performance Bonus</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${bonusVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${bonusVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${bonusVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Other Deductions</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${otherDeductionsVal > 0 ? otherDeductionsVal.toLocaleString("en-IN") : "-"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${otherDeductionsVal > 0 ? otherDeductionsVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f8fafc;">
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Sub Total (B)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(allowancesVal + bonusVal).toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(allowancesVal + bonusVal).toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(allowancesVal + bonusVal).toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Sub Total (D)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(tdsVal + otherDeductionsVal) > 0 ? (tdsVal + otherDeductionsVal).toLocaleString("en-IN") : "0"}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${(tdsVal + otherDeductionsVal) > 0 ? (tdsVal + otherDeductionsVal).toLocaleString("en-IN") : "0"}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f1f5f9;">
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Gross Earnings (E=A+B)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${totalEarningsVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${totalEarningsVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">0</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${totalEarningsVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px;">Gross Deductions (F=C+D)</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${totalDeductionsVal.toLocaleString("en-IN")}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-family: monospace;">${totalDeductionsVal.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
              <tr style="font-weight: bold; background-color: #f1f5f9;">
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; width: 25%;">Net Pay (G=E-F)</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-family: monospace; font-size: 11px;">₹ ${netPayVal.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: bold; background-color: #f8fafc;">Net Pay In Words</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-style: italic; color: #475569;">${numberToWords(netPayVal)}</td>
              </tr>
            </table>

            <div style="font-size: 9px; color: #64748b; margin-top: 25px; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
              <strong>Note :</strong> This is a computer generated payslip and does not require authentication.
            </div>
          </body>
        </html>
      `);
      doc.close();

      // Temporarily change main document title to ensure correct filename in browser print save-as-PDF
      const originalTitle = document.title;
      document.title = `Salary Slip - ${payroll.month}`;

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.title = originalTitle;
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col my-8 border border-slate-150 dark:border-slate-800">
        
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">
              Salary Slip - {payroll.month}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer animate-none"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer animate-none"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer animate-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-12 flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
          <div 
            id="bizwoke-payslip-print-content" 
            className="w-[794px] bg-white text-slate-900 p-8 shadow-md border border-slate-350 font-sans mx-auto"
            style={{ boxSizing: "border-box" }}
          >
            <div className="flex justify-between items-center mb-6">
              <img src="/Bizwoke.jpg" alt="Bizwoke Logo" className="h-[40px] object-contain" />
              <div className="text-right text-[10px] text-slate-650 leading-normal">
                <strong className="text-xs text-slate-900 font-bold block">Bizwoke Nova Private Limited</strong>
                <div>ITHUM Tower, 3rd Floor, Office 307B, A-40, Sector 62,</div>
                <div>Noida, Uttar Pradesh 201301</div>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-[10px] mb-4">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700 w-[18%]">Employee Id</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800 w-[32%]">{employee?.employeeId ?? "--"}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700 w-[18%]">Employee Name</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-850 w-[32%]">{user.name}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Date of Birth</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{employee?.dateOfBirth ?? "--"}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Date of Joining</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{employee?.joiningDate ?? "--"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Designation</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{employee?.designation ?? "--"}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Department</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{departmentName}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Employment Type</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{employee?.employmentType ?? "Full-Time"}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Work Mode</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{workModeStr}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">Gender</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{employee?.gender ?? "--"}</td>
                  <td className="border border-slate-300 px-3 py-1.5 font-bold bg-slate-50 text-slate-700">No of Days / LOP</td>
                  <td className="border border-slate-300 px-3 py-1.5 text-slate-800">{attendanceSummary.totalWorkingDays}.00 / {attendanceSummary.unpaidLeave}.00</td>
                </tr>
              </tbody>
            </table>

            <div className="font-bold text-[11px] px-3 py-1.5 border border-slate-300 border-b-0 bg-slate-100 uppercase tracking-wide">
              Payslip for the month of {payroll.month}
            </div>

            <table className="w-full border-collapse border border-slate-300 text-[10px] mb-4">
              <thead>
                <tr className="bg-slate-100 font-bold text-slate-800">
                  <th className="border border-slate-300 px-2 py-1.5 text-left w-[20%]">Earnings</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-[11%] whitespace-nowrap">Reference Amount</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-[10%]">Amount</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-[11%] whitespace-nowrap">Arrear Amount</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-[11%] whitespace-nowrap">Year to Date</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left w-[16%]">Deductions</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-[10%]">Amount</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-[11%] whitespace-nowrap">Year to Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Basic</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{basicSalaryVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{basicSalaryVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{basicSalaryVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Provident Fund (PF)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{pfVal > 0 ? pfVal.toLocaleString("en-IN") : "-"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{pfVal > 0 ? pfVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">H.R.A</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{hraVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{hraVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{hraVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Employee State Insurance (ESI)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{esiVal > 0 ? esiVal.toLocaleString("en-IN") : "-"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{esiVal > 0 ? esiVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr className="font-bold bg-slate-50 text-slate-850">
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Sub Total (A)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(basicSalaryVal + hraVal).toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(basicSalaryVal + hraVal).toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(basicSalaryVal + hraVal).toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Sub Total (C)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(pfVal + esiVal) > 0 ? (pfVal + esiVal).toLocaleString("en-IN") : "0"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(pfVal + esiVal) > 0 ? (pfVal + esiVal).toLocaleString("en-IN") : "0"}</td>
                </tr>
                <tr className="font-bold bg-slate-100 text-slate-800 text-[9px] uppercase tracking-wider">
                  <td colSpan={5} className="border border-slate-300 px-2 py-1">Other Incentives</td>
                  <td colSpan={3} className="border border-slate-300 px-2 py-1">Other Deductions</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Allowances</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{allowancesVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{allowancesVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{allowancesVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Income Tax (TDS)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{tdsVal > 0 ? tdsVal.toLocaleString("en-IN") : "-"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{tdsVal > 0 ? tdsVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Performance Bonus</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{bonusVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{bonusVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{bonusVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Other Deductions</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{otherDeductionsVal > 0 ? otherDeductionsVal.toLocaleString("en-IN") : "-"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-slate-850">{otherDeductionsVal > 0 ? otherDeductionsVal.toLocaleString("en-IN") : "-"}</td>
                </tr>
                <tr className="font-bold bg-slate-50 text-slate-850">
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Sub Total (B)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(allowancesVal + bonusVal).toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(allowancesVal + bonusVal).toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(allowancesVal + bonusVal).toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Sub Total (D)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(tdsVal + otherDeductionsVal) > 0 ? (tdsVal + otherDeductionsVal).toLocaleString("en-IN") : "0"}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{(tdsVal + otherDeductionsVal) > 0 ? (tdsVal + otherDeductionsVal).toLocaleString("en-IN") : "0"}</td>
                </tr>
                <tr className="font-bold bg-slate-100 text-slate-850">
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Gross Earnings (E=A+B)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{totalEarningsVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{totalEarningsVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">0</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{totalEarningsVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-slate-700">Gross Deductions (F=C+D)</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{totalDeductionsVal.toLocaleString("en-IN")}</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{totalDeductionsVal.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border border-slate-300 text-[10px] mb-6">
              <tbody>
                <tr className="font-bold bg-slate-100 text-slate-850">
                  <td className="border border-slate-300 px-3 py-2 w-[25%]">Net Pay (G=E-F)</td>
                  <td className="border border-slate-300 px-3 py-2 font-mono text-xs text-indigo-900">₹ {netPayVal.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-3 py-2 font-bold bg-slate-50 text-slate-700">Net Pay In Words</td>
                  <td className="border border-slate-300 px-3 py-2 italic text-slate-605 font-medium">{numberToWords(netPayVal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="text-[9px] text-slate-500 mt-6 leading-relaxed border-t border-slate-300 border-dashed pt-3">
              <strong>Note :</strong> This is a computer generated payslip and does not require authentication.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
