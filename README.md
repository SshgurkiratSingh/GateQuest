# GATE ECE Tracker

A comprehensive GATE ECE (Graduate Aptitude Test in Engineering - Electronics and Communication Engineering) study tracking application built with React and Vite.

## Features

- **Daily Question Logging**: Track your daily progress with a 30-question target
- **Subject-wise Analytics**: Monitor performance across all 8 GATE ECE subjects
- **Progress Tracking**: Visual charts showing weekly progress and accuracy trends
- **Study Streaks**: Maintain motivation with daily study streak tracking
- **Complete ECE Syllabus**: All subjects with detailed topic breakdowns
- **Dark/Light Theme**: Modern UI with theme switching
- **Local Storage**: Client-side data persistence using localStorage

## GATE ECE Subjects Covered

1. **Networks, Signals & Systems** (15% weightage)
2. **Electronic Devices** (12% weightage)  
3. **Analog Circuits** (12% weightage)
4. **Digital Circuits** (10% weightage)
5. **Control Systems** (10% weightage)
6. **Communications** (12% weightage)
7. **Electromagnetics** (10% weightage)
8. **Engineering Mathematics** (15% weightage)

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod
- **State Management**: TanStack Query
- **Storage**: localStorage (client-side)

## Development

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

## Deployment

This app is configured for easy deployment on:

### Vercel
1. Connect your repository to Vercel
2. No additional configuration needed

### Netlify
1. Connect your repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist/public`

The app uses client-side localStorage for data persistence, making it completely serverless and easy to deploy on any static hosting platform.

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and storage
│   │   └── hooks/         # Custom React hooks
├── shared/                # Shared TypeScript schemas
├── vercel.json           # Vercel configuration
└── netlify.toml         # Netlify configuration
```

## Usage

1. **Log Questions**: Use the "Log Questions" tab to record your daily practice
2. **Track Progress**: Monitor your daily progress toward the 30-question target
3. **View Analytics**: Analyze your performance across subjects and over time
4. **Study Subjects**: Browse all GATE ECE topics organized by subject
5. **Maintain Streaks**: Keep your daily study streak going for motivation

The app automatically calculates accuracy rates, time spent, and tracks your progress toward daily targets.