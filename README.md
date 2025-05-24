# Bold Highlighter Chrome Extension

A simple Chrome extension that makes any highlighted text bold.

## Features
- Select any text on a webpage
- The selected text will automatically become bold
- Works on all websites

## Installation

1. Download or clone this repository to your computer
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now be active

## Usage

1. Navigate to any webpage
2. Select any text with your mouse
3. The selected text will automatically become bold

## How It Works

The extension uses a content script that listens for the `mouseup` event. When you finish selecting text, it wraps the selected text in `<strong>` tags to make it bold.

## Permissions

This extension requires the `activeTab` permission to modify the content of the current tab.
