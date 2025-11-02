# CodeGym

CodeGym is a desktop application that makes competitive programming practice more fun and organized!

With CodeGym, you can explore problems from multiple online judges, organize your own contests, and track your progress over time.

## Features

- Filter problems by difficulty, tags, and other criteria.
- Integrated online judges (currently 6):
  - Codeforces
  - UVA
  - Kattis
  - Neps
  - Timus
  - LeetCode
- Organize contests in a tree view, add problems, and manage them easily.
- Track your progress — see how many problems you’ve solved per day for each OJ.
- Mark contest problems as solved, favorite, or to-do.
- Sort problems by number of accepted submissions and other metrics.

## Tech Stack

- Vue 3
- TypeScript
- Electron

## Pre-built Installers

You can also download pre-built installers here:

- [Linux (rpm)](https://github.com/jpgmoreira/codegym/releases/download/0.0.2/codegym-0.0.2.x86_64.rpm)
- [Linux (deb)](https://github.com/jpgmoreira/codegym/releases/download/0.0.2/codegym_0.0.2_amd64.deb)
- [Windows](https://github.com/jpgmoreira/codegym/releases/download/0.0.2/codegym-0.0.2-setup.exe)

## How to Run

1. Clone this repository.
2. Checkout to the `mvp` branch:
   ```bash
   git checkout mvp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the app in development mode:
   ```bash
   npm run dev
   ```

## Build

You can build the installer for your platform using the following commands:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## About

CodeGym was created to help competitive programmers stay motivated, track their progress, and make practice more engaging.

## Assets

- **App Icon** — [Neural](https://www.flaticon.com/free-icon/neural_2103658)
- **Arrow Down** — [Arrow Down](https://www.flaticon.com/free-icon/arrow-down_9053032)
- **Book** — [Book](https://www.flaticon.com/free-icon/book_2232559)
- **Information** — [Information](https://www.flaticon.com/free-icon/information_9195785)
- **Solved** — [Solved](https://www.flaticon.com/free-icon/solved_2597570)
- **Star** — [Star](https://www.flaticon.com/free-icon/star_1828614)
- **To-do List** — [To-do List](https://www.flaticon.com/free-icon/to-do-list_2387635)
- **Trash** — [Trash](https://www.flaticon.com/free-icon/trash_3096750)

> All icons were downloaded from [Flaticon](https://www.flaticon.com/).
