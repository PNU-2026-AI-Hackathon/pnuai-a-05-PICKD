# Pickd 웹 프로젝트

이 문서는 Pickd 프론트엔드 프로젝트의 개발 환경 설정 및 디렉토리 구조에 대한 개요를 제공합니다.

## 1. 주요 기능

### 1.1
### 1.2
### 1.3

## 2. 개발 환경 개요

이 프로젝트는 다음과 같은 주요 기술 스택과 도구를 사용하여 개발됩니다.

- **프레임워크**: React 19
- **언어**: TypeScript
- **빌드 도구**: Vite 8
- **스타일링**: Tailwind CSS v3
- **컴파일러**: React Compiler (babel-plugin-react-compiler)
- **코드 품질**: ESLint

## 3. 디렉토리 구조

```
.
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tailwind.config.js
├── eslint.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## 4. 파일 및 폴더 설명

### 4.1. 주요 설정 파일

- **package.json**: 프로젝트의 메타데이터, 스크립트, 의존성 패키지 목록을 정의합니다.
- **package-lock.json**: 의존성 패키지들의 정확한 버전 정보를 기록하여 팀원 간 일관된 의존성 관리를 돕습니다.
- **vite.config.ts**: Vite 빌드 도구 설정 파일입니다. `@vitejs/plugin-react`와 React Compiler babel 프리셋이 적용되어 있습니다.
- **tsconfig.json / tsconfig.app.json / tsconfig.node.json**: TypeScript 컴파일러 설정 파일입니다. 앱과 Node 환경을 분리하여 관리합니다.
- **tailwind.config.js**: Tailwind CSS 설정 파일입니다. `src/` 하위의 모든 tsx/ts/jsx/js 파일과 `index.html`을 스캔 대상으로 지정합니다.
- **eslint.config.js**: ESLint 설정 파일입니다. `react-hooks`, `react-refresh` 플러그인이 포함되어 있습니다.
- **.gitignore**: Git 버전 관리에서 제외할 파일 및 폴더 목록을 정의합니다.
- **index.html**: Vite의 진입점 HTML 파일입니다.

### 4.2. 주요 디렉토리

- **public/**: 빌드 결과물에 그대로 복사되는 정적 파일들을 저장합니다. favicon 및 공통 아이콘 SVG가 포함되어 있습니다.
- **src/**: 애플리케이션의 핵심 소스 코드가 위치합니다.
  - **assets/**: 컴포넌트에서 import하여 사용하는 이미지, SVG 등 정적 자원을 저장합니다.
  - **App.tsx**: 최상위 컴포넌트 파일입니다.
  - **main.tsx**: React 앱의 진입점으로, ReactDOM을 통해 App 컴포넌트를 마운트합니다.
  - **index.css**: Tailwind CSS의 기본 디렉티브를 포함하는 전역 스타일 파일입니다.

## 5. 시작하기

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 빌드 결과 미리보기

```bash
npm run preview
```

### 린트 실행

```bash
npm run lint
```
