// German translations
const translations = {
  "Comprehensive task management plugin for Obsidian with progress bars, task status cycling, and advanced task tracking features.": "Comprehensive task management plugin for Obsidian with progress bars, task status cycling, and advanced task tracking features.",
  "Show progress bar": "Show progress bar",
  "Toggle this to show the progress bar.": "Toggle this to show the progress bar.",
  "Support hover to show progress info": "Support hover to show progress info",
  "Toggle this to allow this plugin to show progress info when hovering over the progress bar.": "Toggle this to allow this plugin to show progress info when hovering over the progress bar.",
  "Add progress bar to non-task bullet": "Add progress bar to non-task bullet",
  "Toggle this to allow adding progress bars to regular list items (non-task bullets).": "Toggle this to allow adding progress bars to regular list items (non-task bullets).",
  "Add progress bar to Heading": "Add progress bar to Heading",
  "Toggle this to allow this plugin to add progress bar for Task below the headings.": "Toggle this to allow this plugin to add progress bar for Task below the headings.",
  "Enable heading progress bars": "Enable heading progress bars",
  "Add progress bars to headings to show progress of all tasks under that heading.": "Add progress bars to headings to show progress of all tasks under that heading.",
  "Auto complete parent task": "Auto complete parent task",
  "Toggle this to allow this plugin to auto complete parent task when all child tasks are completed.": "Toggle this to allow this plugin to auto complete parent task when all child tasks are completed.",
  "Mark parent as 'In Progress' when partially complete": "Mark parent as 'In Progress' when partially complete",
  "When some but not all child tasks are completed, mark the parent task as 'In Progress'. Only works when 'Auto complete parent' is enabled.": "When some but not all child tasks are completed, mark the parent task as 'In Progress'. Only works when 'Auto complete parent' is enabled.",
  "Count sub children level of current Task": "Count sub children level of current Task",
  "Toggle this to allow this plugin to count sub tasks.": "Toggle this to allow this plugin to count sub tasks.",
  "Task Status Settings": "Task Status Settings",
  "Select a predefined task status collection or customize your own": "Select a predefined task status collection or customize your own",
  "Completed task markers": "Completed task markers",
  "Characters in square brackets that represent completed tasks. Example: \"x|X\"": "Characters in square brackets that represent completed tasks. Example: \"x|X\"",
  "Planned task markers": "Planned task markers",
  "Characters in square brackets that represent planned tasks. Example: \"?\"": "Characters in square brackets that represent planned tasks. Example: \"?\"",
  "In progress task markers": "In progress task markers",
  "Characters in square brackets that represent tasks in progress. Example: \">|/\"": "Characters in square brackets that represent tasks in progress. Example: \">|/\"",
  "Abandoned task markers": "Abandoned task markers",
  "Characters in square brackets that represent abandoned tasks. Example: \"-\"": "Characters in square brackets that represent abandoned tasks. Example: \"-\"",
  "Characters in square brackets that represent not started tasks. Default is space \" \"": "Characters in square brackets that represent not started tasks. Default is space \" \"",
  "Count other statuses as": "Count other statuses as",
  "Select the status to count other statuses as. Default is \"Not Started\".": "Select the status to count other statuses as. Default is \"Not Started\".",
  "Task Counting Settings": "Task Counting Settings",
  "Exclude specific task markers": "Exclude specific task markers",
  "Specify task markers to exclude from counting. Example: \"?|/\"": "Specify task markers to exclude from counting. Example: \"?|/\"",
  "Only count specific task markers": "Only count specific task markers",
  "Toggle this to only count specific task markers": "Toggle this to only count specific task markers",
  "Specific task markers to count": "Specific task markers to count",
  "Specify which task markers to count. Example: \"x|X|>|/\"": "Specify which task markers to count. Example: \"x|X|>|/\"",
  "Conditional Progress Bar Display": "Conditional Progress Bar Display",
  "Hide progress bars based on conditions": "Hide progress bars based on conditions",
  "Toggle this to enable hiding progress bars based on tags, folders, or metadata.": "Toggle this to enable hiding progress bars based on tags, folders, or metadata.",
  "Hide by tags": "Hide by tags",
  "Specify tags that will hide progress bars (comma-separated, without #). Example: \"no-progress-bar,hide-progress\"": "Specify tags that will hide progress bars (comma-separated, without #). Example: \"no-progress-bar,hide-progress\"",
  "Hide by folders": "Hide by folders",
  "Specify folder paths that will hide progress bars (comma-separated). Example: \"Daily Notes,Projects/Hidden\"": "Specify folder paths that will hide progress bars (comma-separated). Example: \"Daily Notes,Projects/Hidden\"",
  "Hide by metadata": "Hide by metadata",
  "Specify frontmatter metadata that will hide progress bars. Example: \"hide-progress-bar: true\"": "Specify frontmatter metadata that will hide progress bars. Example: \"hide-progress-bar: true\"",
  "Task Status Switcher": "Task Status Switcher",
  "Enable task status switcher": "Enable task status switcher",
  "Enable/disable the ability to cycle through task states by clicking.": "Enable/disable the ability to cycle through task states by clicking.",
  "Enable custom task marks": "Enable custom task marks",
  "Replace default checkboxes with styled text marks that follow your task status cycle when clicked.": "Replace default checkboxes with styled text marks that follow your task status cycle when clicked.",
  "Enable cycle complete status": "Enable cycle complete status",
  "Enable/disable the ability to automatically cycle through task states when pressing a mark.": "Enable/disable the ability to automatically cycle through task states when pressing a mark.",
  "Always cycle new tasks": "Always cycle new tasks",
  "When enabled, newly inserted tasks will immediately cycle to the next status. When disabled, newly inserted tasks with valid marks will keep their original mark.": "When enabled, newly inserted tasks will immediately cycle to the next status. When disabled, newly inserted tasks with valid marks will keep their original mark.",
  "Task Status Cycle and Marks": "Task Status Cycle and Marks",
  "Define task states and their corresponding marks. The order from top to bottom defines the cycling sequence.": "Define task states and their corresponding marks. The order from top to bottom defines the cycling sequence.",
  "Add Status": "Add Status",
  "Completed Task Mover": "Completed Task Mover",
  "Enable completed task mover": "Enable completed task mover",
  "Toggle this to enable commands for moving completed tasks to another file.": "Toggle this to enable commands for moving completed tasks to another file.",
  "Task marker type": "Task marker type",
  "Choose what type of marker to add to moved tasks": "Choose what type of marker to add to moved tasks",
  "Version marker text": "Version marker text",
  "Text to append to tasks when moved (e.g., 'version 1.0')": "Text to append to tasks when moved (e.g., 'version 1.0')",
  "Date marker text": "Date marker text",
  "Text to append to tasks when moved (e.g., 'archived on 2023-12-31')": "Text to append to tasks when moved (e.g., 'archived on 2023-12-31')",
  "Custom marker text": "Custom marker text",
  "Use {{DATE:format}} for date formatting (e.g., {{DATE:YYYY-MM-DD}}": "Use {{DATE:format}} for date formatting (e.g., {{DATE:YYYY-MM-DD}}",
  "Treat abandoned tasks as completed": "Treat abandoned tasks as completed",
  "If enabled, abandoned tasks will be treated as completed.": "If enabled, abandoned tasks will be treated as completed.",
  "Complete all moved tasks": "Complete all moved tasks",
  "If enabled, all moved tasks will be marked as completed.": "If enabled, all moved tasks will be marked as completed.",
  "With current file link": "With current file link",
  "A link to the current file will be added to the parent task of the moved tasks.": "A link to the current file will be added to the parent task of the moved tasks.",
  "Say Thank You": "Say Thank You",
  "Donate": "Donate",
  "If you like this plugin, consider donating to support continued development:": "If you like this plugin, consider donating to support continued development:",
  "Add number to the Progress Bar": "Add number to the Progress Bar",
  "Toggle this to allow this plugin to add tasks number to progress bar.": "Toggle this to allow this plugin to add tasks number to progress bar.",
  "Show percentage": "Show percentage",
  "Toggle this to allow this plugin to show percentage in the progress bar.": "Toggle this to allow this plugin to show percentage in the progress bar.",
  "Customize progress text": "Customize progress text",
  "Toggle this to customize text representation for different progress percentage ranges.": "Toggle this to customize text representation for different progress percentage ranges.",
  "Progress Ranges": "Progress Ranges",
  "Define progress ranges and their corresponding text representations.": "Define progress ranges and their corresponding text representations.",
  "Add new range": "Add new range",
  "Add a new progress percentage range with custom text": "Add a new progress percentage range with custom text",
  "Min percentage (0-100)": "Min percentage (0-100)",
  "Max percentage (0-100)": "Max percentage (0-100)",
  "Text template (use {{PROGRESS}})": "Text template (use {{PROGRESS}})",
  "Reset to defaults": "Reset to defaults",
  "Reset progress ranges to default values": "Reset progress ranges to default values",
  "Reset": "Reset",
  "Priority Picker Settings": "Priority Picker Settings",
  "Toggle to enable priority picker dropdown for emoji and letter format priorities.": "Toggle to enable priority picker dropdown for emoji and letter format priorities.",
  "Enable priority picker": "Enable priority picker",
  "Enable priority keyboard shortcuts": "Enable priority keyboard shortcuts",
  "Toggle to enable keyboard shortcuts for setting task priorities.": "Toggle to enable keyboard shortcuts for setting task priorities.",
  "Date picker": "Date picker",
  "Enable date picker": "Enable date picker",
  "Toggle this to enable date picker for tasks. This will add a calendar icon near your tasks which you can click to select a date.": "Toggle this to enable date picker for tasks. This will add a calendar icon near your tasks which you can click to select a date.",
  "Date mark": "Date mark",
  "Emoji mark to identify dates. You can use multiple emoji separated by commas.": "Emoji mark to identify dates. You can use multiple emoji separated by commas.",
  "Quick capture": "Quick capture",
  "Enable quick capture": "Enable quick capture",
  "Toggle this to enable Org-mode style quick capture panel. Press Alt+C to open the capture panel.": "Toggle this to enable Org-mode style quick capture panel. Press Alt+C to open the capture panel.",
  "Target file": "Target file",
  "The file where captured text will be saved. You can include a path, e.g., 'folder/Quick Capture.md'": "The file where captured text will be saved. You can include a path, e.g., 'folder/Quick Capture.md'",
  "Placeholder text": "Placeholder text",
  "Placeholder text to display in the capture panel": "Placeholder text to display in the capture panel",
  "Append to file": "Append to file",
  "If enabled, captured text will be appended to the target file. If disabled, it will replace the file content.": "If enabled, captured text will be appended to the target file. If disabled, it will replace the file content.",
  "Task Filter": "Task Filter",
  "Enable Task Filter": "Enable Task Filter",
  "Toggle this to enable the task filter panel": "Toggle this to enable the task filter panel",
  "Preset Filters": "Preset Filters",
  "Create and manage preset filters for quick access to commonly used task filters.": "Create and manage preset filters for quick access to commonly used task filters.",
  "Edit Filter: ": "Edit Filter: ",
  "Filter name": "Filter name",
  "Task Status": "Task Status",
  "Include or exclude tasks based on their status": "Include or exclude tasks based on their status",
  "Include Completed Tasks": "Include Completed Tasks",
  "Include In Progress Tasks": "Include In Progress Tasks",
  "Include Abandoned Tasks": "Include Abandoned Tasks",
  "Include Not Started Tasks": "Include Not Started Tasks",
  "Include Planned Tasks": "Include Planned Tasks",
  "Related Tasks": "Related Tasks",
  "Include parent, child, and sibling tasks in the filter": "Include parent, child, and sibling tasks in the filter",
  "Include Parent Tasks": "Include Parent Tasks",
  "Include Child Tasks": "Include Child Tasks",
  "Include Sibling Tasks": "Include Sibling Tasks",
  "Advanced Filter": "Advanced Filter",
  "Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1'": "Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1'",
  "Filter query": "Filter query",
  "Filter out tasks": "Filter out tasks",
  "If enabled, tasks that match the query will be hidden, otherwise they will be shown": "If enabled, tasks that match the query will be hidden, otherwise they will be shown",
  "Save": "Save",
  "Cancel": "Cancel",
  "Hide filter panel": "Hide filter panel",
  "Show filter panel": "Show filter panel",
  "Filter Tasks": "Filter Tasks",
  "Preset filters": "Preset filters",
  "Select a saved filter preset to apply": "Select a saved filter preset to apply",
  "Select a preset...": "Select a preset...",
  "Query": "Query",
  "Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1 AND DATE:<2022-01-02 NOT PRIORITY:>=#B' - Supports >, <, =, >=, <=, != for PRIORITY and DATE.": "Use boolean operations: AND, OR, NOT. Example: 'text content AND #tag1 AND DATE:<2022-01-02 NOT PRIORITY:>=#B' - Supports >, <, =, >=, <=, != for PRIORITY and DATE.",
  "If true, tasks that match the query will be hidden, otherwise they will be shown": "If true, tasks that match the query will be hidden, otherwise they will be shown",
  "Completed": "Completed",
  "In Progress": "In Progress",
  "Abandoned": "Abandoned",
  "Not Started": "Not Started",
  "Planned": "Planned",
  "Include Related Tasks": "Include Related Tasks",
  "Parent Tasks": "Parent Tasks",
  "Child Tasks": "Child Tasks",
  "Sibling Tasks": "Sibling Tasks",
  "Apply": "Apply",
  "New Preset": "New Preset",
  "Preset saved": "Preset saved",
  "No changes to save": "No changes to save",
  "Close": "Close",
  "Capture to": "Capture to",
  "Capture": "Capture",
  "Capture thoughts, tasks, or ideas...": "Capture thoughts, tasks, or ideas..."
};

export default translations;
