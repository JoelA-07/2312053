const API_URL = "http://4.224.186.213/evaluation-service/notifications";

const typeWeight = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function loadEnv() {
  const fs = require("fs");
  const path = require("path");
  const filePath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();

      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
}

class MinHeap {
  constructor(limit) {
    this.limit = limit;
    this.items = [];
  }

  compare(a, b) {
    if (a.score !== b.score) {
      return a.score - b.score;
    }

    return a.time - b.time;
  }

  push(item) {
    if (this.items.length < this.limit) {
      this.items.push(item);
      this.moveUp(this.items.length - 1);
      return;
    }

    if (this.compare(item, this.items[0]) > 0) {
      this.items[0] = item;
      this.moveDown(0);
    }
  }

  moveUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (this.compare(this.items[index], this.items[parent]) >= 0) {
        break;
      }

      [this.items[index], this.items[parent]] = [
        this.items[parent],
        this.items[index],
      ];
      index = parent;
    }
  }

  moveDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (
        left < this.items.length &&
        this.compare(this.items[left], this.items[smallest]) < 0
      ) {
        smallest = left;
      }

      if (
        right < this.items.length &&
        this.compare(this.items[right], this.items[smallest]) < 0
      ) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [this.items[index], this.items[smallest]] = [
        this.items[smallest],
        this.items[index],
      ];
      index = smallest;
    }
  }

  toSortedList() {
    return [...this.items].sort((a, b) => this.compare(b, a));
  }
}

function parseTime(value) {
  if (!value) {
    return 0;
  }

  return new Date(value.replace(" ", "T")).getTime() || 0;
}

function rankNotification(notification) {
  const type = notification.Type || notification.type || "Event";
  const time = parseTime(notification.Timestamp || notification.timestamp);

  return {
    id: notification.ID || notification.id,
    type,
    message: notification.Message || notification.message || "",
    timestamp: notification.Timestamp || notification.timestamp || "",
    score: typeWeight[type] || 0,
    time,
  };
}

function getTopNotifications(notifications, limit = 10) {
  const heap = new MinHeap(limit);

  notifications.forEach((notification) => {
    heap.push(rankNotification(notification));
  });

  return heap.toSortedList();
}

async function main() {
  loadEnv();

  const headers = {
    Accept: "application/json",
  };

  if (process.env.NOTIFICATION_API_TOKEN) {
    headers.Authorization = `Bearer ${process.env.NOTIFICATION_API_TOKEN}`;
  }

  const response = await fetch(API_URL, { headers });

  if (!response.ok) {
    throw new Error(`Notification API failed with ${response.status}`);
  }

  const data = await response.json();
  const notifications = Array.isArray(data.notifications) ? data.notifications : [];
  const topNotifications = getTopNotifications(notifications, 10);

  console.log("Top 10 Priority Notifications");
  console.table(
    topNotifications.map((item, index) => ({
      Rank: index + 1,
      Type: item.type,
      Message: item.message,
      Timestamp: item.timestamp,
      Score: item.score,
    }))
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  getTopNotifications,
};
