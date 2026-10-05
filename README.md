# Blackboard Customizer

A browser extension that customises the appearance of the University of Leicester's Blackboard site. Add a wallpaper, choose your own course images, and browse courses in a responsive grid.

## Features
An example:
<img width="1387" height="519" alt="image" src="https://github.com/user-attachments/assets/0af22063-54de-4764-ada3-e1ee03a22f58" />

- Custom page background colour and image.
- Responsive course grid with adjustable width and card opacity.
- Rounded course cards, softer shadows, and updated typography.
- Custom images for individual courses, with an option to restore Blackboard's original image.
- A solid white navigation sidebar and a translucent Courses header.
- Settings and uploaded images saved locally in the browser.

## Installation

1. Download or clone this repository and extract it if necessary.
2. Open `chrome://extensions` in Chrome, or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder containing `manifest.json`.
5. Open [Blackboard](https://blackboard.le.ac.uk/) and refresh the page.

You can pin the extension to the browser toolbar for easier access. There is no build step or dependency installation.

## Usage

### Page background

Open the extension popup, choose a background colour or upload an image, then click **Save changes**. To remove the wallpaper and keep the background colour, click **Remove background image**.

### Course grid

Use **Width** to adjust the maximum space occupied by the course grid. The number of columns adapts to the available space. Use **Card opacity** to control how much of the wallpaper shows through the cards, then click **Save changes**.

### Course images

Click the edit button on a course card to open its image options:

- **Choose image** uploads a custom image for that course.
- **Remove custom image** restores Blackboard's original banner.

Course image changes are saved automatically.

### Reset

Click **Reset** in the popup to clear the saved page appearance settings and restore their defaults. Custom course images are kept; remove them individually using the course image options.

## Project structure

```text
blackboard-customizer/
├── manifest.json       # Extension configuration and permissions
├── content.js          # Applies saved settings and manages course images
├── content.css         # Blackboard appearance and course grid styling
├── popup/
│   ├── popup.html      # Settings interface
│   ├── popup.css       # Popup styling
│   └── popup.js        # Loads and saves appearance settings
└── README.md
```

## Local storage and permissions

The extension uses `chrome.storage.local` to store appearance settings and uploaded images. These settings are specific to the browser profile and are not synced between devices by this extension.

The manifest requests storage access and access to `https://blackboard.le.ac.uk/*` so the extension can apply its customisations there.

## Development

Edit the source files directly. After making changes, reload the extension on the browser's extensions page, then refresh Blackboard. JavaScript syntax can be checked with Node.js:

```sh
node --check content.js
node --check popup/popup.js
```

## Limitations

- Currently configured for the University of Leicester's Blackboard domain.
- Blackboard interface updates may require changes to the CSS selectors or content script.
- Large uploaded images can use up the browser's extension storage allowance; smaller images are preferable.
- This is an independent project and is not affiliated with Blackboard or the University of Leicester.
