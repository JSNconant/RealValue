"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserStore } from "@/lib/store";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { User, Lock, Bell, Download, Trash2, Shield, Check } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateProfile, deleteAccount, signOut } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Notifications
  const [notifySearches, setNotifySearches] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({ fullName, email });
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  function handleExportData() {
    if (!user) return;
    const store = getUserStore(user.id);
    const exportPayload = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      },
      searches: store.searches,
      downloads: store.downloads,
      charges: store.charges,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `realvalue-export-${user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data export downloaded as JSON.");
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await deleteAccount();
      toast.info("Your account has been deleted.");
      router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Account Settings</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Manage your personal details, notification choices, and privacy.
        </p>
      </div>

      {/* 1. Profile Details */}
      <Card variant="bordered" style={{ padding: "28px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Profile Information</h2>
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
          />
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <div>
            <Button type="submit" size="md" loading={profileSaving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. Notification Preferences */}
      <Card variant="bordered" style={{ padding: "28px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Email Notifications</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={notifySearches}
              onChange={(e) => {
                setNotifySearches(e.target.checked);
                toast.success("Preference saved.");
              }}
              style={{ accentColor: "var(--color-trust)" }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Search receipts &amp; reports</div>
              <div style={{ fontSize: 13, color: "var(--color-secondary)" }}>
                Receive an email receipt each time a new search is conducted.
              </div>
            </div>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={notifyUpdates}
              onChange={(e) => {
                setNotifyUpdates(e.target.checked);
                toast.success("Preference saved.");
              }}
              style={{ accentColor: "var(--color-trust)" }}
            />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Model accuracy updates</div>
              <div style={{ fontSize: 13, color: "var(--color-secondary)" }}>
                Occasional announcements when model backtesting and validation milestones are published.
              </div>
            </div>
          </label>
        </div>
      </Card>

      {/* 3. Active Sessions */}
      <Card variant="bordered" style={{ padding: "28px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Active Sessions</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            background: "var(--color-page)",
            borderRadius: "var(--radius-input)",
            border: "1px solid var(--color-divider)",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Current Browser Session</div>
            <div style={{ fontSize: 12, color: "var(--color-secondary)" }}>Active now • Local workstation</div>
          </div>
          <span className="badge badge--success">Current</span>
        </div>
      </Card>

      {/* 4. Export Data */}
      <Card variant="bordered" style={{ padding: "28px 24px", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Export Your Data</h2>
        <p style={{ color: "var(--color-secondary)", fontSize: 14, marginBottom: 16 }}>
          Download an archive of all searches, saved homes, and billing records associated with your account.
        </p>
        <Button variant="secondary" size="md" onClick={handleExportData}>
          <Download size={16} /> Export my data (JSON)
        </Button>
      </Card>

      {/* 5. Danger Zone: Delete Account */}
      <Card variant="bordered" style={{ padding: "28px 24px", borderColor: "var(--color-error-border)" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-error)", marginBottom: 8 }}>
          Delete Account
        </h2>
        <p style={{ color: "var(--color-secondary)", fontSize: 14, marginBottom: 16 }}>
          Permanently delete your RealValue account, search snapshots, saved homes, and download records.
          This action cannot be undone.
        </p>

        {showDeleteModal ? (
          <div style={{ padding: 16, background: "var(--color-error-bg)", borderRadius: "var(--radius-input)", border: "1px solid var(--color-error-border)" }}>
            <p style={{ color: "var(--color-error)", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              To confirm, type <strong>DELETE</strong> below:
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== "DELETE"}
                loading={deleting}
                onClick={handleDeleteAccount}
              >
                Permanently delete
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="destructive" size="md" onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={16} /> Delete my account
          </Button>
        )}
      </Card>
    </div>
  );
}
