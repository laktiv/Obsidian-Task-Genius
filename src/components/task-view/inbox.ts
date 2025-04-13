import { App, Component, ExtraButtonComponent, setIcon } from "obsidian";
import { Task, TaskFilter } from "../../utils/types/TaskIndex";
import { TaskListItemComponent } from "./listItem";
import { ViewMode } from "./sidebar";
import { tasksToTree, flattenTaskTree } from "../../utils/treeViewUtil";
import { TaskTreeItemComponent } from "./treeItem";
import { t } from "../../translations/helper";
import { ProjectReviewSetting } from "../../common/setting-definition";
import TaskProgressBarPlugin from "../../index"; // Path used in TaskView.ts

export class InboxComponent extends Component {
	public containerEl: HTMLElement;
	private headerEl: HTMLElement;
	private taskListEl: HTMLElement;
	private filterInput: HTMLInputElement;
	private titleEl: HTMLElement;
	private countEl: HTMLElement;
	private focusBtn: HTMLElement;

	// Task data
	private allTasks: Task[] = [];
	private filteredTasks: Task[] = [];
	private taskComponents: TaskListItemComponent[] = [];
	private selectedTask: Task | null = null;

	// Virtualization
	private taskListObserver: IntersectionObserver;
	private visibleTasks: Map<string, boolean> = new Map();
	private taskPageSize = 50;
	private currentViewMode: ViewMode = "forecast";
	private selectedProject: string | null = null;
	private focusFilter: string | null = null;
	private isTreeView: boolean = false;
	private treeComponents: TaskTreeItemComponent[] = [];
	private rootTasks: Task[] = [];
	private nextRootTaskIndex: number = 0;

	// Events
	public onTaskSelected: (task: Task) => void;
	public onTaskCompleted: (task: Task) => void;

	// Context menu
	public onTaskContextMenu: (event: MouseEvent, task: Task) => void;

	constructor(
		private parentEl: HTMLElement,
		private app: App,
		private plugin: TaskProgressBarPlugin
	) {
		super();
	}

	onload() {
		// Create main content container
		this.containerEl = this.parentEl.createDiv({
			cls: "task-content",
		});

		// Create header
		this.createContentHeader();

		// Create task list container
		this.taskListEl = this.containerEl.createDiv({ cls: "task-list" });

		// Set up intersection observer for lazy loading
		this.initializeVirtualList();
	}

	private createContentHeader() {
		this.headerEl = this.containerEl.createDiv({
			cls: "content-header",
		});

		// View title
		this.titleEl = this.headerEl.createDiv({
			cls: "content-title",
			text: t("Forecast"),
		});

		// Task count
		this.countEl = this.headerEl.createDiv({
			cls: "task-count",
			text: t("0 tasks"),
		});

		// Filter controls
		const filterEl = this.headerEl.createDiv({ cls: "content-filter" });

		// Filter input
		this.filterInput = filterEl.createEl("input", {
			cls: "filter-input",
			attr: {
				type: "text",
				placeholder: t("Filter tasks..."),
			},
		});

		// View toggle button
		const viewToggleBtn = this.headerEl.createDiv(
			{
				cls: "view-toggle-btn",
			},
			(el) => {
				new ExtraButtonComponent(el)
					.setIcon("list")
					.setTooltip(t("Toggle list/tree view"));
			}
		);

		this.registerDomEvent(viewToggleBtn, "click", () => {
			this.toggleViewMode();
		});

		// // Focus filter button
		// this.focusBtn = this.headerEl.createDiv({ cls: "focus-filter" });
		// this.focusBtn.createEl("button", { cls: "focus-button" });
		// this.focusBtn.setText("Focus");

		// Event listeners
		// this.registerDomEvent(this.focusBtn, "click", () => {
		// 	this.toggleFocusFilter();
		// });

		this.registerDomEvent(this.filterInput, "input", () => {
			this.filterTasks(this.filterInput.value);
		});
	}

	private initializeVirtualList() {
		// Set up intersection observer for lazy loading
		this.taskListObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const taskId = entry.target.getAttribute("data-task-id");
					if (taskId) {
						this.visibleTasks.set(taskId, entry.isIntersecting);

						// Load more tasks if we're near the bottom
						if (
							entry.isIntersecting &&
							entry.target.classList.contains("task-load-marker")
						) {
							this.loadMoreTasks();
						}
					}
				});
			},
			{
				root: this.taskListEl,
				threshold: 0.1,
			}
		);
	}

	private toggleFocusFilter() {
		// Toggle focus state
		if (this.focusFilter) {
			this.focusFilter = null;
			this.focusBtn.setText(t("Focus"));
			this.focusBtn.classList.remove("focused");
		} else {
			// Just an example - you could focus on a specific project or context
			this.focusFilter = "Work";
			this.focusBtn.setText(t("Unfocus"));
			this.focusBtn.classList.add("focused");
		}

		this.applyFilters();
		this.refreshTaskList();
	}

	private toggleViewMode() {
		this.isTreeView = !this.isTreeView;

		// Update toggle button icon
		const viewToggleBtn = this.headerEl.querySelector(
			".view-toggle-btn"
		) as HTMLElement;
		if (viewToggleBtn) {
			setIcon(viewToggleBtn, this.isTreeView ? "git-branch" : "list");
		}

		// Refresh the task list with the new view mode
		this.refreshTaskList();
	}

	public setTasks(tasks: Task[]) {
		this.allTasks = tasks;
		this.applyFilters();
		this.refreshTaskList();
	}

	public setViewMode(mode: ViewMode, project?: string | null) {
		this.currentViewMode = mode;
		if (project !== undefined) {
			this.selectedProject = project;
		}

		// Update title
		let title = mode.charAt(0).toUpperCase() + mode.slice(1);
		if (mode === "projects" && this.selectedProject) {
			const projectName = this.selectedProject.split("/").pop();
			if (projectName) {
				title = projectName;
			}
		}
		this.titleEl.setText(title);

		this.applyFilters();
		this.refreshTaskList();
	}

	private applyFilters() {
		// Start with all tasks
		let filtered = [...this.allTasks];

		// Apply view mode filter
		switch (this.currentViewMode) {
			case "inbox":
				// Tasks without a project
				filtered = filtered.filter((task) => !task.project);
				break;
			case "forecast":
				// Tasks due today or overdue
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const todayTimestamp = today.getTime();

				filtered = filtered.filter((task) => {
					if (!task.completed && task.dueDate) {
						return task.dueDate <= todayTimestamp;
					}
					return false;
				});
				break;
			case "flagged":
				// Flagged or high priority tasks
				filtered = filtered.filter(
					(task) =>
						!task.completed &&
						(task.priority === 3 || task.tags.includes("flagged"))
				);
				break;
			case "projects":
				// If a project is selected, show its tasks
				if (this.selectedProject) {
					filtered = filtered.filter(
						(task) => task.project === this.selectedProject
					);
				} else {
					// Otherwise show all tasks with projects
					filtered = filtered.filter((task) => !!task.project);
				}
				break;
			case "review":
				// Tasks that need review (example: tasks without updates in the last week)
				const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
				filtered = filtered.filter(
					(task) =>
						!task.completed &&
						task.createdDate &&
						task.createdDate < weekAgo
				);
				break;
		}

		// Apply focus filter if set
		if (this.focusFilter) {
			const focusFilterLower = this.focusFilter.toLowerCase();
			filtered = filtered.filter(
				(task) =>
					task.context === this.focusFilter ||
					(task.tags && task.tags.includes(focusFilterLower))
			);
		}

		// Apply text filter if there's input in the filter field
		const textFilter = this.filterInput.value;
		if (textFilter) {
			const query = textFilter.toLowerCase();
			filtered = filtered.filter(
				(task) =>
					task.content.toLowerCase().includes(query) ||
					(task.project &&
						task.project.toLowerCase().includes(query)) ||
					(task.context &&
						task.context.toLowerCase().includes(query)) ||
					(task.tags &&
						task.tags.some((tag) =>
							tag.toLowerCase().includes(query)
						))
			);
		}

		// Sort tasks
		filtered.sort((a, b) => {
			// First by completion status
			if (a.completed !== b.completed) {
				return a.completed ? 1 : -1;
			}

			// Then by due date (if available)
			if (a.dueDate && b.dueDate) {
				return a.dueDate - b.dueDate;
			} else if (a.dueDate) {
				return -1;
			} else if (b.dueDate) {
				return 1;
			}

			// Then by priority (higher priority first)
			if (a.priority && b.priority) {
				return b.priority - a.priority;
			} else if (a.priority) {
				return -1;
			} else if (b.priority) {
				return 1;
			}

			// Finally by name
			return a.content.localeCompare(b.content);
		});

		this.filteredTasks = filtered;

		// Update the task count
		this.countEl.setText(`${this.filteredTasks.length} ${t("tasks")}`);
	}

	private filterTasks(query: string) {
		this.applyFilters();
		this.refreshTaskList();
	}

	private refreshTaskList() {
		// Clear existing tasks
		this.taskListEl.empty();
		this.visibleTasks.clear();

		// Clean up old task components
		this.taskComponents.forEach((component) => {
			component.unload();
		});
		this.taskComponents = [];

		// Clean up old tree components
		this.treeComponents.forEach((component) => {
			component.unload();
		});
		this.treeComponents = [];

		// Reset tree state
		this.rootTasks = [];
		this.nextRootTaskIndex = 0;

		// Render based on view mode
		if (this.isTreeView) {
			this.renderTreeView();
		} else {
			// Load first batch of tasks in list view
			this.loadTaskBatch(0, this.taskPageSize);

			// Add a load marker at the end if there are more tasks
			if (this.filteredTasks.length > this.taskPageSize) {
				this.addLoadMarker();
			}
		}
	}

	private renderTreeView() {
		// Convert tasks to tree structure
		this.rootTasks = tasksToTree(this.filteredTasks);
		const taskMap = new Map<string, Task>();
		this.filteredTasks.forEach((task) => taskMap.set(task.id, task));

		// Render the initial batch of root tasks
		this.loadRootTaskBatch(0, this.taskPageSize, taskMap);

		// Add a load marker at the end if there are more root tasks
		if (this.rootTasks.length > this.taskPageSize) {
			this.addLoadMarker();
		}

		// Add empty state if no root tasks
		if (this.rootTasks.length === 0) {
			this.addEmptyState("No tasks found");
		}
	}

	private loadTaskBatch(start: number, count: number) {
		const end = Math.min(start + count, this.filteredTasks.length);
		const fragment = document.createDocumentFragment();

		console.log(`Loading task batch from ${start} to ${end}`);

		for (let i = start; i < end; i++) {
			const task = this.filteredTasks[i];
			const taskComponent = new TaskListItemComponent(
				task,
				this.currentViewMode,
				this.app
			);

			// Set up event handlers
			taskComponent.onTaskSelected = (selectedTask) => {
				this.selectTask(selectedTask);
				if (this.onTaskSelected) {
					this.onTaskSelected(selectedTask);
				}
			};

			taskComponent.onTaskCompleted = (task) => {
				console.log("task completed", task);
				if (this.onTaskCompleted) {
					this.onTaskCompleted(task);
				}
			};

			taskComponent.onTaskContextMenu = (event, task) => {
				if (this.onTaskContextMenu) {
					this.onTaskContextMenu(event, task);
				}
			};

			// Load the component
			this.addChild(taskComponent);
			taskComponent.load();

			// Store for later cleanup
			this.taskComponents.push(taskComponent);

			// Add to DOM
			fragment.appendChild(taskComponent.element);

			// Observe this task for visibility
			this.taskListObserver.observe(taskComponent.element);
		}

		this.taskListEl.appendChild(fragment);

		return end;
	}

	private loadRootTaskBatch(
		start: number,
		count: number,
		taskMap: Map<string, Task>
	): number {
		const end = Math.min(start + count, this.rootTasks.length);
		const fragment = document.createDocumentFragment();

		console.log(`Loading root tasks from ${start} to ${end}`);

		for (let i = start; i < end; i++) {
			const rootTask = this.rootTasks[i];

			// Find direct children using the map (more efficient)
			const childTasks = this.filteredTasks.filter(
				(task) => task.parent === rootTask.id
			);

			const treeComponent = new TaskTreeItemComponent(
				rootTask,
				this.currentViewMode,
				this.app,
				0,
				childTasks,
				taskMap
			);

			// Set up event handlers
			treeComponent.onTaskSelected = (selectedTask) => {
				this.selectTask(selectedTask);
			};

			treeComponent.onTaskCompleted = (task) => {
				console.log("task completed (tree)", task);
				if (this.onTaskCompleted) {
					this.onTaskCompleted(task);
				}
				this.updateTask(task);
			};

			treeComponent.onTaskContextMenu = (event, task) => {
				if (this.onTaskContextMenu) {
					this.onTaskContextMenu(event, task);
				}
			};

			// Load component
			this.addChild(treeComponent);
			treeComponent.load();

			// Add to DOM fragment
			fragment.appendChild(treeComponent.element);

			// Store root component for later cleanup
			this.treeComponents.push(treeComponent);
		}

		// Append the fragment to the list element
		const marker = this.taskListEl.querySelector(".task-load-marker");
		if (marker) {
			this.taskListEl.insertBefore(fragment, marker);
		} else {
			this.taskListEl.appendChild(fragment);
		}

		this.nextRootTaskIndex = end;

		return end;
	}

	private addLoadMarker() {
		// Ensure only one marker exists
		this.removeLoadMarker();

		const loadMarker = this.taskListEl.createDiv({
			cls: "task-load-marker",
			attr: { "data-task-id": "load-marker" },
		});
		loadMarker.setText(t("Loading more..."));
		this.taskListObserver.observe(loadMarker);
	}

	private removeLoadMarker() {
		const oldMarker = this.taskListEl.querySelector(".task-load-marker");
		if (oldMarker) {
			this.taskListObserver.unobserve(oldMarker);
			oldMarker.remove();
		}
	}

	private addEmptyState(message: string) {
		const emptyEl = this.taskListEl.createDiv({ cls: "task-empty-state" });
		emptyEl.setText(message);
	}

	private selectTask(task: Task) {
		if (!task) return;

		const previouslySelectedId = this.selectedTask?.id;

		// If the same task is clicked again, maybe deselect it? Optional behavior.
		if (previouslySelectedId === task.id) {
			// console.log("Deselecting task", task.id);
			// this.selectedTask = null;
			// // Update UI - requires components to handle deselection state
			// if (this.isTreeView) { ... } else { ... }
			// if (this.onTaskSelected) this.onTaskSelected(null); // Notify about deselection
			// return; // Exit early
		}

		// Update internal state
		this.selectedTask = task;
		console.log("Task selected:", task.id);

		// Update visual state of components
		if (!this.isTreeView) {
			this.taskComponents.forEach((comp) => {
				comp.setSelected(comp.getTask().id === task.id);
			});
		} else {
			// For tree view, finding the specific component (which could be nested) is complex here.
			// It's better if TaskTreeItemComponent handles its own selection visual state when clicked.
			// We might need to explicitly tell the *previously* selected component (if any) to deselect itself.
			this.treeComponents.forEach((rootComp) => {
				// Need a method in TaskTreeItemComponent like updateSelectionVisuals(selectedId)
				rootComp.updateSelectionVisuals(task.id);
			});
		}

		// Trigger external event only if selection actually changed
		if (this.onTaskSelected && previouslySelectedId !== task.id) {
			this.onTaskSelected(task);
		}
	}

	public updateTask(updatedTask: Task) {
		// Update the task in the main data source
		const taskIndex = this.allTasks.findIndex(
			(t) => t.id === updatedTask.id
		);
		if (taskIndex !== -1) {
			this.allTasks[taskIndex] = { ...updatedTask }; // Ensure reactivity if needed
		} else {
			console.warn(
				"Task not found in allTasks during update:",
				updatedTask.id
			);
			// Optionally add if it's a new task resulting from an action
			// this.allTasks.push(updatedTask);
		}

		// Update selected task state if it was the one updated
		if (this.selectedTask && this.selectedTask.id === updatedTask.id) {
			this.selectedTask = { ...updatedTask };
		}

		// Re-filter and refresh the view to reflect the change accurately
		this.applyFilters();
		this.refreshTaskList();
	}

	public getSelectedTask(): Task | null {
		return this.selectedTask;
	}

	private loadMoreTasks() {
		console.log("Load more tasks triggered...");
		// Optional: Prevent double loading if already processing
		// (Could add a 'isLoadingMore' flag)

		if (this.isTreeView) {
			if (this.nextRootTaskIndex < this.rootTasks.length) {
				console.log("Loading more TREE tasks");
				const taskMap = new Map<string, Task>();
				this.filteredTasks.forEach((task) =>
					taskMap.set(task.id, task)
				);
				const newEnd = this.loadRootTaskBatch(
					this.nextRootTaskIndex,
					this.taskPageSize,
					taskMap
				);

				// Explicitly manage the marker after loading tree items
				this.removeLoadMarker(); // Remove the old marker

				if (newEnd < this.rootTasks.length) {
					// More root tasks exist, add a new marker at the end
					this.addLoadMarker();
				} else {
					// No more tasks to load
					console.log("All tree tasks loaded.");
				}
			} else {
				// Should not happen if logic is correct, but handle defensively
				console.log(
					"No more tree tasks to load (triggered when index >= total)."
				);
				this.removeLoadMarker();
			}
		} else {
			// List View
			const currentCount = this.taskComponents.length; // Count rendered list items
			if (currentCount < this.filteredTasks.length) {
				console.log("Loading more LIST tasks");
				// Load next batch of list tasks
				const newEnd = this.loadTaskBatch(
					currentCount,
					this.taskPageSize
				);

				// Explicitly manage the marker after loading list items
				this.removeLoadMarker(); // Remove the old marker regardless

				if (newEnd < this.filteredTasks.length) {
					// More tasks exist, add a new marker at the end
					this.addLoadMarker();
				} else {
					// No more tasks to load, marker remains removed
					console.log("All list tasks loaded.");
				}
			} else {
				// This case might happen if triggered erroneously, ensure marker is gone
				console.log(
					"No more list tasks to load (triggered when count >= total)."
				);
				this.removeLoadMarker();
			}
		}
	}

	onunload() {
		// Clean up observer
		if (this.taskListObserver) {
			this.taskListObserver.disconnect();
		}

		// Clean up task components
		this.taskComponents.forEach((component) => {
			component.unload();
		});

		// Clean up tree components
		this.treeComponents.forEach((component) => {
			component.unload();
		});

		this.containerEl.empty();
		this.containerEl.remove();
	}
}
