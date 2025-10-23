# HereMyLinks - Next.js

This is a modern Next.js application for HereMyLinks, a bio links builder platform. The application has been migrated from static HTML/CSS/JS to Next.js for better scalability, API integration capabilities, and modern React features.

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

## 📁 Project Structure

```
heremylinks-nextjs-sample/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   ├── home.module.css      # Home page CSS module
│   └── login/               # Login page directory
│       ├── page.tsx         # Login page component
│       └── login.module.css # Login page CSS module
├── components/              # Reusable React components
│   ├── FeaturesSlider.tsx  # Feature cards slider component
│   ├── ScrollAnimation.tsx # Scroll animation handler
│   └── TopBanner.tsx       # Top promotional banner
├── public/                  # Static assets
│   ├── imgs/               # Images
│   └── fonts/              # Fonts
├── package.json            # Project dependencies
├── next.config.js          # Next.js configuration
└── tsconfig.json           # TypeScript configuration
```

## 🎨 Features

- **Server-Side Rendering (SSR)**: Fast initial page loads with Next.js
- **TypeScript**: Type-safe code for better development experience
- **CSS Modules**: Scoped styling to prevent CSS conflicts
- **Image Optimization**: Automatic image optimization with Next.js Image component
- **Responsive Design**: Mobile-first responsive design
- **Smooth Animations**: Intersection Observer API for scroll animations
- **Interactive Components**: Drag-to-scroll features slider with auto-scroll

## 🔧 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: CSS Modules + Global CSS
- **Fonts**: Google Fonts (Poppins, Roboto)
- **Image Optimization**: Next.js Image component

## 📄 Pages

### Home Page (`/`)
The landing page featuring:
- Hero section with call-to-action
- Features slider with auto-scroll
- Analytics section
- Call-to-action section
- Footer with social links

### Login Page (`/login`)
Multi-step authentication page with:
- Email/username input
- Password creation
- Social login options (Google, Apple)
- Responsive design

## 🔜 Next Steps

The application is now ready for:
- API route integration (`app/api/` directory)
- Authentication implementation (NextAuth.js recommended)
- Database integration
- User dashboard creation
- Backend services connection

## 📝 Notes

- The old HTML/CSS/JS files are still present in the root directory for reference
- All images and fonts have been moved to the `public/` directory
- All JavaScript functionality has been converted to React components
- The application uses the Next.js App Router (not Pages Router)

## 🐛 Development

To check for TypeScript errors:
```bash
npm run build
```

To lint the code (if ESLint is configured):
```bash
npm run lint
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 📧 Support

For support, please contact the development team or open an issue in the repository.

