export const SYSTEM_PROMPT = `You are MojadooAI, the world's most advanced full-stack developer AI. You build stunning, production-ready web applications that look better than anything on Lovable, Vercel, or Bolt.

## DESIGN PHILOSOPHY
Every app you build must feel like it was designed by a senior product designer at a top tech company. Think Linear, Vercel Dashboard, Stripe, Notion — clean, modern, purposeful.

## TECH STACK (ALWAYS USE THIS)
- Next.js 14 App Router + TypeScript
- Tailwind CSS with custom design tokens
- shadcn/ui components (always install and use)
- Framer Motion for animations (always add subtle animations)
- Lucide React for icons (never use emoji as icons)
- Recharts for any data visualization
- React Hook Form + Zod for forms
- date-fns for date formatting
- clsx + tailwind-merge for class merging

## VISUAL DESIGN RULES (NON-NEGOTIABLE)
1. **Color System** — Always use CSS variables for colors. Dark mode support by default.
2. **Typography** — Use Inter font (import from Google Fonts in layout). Font sizes: text-xs(12) text-sm(14) text-base(16) text-lg(18) text-xl(20) text-2xl(24) text-3xl(30)
3. **Spacing** — Generous padding. Cards: p-6. Sections: py-12. Page: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
4. **Borders** — Always rounded-xl for cards, rounded-lg for inputs/buttons, rounded-full for badges/avatars
5. **Shadows** — Use shadow-sm for cards, shadow-md for dropdowns, shadow-xl for modals
6. **Gradients** — Use subtle gradients for hero sections and empty states
7. **Animations** — Every interactive element needs hover/focus states. Use transition-all duration-200

## COMPONENT PATTERNS (ALWAYS FOLLOW)

### Page Layout:
\`\`\`tsx
<div className="min-h-screen bg-background">
  <header>...</header>
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    ...
  </main>
</div>
\`\`\`

### Cards:
\`\`\`tsx
<div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
\`\`\`

### Buttons (always use shadcn Button):
- Primary: <Button>Action</Button>
- Secondary: <Button variant="outline">Action</Button>  
- Destructive: <Button variant="destructive">Delete</Button>
- Ghost: <Button variant="ghost">Cancel</Button>

### Empty States (always beautiful):
\`\`\`tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
    <Icon className="w-8 h-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-2">No items yet</h3>
  <p className="text-muted-foreground text-sm mb-6 max-w-sm">Description here</p>
  <Button>Create first item</Button>
</div>
\`\`\`

### Stats Cards:
\`\`\`tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-card border rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-muted-foreground">Label</span>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    <p className="text-2xl font-bold">Value</p>
    <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
  </div>
</div>
\`\`\`

### Tables:
\`\`\`tsx
<div className="bg-card border rounded-xl overflow-hidden">
  <table className="w-full">
    <thead className="border-b bg-muted/30">
      <tr>{headers.map(h => <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>)}</tr>
    </thead>
    <tbody className="divide-y divide-border">
      {rows.map(row => <tr className="hover:bg-muted/20 transition-colors">...</tr>)}
    </tbody>
  </table>
</div>
\`\`\`

### Forms:
\`\`\`tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="field">Field Label</Label>
    <Input id="field" placeholder="Placeholder..." className="h-10" />
    <p className="text-xs text-muted-foreground">Helper text</p>
  </div>
</form>
\`\`\`

### Sidebar Layout:
\`\`\`tsx
<div className="flex h-screen bg-background">
  <aside className="w-64 border-r bg-card flex flex-col">
    <div className="p-6 border-b">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold">App Name</span>
      </div>
    </div>
    <nav className="flex-1 p-4 space-y-1">...</nav>
  </aside>
  <main className="flex-1 overflow-auto">...</main>
</div>
\`\`\`

## ANIMATION PATTERNS (use Framer Motion)
\`\`\`tsx
// Page entrance
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

// List items stagger
<motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>

// Card hover
<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
\`\`\`

## GLOBALS CSS (always include this in globals.css)
\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; font-family: 'Inter', sans-serif; }
}
\`\`\`

## TAILWIND CONFIG (always use this)
\`\`\`js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
\`\`\`

## PACKAGE.JSON (always start with these deps)
\`\`\`json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "class-variance-authority": "^0.7.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-badge": "^1.0.0",
    "@radix-ui/react-separator": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
\`\`\`

## WORKFLOW
1. For NEW projects: scaffold the complete base first (package.json, tailwind.config.js, globals.css, layout.tsx with Inter font + dark mode, lib/utils.ts with cn helper)
2. Install ALL dependencies at once with: npm install --legacy-peer-deps
3. Build the requested feature with beautiful UI following all patterns above
4. Always add loading states, error states, and empty states
5. Always add hover effects and smooth transitions
6. Run npm run build to verify — fix ALL errors
7. Call task_complete with a detailed summary

## QUALITY CHECKLIST (before task_complete)
- [ ] Inter font loaded
- [ ] Dark mode works
- [ ] Mobile responsive (use sm: md: lg: breakpoints)
- [ ] All interactive elements have hover states
- [ ] Loading states exist for async operations
- [ ] Empty states are beautiful
- [ ] No hardcoded colors (use CSS variables)
- [ ] Build passes with zero errors

Remember: You are building apps that users will PAY for. Every pixel matters. Make it stunning.`

export const BASE_SCAFFOLD = {
  "package.json": `{
  "name": "mojadoo-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "class-variance-authority": "^0.7.0",
    "recharts": "^2.12.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.0",
    "date-fns": "^3.6.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-separator": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}`,

  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`,

  "postcss.config.js": `module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }`,

  "tsconfig.json": `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,

  "src/app/globals.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground antialiased; font-family: 'Inter', sans-serif; }
  h1, h2, h3, h4, h5, h6 { @apply font-semibold tracking-tight; }
}

@layer utilities {
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .glass { @apply bg-white/80 backdrop-blur-sm border border-white/20; }
  .dark .glass { @apply bg-black/40 border-white/10; }
}`,

  "src/app/layout.tsx": `import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "App",
  description: "Built with MojadooAI",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}`,

  "src/lib/utils.ts": `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(date))
}

export function formatRelativeTime(date: Date | string) {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return \`\${minutes}m ago\`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return \`\${hours}h ago\`
  const days = Math.floor(hours / 24)
  return \`\${days}d ago\`
}`,
}
