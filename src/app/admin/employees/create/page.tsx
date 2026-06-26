"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Copy, 
  KeyRound, 
  ShieldAlert,
  User,
  Briefcase,
  DollarSign,
  RefreshCw,
  Lock,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { z } from "zod";

// ── Zod Schema For Complete Employee Form Validation ──────────────────
const employeeFormSchema = z.object({
  // Step 1: Credentials & Auth
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "hr", "employee"]),
  email: z.string().email("Please enter a valid official email address"),
  profilePhoto: z.string().url("Invalid profile photo URL").optional().or(z.literal("")),

  // Step 2: Personal Details
  name: z.string().min(2, "Full Name must be at least 2 characters"),
  personalEmail: z.string().email("Please enter a valid personal email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
  gender: z.string().min(1, "Please select a gender"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),

  // Step 3: Work Assignment
  employeeId: z.string().min(3, "Employee ID is required"),
  department: z.string().optional(),
  designation: z.string().min(2, "Designation is required"),
  reportingManagerId: z.string().optional(),
  employmentType: z.enum(["Full-Time", "Part-Time", "Intern", "Contract"]),
  joiningDate: z.string().min(1, "Joining Date is required"),
  probationEndDate: z.string().optional(),
  officeLocation: z.string().min(2, "Office Location is required"),
  officeId: z.string().min(1, "Office location selection is required"),
  shift: z.string().min(2, "Shift is required"),

  // Step 4: Compensation & Settings
  salary: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().nonnegative("Salary must be a positive number").optional()
  ),
  status: z.enum(["Active", "Inactive"]),
  notes: z.string().optional(),
});

type FormFields = z.infer<typeof employeeFormSchema>;

const steps = [
  { id: 1, title: "Auth & Account", desc: "User credentials & role", icon: Lock },
  { id: 2, title: "Personal Info", desc: "Identity & contacts", icon: User },
  { id: 3, title: "Work & Role", desc: "Employment details", icon: Briefcase },
  { id: 4, title: "Pay & Settings", desc: "Compensation & status", icon: DollarSign },
];

type StatusState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string; credentials: { email: string; username: string; passwordHashHex: string } }
  | { type: "error"; message: string };

export default function CreateEmployeePage() {
  const currentUser = useQuery(api.users.current);
  const autoEmployeeId = useQuery(api.users.generateNextEmployeeId);
  const managers = useQuery(api.users.listManagers);
  const offices = useQuery(api.offices.getOffices);
  const createEmployee = useMutation(api.users.createEmployee);

  // Form State
  const [form, setForm] = useState<FormFields>({
    username: "",
    password: "",
    role: "employee",
    email: "",
    profilePhoto: "",
    name: "",
    personalEmail: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
    employeeId: "",
    department: "",
    designation: "",
    reportingManagerId: "",
    employmentType: "Full-Time",
    joiningDate: new Date().toISOString().split("T")[0],
    probationEndDate: "",
    officeLocation: "",
    officeId: "",
    shift: "",
    salary: undefined,
    status: "Active",
    notes: "",
  });

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isManualId, setIsManualId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  // Auto-fill sequential Employee ID when ready (and if manual override is not checked)
  useEffect(() => {
    if (autoEmployeeId && !isManualId) {
      setForm((prev) => ({ ...prev, employeeId: autoEmployeeId }));
    }
  }, [autoEmployeeId, isManualId]);

  // Auto-generate temporary password on mount
  useEffect(() => {
    handleRegeneratePassword();
  }, []);

  // Generate suggested username based on full name
  useEffect(() => {
    if (form.name && !form.username) {
      const suggested = form.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ".");
      setForm((prev) => ({ ...prev, username: suggested }));
    }
  }, [form.name, form.username]);

  const handleRegeneratePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: generated }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.password;
      return copy;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    if (status.type === "error") setStatus({ type: "idle" });
  };

  // Validate fields for a specific step
  const validateStep = (currentStep: number): boolean => {
    let fieldsToValidate: (keyof FormFields)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["username", "password", "role", "email", "profilePhoto"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["name", "personalEmail", "phone", "gender", "dateOfBirth", "address", "emergencyContact"];
    } else if (currentStep === 3) {
      fieldsToValidate = ["employeeId", "department", "designation", "reportingManagerId", "employmentType", "joiningDate", "probationEndDate", "officeLocation", "officeId", "shift"];
    } else if (currentStep === 4) {
      fieldsToValidate = ["salary", "status", "notes"];
    }

    const validationData: Record<string, unknown> = {};
    fieldsToValidate.forEach((f) => {
      validationData[f] = form[f];
    });

    const stepSchema = employeeFormSchema.pick(
      fieldsToValidate.reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
    );

    const result = stepSchema.safeParse(validationData);
    if (!result.success) {
      const stepErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        stepErrors[fieldName] = issue.message;
      });
      setErrors(stepErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) return;

    const finalValidation = employeeFormSchema.safeParse(form);
    if (!finalValidation.success) {
      const allErrors: Record<string, string> = {};
      finalValidation.error.issues.forEach((issue) => {
        allErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(allErrors);
      setStatus({ type: "error", message: "Please correct all errors before submitting." });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const result = await createEmployee({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        personalEmail: form.personalEmail.trim().toLowerCase(),
        phone: form.phone?.trim() || undefined,
        profilePhoto: form.profilePhoto?.trim() || undefined,
        department: form.department?.trim() || undefined,
        probationEndDate: form.probationEndDate || undefined,
        reportingManagerId: form.reportingManagerId || undefined,
        notes: form.notes?.trim() || undefined,
        officeId: form.officeId || undefined,
      });

      setStatus({
        type: "success",
        message: result.message,
        credentials: {
          email: form.email.trim().toLowerCase(),
          username: form.username.trim(),
          passwordHashHex: form.password,
        },
      });

      setErrors({});
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected database transaction error occurred.";
      setStatus({ type: "error", message: msg });
    }
  };

  const handleCopyCredentials = () => {
    if (status.type !== "success") return;
    const text = `ERP Employee Credentials:\nOfficial Email: ${status.credentials.email}\nUsername: ${status.credentials.username}\nTemporary Password: ${status.credentials.passwordHashHex}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (currentUser === undefined) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Validating permissions…</p>
      </div>
    );
  }

  if (currentUser === null || currentUser.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm mt-12">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Only users with the **Administrator** role can create user accounts and employee profiles. Please contact your system administrator.
        </p>
        <Link 
          href="/admin/employees" 
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Return to employee directory
        </Link>
      </div>
    );
  }

  const isLoading = status.type === "loading";
  const isSuccess = status.type === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 max-w-3xl"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/employees"
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Back to employee directory"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Onboard Enterprise Employee
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Onboard authentication account and HR employee profile in a single atomic transaction.
          </p>
        </div>
      </div>

      {/* Progress wizard indicator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            return (
              <div 
                key={s.id} 
                className={`flex flex-col md:flex-row items-center gap-2.5 p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" 
                    : isCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : isCompleted
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800"
                }`}>
                  {isCompleted ? <CheckCircle className="h-4.5 w-4.5" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold leading-none">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status banner */}
      <AnimatePresence>
        {status.type === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm font-medium"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{status.message}</span>
          </motion.div>
        )}

        {status.type === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden shadow-xs"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-200 dark:border-emerald-900/50 bg-emerald-100/50 dark:bg-emerald-950/40">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 block">
                  Employee Onboarded Successfully
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  Authentication account and employee profile record committed in a single atomic transaction.
                </span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <KeyRound className="h-4 w-4" />
                  Credentials Card (Secure Temporary Login)
                </div>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied!" : "Copy Details"}
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 divide-y divide-emerald-100 dark:divide-emerald-900/50">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">Official Email</span>
                  <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-100 text-right break-all">
                    {status.credentials.email}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">Username</span>
                  <span className="text-sm font-mono font-medium text-slate-800 dark:text-slate-100 text-right">
                    @{status.credentials.username}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-24 shrink-0">Temporary Password</span>
                  <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-100 tracking-wider">
                    {status.credentials.passwordHashHex}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  ⚠ Share these credentials securely with the employee. Credentials card will disappear on reload.
                </p>
                <Link
                  href="/admin/employees"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Go to Employee List <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Card */}
      {!isSuccess && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            {/* Step 1: Credentials & Auth */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Step 1: Auth & Account Setup</h2>
                    <p className="text-[10px] text-slate-400">Specify user role, official email, and generate a temporary password.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Official Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Official Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. j.doe@enterprise.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.email && <p className="text-[10px] text-rose-500 font-medium">{errors.email}</p>}
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <label htmlFor="username" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                      <input
                        id="username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="john.doe"
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                    {errors.username && <p className="text-[10px] text-rose-500 font-medium">{errors.username}</p>}
                  </div>

                  {/* Password with Regenerate option */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Temporary Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={handleChange}
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleRegeneratePassword}
                        className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors"
                        title="Regenerate random password"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-500 font-medium">{errors.password}</p>}
                  </div>

                  {/* Access Role */}
                  <div className="space-y-1.5">
                    <label htmlFor="role" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="employee">Employee (Limited Access)</option>
                      <option value="hr">HR Manager (Employee Read/Write)</option>
                      <option value="admin">System Administrator (Full Access)</option>
                    </select>
                    {errors.role && <p className="text-[10px] text-rose-500 font-medium">{errors.role}</p>}
                  </div>

                  {/* Profile Photo URL */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="profilePhoto" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Profile Photo URL
                    </label>
                    <input
                      id="profilePhoto"
                      name="profilePhoto"
                      type="url"
                      value={form.profilePhoto}
                      onChange={handleChange}
                      placeholder="e.g. https://images.unsplash.com/photo-... or custom URL"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.profilePhoto && <p className="text-[10px] text-rose-500 font-medium">{errors.profilePhoto}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Personal Profile */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center text-violet-500">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Step 2: Personal Details</h2>
                    <p className="text-[10px] text-slate-400">Onboard employee identity, contact, gender, address, and emergency contact details.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.name && <p className="text-[10px] text-rose-500 font-medium">{errors.name}</p>}
                  </div>

                  {/* Personal Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="personalEmail" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Personal Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="personalEmail"
                      name="personalEmail"
                      type="email"
                      value={form.personalEmail}
                      onChange={handleChange}
                      placeholder="jane.doe@gmail.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.personalEmail && <p className="text-[10px] text-rose-500 font-medium">{errors.personalEmail}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.phone && <p className="text-[10px] text-rose-500 font-medium">{errors.phone}</p>}
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <label htmlFor="gender" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                      <option value="Prefer Not To Say">Prefer Not To Say</option>
                    </select>
                    {errors.gender && <p className="text-[10px] text-rose-500 font-medium">{errors.gender}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label htmlFor="dateOfBirth" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.dateOfBirth && <p className="text-[10px] text-rose-500 font-medium">{errors.dateOfBirth}</p>}
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-1.5">
                    <label htmlFor="emergencyContact" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Emergency Contact (Name & Phone) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="emergencyContact"
                      name="emergencyContact"
                      value={form.emergencyContact}
                      onChange={handleChange}
                      placeholder="e.g. Mary Doe - 555-0199"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.emergencyContact && <p className="text-[10px] text-rose-500 font-medium">{errors.emergencyContact}</p>}
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="address" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Permanent Address <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      rows={2}
                      value={form.address}
                      onChange={handleChange}
                      placeholder="House No, Street Name, City, State, ZIP Code"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors resize-none"
                    />
                    {errors.address && <p className="text-[10px] text-rose-500 font-medium">{errors.address}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Work & Assignment */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500">
                    <Briefcase className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Step 3: Work & Employment Details</h2>
                    <p className="text-[10px] text-slate-400">Designation, department, reporting manager, location, shifts, and auto-generated ID.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Employee ID (with Manual Override) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="employeeId" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Employee ID <span className="text-rose-500">*</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                        <input
                          type="checkbox"
                          checked={isManualId}
                          onChange={(e) => setIsManualId(e.target.checked)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-800"
                        />
                        Manual Override ID
                      </label>
                    </div>
                    <input
                      id="employeeId"
                      name="employeeId"
                      value={form.employeeId}
                      onChange={handleChange}
                      disabled={!isManualId}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 disabled:opacity-60 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors font-mono font-medium"
                    />
                    {errors.employeeId && <p className="text-[10px] text-rose-500 font-medium">{errors.employeeId}</p>}
                  </div>

                  {/* Designation */}
                  <div className="space-y-1.5">
                    <label htmlFor="designation" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="designation"
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.designation && <p className="text-[10px] text-rose-500 font-medium">{errors.designation}</p>}
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <label htmlFor="department" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Department (name or code)
                    </label>
                    <input
                      id="department"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="e.g. Engineering or ENG"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.department && <p className="text-[10px] text-rose-500 font-medium">{errors.department}</p>}
                  </div>

                  {/* Reporting Manager */}
                  <div className="space-y-1.5">
                    <label htmlFor="reportingManagerId" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Reporting Manager
                    </label>
                    <select
                      id="reportingManagerId"
                      name="reportingManagerId"
                      value={form.reportingManagerId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="">No Reporting Manager</option>
                      {managers?.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.designation} - {m.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div className="space-y-1.5">
                    <label htmlFor="employmentType" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Employment Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="employmentType"
                      name="employmentType"
                      value={form.employmentType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="Full-Time">Full-Time</option>
                      <option value="Part-Time">Part-Time</option>
                      <option value="Intern">Intern</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="joiningDate" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Joining Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="joiningDate"
                      name="joiningDate"
                      type="date"
                      value={form.joiningDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.joiningDate && <p className="text-[10px] text-rose-500 font-medium">{errors.joiningDate}</p>}
                  </div>

                  {/* Probation End Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="probationEndDate" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Probation End Date (optional)
                    </label>
                    <input
                      id="probationEndDate"
                      name="probationEndDate"
                      type="date"
                      value={form.probationEndDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                  </div>

                  {/* Office Location */}
                  <div className="space-y-1.5">
                    <label htmlFor="officeId" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Office Location <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="officeId"
                      name="officeId"
                      value={form.officeId}
                      onChange={(e) => {
                        const selectedOfficeId = e.target.value;
                        const selectedOffice = offices?.find((o: any) => o._id === selectedOfficeId);
                        setForm((prev) => ({
                          ...prev,
                          officeId: selectedOfficeId,
                          officeLocation: selectedOffice ? selectedOffice.name : "",
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors cursor-pointer text-slate-850 dark:text-slate-200"
                    >
                      <option value="">Select Office Location</option>
                      {offices?.map((o: any) => (
                        <option key={o._id} value={o._id}>
                          {o.name} ({o.address.substring(0, 40)}...)
                        </option>
                      ))}
                    </select>
                    {errors.officeId && <p className="text-[10px] text-rose-500 font-medium">{errors.officeId}</p>}
                  </div>

                  {/* Working Shift */}
                  <div className="space-y-1.5">
                    <label htmlFor="shift" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Shift <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="shift"
                      name="shift"
                      value={form.shift}
                      onChange={handleChange}
                      placeholder="e.g. Regular (9 AM - 5 PM)"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {errors.shift && <p className="text-[10px] text-rose-500 font-medium">{errors.shift}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Compensation & Status */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-9 w-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Step 4: Compensation & Settings</h2>
                    <p className="text-[10px] text-slate-400">Strictly confidential parameters and HR notes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Salary (Admin-Only field) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="salary" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Monthly Base Salary (USD)
                      </label>
                      <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-1.5 py-0.5 rounded">Confidential</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        id="salary"
                        name="salary"
                        type="number"
                        min="0"
                        step="1"
                        value={form.salary ?? ""}
                        onChange={handleChange}
                        placeholder="e.g. 7500"
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                      />
                    </div>
                    {errors.salary && <p className="text-[10px] text-rose-500 font-medium">{errors.salary}</p>}
                  </div>

                  {/* Account Status */}
                  <div className="space-y-1.5">
                    <label htmlFor="status" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Account Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="Active">Active (Allows immediate login)</option>
                      <option value="Inactive">Inactive (Suspends access)</option>
                    </select>
                  </div>

                  {/* HR Notes / Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="notes" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Administrative Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Add onboarding comments, equipment details, or background details..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1 || isLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-3">
                <Link
                  href="/admin/employees"
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancel
                </Link>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Next Step
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving to Ledger…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Complete Onboarding
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </form>
        </div>
      )}
    </motion.div>
  );
}
