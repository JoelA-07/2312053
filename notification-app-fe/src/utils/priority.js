const typeWeight = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function parseTime(value) {
  if (!value) {
    return 0;
  }

  return new Date(value.replace(" ", "T")).getTime() || 0;
}

export function sortByPriority(notifications) {
  return [...notifications].sort((a, b) => {
    const weightDiff = (typeWeight[b.type] || 0) - (typeWeight[a.type] || 0);

    if (weightDiff !== 0) {
      return weightDiff;
    }

    return parseTime(b.timestamp) - parseTime(a.timestamp);
  });
}

export function getPriorityNotifications(notifications, limit) {
  return sortByPriority(notifications).slice(0, limit);
}
