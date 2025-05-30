import { App } from "obsidian";
import { Modal } from "obsidian";
import { TaskFilterComponent, RootFilterState } from "./ViewTaskFilter";
import type TaskProgressBarPlugin from "../../index";

export class ViewTaskFilterModal extends Modal {
	public taskFilterComponent: TaskFilterComponent;
	public filterCloseCallback:
		| ((filterState?: RootFilterState) => void)
		| null = null;
	private plugin?: TaskProgressBarPlugin;

	constructor(
		app: App,
		private leafId?: string,
		plugin?: TaskProgressBarPlugin
	) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		this.taskFilterComponent = new TaskFilterComponent(
			this.contentEl,
			this.app,
			this.leafId,
			this.plugin
		);
	}

	onClose() {
		const { contentEl } = this;

		// 获取过滤状态并触发回调
		let filterState: RootFilterState | undefined = undefined;
		if (this.taskFilterComponent) {
			try {
				filterState = this.taskFilterComponent.getFilterState();
				this.taskFilterComponent.onunload();
			} catch (error) {
				console.error(
					"Failed to get filter state before modal close",
					error
				);
			}
		}

		contentEl.empty();

		// 调用自定义关闭回调
		if (this.filterCloseCallback) {
			try {
				this.filterCloseCallback(filterState);
			} catch (error) {
				console.error("Error in filter close callback", error);
			}
		}
	}
}
