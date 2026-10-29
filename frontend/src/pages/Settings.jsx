
import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  UserRound,
  Bell,
  Bus,
  ShieldCheck,
  Save,
  RotateCcw,
} from "lucide-react";
import API from "../services/api";

const defaultSettings = {
  adminName: "Transport Administrator",
  email: "admin@smarttransit.edu",
  collegeName: "SmartTransit College",
  contact: "",
  notifications: true,
  incidentAlerts: true,
  delayAlerts: true,
  routeDeviationAlerts: true,
  trackingInterval: "10",
  etaBuffer: "5",
};

export default function SettingsPage() {
  const [apiHealth, setApiHealth] = useState("Checking");
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("smarttransit-settings");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return {
        ...defaultSettings,
        ...(saved ? JSON.parse(saved) : {}),
        adminName: user.name || defaultSettings.adminName,
        email: user.email || defaultSettings.email,
      };
    } catch {
      return defaultSettings;
    }
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    API.get("/health").then(({ data }) => {
      if (!cancelled) setApiHealth(data.database);
    }).catch(() => {
      if (!cancelled) setApiHealth("Unavailable");
    });
    return () => { cancelled = true; };
  }, []);

  function updateSetting(key, value) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setMessage("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const { data } = await API.patch("/auth/me", { name: settings.adminName.trim() });
      localStorage.setItem("user", JSON.stringify(data.user));
      setSettings((current) => ({
        ...current,
        adminName: data.user.name,
        email: data.user.email,
      }));
      window.dispatchEvent(new Event("userUpdated"));

      try {
        localStorage.setItem(
          "smarttransit-settings",
          JSON.stringify({ ...settings, adminName: data.user.name, email: data.user.email })
        );
        setMessage("Profile saved to your account. Other preferences are saved on this device only.");
      } catch {
        setMessage("Profile saved to your account, but device preferences could not be saved.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to save your profile.");
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    setSettings({
      ...defaultSettings,
      adminName: user.name || defaultSettings.adminName,
      email: user.email || defaultSettings.email,
    });
    localStorage.removeItem("smarttransit-settings");
    setMessage("Settings restored to their defaults. Click Save Settings to save.");
  }

  const tabs = [
    { id: "profile", label: "Admin Profile", icon: UserRound },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "transport", label: "Transport", icon: Bus },
    { id: "system", label: "System", icon: ShieldCheck },
  ];

  return (
    <div className="settings-page">
      <div className="settings-heading">
        <div>
          <p className="settings-eyebrow">SYSTEM CONFIGURATION</p>
          <h1>Settings</h1>
          <p>
            Manage your profile and device-specific transport preferences.
          </p>
        </div>

        <div className="settings-heading-icon">
          <SettingsIcon size={25} />
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                type="button"
                key={tab.id}
                className={`settings-tab ${
                  activeTab === tab.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage("");
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <form className="settings-content" onSubmit={saveSettings}>
          {activeTab === "profile" && (
            <section className="settings-section">
              <div className="settings-section-heading">
                <UserRound size={20} />
                <div>
                  <h2>Your Profile</h2>
                  <p>
                    Your name is stored with your account and shown in the dashboard.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <label>
                  Display Name
                  <input
                    value={settings.adminName}
                    onChange={(e) =>
                      updateSetting("adminName", e.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    value={settings.email}
                    readOnly
                    aria-label="Account email (read only)"
                  />
                </label>

                <label>
                  College Name
                  <input
                    value={settings.collegeName}
                    onChange={(e) =>
                      updateSetting("collegeName", e.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Contact Number
                  <input
                    type="tel"
                    value={settings.contact}
                    onChange={(e) =>
                      updateSetting("contact", e.target.value)
                    }
                    placeholder="Enter contact number"
                  />
                </label>
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="settings-section">
              <div className="settings-section-heading">
                <Bell size={20} />
                <div>
                  <h2>Notification Preferences</h2>
                  <p>
                    Choose which alerts the dashboard should enable.
                  </p>
                </div>
              </div>

              {[
                {
                  key: "notifications",
                  title: "Enable Notifications",
                  description: "Master notification preference.",
                },
                {
                  key: "incidentAlerts",
                  title: "Incident Alerts",
                  description:
                    "Enable alerts for reported transport incidents.",
                },
                {
                  key: "delayAlerts",
                  title: "Bus Delay Alerts",
                  description: "Enable notifications for bus delays.",
                },
                {
                  key: "routeDeviationAlerts",
                  title: "Route Deviation Alerts",
                  description:
                    "Enable alerts when a bus leaves its planned route.",
                },
              ].map((item) => (
                <label
                  className="settings-toggle-row"
                  key={item.key}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>

                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) =>
                      updateSetting(item.key, e.target.checked)
                    }
                  />
                </label>
              ))}
            </section>
          )}

          {activeTab === "transport" && (
            <section className="settings-section">
              <div className="settings-section-heading">
                <Bus size={20} />
                <div>
                  <h2>Transport Configuration</h2>
                  <p>
                    Configure the intended tracking and ETA preferences.
                  </p>
                </div>
              </div>

              <div className="settings-form-grid">
                <label>
                  Tracking Update Interval
                  <select
                    value={settings.trackingInterval}
                    onChange={(e) =>
                      updateSetting("trackingInterval", e.target.value)
                    }
                  >
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                  </select>
                  <small>Preferred interval for location updates.</small>
                </label>

                <label>
                  ETA Buffer
                  <select
                    value={settings.etaBuffer}
                    onChange={(e) =>
                      updateSetting("etaBuffer", e.target.value)
                    }
                  >
                    <option value="0">0 minutes</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                  </select>
                  <small>Additional time to allow in ETA estimates.</small>
                </label>
              </div>

              <div className="settings-info-note">
                These are saved preferences for the prototype. They do not
                currently change the live tracking algorithm.
              </div>
            </section>
          )}

          {activeTab === "system" && (
            <section className="settings-section">
              <div className="settings-section-heading">
                <ShieldCheck size={20} />
                <div>
                  <h2>System Information</h2>
                  <p>
                    View the current prototype configuration.
                  </p>
                </div>
              </div>

              <div className="settings-system-list">
                <div>
                  <span>Application</span>
                  <strong>SmartTransit</strong>
                </div>
                <div>
                  <span>Frontend</span>
                  <strong>React + Vite</strong>
                </div>
                <div>
                  <span>Database</span>
                  <strong>{apiHealth}</strong>
                </div>
                <div>
                  <span>Backend API</span>
                  <strong>{import.meta.env.VITE_API_URL || "http://localhost:5000/api"}</strong>
                </div>
                <div>
                  <span>Tracking Mode</span>
                  <strong>Driver device GPS with 15-second polling</strong>
                </div>
                <div>
                  <span>Displayed Status</span>
                  <strong className="settings-operational">{apiHealth}</strong>
                </div>
              </div>

              <p className="settings-system-note">
                Account profile updates are stored by the backend. Notification and ETA preferences remain on this device and do not change server behavior. ETA and trip history are not implemented.
              </p>
            </section>
          )}

          <div className="settings-footer">
            <div>
              {message && (
                <p className="settings-message" role="status">
                  {message}
                </p>
              )}
            </div>

            <div className="settings-footer-actions">
              <button
                type="button"
                className="settings-reset-button"
                onClick={resetSettings}
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button type="submit" className="settings-save-button" disabled={saving}>
                <Save size={16} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
