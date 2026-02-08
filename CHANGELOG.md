# Changelog

## [1.7.1] - 2026-02-08

### 🐛 Fixed
- **Build Process**: Memperbaiki kegagalan build yang disebabkan oleh file ikon yang hilang.
- **Panel Header UI**: Memperbaiki ukuran logo yang terlalu besar di header panel samping agar lebih proporsional.

### 🔧 Changed
- **SVG Logo Integration**: Migrasi `BrandLogo` ke format inline SVG menggunakan aset resmi `kotodama.svg` untuk rendering yang lebih tajam.
- **Icon Optimization**: Menghapus set ikon yang tidak terpakai (apple-icons, redundant favicon) untuk mengurangi ukuran paket ekstensi.

### 🛠️ Refactor
- **Robust Build Script**: Menambahkan pengecekan `existsSync` pada `scripts/build.js` agar proses build lebih stabil terhadap aset opsional yang hilang.

## [1.7.0](https://github.com/adenaufal/kotodama/compare/v1.6.0...v1.7.0) - 2026-02-08

### 🚀 Added
- **New Logo Branding**: Implementasi branding logo baru yang lebih tajam dan modern di seluruh ekstensi.
- **Enhanced Icon Support**: Dukungan set ikon lengkap (16px, 32px, 48px, 72px, 96px, 128px, 144px, 192px) untuk kompatibilitas lintas platform.
- **PWA Configuration**: Menambahkan `site.webmanifest` dan `browserconfig.xml` untuk integrasi browser yang lebih baik.

### 🔧 Changed
- **Asset Migration**: Transisi dari file SVG tunggal (`kotodama-button.svg`) ke set ikon PNG yang dioptimalkan untuk performa dan rendering yang konsisten.
- **Project Structure**: Organisasi file statis yang lebih rapi (file konfigurasi di root `public`, semua aset gambar di `public/icons`).

### 🛠️ Refactor
- **Build Script Update**: Memperbarui `scripts/build.js` untuk mendukung distribusi aset ikon dan konfigurasi baru ke folder `dist`.

## [1.6.0](https://github.com/adenaufal/kotodama/compare/v1.5.0...v1.6.0) - 2026-02-08

### 🚀 Added
- **Settings Sidebar Navigation**: Halaman Settings sekarang menggunakan sidebar kiri untuk navigasi (General, Brand Voices) dengan bagian About di footer.
- **Brand Voices Page**: Brand Voices sekarang menjadi halaman pengaturan khusus dengan pengeditan inline (tanpa modal popup).
- **Onboarding Split Layout**: Onboarding menggunakan layout split-screen modern (informasi di kiri, formulir di kanan).
- **Design System**: File `design-system.css` dan `pages.css` baru dengan variabel CSS untuk tema yang konsisten.

### 🔧 Changed
- **Zen Minimalist Aesthetic**: UI yang lebih flat di seluruh Settings dan Onboarding, menghapus card bersarang dan shadow yang berat.
- **About Page**: Desain ulang dengan bagian yang bersih dan flat serta philosophy cards.
- **PageLayout Component**: Sekarang mendukung varian `default`, `dashboard`, and `split` untuk tata letak halaman yang fleksibel.

### 🛠️ Refactor
- **Settings State Consolidation**: Semua state pengaturan sekarang dikelola dalam satu komponen `App.tsx`.
- **BrandVoicePage**: Komponen inline baru menggantikan `BrandVoiceManager` berbasis modal untuk alur buat/edit.


## [1.5.0](https://github.com/adenaufal/kotodama/compare/v1.4.0...v1.5.0) (2026-01-07)


### Features

* **Thread Insertion**: Implement sequential thread posting with configurable delay to avoid Twitter insertion errors.
* **New Button**: Add "New" button to Results UI to reset generation state and start over.
* **Notifications**: Add visual progress "Toasts" in the content script for thread posting feedback.
* **Persistence**: Side panel now remains open after insertion to improve editing workflow.
* Add initial browser extension source and compiled output, and track `dist/` directory. ([b517dd1](https://github.com/adenaufal/kotodama/commit/b517dd15337c6e2ba9a52998dabaf19740e9eb13))


### Bug Fixes

* add comprehensive logging and error handling for AI tweet generation ([#41](https://github.com/adenaufal/kotodama/issues/41)) ([efb6c79](https://github.com/adenaufal/kotodama/commit/efb6c7918ae1cacb41249339877a1ba1b3673f21))
* improve "Add Tweet" button detection with multiple selector fallbacks and visibility checks
* apply fix to bypass the auto-redirection logic on onboarding page in settings page ([aed30dc](https://github.com/adenaufal/kotodama/commit/aed30dc81a23d2ddb1d37903af6ffbea5ecf1df3))

## [Unreleased](https://github.com/adenaufal/kotodama/compare/v1.4.0...HEAD)

## [1.4.0](https://github.com/adenaufal/kotodama/compare/v1.3.0...v1.4.0) (2026-01-07)

### Features

* add API key visibility toggle in General Configuration ([67d9c0a](https://github.com/adenaufal/kotodama/commit/67d9c0a))
* add navigation menu and about page to settings ([#36](https://github.com/adenaufal/kotodama/issues/36)) ([81483bb](https://github.com/adenaufal/kotodama/commit/81483bbfdf5835ca52bea30881ab8f89a0209402))
* add tweet length presets and improve thread parsing ([c547667](https://github.com/adenaufal/kotodama/commit/c5476679e862d8d82a95053a787c1e8cf131edb0))
* enhance brand voice implementation with advanced features ([#35](https://github.com/adenaufal/kotodama/issues/35)) ([545ab04](https://github.com/adenaufal/kotodama/commit/545ab04b69ac31ffaf653337592a690c76fa03e8))

### Bug Fixes

* fix Manage Voices modal clipping by moving it outside restrictive layout container ([e8f2b31](https://github.com/adenaufal/kotodama/commit/e8f2b31))
* fix broken GitHub and Report Issue repository links ([a2b4c1d](https://github.com/adenaufal/kotodama/commit/a2b4c1d))
* remove redundant About section from main Settings tab ([f3e4d5c](https://github.com/adenaufal/kotodama/commit/f3e4d5c))
* adjust panel iframe positioning and sizing ([ff01c66](https://github.com/adenaufal/kotodama/commit/ff01c66a9fcc15117a422f5de3fb46c7d23c48fe))
* improve panel responsiveness and tweet insertion logic ([c0b2680](https://github.com/adenaufal/kotodama/commit/c0b268061285f0735f2d4ff50b5fe7daa80ceb58))
* improve reply detection and tweet insertion logic ([d823a48](https://github.com/adenaufal/kotodama/commit/d823a4885d595099eedbbfc17affb768126f3bc1))
* improve tweet content insertion robustness ([61a91ff](https://github.com/adenaufal/kotodama/commit/61a91ff672826104e5aac348abeeccabdd4bc128))
* improve UI styling and controls for settings components ([a167b10](https://github.com/adenaufal/kotodama/commit/a167b10974c4b0f99bc9a39b699f72e603bd7a4d))
* remove dark mode support and clean up theme logic ([35c0c43](https://github.com/adenaufal/kotodama/commit/35c0c433447cf67875e33c18ae9331a4867cce46))

### Refactor

* redesign Settings/About pages with unified floating navigation and full-page gradient background ([9a8b7c6](https://github.com/adenaufal/kotodama/commit/9a8b7c6))
* simplify SettingsLayout and BrandVoiceList components for cleaner UI ([d5e6f7a](https://github.com/adenaufal/kotodama/commit/d5e6f7a))

## [1.3.0](https://github.com/adenaufal/kotodama/compare/v1.2.0...v1.3.0) (2025-10-18)


### Features

* add brand voice management UI and deletion support ([d147996](https://github.com/adenaufal/kotodama/commit/d147996ec1e19cca1da72ed219f717c4378780a8))
* implement Kotodama UI theme and design tokens ([5299476](https://github.com/adenaufal/kotodama/commit/5299476a137dd642caa6a10700599ff87faca99e))


### Bug Fixes

* improve reply context detection and add performance logging ([597fcb5](https://github.com/adenaufal/kotodama/commit/597fcb58533e9750fa1b39fb1f73c3908d4e5cb5))
* show full tweet context in reply panel ([8de5560](https://github.com/adenaufal/kotodama/commit/8de5560f58c7ae0a9f1e4ac4dc82af64d670fd71))


### Performance Improvements

* enhance temperature adjustment logic for OpenAI model requests ([28e3f84](https://github.com/adenaufal/kotodama/commit/28e3f84352e52443f1f079d90a623c40d04af404))

## [1.2.0](https://github.com/adenaufal/kotodama/compare/v1.1.1...v1.2.0) (2025-10-18)


### Features

* add new UI components and onboarding flow ([20ca83b](https://github.com/adenaufal/kotodama/commit/20ca83ba7ed176fb848b1788375bb2aaa96fdb9d))

## [1.1.1](https://github.com/adenaufal/kotodama/compare/v1.1.0...v1.1.1) (2025-10-17)


### Bug Fixes

* resolve onboarding and panel lint errors ([#30](https://github.com/adenaufal/kotodama/issues/30)) ([9f2832f](https://github.com/adenaufal/kotodama/commit/9f2832fbb35f3ec962fa3ef0e46adc28c7c91c17))

## [1.1.0](https://github.com/adenaufal/kotodama/compare/v1.0.2...v1.1.0) (2025-10-17)


### Features

* **onboarding:** support markdown import and tweet links ([#28](https://github.com/adenaufal/kotodama/issues/28)) ([2377626](https://github.com/adenaufal/kotodama/commit/23776264cb472fcc193f9ca0d21f5d64b6d337b2))
* **panel:** add settings page ([#25](https://github.com/adenaufal/kotodama/issues/25)) ([ca1e31d](https://github.com/adenaufal/kotodama/commit/ca1e31d6227395484c5240aa46388425b922b7c0))
* **panel:** refresh kotodama composer experience ([#26](https://github.com/adenaufal/kotodama/issues/26)) ([714aeb0](https://github.com/adenaufal/kotodama/commit/714aeb0d7ce53044d07a1c7bc8e277d56844f31d))
* **settings:** redirect returning users to settings popup ([#29](https://github.com/adenaufal/kotodama/issues/29)) ([dc79460](https://github.com/adenaufal/kotodama/commit/dc79460fee2fe6fe49cd434406ee7e3f78d16313))


### Bug Fixes

* improve tweet insertion reliability ([#24](https://github.com/adenaufal/kotodama/issues/24)) ([0ac1bb0](https://github.com/adenaufal/kotodama/commit/0ac1bb0b8bd064a34a2c16b728287e7a1e17b3ec))
* **onboarding:** rebuild setup wizard styling ([#27](https://github.com/adenaufal/kotodama/issues/27)) ([89149b9](https://github.com/adenaufal/kotodama/commit/89149b917c5f3f7b4fc4b6d3d7a7827a59233287))
* replace deprecated OpenAI token parameter ([#22](https://github.com/adenaufal/kotodama/issues/22)) ([9cf2a23](https://github.com/adenaufal/kotodama/commit/9cf2a236959f9608d303abdfef70d27003f17b3a))

## [1.0.2](https://github.com/adenaufal/kotodama/compare/v1.0.1...v1.0.2) (2025-10-17)


### Bug Fixes

* **background:** open onboarding from correct path ([#17](https://github.com/adenaufal/kotodama/issues/17)) ([98b91df](https://github.com/adenaufal/kotodama/commit/98b91df540e80bbfa4296a8e1a599e568b2974d0))
* **onboarding:** refresh onboarding layout ([#18](https://github.com/adenaufal/kotodama/issues/18)) ([de1c4c7](https://github.com/adenaufal/kotodama/commit/de1c4c71efe68ce02b8be3a4566c129a29f54714))
* **storage:** avoid mutating settings during save ([#16](https://github.com/adenaufal/kotodama/issues/16)) ([39d7b5f](https://github.com/adenaufal/kotodama/commit/39d7b5fc863b913055c5f500e8a00006963bfef7))

## [1.0.1](https://github.com/adenaufal/kotodama/compare/v1.0.0...v1.0.1) (2025-10-17)


### Bug Fixes

* sanitize rollup output filenames for Chrome extension ([#12](https://github.com/adenaufal/kotodama/issues/12)) ([d2977aa](https://github.com/adenaufal/kotodama/commit/d2977aa9cdefbe342a763b005316a6a44a2bdcc4))

## 1.0.0 (2025-10-17)


### Bug Fixes

* **api:** restore quality openai fallback ([#4](https://github.com/adenaufal/kotodama/issues/4)) ([8a6e7b3](https://github.com/adenaufal/kotodama/commit/8a6e7b33a71fe289f141794b4655c32f1c155160))
