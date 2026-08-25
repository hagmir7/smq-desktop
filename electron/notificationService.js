const { app, Notification } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const log = require("electron-log");

const API_URL = "http://127.0.0.1:8000/api";
const MAX_STORED_IDS = 200;

const stateFile = path.join(
  app.getPath("userData"),
  "notification-state.json"
);

/**
 * Get IDs of notifications already displayed.
 */
function getProcessedIds() {
  try {
    if (!fs.existsSync(stateFile)) return [];

    const data = fs.readFileSync(stateFile, "utf8");
    const parsed = JSON.parse(data);

    return Array.isArray(parsed.processedIds) ? parsed.processedIds : [];
  } catch (error) {
    log.error("Failed to read notification state:", error);
    return [];
  }
}

/**
 * Save IDs of displayed notifications.
 */
function saveProcessedIds(ids) {
  try {
    // Keep only the last N IDs.
    const limitedIds = ids.slice(-MAX_STORED_IDS);

    fs.writeFileSync(
      stateFile,
      JSON.stringify({ processedIds: limitedIds }, null, 2),
      "utf8"
    );
  } catch (error) {
    log.error("Failed to save notification state:", error);
  }
}

/**
 * Display a desktop notification.
 */
function showDesktopNotification(notification) {
  const data = notification?.data || {};

  const title = data.code || getNotificationTitle(notification.type);
  const body =
    data.message ||
    data.description ||
    "Vous avez une nouvelle notification.";

  const desktopNotification = new Notification({
    title,
    body,
    silent: false,
  });

  desktopNotification.show();

  log.info(`Desktop notification displayed: ${notification.id}`);
}

/**
 * Get a readable title from a Laravel notification type.
 */
function getNotificationTitle(type) {
  if (!type) return "Nouvelle notification";

  if (type.includes("ReclamationCreated")) {
    return "Nouvelle réclamation";
  }

  if (type.includes("CorrectiveActionCompletionDate")) {
    return "Action corrective";
  }

  return "Nouvelle notification";
}

/**
 * Check Laravel notifications.
 */
async function checkNotifications(accessToken) {
  if (!accessToken) {
    log.info("Notification check skipped: no access token.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/notifications/unread`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401) {
      log.warn("Notification API returned 401. Session may be expired.");
      return { success: false, unauthorized: true };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    const notifications = Array.isArray(result.data) ? result.data : [];

    let processedIds = getProcessedIds();
    let changed = false;

    // Process oldest notifications first.
    const sortedNotifications = [...notifications].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    for (const notification of sortedNotifications) {
      if (!notification?.id) continue;

      // Already displayed by Electron.
      if (processedIds.includes(notification.id)) continue;

      // IMPORTANT: we only display unread Laravel notifications.
      if (notification.read_at !== null) {
        // Remember already-read notifications so they won't be
        // displayed later.
        processedIds.push(notification.id);
        changed = true;
        continue;
      }

      showDesktopNotification(notification);

      processedIds.push(notification.id);
      changed = true;
    }

    // Remove duplicates.
    processedIds = [...new Set(processedIds)];

    if (changed) {
      saveProcessedIds(processedIds);
    }

    log.info(
      `Notification check completed. ${notifications.length} notifications received.`
    );

    return { success: true, count: notifications.length };
  } catch (error) {
    log.error("Notification check failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  checkNotifications,
};