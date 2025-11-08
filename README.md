# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

# WorkZen - Modern Glass HRMS Platform

A beautiful, modern Human Resource Management System (HRMS) built with React, TypeScript, Tailwind CSS, and Framer Motion. The platform features a stunning glassmorphism design with role-based dashboards for Admins, HR Managers, and Employees.

## 🎨 Design Philosophy

WorkZen embraces **glassmorphism** design principles with:
- Translucent cards and panels with blurred backgrounds
- Subtle gradients and frosted-glass surfaces
- Soft drop shadows and glowing edges
- Professional, futuristic, and minimal visual atmosphere
- Dual light/dark glass modes

## 🛠 Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3+
- **Animations**: Framer Motion
- **Charts & Analytics**: Recharts
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Context API

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173/`

## 🗂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GlassButton.tsx    # Stylized glass button
│   ├── GlassCard.tsx      # Animated glass card container
│   ├── GlassInput.tsx     # Glass-style input fields
│   └── Sidebar.tsx        # Navigation sidebar
├── context/             # React Context providers
│   └── AuthContext.tsx    # Authentication state management
├── layouts/             # Page layouts
│   └── DashboardLayout.tsx # Main dashboard layout
├── pages/               # Page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   ├── AdminDashboard.tsx
│   ├── HRDashboard.tsx
│   └── EmployeeDashboard.tsx
├── types/               # TypeScript definitions
└── utils/               # Utilities
```

## 🎯 Core Features

### Authentication System
- User registration with role selection (Admin, HR, Employee)
- Secure login with localStorage persistence
- Protected routes with role-based access

### Role-Based Dashboards
- **Admin**: Company metrics, employee growth, payroll tracking
- **HR**: Attendance management, leave requests, team insights
- **Employee**: Self-service portal, attendance, payslips

### UI Components
- **GlassCard**: Animated cards with hover effects
- **GlassButton**: Multiple variants with smooth animations
- **GlassInput**: Icon-supported input fields
- **Sidebar**: Responsive navigation with mobile support

### Charts & Analytics
- Employee growth trends
- Attendance analytics
- Payroll visualization
- Leave distribution charts

## 🌈 Color Scheme

- **Primary Gradient**: Indigo → Purple → Blue
- **Neon Accents**: Blue (#00D9FF), Pink (#FF006E), Teal (#00F5FF)
- **Glass Effects**: White/Black with opacity variations

## 📱 Responsive Design

- Fully responsive for mobile, tablet, and desktop
- Collapsible sidebar on smaller screens
- Adaptive grid layouts

## 🚀 Deployment

```bash
# Build for production
npm run build

# Deploy dist/ to your hosting platform
```

Compatible with: Vercel, Netlify, GitHub Pages, AWS Amplify

## 📝 Key Pages

1. **Landing Page** - Public homepage with feature showcase
2. **Login Page** - Secure user authentication
3. **Sign Up Page** - Registration with role selection
4. **Admin Dashboard** - System overview and management
5. **HR Dashboard** - HR operations and approvals
6. **Employee Dashboard** - Self-service employee portal

## 🔐 Authentication

- Email and password-based login
- Role selection during registration
- Protected routes for authenticated users
- Automatic role-based dashboard routing

## 🎬 Animations

- Page load animations
- Hover effects on cards and buttons
- Staggered animations for grids
- Smooth transitions throughout

---

**Built with ❤️ using React, Tailwind CSS, and Framer Motion**

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
