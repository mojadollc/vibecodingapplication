import type { ChatCompletionTool } from "openai/resources/chat/completions"

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Create or overwrite a file in the project workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path, e.g. src/app/page.tsx" },
          content: { type: "string", description: "Full file content" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the content of an existing file",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all files in the project workspace",
      parameters: {
        type: "object",
        properties: {
          subDir: { type: "string", description: "Optional subdirectory to list" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description: "Run a shell command in the project workspace (e.g. npm install, npm run build)",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command to run" },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a file from the project workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative file path to delete" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "task_complete",
      description: "Signal that the task is complete and provide a summary to the user",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Summary of what was built or changed" },
        },
        required: ["summary"],
      },
    },
  },
]
