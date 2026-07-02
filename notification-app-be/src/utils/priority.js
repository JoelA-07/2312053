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

function comparePriority(a, b) {
  const weightDiff = (typeWeight[a.type] || 0) - (typeWeight[b.type] || 0);

  if (weightDiff !== 0) {
    return weightDiff;
  }

  return parseTime(a.timestamp) - parseTime(b.timestamp);
}

function getPriorityNotifications(notifications, limit = 10) {
  const heap = [];

  function moveUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);

      if (comparePriority(heap[index], heap[parent]) >= 0) {
        break;
      }

      [heap[index], heap[parent]] = [heap[parent], heap[index]];
      index = parent;
    }
  }

  function moveDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (left < heap.length && comparePriority(heap[left], heap[smallest]) < 0) {
        smallest = left;
      }

      if (right < heap.length && comparePriority(heap[right], heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) {
        break;
      }

      [heap[index], heap[smallest]] = [heap[smallest], heap[index]];
      index = smallest;
    }
  }

  notifications.forEach((notification) => {
    if (heap.length < limit) {
      heap.push(notification);
      moveUp(heap.length - 1);
      return;
    }

    if (comparePriority(notification, heap[0]) > 0) {
      heap[0] = notification;
      moveDown(0);
    }
  });

  return heap.sort((a, b) => comparePriority(b, a));
}

module.exports = { getPriorityNotifications };
