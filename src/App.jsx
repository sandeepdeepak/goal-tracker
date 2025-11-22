import { useState, useEffect } from "react";
import ConfirmDialog from "./components/ConfirmDialog";

const App = () => {
  const [newHabit, setNewHabit] = useState({ name: "", description: "" });
  const [editingHabit, setEditingHabit] = useState(null);
  const [dateOffset, setDateOffset] = useState(0); // 0 = current week, -1 = previous week, +1 = next week
  const [isAddHabitExpanded, setIsAddHabitExpanded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [expandedHabits, setExpandedHabits] = useState(new Set());
  const [draggedHabit, setDraggedHabit] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Load habits from localStorage on component mount
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem("habits");
    return saved ? JSON.parse(saved) : [];
  });

  // Load reminders from localStorage on component mount
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem("reminders");
    return saved ? JSON.parse(saved) : [];
  });

  const [newReminder, setNewReminder] = useState("");

  // Save habits to localStorage whenever habits change
  useEffect(() => {
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits]);

  // Save reminders to localStorage whenever reminders change
  useEffect(() => {
    localStorage.setItem("reminders", JSON.stringify(reminders));
  }, [reminders]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Add a new habit
  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    const habit = {
      id: Date.now().toString(),
      name: newHabit.name.trim(),
      description: newHabit.description.trim(),
      createdAt: getTodayDate(),
      completedDates: [],
      streak: 0,
    };

    setHabits([...habits, habit]);
    setNewHabit({ name: "", description: "" });
  };

  // Delete a habit
  const deleteHabit = (id) => {
    const habitToDelete = habits.find((habit) => habit.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Habit",
      message: `Are you sure you want to delete "${habitToDelete?.name}"? This action cannot be undone.`,
      onConfirm: () => {
        setHabits(habits.filter((habit) => habit.id !== id));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const handleDialogCancel = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  // Toggle habit completion for today
  const toggleHabitCompletion = (id) => {
    const today = getTodayDate();
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const isCompleted = habit.completedDates.includes(today);
          let newCompletedDates;

          if (isCompleted) {
            // Remove today from completed dates
            newCompletedDates = habit.completedDates.filter(
              (date) => date !== today
            );
          } else {
            // Add today to completed dates
            newCompletedDates = [...habit.completedDates, today];
          }

          // Calculate streak
          const sortedDates = newCompletedDates.sort().reverse();
          let streak = 0;
          const today_date = new Date(today);

          for (let i = 0; i < sortedDates.length; i++) {
            const checkDate = new Date(sortedDates[i]);
            const expectedDate = new Date(today_date);
            expectedDate.setDate(expectedDate.getDate() - i);

            if (checkDate.toDateString() === expectedDate.toDateString()) {
              streak++;
            } else {
              break;
            }
          }

          return {
            ...habit,
            completedDates: newCompletedDates,
            streak: streak,
          };
        }
        return habit;
      })
    );
  };

  // Start editing a habit
  const startEdit = (habit) => {
    setEditingHabit({
      ...habit,
      editName: habit.name,
      editDescription: habit.description,
    });
  };

  // Save edited habit
  const saveEdit = () => {
    if (!editingHabit.editName.trim()) return;

    setHabits(
      habits.map((habit) =>
        habit.id === editingHabit.id
          ? {
              ...habit,
              name: editingHabit.editName.trim(),
              description: editingHabit.editDescription.trim(),
            }
          : habit
      )
    );
    setEditingHabit(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingHabit(null);
  };

  // Check if habit is completed on a specific date
  const isCompletedOnDate = (habit, date) => {
    return habit.completedDates.includes(date);
  };

  // Check if habit is completed today
  const isCompletedToday = (habit) => {
    return habit.completedDates.includes(getTodayDate());
  };

  // Generate 7 days based on current offset
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    if (dateOffset === 0) {
      // For current week, show days ending with today
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6); // Start 6 days before today

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateString = date.toISOString().split("T")[0];

        days.push({
          date: dateString,
          dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
          dayNumber: date.getDate(),
          monthName: date.toLocaleDateString("en-US", { month: "short" }),
          isToday: dateString === todayString,
          isFuture: dateString > todayString,
        });
      }
    } else {
      // For other weeks, show standard week view
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + dateOffset * 7);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateString = date.toISOString().split("T")[0];

        days.push({
          date: dateString,
          dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
          dayNumber: date.getDate(),
          monthName: date.toLocaleDateString("en-US", { month: "short" }),
          isToday: dateString === todayString,
          isFuture: dateString > todayString,
        });
      }
    }

    return days;
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    setDateOffset(dateOffset - 1);
  };

  const goToNextWeek = () => {
    setDateOffset(dateOffset + 1);
  };

  const goToCurrentWeek = () => {
    setDateOffset(0);
  };

  // Get current week description
  const getCurrentWeekDescription = () => {
    if (dateOffset === 0) return "This Week";
    if (dateOffset === 1) return "Next Week";
    if (dateOffset === -1) return "Last Week";
    if (dateOffset > 1) return `${dateOffset} Weeks Ahead`;
    return `${Math.abs(dateOffset)} Weeks Ago`;
  };

  // Toggle habit completion for a specific date
  const toggleHabitCompletionForDate = (habitId, targetDate) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === habitId) {
          const isCompleted = habit.completedDates.includes(targetDate);
          let newCompletedDates;

          if (isCompleted) {
            // Remove date from completed dates
            newCompletedDates = habit.completedDates.filter(
              (date) => date !== targetDate
            );
          } else {
            // Add date to completed dates
            newCompletedDates = [...habit.completedDates, targetDate];
          }

          return {
            ...habit,
            completedDates: newCompletedDates,
            streak: newCompletedDates.length, // Simplified streak calculation
          };
        }
        return habit;
      })
    );
  };

  // Reminder functions
  const addReminder = (e) => {
    e.preventDefault();
    if (!newReminder.trim()) return;

    const reminder = {
      id: Date.now().toString(),
      text: newReminder.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setReminders([reminder, ...reminders]);
    setNewReminder("");
  };

  const toggleReminderCompletion = (id) => {
    setReminders(
      reminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
  };

  const deleteReminder = (id) => {
    const reminderToDelete = reminders.find((reminder) => reminder.id === id);
    setConfirmDialog({
      isOpen: true,
      title: "Delete Reminder",
      message: `Are you sure you want to delete "${reminderToDelete?.text}"? This action cannot be undone.`,
      onConfirm: () => {
        setReminders(reminders.filter((reminder) => reminder.id !== id));
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  // Format creation date for display
  const formatCreationDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Toggle habit accordion
  const toggleHabitAccordion = (habitId) => {
    const newExpandedHabits = new Set(expandedHabits);
    if (newExpandedHabits.has(habitId)) {
      newExpandedHabits.delete(habitId);
    } else {
      newExpandedHabits.add(habitId);
    }
    setExpandedHabits(newExpandedHabits);
  };

  // Get current week dates only (for collapsed view)
  const getCurrentWeekDates = () => {
    const days = [];
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    // Show current week dates (7 days ending with today)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); // Start 6 days before today

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split("T")[0];

      days.push({
        date: dateString,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString("en-US", { month: "short" }),
        isToday: dateString === todayString,
        isFuture: dateString > todayString,
      });
    }

    return days;
  };

  // Drag and drop handlers
  const handleDragStart = (e, habit, index) => {
    setDraggedHabit({ habit, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    // Only clear dragOverIndex if we're leaving the entire card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedHabit || draggedHabit.index === dropIndex) {
      setDraggedHabit(null);
      return;
    }

    const newHabits = [...habits];
    const [movedHabit] = newHabits.splice(draggedHabit.index, 1);
    newHabits.splice(dropIndex, 0, movedHabit);

    setHabits(newHabits);
    setDraggedHabit(null);
  };

  const handleDragEnd = () => {
    setDraggedHabit(null);
    setDragOverIndex(null);
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🎯 Habit Tracker</h1>
        <p>Build better habits, one day at a time</p>
      </div>

      <div className="content">
        {/* Content Grid - Side by Side Layout */}
        <div className="content-grid">
          {/* Habits Column */}
          <div className="habits-column">
            {/* Add New Habit Accordion */}
            <div className="add-habit-accordion">
              <div
                className="accordion-header"
                onClick={() => setIsAddHabitExpanded(!isAddHabitExpanded)}
              >
                <h2 style={{ margin: 0, color: "#e6edf3" }}>Add New Habit</h2>
                <span
                  className={`accordion-icon ${
                    isAddHabitExpanded ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </div>

              <div
                className={`accordion-content ${
                  isAddHabitExpanded ? "expanded" : ""
                }`}
              >
                <form className="add-habit-form" onSubmit={addHabit}>
                  <div className="form-group">
                    <label>Habit Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Drink 8 glasses of water"
                      value={newHabit.name}
                      onChange={(e) =>
                        setNewHabit({ ...newHabit, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Stay hydrated throughout the day"
                      value={newHabit.description}
                      onChange={(e) =>
                        setNewHabit({
                          ...newHabit,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Add Habit
                  </button>
                </form>
              </div>
            </div>
            {/* Habits List */}
            <div className="habits-list">
              {habits.length === 0 ? (
                <div className="empty-state">
                  <h3>No habits yet!</h3>
                  <p>
                    Start building better habits by adding your first one above.
                  </p>
                  <div style={{ fontSize: "48px", marginBottom: "20px" }}>
                    🌱
                  </div>
                </div>
              ) : (
                habits.map((habit, index) => (
                  <div
                    key={habit.id}
                    className={`habit-card-accordion ${
                      draggedHabit?.index === index ? "dragging" : ""
                    } ${dragOverIndex === index ? "drag-over" : ""}`}
                    draggable={editingHabit?.id !== habit.id}
                    onDragStart={(e) => handleDragStart(e, habit, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {editingHabit && editingHabit.id === habit.id ? (
                      // Edit Mode
                      <div className="habit-card-content">
                        <div className="form-group">
                          <label>Habit Name</label>
                          <input
                            type="text"
                            value={editingHabit.editName}
                            onChange={(e) =>
                              setEditingHabit({
                                ...editingHabit,
                                editName: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Description</label>
                          <input
                            type="text"
                            value={editingHabit.editDescription}
                            onChange={(e) =>
                              setEditingHabit({
                                ...editingHabit,
                                editDescription: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="habit-actions">
                          <button
                            onClick={saveEdit}
                            className="btn btn-success"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Accordion Mode
                      <div>
                        {/* Collapsed View - Always Visible */}
                        <div
                          className="habit-accordion-header"
                          onClick={() => toggleHabitAccordion(habit.id)}
                        >
                          <div className="habit-header-content">
                            <h3 className="habit-name">{habit.name}</h3>
                            <div className="habit-streak">
                              {habit.streak} day{habit.streak !== 1 ? "s" : ""}
                            </div>
                          </div>

                          {/* Current Week Calendar - Collapsed View */}
                          <div className="habit-calendar-collapsed">
                            <div className="calendar-days">
                              {getCurrentWeekDates().map((day) => (
                                <div
                                  key={day.date}
                                  className={`calendar-day-small ${
                                    day.isToday ? "today" : ""
                                  } ${
                                    day.isFuture
                                      ? "future"
                                      : isCompletedOnDate(habit, day.date)
                                      ? "completed"
                                      : "pending"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!day.isFuture) {
                                      toggleHabitCompletionForDate(
                                        habit.id,
                                        day.date
                                      );
                                    }
                                  }}
                                  style={{
                                    cursor: day.isFuture
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                >
                                  <div className="day-number-small">
                                    {day.dayNumber}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <span
                            className={`habit-accordion-icon ${
                              expandedHabits.has(habit.id) ? "expanded" : ""
                            }`}
                          >
                            ▼
                          </span>
                        </div>

                        {/* Expanded View - Show when opened */}
                        <div
                          className={`habit-accordion-content ${
                            expandedHabits.has(habit.id) ? "expanded" : ""
                          }`}
                        >
                          <div className="habit-expanded-content">
                            {habit.description && (
                              <p className="habit-description">
                                {habit.description}
                              </p>
                            )}

                            {/* Full Calendar with Navigation */}
                            <div className="habit-calendar">
                              <div className="calendar-header">
                                <button
                                  className="calendar-nav-btn"
                                  onClick={goToPreviousWeek}
                                  title="Previous Week"
                                >
                                  ←
                                </button>
                                <div className="calendar-week-info">
                                  <h4 className="calendar-title">
                                    {getCurrentWeekDescription()}
                                  </h4>
                                  {dateOffset !== 0 && (
                                    <button
                                      className="calendar-today-btn"
                                      onClick={goToCurrentWeek}
                                    >
                                      Go to Today
                                    </button>
                                  )}
                                </div>
                                <button
                                  className="calendar-nav-btn"
                                  onClick={goToNextWeek}
                                  title="Next Week"
                                >
                                  →
                                </button>
                              </div>
                              <div className="calendar-days">
                                {getNext7Days().map((day) => (
                                  <div
                                    key={day.date}
                                    className={`calendar-day ${
                                      day.isToday ? "today" : ""
                                    } ${
                                      day.isFuture
                                        ? "future"
                                        : isCompletedOnDate(habit, day.date)
                                        ? "completed"
                                        : "pending"
                                    }`}
                                    onClick={() => {
                                      if (!day.isFuture) {
                                        toggleHabitCompletionForDate(
                                          habit.id,
                                          day.date
                                        );
                                      }
                                    }}
                                    style={{
                                      cursor: day.isFuture
                                        ? "not-allowed"
                                        : "pointer",
                                    }}
                                  >
                                    <div className="day-name">
                                      {day.dayName}
                                    </div>
                                    <div className="day-number">
                                      {day.dayNumber}
                                    </div>
                                    <div className="completion-indicator">
                                      {day.isFuture
                                        ? "🔒"
                                        : isCompletedOnDate(habit, day.date)
                                        ? "✅"
                                        : "⭕"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="habit-actions">
                              <button
                                onClick={() => startEdit(habit)}
                                className="btn btn-secondary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteHabit(habit.id)}
                                className="btn btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reminders Column */}
          <div className="reminders-column">
            {/* Reminders Section */}
            <div className="reminders-section">
              <h2>📋 Reminders</h2>

              {/* Add New Reminder */}
              <form className="add-reminder-form" onSubmit={addReminder}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Add a new reminder..."
                    value={newReminder}
                    onChange={(e) => setNewReminder(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary">
                    Add
                  </button>
                </div>
              </form>

              {/* Reminders List */}
              <div className="reminders-list">
                {reminders.length === 0 ? (
                  <div className="empty-state">
                    <h3>No reminders yet!</h3>
                    <p>Add a reminder to keep track of important tasks.</p>
                    <div style={{ fontSize: "48px", marginBottom: "20px" }}>
                      📝
                    </div>
                  </div>
                ) : (
                  reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`reminder-card ${
                        reminder.completed ? "completed" : ""
                      }`}
                    >
                      <div className="reminder-content">
                        <p
                          className={reminder.completed ? "completed-text" : ""}
                        >
                          {reminder.text}
                        </p>
                        <div className="reminder-date">
                          Created: {formatCreationDate(reminder.createdAt)}
                        </div>
                      </div>
                      <div className="reminder-actions">
                        <button
                          className={`reminder-toggle-btn ${
                            reminder.completed ? "completed" : "pending"
                          }`}
                          onClick={() => toggleReminderCompletion(reminder.id)}
                          title={
                            reminder.completed
                              ? "Mark as undone"
                              : "Mark as done"
                          }
                        ></button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteReminder(reminder.id)}
                          title="Delete reminder"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={handleDialogCancel}
      />
    </div>
  );
};

export default App;
