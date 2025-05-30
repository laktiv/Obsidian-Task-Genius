import {
	EditorView,
	ViewPlugin,
	ViewUpdate,
	Decoration,
	DecorationSet,
	WidgetType,
	MatchDecorator,
	PluginValue,
	PluginSpec,
} from "@codemirror/view";
import { App, editorLivePreviewField, Keymap, Menu } from "obsidian";
import TaskProgressBarPlugin from "../index";
import { Annotation } from "@codemirror/state";
// @ts-ignore - This import is necessary but TypeScript can't find it
import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";
import { t } from "../translations/helper";
export const priorityChangeAnnotation = Annotation.define();

// Priority definitions
export const TASK_PRIORITIES = {
	highest: {
		emoji: "🔺",
		text: t("Highest priority"),
		regex: "🔺",
	},
	high: {
		emoji: "⏫",
		text: t("High priority"),
		regex: "⏫",
	},
	medium: {
		emoji: "🔼",
		text: t("Medium priority"),
		regex: "🔼",
	},
	none: {
		emoji: "",
		text: t("No priority"),
		regex: "",
	},
	low: {
		emoji: "🔽",
		text: t("Low priority"),
		regex: "🔽",
	},
	lowest: {
		emoji: "⏬️",
		text: t("Lowest priority"),
		regex: "⏬️",
	},
};

// Task plugin format priorities
export const LETTER_PRIORITIES = {
	A: {
		text: t("Priority A"),
		regex: "\\[#A\\]",
	},
	B: {
		text: t("Priority B"),
		regex: "\\[#B\\]",
	},
	C: {
		text: t("Priority C"),
		regex: "\\[#C\\]",
	},
};

// Combined regular expressions for detecting priorities
const emojiPriorityRegex = Object.values(TASK_PRIORITIES)
	.map((p) => p.regex)
	.filter((r) => r)
	.join("|");

const letterPriorityRegex = Object.values(LETTER_PRIORITIES)
	.map((p) => p.regex)
	.join("|");

class PriorityWidget extends WidgetType {
	constructor(
		readonly app: App,
		readonly plugin: TaskProgressBarPlugin,
		readonly view: EditorView,
		readonly from: number,
		readonly to: number,
		readonly currentPriority: string,
		readonly isLetterFormat: boolean
	) {
		super();
	}

	eq(other: PriorityWidget): boolean {
		return (
			this.from === other.from &&
			this.to === other.to &&
			this.currentPriority === other.currentPriority &&
			this.isLetterFormat === other.isLetterFormat
		);
	}

	toDOM(): HTMLElement {
		try {
			const wrapper = createEl("span", {
				cls: "priority-widget",
				attr: {
					"aria-label": t("Task Priority"),
				},
			});

			if (this.isLetterFormat) {
				// Create spans for letter format priority [#A]
				const leftBracket = document.createElement("span");
				leftBracket.classList.add(
					"cm-formatting",
					"cm-formatting-link",
					"cm-hmd-barelink",
					"cm-link",
					"cm-list-1"
				);
				leftBracket.setAttribute("spellcheck", "false");
				leftBracket.textContent = "[";

				const priority = document.createElement("span");
				priority.classList.add(
					"cm-hmd-barelink",
					"cm-link",
					"cm-list-1"
				);
				priority.textContent = this.currentPriority.slice(1, -1); // Remove brackets

				const rightBracket = document.createElement("span");
				rightBracket.classList.add(
					"cm-formatting",
					"cm-formatting-link",
					"cm-hmd-barelink",
					"cm-link",
					"cm-list-1"
				);
				rightBracket.setAttribute("spellcheck", "false");
				rightBracket.textContent = "]";

				wrapper.appendChild(leftBracket);
				wrapper.appendChild(priority);
				wrapper.appendChild(rightBracket);
			} else {
				const priorityText = document.createElement("span");
				priorityText.classList.add("task-priority");
				priorityText.textContent = this.currentPriority;
				wrapper.appendChild(priorityText);
			}

			// Handle click to show priority menu
			wrapper.addEventListener("click", (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.showPriorityMenu(e);
			});

			return wrapper;
		} catch (error) {
			console.error("Error creating priority widget DOM:", error);
			// Return a fallback element to prevent crashes
			const fallback = createEl("span", {
				cls: "priority-widget-error",
				text: this.currentPriority,
			});
			return fallback;
		}
	}

	private showPriorityMenu(e: MouseEvent) {
		try {
			const menu = new Menu();

			if (this.isLetterFormat) {
				// Letter format priorities (A, B, C)
				Object.entries(LETTER_PRIORITIES).forEach(([key, priority]) => {
					menu.addItem((item) => {
						item.setTitle(priority.text);
						item.onClick(() => {
							this.setPriority(`[#${key}]`);
						});
					});
				});

				// Add option to remove priority
				menu.addItem((item) => {
					item.setTitle(t("Remove Priority"));
					item.onClick(() => {
						this.removePriority();
					});
				});
			} else {
				// Emoji format priorities
				Object.entries(TASK_PRIORITIES).forEach(([key, priority]) => {
					if (key === "none") {
						menu.addItem((item) => {
							item.setTitle(t("Remove Priority"));
							item.onClick(() => {
								this.removePriority();
							});
						});
					} else {
						menu.addItem((item) => {
							item.setTitle(`${priority.emoji} ${priority.text}`);
							item.onClick(() => {
								this.setPriority(priority.emoji);
							});
						});
					}
				});
			}

			menu.showAtMouseEvent(e);
		} catch (error) {
			console.error("Error showing priority menu:", error);
		}
	}

	private setPriority(priority: string) {
		try {
			// Validate view state before making changes
			if (!this.view || this.view.state.doc.length < this.to) {
				console.warn("Invalid view state, skipping priority update");
				return;
			}

			const transaction = this.view.state.update({
				changes: { from: this.from, to: this.to, insert: priority },
				annotations: [priorityChangeAnnotation.of(true)],
			});

			this.view.dispatch(transaction);
		} catch (error) {
			console.error("Error setting priority:", error);
		}
	}

	private removePriority() {
		try {
			// Validate view state before making changes
			if (!this.view || this.view.state.doc.length < this.to) {
				console.warn("Invalid view state, skipping priority removal");
				return;
			}

			const transaction = this.view.state.update({
				changes: { from: this.from, to: this.to, insert: "" },
				annotations: [priorityChangeAnnotation.of(true)],
			});

			this.view.dispatch(transaction);
		} catch (error) {
			console.error("Error removing priority:", error);
		}
	}
}

export function priorityPickerExtension(
	app: App,
	plugin: TaskProgressBarPlugin
) {
	// Don't enable if the setting is off
	if (!plugin.settings.enablePriorityPicker) {
		return [];
	}

	class PriorityViewPluginValue implements PluginValue {
		public readonly view: EditorView;
		public readonly plugin: TaskProgressBarPlugin;
		decorations: DecorationSet = Decoration.none;
		private lastUpdate: number = 0;
		private readonly updateThreshold: number = 50; // Increased threshold for better stability
		public isDestroyed: boolean = false;

		// Emoji priorities matcher
		private readonly emojiMatch = new MatchDecorator({
			regexp: new RegExp(`(${emojiPriorityRegex})`, "g"),
			decorate: (
				add,
				from: number,
				to: number,
				match: RegExpExecArray,
				view: EditorView
			) => {
				try {
					if (!this.shouldRender(view, from, to)) {
						return;
					}

					add(
						from,
						to,
						Decoration.replace({
							widget: new PriorityWidget(
								app,
								plugin,
								view,
								from,
								to,
								match[0],
								false
							),
						})
					);
				} catch (error) {
					console.warn("Error decorating emoji priority:", error);
				}
			},
		});

		// Letter priorities matcher
		private readonly letterMatch = new MatchDecorator({
			regexp: new RegExp(`(${letterPriorityRegex})`, "g"),
			decorate: (
				add,
				from: number,
				to: number,
				match: RegExpExecArray,
				view: EditorView
			) => {
				try {
					if (!this.shouldRender(view, from, to)) {
						return;
					}

					add(
						from,
						to,
						Decoration.replace({
							widget: new PriorityWidget(
								app,
								plugin,
								view,
								from,
								to,
								match[0],
								true
							),
						})
					);
				} catch (error) {
					console.warn("Error decorating letter priority:", error);
				}
			},
		});

		constructor(view: EditorView) {
			this.view = view;
			this.plugin = plugin;
			this.updateDecorations(view);
		}

		update(update: ViewUpdate): void {
			if (this.isDestroyed) return;

			try {
				if (
					update.docChanged ||
					update.viewportChanged ||
					update.selectionSet ||
					update.transactions.some((tr) =>
						tr.annotation(priorityChangeAnnotation)
					)
				) {
					// Throttle updates to avoid performance issues with large documents
					const now = Date.now();
					if (now - this.lastUpdate > this.updateThreshold) {
						this.lastUpdate = now;
						this.updateDecorations(update.view, update);
					} else {
						// Schedule an update in the near future to ensure rendering
						setTimeout(() => {
							if (this.view && !this.isDestroyed) {
								this.updateDecorations(this.view);
							}
						}, this.updateThreshold);
					}
				}
			} catch (error) {
				console.error("Error in priority picker update:", error);
			}
		}

		destroy(): void {
			this.isDestroyed = true;
			this.decorations = Decoration.none;
		}

		updateDecorations(view: EditorView, update?: ViewUpdate) {
			if (this.isDestroyed) return;

			// Only apply in live preview mode
			if (!this.isLivePreview(view.state)) {
				this.decorations = Decoration.none;
				return;
			}

			try {
				// Use incremental update when possible for better performance
				if (update && !update.docChanged && this.decorations.size > 0) {
					// Try to update emoji decorations
					const emojiDecos = this.emojiMatch.updateDeco(
						update,
						this.decorations
					);
					if (emojiDecos.size > 0) {
						this.decorations = emojiDecos;
						return;
					}

					// If no emoji decorations, try letter format
					const letterDecos = this.letterMatch.updateDeco(
						update,
						this.decorations
					);
					this.decorations = letterDecos;
				} else {
					// Create new decorations from scratch
					// First try emoji priorities
					const emojiDecos = this.emojiMatch.createDeco(view);
					if (emojiDecos.size > 0) {
						this.decorations = emojiDecos;
						return;
					}

					// If no emoji priorities found, check for letter priorities
					this.decorations = this.letterMatch.createDeco(view);
				}
			} catch (e) {
				console.warn(
					"Error updating priority decorations, clearing decorations",
					e
				);
				// Clear decorations on error to prevent crashes
				this.decorations = Decoration.none;
			}
		}

		isLivePreview(state: EditorView["state"]): boolean {
			try {
				return state.field(editorLivePreviewField);
			} catch (error) {
				console.warn("Error checking live preview state:", error);
				return false;
			}
		}

		shouldRender(
			view: EditorView,
			decorationFrom: number,
			decorationTo: number
		) {
			try {
				// Validate positions
				if (
					decorationFrom < 0 ||
					decorationTo > view.state.doc.length ||
					decorationFrom >= decorationTo
				) {
					return false;
				}

				const syntaxNode = syntaxTree(view.state).resolveInner(
					decorationFrom + 1
				);
				const nodeProps = syntaxNode.type.prop(tokenClassNodeProp);

				if (nodeProps) {
					const props = nodeProps.split(" ");
					if (
						props.includes("hmd-codeblock") ||
						props.includes("hmd-frontmatter")
					) {
						return false;
					}
				}

				const selection = view.state.selection;

				const overlap = selection.ranges.some((r) => {
					return !(r.to <= decorationFrom || r.from >= decorationTo);
				});

				return !overlap && this.isLivePreview(view.state);
			} catch (e) {
				// If an error occurs, default to not rendering to avoid breaking the editor
				console.warn("Error checking if priority should render", e);
				return false;
			}
		}
	}

	const PriorityViewPluginSpec: PluginSpec<PriorityViewPluginValue> = {
		decorations: (plugin) => {
			try {
				if (plugin.isDestroyed) {
					return Decoration.none;
				}

				return plugin.decorations.update({
					filter: (
						rangeFrom: number,
						rangeTo: number,
						deco: Decoration
					) => {
						try {
							const widget = deco.spec?.widget;
							if ((widget as any).error) {
								return false;
							}

							// Validate range
							if (
								rangeFrom < 0 ||
								rangeTo > plugin.view.state.doc.length ||
								rangeFrom >= rangeTo
							) {
								return false;
							}

							const selection = plugin.view.state.selection;

							// Remove decorations when cursor is inside them
							for (const range of selection.ranges) {
								if (
									!(
										range.to <= rangeFrom ||
										range.from >= rangeTo
									)
								) {
									return false;
								}
							}

							return true;
						} catch (e) {
							console.warn(
								"Error filtering priority decoration",
								e
							);
							return false; // Remove decoration on error
						}
					},
				});
			} catch (e) {
				console.error("Failed to update decorations filter", e);
				return plugin.decorations; // Return current decorations to avoid breaking the editor
			}
		},
	};

	// Create the plugin with our implementation
	const pluginInstance = ViewPlugin.fromClass(
		PriorityViewPluginValue,
		PriorityViewPluginSpec
	);

	return pluginInstance;
}
