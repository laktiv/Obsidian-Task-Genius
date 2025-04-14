import { App, Component, ExtraButtonComponent, setIcon } from "obsidian";
import { Task } from "../../utils/types/TaskIndex";
import { TaskListItemComponent } from "./listItem"; // Re-import needed components
import {
	ViewMode,
	getViewSettingOrDefault,
} from "../../common/setting-definition"; // Import ViewMode
import { tasksToTree } from "../../utils/treeViewUtil"; // Re-import needed utils
import { TaskTreeItemComponent } from "./treeItem"; // Re-import needed components
import { t } from "../../translations/helper";
import TaskProgressBarPlugin from "../../index";
import { isNotCompleted } from "../../pages/TaskView"; // Corrected path
// We won't use BaseTaskRendererComponent for the main list in Inbox
// import { BaseTaskRendererComponent } from "./baseTaskRenderer";

export class ContentComponent extends Component {
	public containerEl: HTMLElement;
	private headerEl: HTMLElement;
	private taskListEl: HTMLElement; // Container for rendering
	private filterInput: HTMLInputElement;
	private titleEl: HTMLElement;
	private countEl: HTMLElement;

	// Task data
	private allTasks: Task[] = [];
	private filteredTasks: Task[] = []; // Tasks after filters applied
	private selectedTask: Task | null = null;

	// Child Components (managed by InboxComponent for lazy loading)
	private taskComponents: TaskListItemComponent[] = [];
	private treeComponents: TaskTreeItemComponent[] = [];

	// Virtualization State
	private taskListObserver: IntersectionObserver;
	private taskPageSize = 50; // Number of tasks to load per batch
	private nextTaskIndex = 0; // Index for next list item batch
	private nextRootTaskIndex = 0; // Index for next tree root batch
	private rootTasks: Task[] = []; // Root tasks for tree view

	// State
	private currentViewId: ViewMode = "inbox"; // Renamed from currentViewMode
	private selectedProjectForView: string | null = null; // Keep track if a specific project is filtered (for project view)
	private focusFilter: string | null = null; // Keep focus filter if needed
	private isTreeView: boolean = false;

	// Events (Passed to created components)
	public onTaskSelected: (task: Task | null) => void = () => {};
	public onTaskCompleted: (task: Task) => void = () => {};
	public onTaskContextMenu: (event: MouseEvent, task: Task) => void =
		() => {};

	constructor(
		private parentEl: HTMLElement,
		private app: App,
		private plugin: TaskProgressBarPlugin
	) {
		super();
	}

	onload() {
		// Create main content container
		this.containerEl = this.parentEl.createDiv({ cls: "task-content" });

		// Create header
		this.createContentHeader();

		// Create task list container
		this.taskListEl = this.containerEl.createDiv({ cls: "task-list" });

		// Set up intersection observer for lazy loading
		this.initializeVirtualList();
	}

	private createContentHeader() {
		this.headerEl = this.containerEl.createDiv({ cls: "content-header" });

		// View title - will be updated in setViewMode
		this.titleEl = this.headerEl.createDiv({
			cls: "content-title",
			text: t("Inbox"), // Default title
		});

		// Task count
		this.countEl = this.headerEl.createDiv({
			cls: "task-count",
			text: t("0 tasks"),
		});

		// Filter controls
		const filterEl = this.headerEl.createDiv({ cls: "content-filter" });
		this.filterInput = filterEl.createEl("input", {
			cls: "filter-input",
			attr: { type: "text", placeholder: t("Filter tasks...") },
		});

		// View toggle button
		const viewToggleBtn = this.headerEl.createDiv({
			cls: "view-toggle-btn",
		});
		setIcon(viewToggleBtn, "list"); // Set initial icon
		viewToggleBtn.setAttribute("aria-label", t("Toggle list/tree view"));
		this.registerDomEvent(viewToggleBtn, "click", () => {
			this.toggleViewMode();
		});

		// Focus filter button (remains commented out)
		// ...

		// Event listeners
		this.registerDomEvent(this.filterInput, "input", () => {
			this.filterTasks(this.filterInput.value);
		});
	}

	private initializeVirtualList() {
		this.taskListObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (
						entry.isIntersecting &&
						entry.target.classList.contains("task-load-marker")
					) {
						// console.log(
						// 	"Load marker intersecting, calling loadMoreTasks..."
						// );
						// Target is the load marker, load more tasks
						this.loadMoreTasks();
					}
				});
			},
			{
				root: this.taskListEl, // Observe within the task list container
				threshold: 0.1, // Trigger when 10% of the marker is visible
			}
		);
	}

	private toggleViewMode() {
		this.isTreeView = !this.isTreeView;
		const viewToggleBtn = this.headerEl.querySelector(
			".view-toggle-btn"
		) as HTMLElement;
		if (viewToggleBtn) {
			setIcon(viewToggleBtn, this.isTreeView ? "git-branch" : "list");
		}
		this.refreshTaskList(); // Refresh list completely on view mode change
	}

	public setTasks(tasks: Task[]) {
		this.allTasks = tasks;
		this.applyFilters();
		this.refreshTaskList();
	}

	// Updated method signature
	public setViewMode(viewId: ViewMode, project?: string | null) {
		this.currentViewId = viewId;
		this.selectedProjectForView = project === undefined ? null : project;

		// Update title based on the view config
		const viewConfig = getViewSettingOrDefault(this.plugin, viewId);
		let title = t(viewConfig.name);

		// Special handling for project view title (if needed, maybe handled by component itself)
		// if (viewId === "projects" && this.selectedProjectForView) {
		// 	const projectName = this.selectedProjectForView.split("/").pop();
		// 	title = projectName || t("Project");
		// }
		this.titleEl.setText(title);

		this.applyFilters();
		this.refreshTaskList();
	}

	private applyFilters() {
		// Start with all tasks
		let filtered = [...this.allTasks];

		// Get the complete configuration for the current view
		const viewConfig = getViewSettingOrDefault(
			this.plugin,
			this.currentViewId
		);
		const filterRules = viewConfig.filterRules || {}; // Get rules or empty object

		if (Object.keys(filterRules).length > 0) {
			// Check if there are any rules defined
			// --- Apply Custom Filter Rules ---
			console.log(
				`Applying filter rules for view ${this.currentViewId}:`,
				filterRules
			);

			if (filterRules.textContains) {
				const query = filterRules.textContains.toLowerCase();
				filtered = filtered.filter((task) =>
					task.content.toLowerCase().includes(query)
				);
			}
			if (filterRules.tagsInclude && filterRules.tagsInclude.length > 0) {
				filtered = filtered.filter((task) =>
					filterRules.tagsInclude!.every((tag) =>
						task.tags.includes(tag)
					)
				);
			}
			if (filterRules.tagsExclude && filterRules.tagsExclude.length > 0) {
				filtered = filtered.filter(
					(task) =>
						!filterRules.tagsExclude!.some((tag) =>
							task.tags.includes(tag)
						)
				);
			}
			if (filterRules.project) {
				filtered = filtered.filter(
					(task) => task.project === filterRules.project
				);
			}
			if (filterRules.priority !== undefined) {
				filtered = filtered.filter(
					(task) => (task.priority || 0) === filterRules.priority // Handle undefined priority
				);
			}
			if (
				filterRules.statusInclude &&
				filterRules.statusInclude.length > 0
			) {
				filtered = filtered.filter((task) =>
					filterRules.statusInclude!.includes(task.status)
				);
			}
			if (
				filterRules.statusExclude &&
				filterRules.statusExclude.length > 0
			) {
				filtered = filtered.filter(
					(task) => !filterRules.statusExclude!.includes(task.status)
				);
			}
			if (filterRules.pathIncludes) {
				const query = filterRules.pathIncludes.toLowerCase();
				filtered = filtered.filter((task) =>
					task.filePath.toLowerCase().includes(query)
				);
			}
			if (filterRules.pathExcludes) {
				const query = filterRules.pathExcludes.toLowerCase();
				filtered = filtered.filter(
					(task) => !task.filePath.toLowerCase().includes(query)
				);
			}
			// TODO: Implement Date Filters (dueDate, startDate, scheduledDate) - requires parsing relative dates

			// Apply the standard hide completed/abandoned logic *after* custom rules
			// Note: isNotCompleted already uses the viewConfig, so this is slightly redundant,
			// but ensures the hide setting is respected even if no other rules match.
			filtered = filtered.filter((task) =>
				isNotCompleted(this.plugin, task, this.currentViewId)
			);
		} else {
			// --- Apply Default View Logic (If no custom rules are set for the view) ---
			// This switch might become less relevant if default views also get rules via settings,
			// but can serve as a fallback or specific behavior override.
			switch (this.currentViewId) {
				case "inbox":
					filtered = filtered.filter(
						(task) =>
							!task.project && // No project assigned
							isNotCompleted(
								this.plugin,
								task,
								this.currentViewId
							)
					);
					break;
				case "flagged":
					filtered = filtered.filter(
						(task) =>
							(task.priority === 3 ||
								task.tags?.includes("flagged")) && // Default flagged logic
							isNotCompleted(
								this.plugin,
								task,
								this.currentViewId
							)
					);
					break;
				// Other default views like forecast, projects, tags, review are handled by their specific components
				default:
					// Default behavior for views without specific rules or component:
					// just apply the hide completed setting
					filtered = filtered.filter((task) =>
						isNotCompleted(this.plugin, task, this.currentViewId)
					);
					break;
			}
		}

		// Apply focus filter if set (logic remains the same)
		if (this.focusFilter) {
			// ... (focus filter logic) ...
		}

		// Apply text filter from the input box (applied AFTER view-specific filters)
		const textFilter = this.filterInput.value.toLowerCase();
		if (textFilter) {
			filtered = filtered.filter(
				(task) =>
					task.content.toLowerCase().includes(textFilter) ||
					task.project?.toLowerCase().includes(textFilter) ||
					task.context?.toLowerCase().includes(textFilter) ||
					task.tags?.some((tag) =>
						tag.toLowerCase().includes(textFilter)
					)
			);
		}

		// --- Sorting --- (Apply sorting last)
		filtered.sort((a, b) => {
			// Example Sort: Non-completed first, then Priority (High to Low), then Due Date (Earliest first)
			const completedA = a.completed;
			const completedB = b.completed;
			if (completedA !== completedB) return completedA ? 1 : -1; // Non-completed first

			const prioA = a.priority ?? 0; // Default priority if undefined
			const prioB = b.priority ?? 0;
			if (prioA !== prioB) return prioB - prioA; // Higher priority first

			const dueA = a.dueDate ?? Infinity;
			const dueB = b.dueDate ?? Infinity;
			if (dueA !== dueB) return dueA - dueB; // Earlier due date first

			// Fallback sort by content
			return a.content.localeCompare(b.content);
		});

		this.filteredTasks = filtered;

		// Update the task count display
		this.countEl.setText(`${this.filteredTasks.length} ${t("tasks")}`);
	}

	private filterTasks(query: string) {
		this.applyFilters(); // Re-apply all filters including the new text query
		this.refreshTaskList();
	}

	private cleanupComponents() {
		// Unload and clear previous components
		this.taskComponents.forEach((component) => this.removeChild(component));
		this.taskComponents = [];
		this.treeComponents.forEach((component) => this.removeChild(component));
		this.treeComponents = [];
		// Disconnect observer from any previous elements
		this.taskListObserver.disconnect();
		// Clear the container
		this.taskListEl.empty();
	}

	private refreshTaskList() {
		this.cleanupComponents(); // Clear previous state and components

		// Reset indices for lazy loading
		this.nextTaskIndex = 0;
		this.nextRootTaskIndex = 0;
		this.rootTasks = [];

		if (this.filteredTasks.length === 0) {
			this.addEmptyState(t("No tasks found."));
			return;
		}

		// Render based on view mode
		if (this.isTreeView) {
			const taskMap = new Map<string, Task>();
			this.filteredTasks.forEach((task) => taskMap.set(task.id, task));
			this.rootTasks = tasksToTree(this.filteredTasks); // Calculate root tasks
			this.loadRootTaskBatch(taskMap); // Load the first batch
		} else {
			this.loadTaskBatch(); // Load the first batch
		}

		// Add load marker if necessary
		this.checkAndAddLoadMarker();
	}

	private loadTaskBatch(): number {
		const fragment = document.createDocumentFragment();
		const countToLoad = this.taskPageSize;
		const start = this.nextTaskIndex;
		const end = Math.min(start + countToLoad, this.filteredTasks.length);

		// console.log(`Loading list tasks from ${start} to ${end}`);

		for (let i = start; i < end; i++) {
			const task = this.filteredTasks[i];
			const taskComponent = new TaskListItemComponent(
				task,
				this.currentViewId, // Pass currentViewId
				this.app
			);

			// Attach event handlers
			taskComponent.onTaskSelected = this.selectTask.bind(this);
			taskComponent.onTaskCompleted = (t) => {
				if (this.onTaskCompleted) this.onTaskCompleted(t);
			};
			taskComponent.onTaskContextMenu = (e, t) => {
				if (this.onTaskContextMenu) this.onTaskContextMenu(e, t);
			};

			this.addChild(taskComponent); // Manage lifecycle
			taskComponent.load();
			fragment.appendChild(taskComponent.element);
			this.taskComponents.push(taskComponent); // Keep track of rendered components
		}

		this.taskListEl.appendChild(fragment);
		this.nextTaskIndex = end; // Update index for the next batch
		return end; // Return the new end index
	}

	private loadRootTaskBatch(taskMap: Map<string, Task>): number {
		const fragment = document.createDocumentFragment();
		const countToLoad = this.taskPageSize;
		const start = this.nextRootTaskIndex;
		const end = Math.min(start + countToLoad, this.rootTasks.length);

		// console.log(`Loading tree tasks from ${start} to ${end}`);

		for (let i = start; i < end; i++) {
			const rootTask = this.rootTasks[i];
			const childTasks = this.filteredTasks.filter(
				(task) => task.parent === rootTask.id
			);

			const treeComponent = new TaskTreeItemComponent(
				rootTask,
				this.currentViewId, // Pass currentViewId
				this.app,
				0,
				childTasks,
				taskMap
			);

			// Attach event handlers
			treeComponent.onTaskSelected = this.selectTask.bind(this);
			treeComponent.onTaskCompleted = (t) => {
				if (this.onTaskCompleted) this.onTaskCompleted(t);
			};
			treeComponent.onTaskContextMenu = (e, t) => {
				if (this.onTaskContextMenu) this.onTaskContextMenu(e, t);
			};

			this.addChild(treeComponent); // Manage lifecycle
			treeComponent.load();
			fragment.appendChild(treeComponent.element);
			this.treeComponents.push(treeComponent); // Keep track of rendered components
		}

		this.taskListEl.appendChild(fragment);
		this.nextRootTaskIndex = end; // Update index for the next batch
		return end; // Return the new end index
	}

	private checkAndAddLoadMarker() {
		this.removeLoadMarker(); // Remove existing marker first

		const moreTasksExist = this.isTreeView
			? this.nextRootTaskIndex < this.rootTasks.length
			: this.nextTaskIndex < this.filteredTasks.length;

		// console.log(
		// 	`Check load marker: moreTasksExist = ${moreTasksExist} (Tree: ${this.nextRootTaskIndex}/${this.rootTasks.length}, List: ${this.nextTaskIndex}/${this.filteredTasks.length})`
		// );

		if (moreTasksExist) {
			this.addLoadMarker();
		}
	}

	private addLoadMarker() {
		const loadMarker = this.taskListEl.createDiv({
			cls: "task-load-marker",
			attr: { "data-task-id": "load-marker" }, // Use data attribute for identification
		});
		loadMarker.setText(t("Loading more..."));
		// console.log("Adding load marker and observing.");
		this.taskListObserver.observe(loadMarker); // Observe the marker
	}

	private removeLoadMarker() {
		const oldMarker = this.taskListEl.querySelector(".task-load-marker");
		if (oldMarker) {
			this.taskListObserver.unobserve(oldMarker); // Stop observing before removing
			oldMarker.remove();
		}
	}

	private loadMoreTasks() {
		// console.log("Load more tasks triggered...");
		this.removeLoadMarker(); // Remove the current marker

		if (this.isTreeView) {
			if (this.nextRootTaskIndex < this.rootTasks.length) {
				// console.log(
				// 	`Loading more TREE tasks from index ${this.nextRootTaskIndex}`
				// );
				const taskMap = new Map<string, Task>();
				this.filteredTasks.forEach((task) =>
					taskMap.set(task.id, task)
				);
				this.loadRootTaskBatch(taskMap);
			} else {
				// console.log("No more TREE tasks to load.");
			}
		} else {
			if (this.nextTaskIndex < this.filteredTasks.length) {
				// console.log(
				// 	`Loading more LIST tasks from index ${this.nextTaskIndex}`
				// );
				this.loadTaskBatch();
			} else {
				// console.log("No more LIST tasks to load.");
			}
		}

		// Add the marker back if there are still more tasks after loading the batch
		this.checkAndAddLoadMarker();
	}

	private addEmptyState(message: string) {
		this.cleanupComponents(); // Ensure list is clean
		const emptyEl = this.taskListEl.createDiv({ cls: "task-empty-state" });
		emptyEl.setText(message);
	}

	private selectTask(task: Task | null) {
		if (this.selectedTask?.id === task?.id && task !== null) {
			// If clicking the already selected task, deselect it (or toggle details - handled by TaskView)
			// this.selectedTask = null;
			// console.log("Task deselected (in ContentComponent):", task?.id);
			// // Update visual state of the item if needed (remove highlight)
			// const itemEl = this.taskListEl.querySelector(`[data-task-row-id="${task.id}"]`);
			// itemEl?.removeClass('is-selected'); // Example class
			// if(this.onTaskSelected) this.onTaskSelected(null); // Notify parent
			// return;
		}

		// Deselect previous task visually if needed
		if (this.selectedTask) {
			// const prevItemEl = this.taskListEl.querySelector(`[data-task-row-id="${this.selectedTask.id}"]`);
			// prevItemEl?.removeClass('is-selected');
		}

		this.selectedTask = task;
		// console.log("Task selected (in ContentComponent):", task?.id);

		// Select new task visually if needed
		if (task) {
			// const newItemEl = this.taskListEl.querySelector(`[data-task-row-id="${task.id}"]`);
			// newItemEl?.addClass('is-selected');
		}

		if (this.onTaskSelected) {
			this.onTaskSelected(task);
		}
	}

	public updateTask(updatedTask: Task) {
		// Update the task in the main data source
		const taskIndexAll = this.allTasks.findIndex(
			(t) => t.id === updatedTask.id
		);
		if (taskIndexAll !== -1) {
			this.allTasks[taskIndexAll] = { ...updatedTask };
		} else {
			// If task doesn't exist in allTasks, it might be a new task
			// We might need a mechanism to add it, or rely on a full refresh
			// For now, let's just check if it should be added based on current filters
			// This is complex, a full refresh via applyFilters might be safer
			// this.allTasks.push(updatedTask);
		}

		// Update selected task state if it was the one updated
		if (this.selectedTask && this.selectedTask.id === updatedTask.id) {
			this.selectedTask = { ...updatedTask };
		}

		// Re-apply filters to see if the task should still be visible and update count
		const previousFilteredTasksLength = this.filteredTasks.length;
		this.applyFilters();
		const taskStillVisible = this.filteredTasks.some(
			(t) => t.id === updatedTask.id
		);

		// Option 1: Task still visible after filtering, update in place
		if (taskStillVisible) {
			// Find the rendered component and update it
			if (!this.isTreeView) {
				const component = this.taskComponents.find(
					(c) => c.getTask().id === updatedTask.id
				);
				component?.updateTask(updatedTask); // Update rendered component
			} else {
				// For tree view, check root components and recursively search
				let updated = false;
				for (const rootComp of this.treeComponents) {
					if (rootComp.getTask().id === updatedTask.id) {
						rootComp.updateTask(updatedTask);
						updated = true;
						break;
					} else {
						if (rootComp.updateTaskRecursively(updatedTask)) {
							updated = true;
							break;
						}
					}
				}
			}
		}
		// Option 2: Task visibility changed or something else requires full refresh
		else {
			this.refreshTaskList();
			return; // Exit early as refresh handles everything
		}

		// Update count display if it wasn't handled by a full refresh
		if (this.filteredTasks.length !== previousFilteredTasksLength) {
			this.countEl.setText(`${this.filteredTasks.length} ${t("tasks")}`);
		}
	}

	public getSelectedTask(): Task | null {
		return this.selectedTask;
	}

	onunload() {
		this.cleanupComponents(); // Use the cleanup method
		this.containerEl.empty(); // Extra safety
		this.containerEl.remove();
	}
}
