import { Component, setIcon } from "obsidian";
import { Task } from "../../utils/types/TaskIndex";
import { CalendarComponent } from "./calendar";
import { TaskListItemComponent } from "./listItem";
import { t } from "../../translations/helper";

interface DateSection {
	title: string;
	date: Date;
	tasks: Task[];
	isExpanded: boolean;
}

export class ForecastComponent extends Component {
	// UI Elements
	public containerEl: HTMLElement;
	private forecastHeaderEl: HTMLElement;
	private settingsEl: HTMLElement;
	private calendarContainerEl: HTMLElement;
	private dueSoonContainerEl: HTMLElement;
	private taskContainerEl: HTMLElement;
	private taskListContainerEl: HTMLElement;
	private focusBarEl: HTMLElement;
	private statsContainerEl: HTMLElement;

	// Child components
	private calendarComponent: CalendarComponent;
	private taskComponents: TaskListItemComponent[] = [];

	// State
	private allTasks: Task[] = [];
	private pastDueTasks: Task[] = [];
	private todayTasks: Task[] = [];
	private futureTasks: Task[] = [];
	private selectedDate: Date = new Date();
	private dateSections: DateSection[] = [];
	private focusFilter: string | null = null;

	// Events
	public onTaskSelected: (task: Task) => void;
	public onTaskCompleted: (task: Task) => void;

	constructor(private parentEl: HTMLElement) {
		super();
	}

	onload() {
		// Create main container
		this.containerEl = this.parentEl.createDiv({
			cls: "forecast-container",
		});

		// Create content container for columns
		const contentContainer = this.containerEl.createDiv({
			cls: "forecast-content",
		});

		// Left column: create calendar section and due soon stats
		this.createLeftColumn(contentContainer);

		// Right column: create task sections by date
		this.createRightColumn(contentContainer);
	}

	private createForecastHeader() {
		this.forecastHeaderEl = this.taskContainerEl.createDiv({
			cls: "forecast-header",
		});

		// Title and task count
		const titleContainer = this.forecastHeaderEl.createDiv({
			cls: "forecast-title-container",
		});

		this.titleEl = titleContainer.createDiv({
			cls: "forecast-title",
			text: "Forecast",
		});

		const countEl = titleContainer.createDiv({
			cls: "forecast-count",
		});
		countEl.setText("0 actions, 0 projects");

		// Settings button
		this.settingsEl = this.forecastHeaderEl.createDiv({
			cls: "forecast-settings",
		});
		setIcon(this.settingsEl, "settings");
	}

	private createFocusBar() {
		this.focusBarEl = this.taskContainerEl.createDiv({
			cls: "forecast-focus-bar",
		});

		const focusInput = this.focusBarEl.createEl("input", {
			cls: "focus-input",
			attr: {
				type: "text",
				placeholder: "Focusing on Work",
			},
		});

		const unfocusBtn = this.focusBarEl.createEl("button", {
			cls: "unfocus-button",
			text: "Unfocus",
		});

		this.registerDomEvent(unfocusBtn, "click", () => {
			focusInput.value = "";
		});
	}

	private createLeftColumn(parentEl: HTMLElement) {
		const leftColumnEl = parentEl.createDiv({
			cls: "forecast-left-column",
		});

		// Stats bar for Past Due / Today / Future counts
		this.createStatsBar(leftColumnEl);

		// Calendar section
		this.calendarContainerEl = leftColumnEl.createDiv({
			cls: "forecast-calendar-section",
		});

		// Create and initialize calendar component
		this.calendarComponent = new CalendarComponent(
			this.calendarContainerEl
		);
		this.addChild(this.calendarComponent);
		this.calendarComponent.load();

		// Due Soon section below calendar
		this.createDueSoonSection(leftColumnEl);

		// Set up calendar events
		this.calendarComponent.onDateSelected = (date, tasks) => {
			this.selectedDate = date;
			this.refreshDateSections();
		};
	}

	private createStatsBar(parentEl: HTMLElement) {
		this.statsContainerEl = parentEl.createDiv({
			cls: "forecast-stats",
		});

		// Create stat items
		const createStatItem = (
			id: string,
			label: string,
			count: number,
			type: string
		) => {
			const statItem = this.statsContainerEl.createDiv({
				cls: `stat-item ${id}`,
			});

			const countEl = statItem.createDiv({
				cls: "stat-count",
				text: count.toString(),
			});

			const labelEl = statItem.createDiv({
				cls: "stat-label",
				text: label,
			});

			// Register click handler
			this.registerDomEvent(statItem, "click", () => {
				this.focusTaskList(type);
			});

			return statItem;
		};

		// Create stats for past due, today, and future
		createStatItem("past-due", "Past Due", 0, "past-due");
		createStatItem("today", "Today", 1, "today");
		createStatItem("future", "Future", 2, "future");
	}

	private createDueSoonSection(parentEl: HTMLElement) {
		this.dueSoonContainerEl = parentEl.createDiv({
			cls: "forecast-due-soon-section",
		});

		// Due soon entries will be added when tasks are set
	}

	private createRightColumn(parentEl: HTMLElement) {
		this.taskContainerEl = parentEl.createDiv({
			cls: "forecast-right-column",
		});

		// Create header with project count and actions
		this.createForecastHeader();

		// Create focus filter bar
		this.createFocusBar();

		this.taskListContainerEl = this.taskContainerEl.createDiv({
			cls: "forecast-task-list",
		});

		// Date sections will be added when tasks are set
	}

	public setTasks(tasks: Task[]) {
		this.allTasks = tasks;

		// Update header count
		this.updateHeaderCount();

		// Filter and categorize tasks
		this.categorizeTasks();

		// Update calendar with all tasks
		this.calendarComponent.setTasks(this.allTasks);

		// Update stats
		this.updateTaskStats();

		// Update due soon section
		this.updateDueSoonSection();

		// Create date sections for the right column
		this.createDateSections();
	}

	private updateHeaderCount() {
		// Count actions (tasks) and unique projects
		const projectSet = new Set<string>();
		this.allTasks.forEach((task) => {
			if (task.project) {
				projectSet.add(task.project);
			}
		});

		const taskCount = this.allTasks.filter(
			(task) => !task.completed
		).length;
		const projectCount = projectSet.size;

		// Update header
		const countEl = this.forecastHeaderEl.querySelector(".forecast-count");
		if (countEl) {
			countEl.textContent = `${taskCount} actions, ${projectCount} project${
				projectCount !== 1 ? "s" : ""
			}`;
		}
	}

	private categorizeTasks() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayTimestamp = today.getTime();

		// Filter for incomplete tasks with due dates
		const tasksWithDueDates = this.allTasks.filter(
			(task) => !task.completed && task.dueDate !== undefined
		);

		// Split into past due, today, and future
		this.pastDueTasks = tasksWithDueDates.filter(
			(task) => task.dueDate! < todayTimestamp
		);
		this.todayTasks = tasksWithDueDates.filter((task) => {
			const dueDate = new Date(task.dueDate!);
			dueDate.setHours(0, 0, 0, 0);
			return dueDate.getTime() === todayTimestamp;
		});
		this.futureTasks = tasksWithDueDates.filter(
			(task) => task.dueDate! > todayTimestamp
		);

		// Sort tasks by priority and then due date
		const sortTasksByPriorityAndDueDate = (tasks: Task[]) => {
			return tasks.sort((a, b) => {
				// First by priority (high to low)
				const priorityA = a.priority || 0;
				const priorityB = b.priority || 0;
				if (priorityA !== priorityB) {
					return priorityB - priorityA;
				}

				// Then by due date (early to late)
				return (a.dueDate || 0) - (b.dueDate || 0);
			});
		};

		this.pastDueTasks = sortTasksByPriorityAndDueDate(this.pastDueTasks);
		this.todayTasks = sortTasksByPriorityAndDueDate(this.todayTasks);
		this.futureTasks = sortTasksByPriorityAndDueDate(this.futureTasks);
	}

	private updateTaskStats() {
		// Update counts in stats bar
		const statItems = this.statsContainerEl.querySelectorAll(".stat-item");
		statItems.forEach((item) => {
			const countEl = item.querySelector(".stat-count");
			if (countEl) {
				if (item.classList.contains("past-due")) {
					countEl.textContent = this.pastDueTasks.length.toString();
				} else if (item.classList.contains("today")) {
					countEl.textContent = this.todayTasks.length.toString();
				} else if (item.classList.contains("future")) {
					countEl.textContent = this.futureTasks.length.toString();
				}
			}
		});
	}

	private updateDueSoonSection() {
		// Clear existing content
		this.dueSoonContainerEl.empty();

		// Get the next 7 days from today
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const dueSoonItems: { date: Date; tasks: Task[] }[] = [];

		// Process tasks due in the next week
		for (let i = 0; i < 15; i++) {
			const date = new Date(today);
			date.setDate(date.getDate() + i);

			// Skip today since it's shown in the stats bar
			if (i === 0) continue;

			const tasksForDay = this.getTasksForDate(date);
			if (tasksForDay.length > 0) {
				dueSoonItems.push({
					date: date,
					tasks: tasksForDay,
				});
			}
		}

		// Add a header
		const headerEl = this.dueSoonContainerEl.createDiv({
			cls: "due-soon-header",
		});
		headerEl.setText("Coming Up");

		// Create entries for upcoming due tasks
		dueSoonItems.forEach((item) => {
			const itemEl = this.dueSoonContainerEl.createDiv({
				cls: "due-soon-item",
			});

			// Format the date
			const dateStr = this.formatDateForDueSoon(item.date);

			// Get day of week
			const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
				item.date.getDay()
			];

			const dateEl = itemEl.createDiv({
				cls: "due-soon-date",
			});
			dateEl.setText(`${dayOfWeek}, ${dateStr}`);

			const countEl = itemEl.createDiv({
				cls: "due-soon-count",
			});
			countEl.setText(item.tasks.length.toString());

			// Add click handler to select this date
			this.registerDomEvent(itemEl, "click", () => {
				this.calendarComponent.selectDate(item.date);
				this.selectedDate = item.date;
				this.refreshDateSections();
			});
		});

		// Add empty state if needed
		if (dueSoonItems.length === 0) {
			const emptyEl = this.dueSoonContainerEl.createDiv({
				cls: "due-soon-empty",
			});
			emptyEl.setText(t("No upcoming tasks"));
		}
	}

	private formatDateForDueSoon(date: Date): string {
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		return `${monthNames[date.getMonth()]} ${date.getDate()}`;
	}

	private createDateSections() {
		// Clean up any existing task components
		this.taskComponents.forEach((component) => {
			component.unload();
		});
		this.taskComponents = [];

		// Clear existing content
		this.taskListContainerEl.empty();

		// Create sections based on time categories (Today, Tomorrow, Next Week, etc.)
		this.dateSections = [];

		// Today section
		if (this.todayTasks.length > 0) {
			this.dateSections.push({
				title: "Today — " + this.formatDate(new Date()),
				date: new Date(),
				tasks: this.todayTasks,
				isExpanded: true,
			});
		}

		// Future sections by date
		const dateMap = new Map<string, Task[]>();

		this.futureTasks.forEach((task) => {
			if (task.dueDate) {
				const date = new Date(task.dueDate);
				date.setHours(0, 0, 0, 0);
				const dateKey = date.toISOString().split("T")[0];

				if (!dateMap.has(dateKey)) {
					dateMap.set(dateKey, []);
				}

				dateMap.get(dateKey)!.push(task);
			}
		});

		// Sort dates and create sections
		const sortedDates = Array.from(dateMap.keys()).sort();

		sortedDates.forEach((dateKey) => {
			const date = new Date(dateKey);
			const tasks = dateMap.get(dateKey)!;

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			const dayDiff = Math.round(
				(date.getTime() - today.getTime()) / (1000 * 3600 * 24)
			);

			let title = this.formatDate(date);

			// Add a special title for tomorrow
			if (dayDiff === 1) {
				title = "Tomorrow, " + title;
			} else {
				const dayOfWeek = [
					"Sunday",
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
				][date.getDay()];
				title = `${dayOfWeek}, ${title}`;
			}

			this.dateSections.push({
				title: title,
				date: date,
				tasks: tasks,
				isExpanded: dayDiff <= 7, // Auto-expand next 7 days
			});
		});

		// Past due section (if any)
		if (this.pastDueTasks.length > 0) {
			this.dateSections.unshift({
				title: "Past Due",
				date: new Date(0), // Placeholder
				tasks: this.pastDueTasks,
				isExpanded: true,
			});
		}

		// Render the sections
		this.renderDateSections();
	}

	private renderDateSections() {
		// Clear container
		this.taskListContainerEl.empty();

		// Render each section
		this.dateSections.forEach((section) => {
			const sectionEl = this.taskListContainerEl.createDiv({
				cls: "task-date-section",
			});

			// Section header
			const headerEl = sectionEl.createDiv({
				cls: "date-section-header",
			});

			// Expand/collapse toggle
			const toggleEl = headerEl.createDiv({
				cls: "section-toggle",
			});
			setIcon(
				toggleEl,
				section.isExpanded ? "chevron-down" : "chevron-right"
			);

			// Section title
			const titleEl = headerEl.createDiv({
				cls: "section-title",
			});
			titleEl.setText(section.title);

			// Task count badge
			const countEl = headerEl.createDiv({
				cls: "section-count",
			});
			countEl.setText(`${section.tasks.length}`);

			// Task container (initially hidden if collapsed)
			const taskListEl = sectionEl.createDiv({
				cls: "section-tasks",
			});

			if (!section.isExpanded) {
				taskListEl.style.display = "none";
			}

			// Register toggle event
			this.registerDomEvent(headerEl, "click", () => {
				section.isExpanded = !section.isExpanded;
				setIcon(
					toggleEl,
					section.isExpanded ? "chevron-down" : "chevron-right"
				);
				taskListEl.style.display = section.isExpanded ? "" : "none";
			});

			// Create task items
			section.tasks.forEach((task) => {
				const taskComponent = new TaskListItemComponent(
					task,
					"forecast",
					this.app
				);

				// Set up event handlers
				taskComponent.onTaskSelected = (selectedTask) => {
					if (this.onTaskSelected) {
						this.onTaskSelected(selectedTask);
					}
				};

				taskComponent.onTaskCompleted = (task) => {
					if (this.onTaskCompleted) {
						this.onTaskCompleted(task);
					}
				};

				// Load component
				this.addChild(taskComponent);
				taskComponent.load();

				// Add to DOM
				taskListEl.appendChild(taskComponent.element);

				// Store for later cleanup
				this.taskComponents.push(taskComponent);
			});
		});

		// Add empty state if no sections
		if (this.dateSections.length === 0) {
			const emptyEl = this.taskListContainerEl.createDiv({
				cls: "forecast-empty-state",
			});
			emptyEl.setText("No tasks scheduled");
		}
	}

	private formatDate(date: Date): string {
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		return `${
			months[date.getMonth()]
		} ${date.getDate()}, ${date.getFullYear()}`;
	}

	private focusTaskList(type: string) {
		// Clear previous focus
		const statItems = this.statsContainerEl.querySelectorAll(".stat-item");
		statItems.forEach((item) => item.classList.remove("active"));

		// Set new focus
		if (this.focusFilter === type) {
			// Toggle off if already selected
			this.focusFilter = null;
		} else {
			this.focusFilter = type;
			const activeItem = this.statsContainerEl.querySelector(
				`.stat-item.${type}`
			);
			if (activeItem) {
				activeItem.classList.add("active");
			}
		}

		// Update date sections based on filter
		if (this.focusFilter === "past-due") {
			this.dateSections = [
				{
					title: "Past Due",
					date: new Date(0),
					tasks: this.pastDueTasks,
					isExpanded: true,
				},
			];
		} else if (this.focusFilter === "today") {
			this.dateSections = [
				{
					title: "Today — " + this.formatDate(new Date()),
					date: new Date(),
					tasks: this.todayTasks,
					isExpanded: true,
				},
			];
		} else if (this.focusFilter === "future") {
			// Re-create all future sections
			this.createDateSections();
			// Filter out past due and today
			this.dateSections = this.dateSections.filter((section) => {
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				return section.date.getTime() > today.getTime();
			});
		} else {
			// No filter, show all sections
			this.createDateSections();
		}

		// Re-render the sections
		this.renderDateSections();
	}

	private refreshDateSections() {
		// Update sections based on selected date
		if (this.focusFilter) {
			// If there's a filter active, don't change the sections
			return;
		}

		// Get tasks for selected date
		const selectedDateTasks = this.getTasksForDate(this.selectedDate);

		if (selectedDateTasks.length > 0) {
			// Create a section just for this date
			this.dateSections = [
				{
					title: this.formatDate(this.selectedDate),
					date: this.selectedDate,
					tasks: selectedDateTasks,
					isExpanded: true,
				},
			];
			this.renderDateSections();
		} else {
			// If no tasks on the selected date, show empty state
			this.dateSections = [];
			this.renderDateSections();
		}
	}

	private getTasksForDate(date: Date): Task[] {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const startTimestamp = startOfDay.getTime();
		const endTimestamp = endOfDay.getTime();

		return this.allTasks.filter((task) => {
			if (task.dueDate && !task.completed) {
				const dueDate = new Date(task.dueDate);
				dueDate.setHours(0, 0, 0, 0);
				return dueDate.getTime() === startTimestamp;
			}
			return false;
		});
	}

	public updateTask(updatedTask: Task) {
		// Find and update the task component
		const component = this.taskComponents.find(
			(c) => c.getTask().id === updatedTask.id
		);

		if (component) {
			component.updateTask(updatedTask);
		}

		// Re-categorize all tasks
		this.setTasks(
			this.allTasks.map((task) =>
				task.id === updatedTask.id ? updatedTask : task
			)
		);
	}

	onunload() {
		this.containerEl.empty();
		this.containerEl.remove();
	}
}
